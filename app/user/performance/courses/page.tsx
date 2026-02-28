'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth';
import { FrostedHeader } from '@/components/custom/frosted-header';
import { useMobileMenu } from '@/components/mobile-menu-context';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BookOpenIcon, PlusIcon, Trash2Icon, RefreshCwIcon } from 'lucide-react';

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

function formatTrimesterLabel(code: string): string {
  if (code.length !== 3) return code;
  const year = code.slice(0, 2);
  const sem = code[2];
  const semLabel = sem === '1' ? 'Spring' : sem === '2' ? 'Summer' : 'Fall';
  return `${semLabel} ${year}`;
}

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
  const [viewTrimester, setViewTrimester] = useState<string>(profileTrimester);

  const fetchEnrolled = async (sem: string) => {
    if (!studentId || !sem) { setEnrolled([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/performance/students/${studentId}/courses/${encodeURIComponent(sem)}`);
      const data = await res.json();
      const normalized: EnrolledCourse[] = Array.isArray(data)
        ? data.map((c: any) => ({
            id: c.enrollment_id ?? c.id ?? '',
            course_id: c.course_id ?? '',
            course_name: c.title ?? c.course_name ?? '',
            course_code: c.code ?? c.course_code ?? '',
            trimester: c.trimester ?? '',
            section: c.section,
            faculty: c.faculty_name ?? c.faculty,
            credits: c.credits,
            ct_count: c.ct_count,
            assignment_count: c.assignment_count,
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
    await fetchEnrolled(viewTrimester);
  };

  useEffect(() => { fetchData(); }, [studentId]);
  useEffect(() => { fetchEnrolled(viewTrimester); }, [viewTrimester, studentId]);

  // Fetch available trimesters for the enroll form
  useEffect(() => {
    const fetchTrimesters = async () => {
      try {
        const res = await fetch('/api/course-management/trimesters');
        const data = await res.json();
        const list: TrimesterOption[] = Array.isArray(data?.trimesters)
          ? data.trimesters.map((t: { trimester: string }) => ({
              code: t.trimester,
              label: formatTrimesterLabel(t.trimester),
            }))
          : [];
        setTrimesters(list);
        // Auto-select: prefer profile's current_trimester, else first in list
        if (!viewTrimester && list.length > 0) {
          setViewTrimester(list[0].code);
        } else if (viewTrimester && list.length > 0 && !list.find(t => t.code === viewTrimester)) {
          setViewTrimester(list[0].code);
        }
      } catch {
        // silent
      }
    };
    fetchTrimesters();
  }, []);

  const enrolledCourseIds = new Set(enrolled.map((e) => e.course_id));

  const openEnrollDialog = (course: AvailableCourse) => {
    setSelectedCourse(course);
    setEnrollForm({ section: '', faculty: '', trimesterCode: '' });
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

  const unenrolledCourses = available.filter((c) => !enrolledCourseIds.has(c.id));

  return (
    <div className="flex flex-col h-full">
      <FrostedHeader title="My Courses" onMobileMenuToggle={toggleMobileMenu} showSearch={false} />
      <div className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* Header Row */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-xl font-bold">My Courses</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {viewTrimester
                ? `${formatTrimesterLabel(viewTrimester)} (${viewTrimester})`
                : 'Select a trimester to view courses'}
            </p>
          </div>
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

        {/* Enrolled Courses */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border shadow-sm animate-pulse">
                <CardContent className="p-5 h-24" />
              </Card>
            ))}
          </div>
        ) : enrolled.length === 0 ? (
          <Card className="border shadow-sm">
            <CardContent className="p-10 flex flex-col items-center justify-center gap-3 text-center">
              <BookOpenIcon className="h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                You haven&apos;t enrolled in any courses for this trimester yet.
              </p>
              <Button
                size="sm"
                onClick={() => setEnrollOpen(true)}
                className="gap-2 bg-primary hover:bg-primary/90 mt-1"
              >
                <PlusIcon className="h-4 w-4" />
                Enroll Now
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {enrolled.map((course) => (
              <Card key={course.id} className="border shadow-sm">
                <CardContent className="p-5 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="rounded-xl p-2.5 bg-blue-500/10 shrink-0">
                      <BookOpenIcon className="h-5 w-5 text-blue-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{course.course_name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{course.course_code}</p>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {course.section && (
                          <Badge variant="outline" className="text-xs">§ {course.section}</Badge>
                        )}
                        {course.faculty && (
                          <Badge variant="secondary" className="text-xs">{course.faculty}</Badge>
                        )}
                        {course.credits !== undefined && (
                          <Badge variant="outline" className="text-xs">{course.credits} cr</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                    disabled={unenrolling === course.course_id}
                    onClick={() => handleUnenroll(course.course_id)}
                  >
                    <Trash2Icon className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Course List Dialog */}
        <Dialog open={enrollOpen} onOpenChange={(open) => { setEnrollOpen(open); if (!open) setSelectedCourse(null); }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Enroll in a Course</DialogTitle>
            </DialogHeader>
            {selectedCourse ? (
              /* Step 2: fill section + faculty */
              <div className="space-y-4">
                <div className="rounded-lg border p-3 bg-muted/40">
                  <p className="font-semibold text-sm">{selectedCourse.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{selectedCourse.code}{selectedCourse.credit ? ` · ${selectedCourse.credit} credits` : ''}</p>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Trimester *</label>
                    <Select
                      value={enrollForm.trimesterCode}
                      onValueChange={(v) => setEnrollForm((f) => ({ ...f, trimesterCode: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select trimester…" />
                      </SelectTrigger>
                      <SelectContent>
                        {trimesters.length === 0 ? (
                          <SelectItem value="_none" disabled>No trimesters available</SelectItem>
                        ) : (
                          trimesters.map((t) => (
                            <SelectItem key={t.code} value={t.code}>
                              <span>{t.label}</span>
                              <span className="ml-2 text-muted-foreground text-xs">{t.code}</span>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
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
                          <p className="text-xs text-muted-foreground">{course.code}{course.credit ? ` · ${course.credit} cr` : ''}</p>
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
    </div>
  );
}
