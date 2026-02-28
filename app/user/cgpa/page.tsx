'use client';

import { useState } from 'react';
import { FrostedHeader } from '@/components/custom/frosted-header';
import { useMobileMenu } from '@/components/mobile-menu-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PlusIcon, Trash2Icon, CalculatorIcon, TrendingUpIcon, RefreshCwIcon } from 'lucide-react';

// UIU grading scale
const GRADES = [
  { label: 'A',   value: 4.00 },
  { label: 'A-',  value: 3.67 },
  { label: 'B+',  value: 3.33 },
  { label: 'B',   value: 3.00 },
  { label: 'B-',  value: 2.67 },
  { label: 'C+',  value: 2.33 },
  { label: 'C',   value: 2.00 },
  { label: 'C-',  value: 1.67 },
  { label: 'D+',  value: 1.33 },
  { label: 'D',   value: 1.00 },
  { label: 'F',   value: 0.00 },
];

interface CourseRow {
  id: number;
  courseName: string;
  creditHours: number;
  gradePoint: number;
}

let _id = 1;
const newCourse = (): CourseRow => ({ id: _id++, courseName: '', creditHours: 3, gradePoint: 4.00 });

function gpaBadgeColor(gpa: number) {
  if (gpa >= 3.75) return 'bg-green-500/15 text-green-600 border-green-500/30';
  if (gpa >= 3.00) return 'bg-blue-500/15 text-blue-600 border-blue-500/30';
  if (gpa >= 2.50) return 'bg-amber-500/15 text-amber-600 border-amber-500/30';
  if (gpa >= 2.00) return 'bg-orange-500/15 text-orange-600 border-orange-500/30';
  return 'bg-red-500/15 text-red-600 border-red-500/30';
}

function gpaLabel(gpa: number) {
  if (gpa >= 3.75) return 'Excellent';
  if (gpa >= 3.00) return 'Good';
  if (gpa >= 2.50) return 'Average';
  if (gpa >= 2.00) return 'Pass';
  return 'Fail';
}

export default function CGPACalculatorPage() {
  const { toggleMobileMenu } = useMobileMenu();

  const [previousCGPA, setPreviousCGPA] = useState<string>('');
  const [creditsCompleted, setCreditsCompleted] = useState<string>('');
  const [courses, setCourses] = useState<CourseRow[]>([newCourse()]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const handleCourseChange = (id: number, field: keyof CourseRow, value: string | number) => {
    setCourses((prev) => prev.map((c) => (c.id !== id ? c : { ...c, [field]: value })));
  };

  const addCourse = () => setCourses((prev) => [...prev, newCourse()]);

  const removeCourse = (id: number) => {
    if (courses.length > 1) setCourses((prev) => prev.filter((c) => c.id !== id));
  };

  const reset = () => {
    _id = 1;
    setPreviousCGPA('');
    setCreditsCompleted('');
    setCourses([newCourse()]);
  };

  // ── Calculations ──────────────────────────────────────────────────────────
  const semesterGPA = (() => {
    const valid = courses.filter((c) => c.creditHours > 0);
    if (!valid.length) return null;
    const pts = valid.reduce((s, c) => s + c.gradePoint * c.creditHours, 0);
    const creds = valid.reduce((s, c) => s + c.creditHours, 0);
    return creds > 0 ? pts / creds : null;
  })();

  const prevCGPANum = parseFloat(previousCGPA) || 0;
  const prevCreditsNum = parseInt(creditsCompleted) || 0;
  const semesterCredits = courses.reduce((s, c) => s + c.creditHours, 0);
  const totalCredits = prevCreditsNum + semesterCredits;

  const cumulativeCGPA = (() => {
    if (totalCredits === 0) return null;
    const prevPts = prevCGPANum * prevCreditsNum;
    const semPts = courses.reduce((s, c) => s + c.gradePoint * c.creditHours, 0);
    return (prevPts + semPts) / totalCredits;
  })();

  const hasPrevData = prevCGPANum > 0 || prevCreditsNum > 0;

  return (
    <div className="flex flex-col h-full">
      <FrostedHeader title="CGPA Calculator" onMobileMenuToggle={toggleMobileMenu} showSearch={false} />
      <div className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* ── Summary cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border shadow-sm">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="rounded-xl p-3 bg-purple-500/10 shrink-0">
                <CalculatorIcon className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Semester GPA</p>
                <p className="text-2xl font-bold">
                  {semesterGPA !== null ? semesterGPA.toFixed(2) : '—'}
                </p>
                {semesterGPA !== null && (
                  <Badge className={`mt-1 text-xs border ${gpaBadgeColor(semesterGPA)}`}>
                    {gpaLabel(semesterGPA)}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="rounded-xl p-3 bg-[#007AFF]/10 shrink-0">
                <TrendingUpIcon className="h-5 w-5 text-[#007AFF]" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Cumulative CGPA</p>
                <p className="text-2xl font-bold">
                  {cumulativeCGPA !== null ? cumulativeCGPA.toFixed(2) : '—'}
                </p>
                {cumulativeCGPA !== null && (
                  <Badge className={`mt-1 text-xs border ${gpaBadgeColor(cumulativeCGPA)}`}>
                    {gpaLabel(cumulativeCGPA)}
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
                <p className="text-xs text-muted-foreground">Total Credits</p>
                <p className="text-2xl font-bold">{totalCredits}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {hasPrevData ? `${prevCreditsNum} prev + ${semesterCredits} this sem` : `${semesterCredits} this semester`}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Previous academic record ── */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold">Previous Academic Record</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Previous CGPA</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="4"
                  placeholder="e.g. 3.75"
                  value={previousCGPA}
                  onWheel={(e) => e.currentTarget.blur()}
                  onChange={(e) => setPreviousCGPA(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Credits Completed</Label>
                <Input
                  type="number"
                  step="1"
                  min="0"
                  placeholder="e.g. 90"
                  value={creditsCompleted}
                  onWheel={(e) => e.currentTarget.blur()}
                  onChange={(e) => setCreditsCompleted(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Current semester courses ── */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold">Current Semester Courses</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-xs text-muted-foreground hover:text-destructive"
                onClick={reset}
              >
                <RefreshCwIcon className="h-3.5 w-3.5" />
                Reset
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {courses.map((course) => (
              <div key={course.id} className="grid grid-cols-12 gap-2 items-center p-3 sm:p-0 rounded-xl border sm:border-0 sm:rounded-none bg-muted/20 sm:bg-transparent">
                <Input
                  className="col-span-11 sm:col-span-5 h-9 text-sm"
                  placeholder="Course name (optional)"
                  value={course.courseName}
                  onChange={(e) => handleCourseChange(course.id, 'courseName', e.target.value)}
                />
                <Select
                  value={String(course.creditHours)}
                  onValueChange={(v) => handleCourseChange(course.id, 'creditHours', parseInt(v))}
                >
                  <SelectTrigger className="col-span-5 sm:col-span-2 h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4].map((c) => (
                      <SelectItem key={c} value={String(c)}>{c} cr</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={course.gradePoint.toFixed(2)}
                  onValueChange={(v) => handleCourseChange(course.id, 'gradePoint', parseFloat(v))}
                >
                  <SelectTrigger className="col-span-6 sm:col-span-4 h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GRADES.map((g) => (
                      <SelectItem key={g.label} value={g.value.toFixed(2)}>
                        {g.label} ({g.value.toFixed(2)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="sm"
                  className="col-span-1 h-9 w-full p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  disabled={courses.length === 1}
                  onClick={() => removeCourse(course.id)}
                >
                  <Trash2Icon className="h-4 w-4" />
                </Button>
              </div>
            ))}

            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-xs text-[#007AFF] hover:text-[#007AFF] hover:bg-[#007AFF]/10"
              onClick={addCourse}
            >
              <PlusIcon className="h-3.5 w-3.5" />
              Add Course
            </Button>
          </CardContent>
        </Card>

        {/* ── Results table ── */}
        {courses.some((c) => c.courseName.trim() || c.gradePoint > 0) && (
          <Card className="border shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-bold">Results</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-0">
              <div className="rounded-xl border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent bg-muted/40">
                      <TableHead className="text-xs font-semibold px-5 py-3.5">Course</TableHead>
                      <TableHead className="text-xs font-semibold text-center px-5 py-3.5">Credits</TableHead>
                      <TableHead className="text-xs font-semibold text-center px-5 py-3.5">Grade</TableHead>
                      <TableHead className="text-xs font-semibold text-center px-5 py-3.5">Quality Points</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {courses
                      .filter((c) => c.courseName.trim() || c.gradePoint > 0)
                      .map((course, i) => {
                        const gradeLabel = GRADES.find((g) => g.value === course.gradePoint)?.label ?? '—';
                        return (
                          <TableRow key={i}>
                            <TableCell className="text-sm font-medium px-5 py-4">
                              {course.courseName || `Course ${i + 1}`}
                            </TableCell>
                            <TableCell className="text-center text-sm px-5 py-4">{course.creditHours}</TableCell>
                            <TableCell className="text-center px-5 py-4">
                              <Badge className="text-xs border bg-[#007AFF]/10 text-[#007AFF] border-[#007AFF]/20 hover:bg-[#007AFF]/10">
                                {gradeLabel} ({course.gradePoint.toFixed(2)})
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center text-sm font-mono px-5 py-4">
                              {(course.gradePoint * course.creditHours).toFixed(2)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}
