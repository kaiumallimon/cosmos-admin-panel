'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { FrostedHeader } from '@/components/custom/frosted-header';
import { StatsCard } from '@/components/dashboard/stats-card';
import { useMobileMenu } from '@/components/mobile-menu-context';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
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
  ChevronRightIcon,
  RefreshCwIcon,
  HistoryIcon,
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

// ─── Component ────────────────────────────────────────────────────────────────

export default function QuizIndexPage() {
  const { user } = useAuthStore();
  const { toggleMobileMenu } = useMobileMenu();
  const router = useRouter();

  const studentId = user.profile?.id;
  const trimester = user.profile?.current_trimester ?? '';

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
    if (!studentId || !trimester) { setCoursesLoading(false); return; }
    setCoursesLoading(true);
    try {
      const res = await fetch(
        `/api/performance/students/${studentId}/courses/${encodeURIComponent(trimester)}`,
      );
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
    } catch {
      setCourses([]);
    } finally {
      setCoursesLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchCourses();
  }, [studentId, trimester]);

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

        {/* Enrolled courses grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold">Choose a Course to Start</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchCourses}
              className="gap-2 text-muted-foreground"
            >
              <RefreshCwIcon className="h-3.5 w-3.5" />
              Refresh
            </Button>
          </div>

          {coursesLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="p-5">
                  <Skeleton className="h-5 w-16 mb-2" />
                  <Skeleton className="h-4 w-36 mb-4" />
                  <Skeleton className="h-9 w-full rounded-md" />
                </Card>
              ))}
            </div>
          ) : courses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center border rounded-xl bg-muted/20">
              <BookOpenIcon className="h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                No enrolled courses found for the current trimester.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {courses.map((course) => (
                <Card
                  key={course.id}
                  className="group border hover:border-primary/50 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => openDialog(course)}
                >
                  <CardContent className="p-5 flex flex-col gap-3 h-full">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <Badge variant="secondary" className="text-xs font-mono mb-2">
                          {course.course_code}
                        </Badge>
                        <p className="text-sm font-semibold leading-snug line-clamp-2">
                          {course.course_name}
                        </p>
                      </div>
                      <div className="shrink-0 h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary transition-colors">
                        <BrainCircuitIcon className="h-4 w-4 text-primary group-hover:text-primary-foreground transition-colors" />
                      </div>
                    </div>
                    <div className="mt-auto pt-3 border-t">
                      <div className="flex items-center gap-1 text-xs text-primary font-medium">
                        Attempt Quiz
                        <ChevronRightIcon className="h-3.5 w-3.5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
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
