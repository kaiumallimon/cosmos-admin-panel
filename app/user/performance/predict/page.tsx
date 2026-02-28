'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth';
import { FrostedHeader } from '@/components/custom/frosted-header';
import { useMobileMenu } from '@/components/mobile-menu-context';
import { Badge } from '@/components/ui/badge';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
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
import {
  SparklesIcon,
  TrendingUpIcon,
  BookOpenIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  RefreshCwIcon,
  LayersIcon,
  TargetIcon,
  ActivityIcon,
  Search,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface EnrolledCourse {
  id: string;
  course_id: string;
  course_name: string;
  course_code: string;
  trimester: string;
  section?: string;
  faculty?: string;
  credits?: number;
}

interface MarksForm {
  ct: string;
  assignment: string;
  attendance: string;
  mid: string;
  project: string;
}

interface Layer1Prediction {
  score: number;
  grade: string;
  grade_point: number;
  model_used: string;
  confidence: number;
}

interface Layer2Adjustment {
  adjustment_amount: number;
  adjustment_breakdown: Record<string, number> | null;
  enabled: boolean;
  reason: string;
}

interface FinalPrediction {
  score: number;
  grade: string;
  grade_point: number;
  max_possible_score: number;
}

interface CurrentMarks {
  ct: number;
  assignment: number;
  attendance: number;
  mid: number;
  total_earned: number;
  percentage: number;
}

interface PredictionData {
  course: string;
  student_type: string;
  layer1_prediction: Layer1Prediction;
  layer2_adjustment: Layer2Adjustment;
  final_prediction: FinalPrediction;
  current_marks: CurrentMarks;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function gradeColor(grade: string | null | undefined): string {
  if (!grade) return 'text-muted-foreground';
  const g = grade.toUpperCase();
  if (g.startsWith('A')) return 'text-emerald-500';
  if (g.startsWith('B')) return 'text-blue-500';
  if (g.startsWith('C')) return 'text-amber-500';
  return 'text-red-500';
}

const STEPS = ['Choose Course', 'Enter Marks', 'Prediction Result'];

const EMPTY_MARKS: MarksForm = { ct: '', assignment: '', attendance: '', mid: '', project: '' };

// ─── Component ───────────────────────────────────────────────────────────────

export default function GradePredictionPage() {
  const { user } = useAuthStore();
  const { toggleMobileMenu } = useMobileMenu();

  const studentId = user?.profile?.id ?? '';
  const profileTrimester = user?.profile?.current_trimester ?? '';

  // ── Step state ──
  const [step, setStep] = useState<0 | 1 | 2>(0);

  // ── Step 1 ──
  const [courses, setCourses] = useState<EnrolledCourse[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [courseSearch, setCourseSearch] = useState('');

  // ── Step 2 ──
  const [marks, setMarks] = useState<MarksForm>(EMPTY_MARKS);
  const [currentTrimester, setCurrentTrimester] = useState('');
  const [cgpa, setCgpa] = useState('');
  const [useMeta, setUseMeta] = useState(true);
  const [autoFilling, setAutoFilling] = useState(false);

  // ── Step 3 ──
  const [predicting, setPredicting] = useState(false);
  const [result, setResult] = useState<PredictionData | null>(null);
  const [error, setError] = useState('');

  // ─── Load enrolled courses (same pattern as /user/performance/courses) ────

  useEffect(() => {
    if (!studentId || !profileTrimester) return;
    setCoursesLoading(true);
    fetch(`/api/performance/students/${studentId}/courses/${encodeURIComponent(profileTrimester)}`)
      .then((r) => r.json())
      .then((data) => {
        const list: EnrolledCourse[] = Array.isArray(data)
          ? data.map((c: any) => ({
              id: c.enrollment_id ?? c.id ?? '',
              course_id: c.course_id ?? '',
              course_name: c.title ?? c.course_name ?? '',
              course_code: c.code ?? c.course_code ?? '',
              trimester: c.trimester ?? '',
              section: c.section,
              faculty: c.faculty_name ?? c.faculty,
              credits: c.credits,
            }))
          : [];
        setCourses(list);
      })
      .catch(() => setCourses([]))
      .finally(() => setCoursesLoading(false));
  }, [studentId, profileTrimester]);

  // ─── Auto-fill marks when course selected ────────────────────────────────

  async function autoFillMarks(courseId: string) {
    if (!studentId || !courseId) return;
    setAutoFilling(true);
    try {
      const res = await fetch(
        `/api/performance/assessments?student_id=${studentId}&course_id=${courseId}`,
      );
      const data = await res.json();
      const list: { type: string; marks: number; full_marks: number }[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
        ? data.data
        : [];

      const pick = (type: string) => {
        const found = list.find((a) => a.type?.toLowerCase() === type);
        return found != null && found.marks != null ? String(found.marks) : '';
      };

      setMarks({
        ct: pick('ct'),
        assignment: pick('assignment'),
        attendance: pick('attendance'),
        mid: pick('mid'),
        project: pick('project'),
      });
    } catch {
      // silently fail — user can enter manually
    } finally {
      setAutoFilling(false);
    }
  }

  // ─── Handle predict ───────────────────────────────────────────────────────

  async function handlePredict() {
    const selectedCourse = courses.find((c) => c.course_id === selectedCourseId);
    if (!selectedCourse || !studentId) return;

    setError('');
    setPredicting(true);

    const payload: Record<string, unknown> = {
      student_id: studentId,
      current_course: {
        course: selectedCourse.course_code,
        ct: Number(marks.ct) || 0,
        assignment: Number(marks.assignment) || 0,
        attendance: Number(marks.attendance) || 0,
        mid: Number(marks.mid) || 0,
        ...(marks.project !== '' ? { project: Number(marks.project) } : {}),
      },
      current_trimester: Number(currentTrimester) || 1,
      use_meta_learning: useMeta,
    };

    if (cgpa !== '') {
      payload.cgpa = Number(cgpa);
    }

    try {
      const res = await fetch('/api/performance/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(json.error ?? json.message ?? 'Prediction failed. Please try again.');
        return;
      }

      setResult(json.data);
      setStep(2);
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setPredicting(false);
    }
  }

  // ─── Step navigation ──────────────────────────────────────────────────────

  function goToStep1() {
    setSelectedCourseId('');
    setMarks(EMPTY_MARKS);
    setCurrentTrimester('');
    setCgpa('');
    setResult(null);
    setError('');
    setCourseSearch('');
    setStep(0);
  }

  function handleCourseNext() {
    if (!selectedCourseId) return;
    autoFillMarks(selectedCourseId);
    setStep(1);
  }

  const selectedCourse = courses.find((c) => c.course_id === selectedCourseId);

  const filteredCourses = courses.filter((c) => {
    const q = courseSearch.toLowerCase();
    return (
      !courseSearch ||
      c.course_name.toLowerCase().includes(q) ||
      c.course_code.toLowerCase().includes(q) ||
      (c.faculty?.toLowerCase().includes(q) ?? false) ||
      (c.section?.toLowerCase().includes(q) ?? false)
    );
  });

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      <FrostedHeader
        title="Grade Prediction"
        onMobileMenuToggle={toggleMobileMenu}
        showSearch={false}
      />

      <div className="p-6 space-y-6">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/user/performance">Performance</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbPage>Grade Prediction</BreadcrumbPage>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Step Progress */}
        <div className="flex items-center gap-2">
          {STEPS.map((label, idx) => (
            <div key={idx} className="flex items-center gap-2 flex-1 last:flex-none">
              <div className="flex items-center gap-2 shrink-0">
                <div
                  className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-colors ${
                    idx < step
                      ? 'bg-primary border-primary text-primary-foreground'
                      : idx === step
                      ? 'border-primary text-primary bg-primary/10'
                      : 'border-muted text-muted-foreground bg-muted/30'
                  }`}
                >
                  {idx < step ? '✓' : idx + 1}
                </div>
                <span
                  className={`text-xs font-medium hidden sm:block ${
                    idx === step ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {label}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-px transition-colors ${
                    idx < step ? 'bg-primary' : 'bg-border'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">

          {/* ── Step 0: Choose Course ── */}
          {step === 0 && (
            <motion.div
              key="step0"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {coursesLoading ? (
                <Card>
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-6 w-40" />
                      <Skeleton className="h-9 w-9" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-10 w-full mb-6" />
                    <div className="space-y-3">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex items-center space-x-4 py-3">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-40" />
                            <Skeleton className="h-3 w-24" />
                          </div>
                          <Skeleton className="h-6 w-16 rounded-full" />
                          <Skeleton className="h-6 w-24 rounded-full" />
                          <Skeleton className="h-8 w-20 rounded ml-auto" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <CardTitle className="flex items-center gap-2">
                        <BookOpenIcon className="h-5 w-5" />
                        Enrolled Courses
                      </CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (!studentId || !profileTrimester) return;
                          setCoursesLoading(true);
                          fetch(`/api/performance/students/${studentId}/courses/${encodeURIComponent(profileTrimester)}`)
                            .then((r) => r.json())
                            .then((data) => {
                              const list: EnrolledCourse[] = Array.isArray(data)
                                ? data.map((c: any) => ({
                                    id: c.enrollment_id ?? c.id ?? '',
                                    course_id: c.course_id ?? '',
                                    course_name: c.title ?? c.course_name ?? '',
                                    course_code: c.code ?? c.course_code ?? '',
                                    trimester: c.trimester ?? '',
                                    section: c.section,
                                    faculty: c.faculty_name ?? c.faculty,
                                    credits: c.credits,
                                  }))
                                : [];
                              setCourses(list);
                            })
                            .catch(() => setCourses([]))
                            .finally(() => setCoursesLoading(false));
                        }}
                      >
                        <RefreshCwIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>

                  <CardContent>
                    {/* Search */}
                    <div className="relative mb-6">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by course name, code, section or faculty…"
                        value={courseSearch}
                        onChange={(e) => setCourseSearch(e.target.value)}
                        className={`pl-10 ${courseSearch ? 'pr-10' : ''}`}
                      />
                      {courseSearch && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCourseSearch('')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>

                    {/* Table */}
                    <div className="bg-white dark:bg-card rounded-lg border shadow-sm overflow-hidden">
                      {filteredCourses.length === 0 ? (
                        <div className="p-12 text-center">
                          <BookOpenIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <h3 className="text-lg font-semibold mb-2">No courses found</h3>
                          <p className="text-muted-foreground">
                            {courseSearch
                              ? `No courses match "${courseSearch}"`
                              : 'No enrolled courses found for your current trimester.'}
                          </p>
                        </div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-50 dark:hover:bg-gray-900/50">
                              <TableHead className="font-semibold text-gray-900 dark:text-gray-100 py-4">Course</TableHead>
                              <TableHead className="font-semibold text-gray-900 dark:text-gray-100 py-4">Code</TableHead>
                              <TableHead className="font-semibold text-gray-900 dark:text-gray-100 py-4">Section</TableHead>
                              <TableHead className="font-semibold text-gray-900 dark:text-gray-100 py-4">Faculty</TableHead>
                              <TableHead className="font-semibold text-gray-900 dark:text-gray-100 py-4">Credits</TableHead>
                              <TableHead className="font-semibold text-gray-900 dark:text-gray-100 py-4">Trimester</TableHead>
                              <TableHead className="font-semibold text-gray-900 dark:text-gray-100 py-4 text-right">Action</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredCourses.map((course) => (
                              <TableRow
                                key={course.course_id}
                                onClick={() => setSelectedCourseId(course.course_id)}
                                className={`transition-colors cursor-pointer ${
                                  selectedCourseId === course.course_id
                                    ? 'bg-primary/5 hover:bg-primary/10'
                                    : 'hover:bg-gray-50 dark:hover:bg-gray-900/30'
                                }`}
                              >
                                <TableCell className="py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                                      <BookOpenIcon className="h-5 w-5 text-primary" />
                                    </div>
                                    <div className="font-medium">{course.course_name}</div>
                                  </div>
                                </TableCell>
                                <TableCell className="py-4 font-mono text-sm font-medium">{course.course_code}</TableCell>
                                <TableCell className="py-4">
                                  {course.section
                                    ? <Badge className="bg-primary/10 text-primary" variant="outline">{course.section}</Badge>
                                    : <span className="text-muted-foreground text-sm">—</span>}
                                </TableCell>
                                <TableCell className="py-4">
                                  {course.faculty
                                    ? <Badge variant="secondary">{course.faculty}</Badge>
                                    : <span className="text-muted-foreground text-sm">—</span>}
                                </TableCell>
                                <TableCell className="py-4">
                                  {course.credits !== undefined
                                    ? <Badge variant="outline" className="font-semibold">{course.credits} cr</Badge>
                                    : <span className="text-muted-foreground text-sm">—</span>}
                                </TableCell>
                                <TableCell className="py-4 text-sm text-muted-foreground">{course.trimester || profileTrimester}</TableCell>
                                <TableCell className="py-4 text-right">
                                  <Button
                                    size="sm"
                                    variant={selectedCourseId === course.course_id ? 'default' : 'outline'}
                                    onClick={(e) => { e.stopPropagation(); setSelectedCourseId(course.course_id); }}
                                    className="gap-1.5"
                                  >
                                    {selectedCourseId === course.course_id ? '✓ Selected' : 'Select'}
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Button
                className="gap-2"
                disabled={!selectedCourseId || coursesLoading}
                onClick={handleCourseNext}
              >
                Next: Enter Marks
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
            </motion.div>
          )}

          {/* ── Step 1: Enter Marks ── */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* Selected course indicator */}
              {selectedCourse && (
                <div className="flex items-center gap-2 text-sm">
                  <BookOpenIcon className="h-4 w-4 text-primary shrink-0" />
                  <span className="font-semibold">{selectedCourse.course_code}</span>
                  <span className="text-muted-foreground">—</span>
                  <span className="text-muted-foreground">{selectedCourse.course_name}</span>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Marks */}
                <Card className="border shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <TargetIcon className="h-4 w-4 text-primary" />
                      Assessment Marks
                    </CardTitle>
                    {autoFilling ? (
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <RefreshCwIcon className="h-3 w-3 animate-spin" />
                        Auto-filling from your records…
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Enter your raw marks for each assessment. Values auto-filled from records if available.
                      </p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {[
                        { key: 'ct', label: 'CT Marks', max: 20 },
                        { key: 'assignment', label: 'Assignment', max: 20 },
                        { key: 'attendance', label: 'Attendance', max: 10 },
                        { key: 'mid', label: 'Mid Marks', max: 30 },
                        { key: 'project', label: 'Project (opt)', max: 30 },
                      ].map(({ key, label, max }) => (
                        <div key={key} className="space-y-1">
                          <label className="text-xs font-medium text-muted-foreground block">
                            {label}
                            <span className="ml-1 text-muted-foreground/60">/ {max}</span>
                          </label>
                          <Input
                            type="number"
                            min={0}
                            max={max}
                            placeholder={`0–${max}`}
                            value={marks[key as keyof MarksForm]}
                            onChange={(e) =>
                              setMarks((prev) => ({ ...prev, [key]: e.target.value }))
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Academic Context */}
                <Card className="border shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <ActivityIcon className="h-4 w-4 text-primary" />
                      Academic Context
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      Provide your overall context for more accurate predictions.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground block">
                          Trimester No. <span className="text-destructive">*</span>
                        </label>
                        <Input
                          type="number"
                          min={1}
                          placeholder="e.g. 3"
                          value={currentTrimester}
                          onChange={(e) => setCurrentTrimester(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground/70">
                          Your overall trimester count (1 = first)
                        </p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground block">
                          CGPA (optional)
                        </label>
                        <Input
                          type="number"
                          min={0}
                          max={4}
                          step={0.01}
                          placeholder="0.00 – 4.00"
                          value={cgpa}
                          onChange={(e) => setCgpa(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Meta-learning toggle */}
                    <div className="flex items-center gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() => setUseMeta((v) => !v)}
                        className={`h-5 w-9 rounded-full transition-colors relative shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                          useMeta ? 'bg-primary' : 'bg-muted'
                        }`}
                        aria-checked={useMeta}
                        role="switch"
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                            useMeta ? 'translate-x-4' : ''
                          }`}
                        />
                      </button>
                      <div>
                        <p className="text-sm font-medium leading-none">Use meta-learning</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Applies historical patterns for improved accuracy
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {error && (
                <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(0)} className="gap-1.5">
                  <ChevronLeftIcon className="h-4 w-4" />
                  Back
                </Button>
                <Button
                  className="gap-2"
                  disabled={
                    predicting ||
                    !marks.ct ||
                    !marks.assignment ||
                    !marks.attendance ||
                    !marks.mid ||
                    !currentTrimester
                  }
                  onClick={handlePredict}
                >
                  {predicting ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Predicting…
                    </>
                  ) : (
                    <>
                      <SparklesIcon className="h-4 w-4" />
                      Predict My Grade
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}

          {/* ── Step 2: Results ── */}
          {step === 2 && result && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              {/* Top row: hero + marks summary */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Final prediction hero */}
                <Card className="border shadow-sm overflow-hidden lg:col-span-1">
                  <div className="bg-linear-to-br from-primary/5 to-primary/10 px-6 py-8 text-center space-y-3 h-full flex flex-col items-center justify-center">
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <TrendingUpIcon className="h-4 w-4 text-primary" />
                      <span className="font-medium">Predicted Final Grade</span>
                    </div>
                    <p className={`text-7xl font-bold tracking-tight ${gradeColor(result.final_prediction.grade)}`}>
                      {result.final_prediction.grade ?? 'N/A'}
                    </p>
                    <div className="flex items-center justify-center gap-4 text-sm">
                      <span className="text-muted-foreground">
                        Score:{' '}
                        <span className="font-semibold text-foreground">
                          {result.final_prediction.score?.toFixed(1)}
                        </span>
                      </span>
                      <span className="text-muted-foreground">
                        GPA:{' '}
                        <span className="font-semibold text-foreground">
                          {result.final_prediction.grade_point?.toFixed(2)}
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                      <Badge variant="secondary" className="text-xs">
                        {result.student_type}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        Max: {result.final_prediction.max_possible_score?.toFixed(1)}
                      </Badge>
                    </div>
                  </div>
                </Card>

                {/* Current marks summary */}
                <Card className="border shadow-sm lg:col-span-2">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <TargetIcon className="h-4 w-4 text-primary" />
                      Current Marks Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label: 'CT', value: result.current_marks.ct },
                        { label: 'Assignment', value: result.current_marks.assignment },
                        { label: 'Attendance', value: result.current_marks.attendance },
                        { label: 'Mid', value: result.current_marks.mid },
                      ].map(({ label, value }) => (
                        <div key={label} className="rounded-lg bg-muted/40 px-3 py-3 text-center">
                          <p className="text-xs text-muted-foreground">{label}</p>
                          <p className="text-2xl font-semibold mt-1">{value ?? '—'}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3 border-t pt-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Total Earned</span>
                        <span className="font-semibold">{result.current_marks.total_earned?.toFixed(1)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Percentage</span>
                        <span className="font-semibold">{result.current_marks.percentage?.toFixed(1)}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Layer breakdowns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Layer 1 */}
                <Card className="border shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <LayersIcon className="h-4 w-4 text-primary" />
                      Layer 1 — Base Prediction
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Grade</span>
                      <span className={`font-semibold ${gradeColor(result.layer1_prediction.grade)}`}>
                        {result.layer1_prediction.grade}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Score</span>
                      <span className="font-medium">{result.layer1_prediction.score?.toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">GPA</span>
                      <span className="font-medium">{result.layer1_prediction.grade_point?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Confidence</span>
                      <Badge variant="secondary" className="text-xs">
                        {Math.round((result.layer1_prediction.confidence ?? 0) * 100)}%
                      </Badge>
                    </div>
                    {result.layer1_prediction.model_used && (
                      <div className="flex justify-between items-start gap-2 pt-2 border-t">
                        <span className="text-muted-foreground shrink-0">Model</span>
                        <span className="text-xs text-right text-muted-foreground/80 break-all">
                          {result.layer1_prediction.model_used}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Layer 2 */}
                <Card className="border shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <ActivityIcon className="h-4 w-4 text-primary" />
                      Layer 2 — Meta Adjustment
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Enabled</span>
                      <Badge
                        variant={result.layer2_adjustment.enabled ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {result.layer2_adjustment.enabled ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Adjustment</span>
                      <span
                        className={`font-medium ${
                          result.layer2_adjustment.adjustment_amount > 0
                            ? 'text-emerald-500'
                            : result.layer2_adjustment.adjustment_amount < 0
                            ? 'text-red-500'
                            : ''
                        }`}
                      >
                        {result.layer2_adjustment.adjustment_amount > 0 ? '+' : ''}
                        {result.layer2_adjustment.adjustment_amount?.toFixed(2)}
                      </span>
                    </div>
                    {result.layer2_adjustment.reason && (
                      <p className="text-xs text-muted-foreground pt-2 border-t leading-relaxed">
                        {result.layer2_adjustment.reason}
                      </p>
                    )}
                    {result.layer2_adjustment.adjustment_breakdown &&
                      Object.keys(result.layer2_adjustment.adjustment_breakdown).length > 0 && (
                        <div className="pt-2 border-t space-y-1">
                          {Object.entries(result.layer2_adjustment.adjustment_breakdown).map(
                            ([k, v]) => (
                              <div key={k} className="flex justify-between text-xs">
                                <span className="text-muted-foreground capitalize">{k}</span>
                                <span
                                  className={
                                    v > 0
                                      ? 'text-emerald-500 font-medium'
                                      : v < 0
                                      ? 'text-red-500 font-medium'
                                      : 'text-muted-foreground'
                                  }
                                >
                                  {v > 0 ? '+' : ''}
                                  {v.toFixed(2)}
                                </span>
                              </div>
                            ),
                          )}
                        </div>
                      )}
                  </CardContent>
                </Card>
              </div>

              {/* Actions */}
              <Button variant="outline" onClick={goToStep1} className="gap-2">
                <RefreshCwIcon className="h-4 w-4" />
                Predict Another Course
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
