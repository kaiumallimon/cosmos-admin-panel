'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { FrostedHeader } from '@/components/custom/frosted-header';
import { StatsCard } from '@/components/dashboard/stats-card';
import { useMobileMenu } from '@/components/mobile-menu-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  BrainCircuitIcon,
  TrophyIcon,
  TargetIcon,
  BookOpenIcon,
  TrendingUpIcon,
  RefreshCwIcon,
  HistoryIcon,
  Search,
  X,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface EnrolledCourse {
  id: string;
  course_name: string;
  course_code: string;
}

interface Topic {
  id: string;
  topic_name: string;
}

interface QuizStats {
  total_attempts: number;
  avg_percentage: number | null;
  topics_covered: number;
  avg_precision: number | null;
}

interface TrimesterOption {
  code: string;
  label: string;
}

function formatTrimesterLabel(code: string): string {
  if (code.length !== 3) return code;
  const year = code.slice(0, 2);
  const sem = code[2];
  const semLabel = sem === '1' ? 'Spring' : sem === '2' ? 'Summer' : 'Fall';
  return `${semLabel} ${year}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function QuizIndexPage() {
  const { user } = useAuthStore();
  const { toggleMobileMenu } = useMobileMenu();
  const router = useRouter();

  const studentId = user.profile?.id;
  const profileTrimester = user.profile?.current_trimester ?? '';

  // ─── Trimester ───────────────────────────────────────────────────────────
  const [trimesters, setTrimesters] = useState<TrimesterOption[]>([]);
  const [viewTrimester, setViewTrimester] = useState<string>(profileTrimester);

  // ─── Stats ──────────────────────────────────────────────────────────────
  const [stats, setStats] = useState<QuizStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // ─── Enrolled courses ────────────────────────────────────────────────────
  const [courses, setCourses] = useState<EnrolledCourse[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);

  // ─── Attempt quiz dialog ─────────────────────────────────────────────────
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeCourse, setActiveCourse] = useState<EnrolledCourse | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [searchInput, setSearchInput] = useState('');

  // ─── Fetch stats ─────────────────────────────────────────────────────────
  const fetchStats = async () => {
    if (!studentId) return;
    setStatsLoading(true);
    try {
      const res = await fetch(`/api/performance/quiz/stats?student_id=${studentId}`);
      const data = await res.json();
      setStats(data);
    } catch {
      setStats(null);
    } finally {
      setStatsLoading(false);
    }
  };

  // ─── Fetch enrolled courses ───────────────────────────────────────────────
  const fetchCourses = async () => {
    if (!studentId) { setCoursesLoading(false); return; }
    setCoursesLoading(true);
    try {
      const url = viewTrimester
        ? `/api/performance/students/${studentId}/courses/${encodeURIComponent(viewTrimester)}`
        : `/api/performance/students/${studentId}/courses`;
      const res = await fetch(url);
      const data = await res.json();
      setCourses(
        Array.isArray(data)
          ? data.map((c: any) => ({
              id: c.course_id ?? c.id ?? '',
              course_name: c.title ?? c.course_name ?? '',
              course_code: c.code ?? c.course_code ?? '',
            }))
          : [],
      );
    } catch (err) {
      console.error('Fetch courses error', err);
      setCourses([]);
    } finally {
      setCoursesLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [studentId]);

  useEffect(() => {
    if (!studentId || !viewTrimester) return;
    fetchCourses();
  }, [studentId, viewTrimester]);

  useEffect(() => {
    const fetchTrimesters = async () => {
      try {
        const res = await fetch('/api/course-management/trimesters');
        const data = await res.json();
        const raw: { trimester: string; created_at?: string }[] = Array.isArray(data?.trimesters)
          ? data.trimesters
          : [];
        const sorted = [...raw].sort(
          (a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime(),
        );
        const list: TrimesterOption[] = sorted.map((t) => ({
          code: t.trimester,
          label: formatTrimesterLabel(t.trimester),
        }));
        setTrimesters(list);
        if (!viewTrimester && list.length > 0) {
          setViewTrimester(list[0].code);
        } else if (viewTrimester && list.length > 0 && !list.find((t) => t.code === viewTrimester)) {
          setViewTrimester(list[0].code);
        }
      } catch { /* silent */ }
    };
    fetchTrimesters();
  }, []);

  // ─── Open dialog ──────────────────────────────────────────────────────────
  const openDialog = async (course: EnrolledCourse) => {
    setActiveCourse(course);
    setSelectedTopics([]);
    setTopics([]);
    setDialogOpen(true);
    setTopicsLoading(true);
    try {
      const res = await fetch('/api/performance/course-topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ course_id: course.id }),
      });
      const data = await res.json();
      const raw: any[] = Array.isArray(data) ? data : data?.topics ?? [];
      setTopics(raw.map((t: any) => ({ id: t.id, topic_name: t.topic_name ?? t.name ?? '' })));
    } catch {
      setTopics([]);
    } finally {
      setTopicsLoading(false);
    }
  };

  // ─── Generate quiz ────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!studentId || !activeCourse || selectedTopics.length === 0) return;
    setGenerating(true);
    try {
      const res = await fetch('/api/performance/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: studentId,
          course_id: activeCourse.id,
          topic_ids: selectedTopics,
        }),
      });
      const data = await res.json();
      if (data?.quiz_id && data?.generated_quiz) {
        sessionStorage.setItem(`quiz_${data.quiz_id}`, JSON.stringify(data));
        setDialogOpen(false);
        router.push(`/user/performance/quiz/${data.quiz_id}`);
      }
    } finally {
      setGenerating(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      <FrostedHeader title="Practice Quiz" onMobileMenuToggle={toggleMobileMenu} showSearch={false} />

      <div className="p-6 space-y-6">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/user/performance">Performance</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Practice Quiz</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header row */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-xl font-bold">Practice Quiz</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Select a course and topics to generate a personalised quiz
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/user/performance/quiz/history')}
            className="gap-2"
          >
            <HistoryIcon className="h-4 w-4" />
            Quiz History
          </Button>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statsLoading ? (
            [1, 2, 3, 4].map((i) => (
              <Card key={i} className="p-6">
                <Skeleton className="h-4 w-24 mb-3" />
                <Skeleton className="h-8 w-16" />
              </Card>
            ))
          ) : (
            <>
              <StatsCard
                icon={TrophyIcon}
                title="Total Attempts"
                value={stats?.total_attempts ?? 0}
                description="Quiz attempts made so far"
              />
              <StatsCard
                icon={TrendingUpIcon}
                title="Avg Score"
                value={stats?.avg_percentage != null ? `${stats.avg_percentage}%` : '—'}
                description="Average across all quizzes"
              />
              <StatsCard
                icon={BookOpenIcon}
                title="Topics Covered"
                value={stats?.topics_covered ?? 0}
                description="Unique topics practised"
              />
              <StatsCard
                icon={TargetIcon}
                title="Avg Precision"
                value={stats?.avg_precision != null ? `${stats.avg_precision}%` : '—'}
                description="Accuracy on answered questions"
              />
            </>
          )}
        </div>

        {/* Enrolled courses table */}
        <Card className="mt-2">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <CardTitle className="flex items-center gap-2">
                <BookOpenIcon className="h-5 w-5" />
                Choose a Course to Start
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
                <Button variant="outline" size="sm" onClick={fetchCourses}>
                  <RefreshCwIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Search */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by course name or code…"
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

            <div className="bg-white dark:bg-card rounded-lg border shadow-sm overflow-hidden">
              {coursesLoading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center space-x-4 py-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                      <Skeleton className="h-6 w-16 rounded-full" />
                      <Skeleton className="h-8 w-28 rounded" />
                    </div>
                  ))}
                </div>
              ) : (() => {
                const filtered = courses.filter((c) => {
                  const q = searchInput.toLowerCase();
                  return (
                    !searchInput ||
                    c.course_name.toLowerCase().includes(q) ||
                    c.course_code.toLowerCase().includes(q)
                  );
                });
                return filtered.length === 0 ? (
                  <div className="p-12 text-center">
                    <BookOpenIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No courses found</h3>
                    <p className="text-muted-foreground">
                      {searchInput
                        ? `No courses match "${searchInput}"`
                        : 'No enrolled courses found for the current trimester.'}
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-50 dark:hover:bg-gray-900/50">
                        <TableHead className="font-semibold text-gray-900 dark:text-gray-100 py-4">Course</TableHead>
                        <TableHead className="font-semibold text-gray-900 dark:text-gray-100 py-4">Code</TableHead>
                        <TableHead className="font-semibold text-gray-900 dark:text-gray-100 py-4 text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((course) => (
                        <TableRow
                          key={course.id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors cursor-pointer"
                          onClick={() => openDialog(course)}
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
                          <TableCell className="py-4 text-right">
                            <Button
                              size="sm"
                              className="gap-2 bg-primary hover:bg-primary/90"
                              onClick={(e) => { e.stopPropagation(); openDialog(course); }}
                            >
                              <BrainCircuitIcon className="h-4 w-4" />
                              Attempt Quiz
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                );
              })()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Attempt Quiz Dialog ────────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BrainCircuitIcon className="h-5 w-5 text-primary" />
              Attempt Quiz
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg border p-3 bg-muted/40">
              <p className="text-xs font-medium text-muted-foreground">Course</p>
              <p className="text-sm font-semibold mt-0.5">
                {activeCourse?.course_code}
                {activeCourse?.course_name ? ` — ${activeCourse.course_name}` : ''}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Select Topics{selectedTopics.length > 0 && ` (${selectedTopics.length} selected)`}
              </label>
              {topicsLoading ? (
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-8 w-24 rounded-full" />)}
                </div>
              ) : topics.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2">
                  No topics available for this course.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2 max-h-52 overflow-y-auto py-1 pr-1">
                  {topics.map((t) => {
                    const selected = selectedTopics.includes(t.id);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() =>
                          setSelectedTopics((prev) =>
                            selected ? prev.filter((id) => id !== t.id) : [...prev, t.id],
                          )
                        }
                        className={`text-sm px-3 py-1.5 rounded-full border transition-all ${
                          selected
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-muted/40 text-muted-foreground border-border hover:border-primary/50 hover:text-foreground'
                        }`}
                      >
                        {t.topic_name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={generating || selectedTopics.length === 0}
              onClick={handleGenerate}
              className="bg-primary hover:bg-primary/90 gap-2"
            >
              {generating ? (
                <>
                  <div className="h-4 w-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <BrainCircuitIcon className="h-4 w-4" />
                  Generate Quiz
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
