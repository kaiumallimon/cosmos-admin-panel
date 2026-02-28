'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { FrostedHeader } from '@/components/custom/frosted-header';
import { StatsCard } from '@/components/dashboard/stats-card';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  BookOpenIcon,
  PlusIcon,
  Trash2Icon,
  RefreshCwIcon,
  CreditCardIcon,
  MoreHorizontal,
  Search,
  X,
  ClipboardListIcon,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AvailableCourse {
  id: string;
  title: string;
  code: string;
  credit?: number;
  department?: string;
}

interface EnrolledCourse {
  id: string;          // enrollment_id
  course_id: string;
  course_name: string; // title
  course_code: string; // code
  trimester: string;
  section?: string;
  faculty?: string;    // faculty_name
  credits?: number;
  ct_count?: number;
  assignment_count?: number;
}

interface TrimesterOption {
  code: string;
  label: string;
}

interface EnrollForm {
  section: string;
  faculty: string;
  trimesterCode: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTrimesterLabel(code: string): string {
  if (code.length !== 3) return code;
  const year = code.slice(0, 2);
  const sem = code[2];
  const semLabel = sem === '1' ? 'Spring' : sem === '2' ? 'Summer' : 'Fall';
  return `${semLabel} ${year}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function MyCoursesPage() {
  const { user } = useAuthStore();
  const { toggleMobileMenu } = useMobileMenu();
  const studentId = user.profile?.id;
  const profileTrimester = user.profile?.current_trimester ?? '';

  const [available, setAvailable] = useState<AvailableCourse[]>([]);
  const [enrolled, setEnrolled] = useState<EnrolledCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<AvailableCourse | null>(null);
  const [enrollForm, setEnrollForm] = useState<EnrollForm>({ section: '', faculty: '', trimesterCode: '' });
  const [enrolling, setEnrolling] = useState(false);
  const [unenrolling, setUnenrolling] = useState<string | null>(null);
  const [trimesters, setTrimesters] = useState<TrimesterOption[]>([]);
  const [latestTrimester, setLatestTrimester] = useState<TrimesterOption | null>(null);
  const [viewTrimester, setViewTrimester] = useState<string>(profileTrimester);
  const [searchInput, setSearchInput] = useState('');
  const router = useRouter();

  // ─── Data fetching ──────────────────────────────────────────────────────────

  const fetchEnrolled = async (sem: string) => {
    if (!studentId) { setEnrolled([]); setLoading(false); return; }
    setLoading(true);
    try {
      const url = sem
        ? `/api/performance/enrollments/${studentId}?trimester=${encodeURIComponent(sem)}`
        : `/api/performance/enrollments/${studentId}`;
      const res = await fetch(url);
      const data = await res.json();
      const normalized: EnrolledCourse[] = Array.isArray(data)
        ? data.map((c: any) => ({
            id: c.enrollment_id ?? c.id ?? '',
            course_id: c.course_id ?? '',
            course_name: c.course_title ?? c.title ?? c.course_name ?? '',
            course_code: c.course_code ?? c.code ?? '',
            trimester: c.trimester ?? '',
            section: c.section ?? undefined,
            faculty: c.faculty ?? c.faculty_name ?? undefined,
            credits: c.credit ?? c.credits ?? undefined,
            ct_count: c.ct_count ?? undefined,
            assignment_count: c.assignment_count ?? undefined,
          }))
        : [];
      setEnrolled(normalized);
    } catch {
      setEnrolled([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    if (!studentId) return;
    try {
      const res = await fetch('/api/performance/courses');
      const data = await res.json();
      setAvailable(Array.isArray(data) ? data : []);
    } catch { /* silent */ }
  };

  useEffect(() => { fetchData(); }, [studentId]);
  useEffect(() => { fetchEnrolled(viewTrimester); }, [viewTrimester, studentId]);

  useEffect(() => {
    const fetchTrimesters = async () => {
      try {
        const res = await fetch('/api/course-management/trimesters');
        const data = await res.json();
        const raw: { trimester: string; created_at?: string }[] = Array.isArray(data?.trimesters)
          ? data.trimesters
          : [];
        // Sort descending by created_at so the latest is first
        const sorted = [...raw].sort((a, b) =>
          new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
        );
        const list: TrimesterOption[] = sorted.map((t) => ({
          code: t.trimester,
          label: formatTrimesterLabel(t.trimester),
        }));
        setTrimesters(list);
        if (list.length > 0) setLatestTrimester(list[0]);
        if (list.length > 0) {
          setViewTrimester((current) => {
            if (!current) return list[0].code;
            if (!list.find((t) => t.code === current)) return list[0].code;
            return current; // already valid — no change, no re-fetch
          });
        }
      } catch { /* silent */ }
    };
    fetchTrimesters();
  }, []);

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const enrolledCourseIds = new Set(enrolled.map((e) => e.course_id));
  const unenrolledCourses = available.filter((c) => !enrolledCourseIds.has(c.id));

  const openEnrollDialog = (course: AvailableCourse) => {
    setSelectedCourse(course);
    setEnrollForm({ section: '', faculty: '', trimesterCode: latestTrimester?.code ?? '' });
  };

  const handleEnroll = async () => {
    if (!selectedCourse || !enrollForm.section || !enrollForm.faculty || !enrollForm.trimesterCode) return;
    setEnrolling(true);
    try {
      await fetch('/api/performance/student-courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: studentId,
          course_id: selectedCourse.id,
          trimester: enrollForm.trimesterCode,
          section: enrollForm.section,
          faculty: enrollForm.faculty,
        }),
      });
      setSelectedCourse(null);
      setEnrollOpen(false);
      setViewTrimester(enrollForm.trimesterCode);
      await fetchEnrolled(enrollForm.trimesterCode);
    } finally {
      setEnrolling(false);
    }
  };

  const handleUnenroll = async (courseId: string) => {
    setUnenrolling(courseId);
    try {
      await fetch('/api/performance/student-courses', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId, course_id: courseId, trimester: viewTrimester }),
      });
      await fetchEnrolled(viewTrimester);
    } finally {
      setUnenrolling(null);
    }
  };

  // ─── Derived stats ───────────────────────────────────────────────────────────

  const totalCredits = enrolled.reduce((sum, c) => sum + (c.credits ?? 0), 0);

  const filteredEnrolled = enrolled.filter((c) => {
    const q = searchInput.toLowerCase();
    return (
      !searchInput ||
      c.course_name.toLowerCase().includes(q) ||
      c.course_code.toLowerCase().includes(q) ||
      (c.faculty?.toLowerCase().includes(q) ?? false) ||
      (c.section?.toLowerCase().includes(q) ?? false)
    );
  });

  // ─── Loading skeleton ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm border-b border-border sticky top-0 z-40">
          <div className="flex items-center justify-between px-6 py-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-10 rounded-md" />
          </div>
        </div>
        <div className="p-6">
          <div className="flex items-center space-x-2 mb-6">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {[1, 2].map((i) => (
              <Card key={i} className="p-6">
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-10 w-36" />
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
                    <Skeleton className="h-8 w-8 rounded ml-auto" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ─── Main render ─────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      <FrostedHeader title="My Courses" onMobileMenuToggle={toggleMobileMenu} showSearch={false} />

      <div className="p-6">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/user/performance">Performance</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>My Courses</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
          <StatsCard
            icon={BookOpenIcon}
            title="Enrolled Courses"
            value={enrolled.length}
            description={viewTrimester ? `${formatTrimesterLabel(viewTrimester)} (${viewTrimester})` : undefined}
          />
          <StatsCard
            icon={CreditCardIcon}
            title="Total Credits"
            value={totalCredits}
            description="Sum of enrolled course credits"
          />
        </div>

        {/* Table Card */}
        <Card className="mt-5">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <CardTitle className="flex items-center gap-2">
                <BookOpenIcon className="h-5 w-5" />
                Enrolled Courses
              </CardTitle>
              <div className="flex items-center gap-2 flex-wrap">
                {trimesters.length > 0 && (
                  <Select value={viewTrimester} onValueChange={setViewTrimester}>
                    <SelectTrigger className="w-[180px] h-9 text-sm">
                      <SelectValue placeholder="Select trimester" />
                    </SelectTrigger>
                    <SelectContent>
                      {trimesters.map((t) => (
                        <SelectItem key={t.code} value={t.code}>
                          <span>{t.label}</span>
                          <span className="ml-2 text-muted-foreground text-xs">{t.code}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <Button variant="outline" size="sm" onClick={() => fetchEnrolled(viewTrimester)}>
                  <RefreshCwIcon className="h-4 w-4" />
                </Button>
                <Button size="sm" onClick={() => setEnrollOpen(true)} className="gap-2 bg-primary hover:bg-primary/90">
                  <PlusIcon className="h-4 w-4" />
                  Enroll in Course
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {/* Search */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by course name, code, section or faculty…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className={`pl-10 ${searchInput ? 'pr-10' : ''}`}
              />
              {searchInput && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchInput('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-card rounded-lg border shadow-sm overflow-hidden">
              {filteredEnrolled.length === 0 ? (
                <div className="p-12 text-center">
                  <BookOpenIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No courses found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchInput
                      ? `No courses match "${searchInput}"`
                      : viewTrimester
                        ? `You haven't enrolled in any courses for ${formatTrimesterLabel(viewTrimester)} (${viewTrimester}) yet.`
                        : 'Select a trimester to view your enrolled courses.'}
                  </p>
                  {!searchInput && (
                    <Button onClick={() => setEnrollOpen(true)} className="gap-2">
                      <PlusIcon className="h-4 w-4" />
                      Enroll in Course
                    </Button>
                  )}
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
                      <TableHead className="font-semibold text-gray-900 dark:text-gray-100 py-4 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEnrolled.map((course) => (
                      <TableRow
                        key={course.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors cursor-pointer"
                        onClick={() => router.push(
                          `/user/performance/courses/${course.course_id}?enrollment_id=${encodeURIComponent(course.id)}&name=${encodeURIComponent(course.course_name)}&code=${encodeURIComponent(course.course_code)}`
                        )}
                      >
                        <TableCell className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                              <BookOpenIcon className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <div className="font-medium">{course.course_name}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 font-mono text-sm font-medium">{course.course_code}</TableCell>
                        <TableCell className="py-4">
                          {course.section
                            ? <Badge className='bg-primary/10 text-primary'  variant="outline">{course.section}</Badge>
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
                        <TableCell className="py-4 text-sm text-muted-foreground">{course.trimester || viewTrimester}</TableCell>
                        <TableCell className="py-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem
                                onClick={() => router.push(
                                  `/user/performance/courses/${course.course_id}?enrollment_id=${encodeURIComponent(course.id)}&name=${encodeURIComponent(course.course_name)}&code=${encodeURIComponent(course.course_code)}`
                                )}
                              >
                                <ClipboardListIcon className="mr-2 h-4 w-4" />
                                Assessments
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleUnenroll(course.course_id)}
                                disabled={unenrolling === course.course_id}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2Icon className="mr-2 h-4 w-4" />
                                {unenrolling === course.course_id ? 'Unenrolling…' : 'Unenroll'}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Enroll Dialog ───────────────────────────────────────────────────── */}
      <Dialog open={enrollOpen} onOpenChange={(open) => { setEnrollOpen(open); if (!open) setSelectedCourse(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Enroll in a Course</DialogTitle>
          </DialogHeader>
          {selectedCourse ? (
            /* Step 2: fill trimester, section, faculty */
            <div className="space-y-4">
              <div className="rounded-lg border p-3 bg-muted/40">
                <p className="font-semibold text-sm">{selectedCourse.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {selectedCourse.code}{selectedCourse.credit ? ` · ${selectedCourse.credit} credits` : ''}
                </p>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Trimester</label>
                  <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2">
                    <span className="text-sm font-medium">
                      {latestTrimester ? latestTrimester.label : 'No trimester available'}
                    </span>
                    {latestTrimester && (
                      <Badge variant="outline" className="text-xs font-mono">{latestTrimester.code}</Badge>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Section *</label>
                  <Input
                    placeholder="e.g. A, B, C"
                    value={enrollForm.section}
                    onChange={(e) => setEnrollForm((f) => ({ ...f, section: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Faculty *</label>
                  <Input
                    placeholder="Faculty name"
                    value={enrollForm.faculty}
                    onChange={(e) => setEnrollForm((f) => ({ ...f, faculty: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setSelectedCourse(null)}>Back</Button>
                <Button
                  className="bg-primary hover:bg-primary/90"
                  disabled={enrolling || !enrollForm.trimesterCode || !enrollForm.section || !enrollForm.faculty}
                  onClick={handleEnroll}
                >
                  {enrolling ? 'Enrolling…' : 'Confirm Enroll'}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            /* Step 1: pick a course */
            <>
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {unenrolledCourses.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    You&apos;re already enrolled in all available courses.
                  </p>
                ) : (
                  unenrolledCourses.map((course) => (
                    <div
                      key={course.id}
                      className="flex items-center justify-between gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer"
                      onClick={() => openEnrollDialog(course)}
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{course.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {course.code}{course.credit ? ` · ${course.credit} cr` : ''}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        className="shrink-0 bg-primary hover:bg-primary/90"
                        onClick={(e) => { e.stopPropagation(); openEnrollDialog(course); }}
                      >
                        Enroll
                      </Button>
                    </div>
                  ))
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEnrollOpen(false)}>Close</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
