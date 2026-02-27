'use client';

import { useState } from 'react';
import { FrostedHeader } from '@/components/custom/frosted-header';
import { useMobileMenu } from '@/components/mobile-menu-context';
import { useAuthStore } from '@/store/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PlusIcon, Trash2Icon, CalculatorIcon, TrendingUpIcon, RefreshCwIcon } from 'lucide-react';

// 4-point grading scale (common Bangladeshi university standard)
const GRADE_POINTS: Record<string, number> = {
  'A+': 4.00,
  'A':  3.75,
  'A-': 3.50,
  'B+': 3.25,
  'B':  3.00,
  'B-': 2.75,
  'C+': 2.50,
  'C':  2.25,
  'D':  2.00,
  'F':  0.00,
};

const GRADES = Object.keys(GRADE_POINTS);

interface CourseRow {
  id: number;
  name: string;
  credit: string;
  grade: string;
}

interface Trimester {
  id: number;
  label: string;
  courses: CourseRow[];
}

let nextId = 1;
const newCourse = (): CourseRow => ({ id: nextId++, name: '', credit: '3', grade: 'A' });
const newTrimester = (idx: number): Trimester => ({
  id: nextId++,
  label: `Trimester ${idx}`,
  courses: [newCourse()],
});

function calcGPA(courses: CourseRow[]): number | null {
  const valid = courses.filter((c) => c.credit && c.grade && Number(c.credit) > 0);
  if (valid.length === 0) return null;
  const totalPoints = valid.reduce((s, c) => s + GRADE_POINTS[c.grade] * Number(c.credit), 0);
  const totalCredits = valid.reduce((s, c) => s + Number(c.credit), 0);
  return totalCredits > 0 ? totalPoints / totalCredits : null;
}

function calcCGPA(trimesters: Trimester[]): number | null {
  const allCourses = trimesters.flatMap((t) => t.courses);
  return calcGPA(allCourses);
}

function gpaBadgeColor(gpa: number) {
  if (gpa >= 3.75) return 'bg-green-500/15 text-green-600 border-green-500/30';
  if (gpa >= 3.00) return 'bg-blue-500/15 text-blue-600 border-blue-500/30';
  if (gpa >= 2.50) return 'bg-amber-500/15 text-amber-600 border-amber-500/30';
  if (gpa >= 2.00) return 'bg-orange-500/15 text-orange-600 border-orange-500/30';
  return 'bg-red-500/15 text-red-600 border-red-500/30';
}

export default function CGPACalculatorPage() {
  const { toggleMobileMenu } = useMobileMenu();
  const { user } = useAuthStore();
  const existingCGPA = user.profile?.cgpa;

  const [trimesters, setTrimesters] = useState<Trimester[]>([newTrimester(1)]);

  // ── Course helpers ────────────────────────────────────────────────────────
  const updateCourse = (tId: number, cId: number, field: keyof CourseRow, value: string) => {
    setTrimesters((prev) =>
      prev.map((t) =>
        t.id !== tId
          ? t
          : { ...t, courses: t.courses.map((c) => (c.id !== cId ? c : { ...c, [field]: value })) }
      )
    );
  };

  const addCourse = (tId: number) => {
    setTrimesters((prev) =>
      prev.map((t) => (t.id !== tId ? t : { ...t, courses: [...t.courses, newCourse()] }))
    );
  };

  const removeCourse = (tId: number, cId: number) => {
    setTrimesters((prev) =>
      prev.map((t) =>
        t.id !== tId ? t : { ...t, courses: t.courses.filter((c) => c.id !== cId) }
      )
    );
  };

  // ── Trimester helpers ─────────────────────────────────────────────────────
  const addTrimester = () => {
    setTrimesters((prev) => [...prev, newTrimester(prev.length + 1)]);
  };

  const removeTrimester = (tId: number) => {
    setTrimesters((prev) => prev.filter((t) => t.id !== tId));
  };

  const updateTrimesterLabel = (tId: number, label: string) => {
    setTrimesters((prev) => prev.map((t) => (t.id !== tId ? t : { ...t, label })));
  };

  const reset = () => {
    nextId = 1;
    setTrimesters([newTrimester(1)]);
  };

  // ── Calculated values ─────────────────────────────────────────────────────
  const cgpa = calcCGPA(trimesters);
  const totalCredits = trimesters
    .flatMap((t) => t.courses)
    .filter((c) => c.credit && Number(c.credit) > 0 && c.grade !== 'F')
    .reduce((s, c) => s + Number(c.credit), 0);

  return (
    <div className="flex flex-col h-full">
      <FrostedHeader title="CGPA Calculator" onMobileMenuToggle={toggleMobileMenu} showSearch={false} />
      <div className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border shadow-sm">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="rounded-xl p-3 bg-[#007AFF]/10 shrink-0">
                <CalculatorIcon className="h-5 w-5 text-[#007AFF]" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Calculated CGPA</p>
                <p className="text-2xl font-bold">
                  {cgpa !== null ? cgpa.toFixed(2) : '—'}
                </p>
                {cgpa !== null && (
                  <Badge className={`mt-1 text-xs border ${gpaBadgeColor(cgpa)}`}>
                    {cgpa >= 3.75 ? 'Excellent' : cgpa >= 3.0 ? 'Good' : cgpa >= 2.5 ? 'Average' : cgpa >= 2.0 ? 'Pass' : 'Fail'}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="rounded-xl p-3 bg-green-500/10 shrink-0">
                <TrendingUpIcon className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Earned Credits</p>
                <p className="text-2xl font-bold">{totalCredits}</p>
                <p className="text-xs text-muted-foreground mt-0.5">excluding F grades</p>
              </div>
            </CardContent>
          </Card>

          {existingCGPA !== undefined && existingCGPA !== null && (
            <Card className="border shadow-sm">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="rounded-xl p-3 bg-purple-500/10 shrink-0">
                  <TrendingUpIcon className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Current CGPA (Profile)</p>
                  <p className="text-2xl font-bold">{existingCGPA}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">from your profile</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Grade Reference */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Grading Scale Reference</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(GRADE_POINTS).map(([g, p]) => (
                <div key={g} className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs">
                  <span className="font-bold">{g}</span>
                  <span className="text-muted-foreground">= {p.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Trimesters */}
        {trimesters.map((trimester, tIdx) => {
          const gpa = calcGPA(trimester.courses);
          return (
            <Card key={trimester.id} className="border shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-3">
                  <Input
                    value={trimester.label}
                    onChange={(e) => updateTrimesterLabel(trimester.id, e.target.value)}
                    className="h-8 text-sm font-semibold w-48 border-0 border-b rounded-none px-0 focus-visible:ring-0 bg-transparent"
                  />
                  <div className="flex items-center gap-2">
                    {gpa !== null && (
                      <Badge className={`text-xs border ${gpaBadgeColor(gpa)}`}>
                        GPA: {gpa.toFixed(2)}
                      </Badge>
                    )}
                    {trimesters.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => removeTrimester(trimester.id)}
                      >
                        <Trash2Icon className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {/* Column Headers */}
                <div className="grid grid-cols-12 gap-2 px-1 text-xs font-medium text-muted-foreground">
                  <span className="col-span-6">Course Name</span>
                  <span className="col-span-2 text-center">Credits</span>
                  <span className="col-span-3 text-center">Grade</span>
                  <span className="col-span-1" />
                </div>

                {trimester.courses.map((course) => (
                  <div key={course.id} className="grid grid-cols-12 gap-2 items-center">
                    <Input
                      className="col-span-6 h-8 text-sm"
                      placeholder="Course name (optional)"
                      value={course.name}
                      onChange={(e) => updateCourse(trimester.id, course.id, 'name', e.target.value)}
                    />
                    <Select
                      value={course.credit}
                      onValueChange={(v) => updateCourse(trimester.id, course.id, 'credit', v)}
                    >
                      <SelectTrigger className="col-span-2 h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4].map((c) => (
                          <SelectItem key={c} value={String(c)}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={course.grade}
                      onValueChange={(v) => updateCourse(trimester.id, course.id, 'grade', v)}
                    >
                      <SelectTrigger className="col-span-3 h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {GRADES.map((g) => (
                          <SelectItem key={g} value={g}>
                            {g} ({GRADE_POINTS[g].toFixed(2)})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="col-span-1 h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      disabled={trimester.courses.length === 1}
                      onClick={() => removeCourse(trimester.id, course.id)}
                    >
                      <Trash2Icon className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}

                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-1 gap-1.5 text-xs text-[#007AFF] hover:text-[#007AFF] hover:bg-[#007AFF]/10"
                  onClick={() => addCourse(trimester.id)}
                >
                  <PlusIcon className="h-3.5 w-3.5" />
                  Add Course
                </Button>
              </CardContent>
            </Card>
          );
        })}

        {/* Action Buttons */}
        <div className="flex items-center gap-3 flex-wrap">
          <Button
            variant="outline"
            className="gap-2"
            onClick={addTrimester}
          >
            <PlusIcon className="h-4 w-4" />
            Add Trimester
          </Button>
          <Button
            variant="ghost"
            className="gap-2 text-muted-foreground"
            onClick={reset}
          >
            <RefreshCwIcon className="h-4 w-4" />
            Reset
          </Button>
        </div>

      </div>
    </div>
  );
}
