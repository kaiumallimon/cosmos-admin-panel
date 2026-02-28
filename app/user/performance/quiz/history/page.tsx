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
  CheckCircle2Icon,
  XCircleIcon,
  BrainCircuitIcon,
  CalendarIcon,
  TrophyIcon,
  TrendingUpIcon,
  TargetIcon,
  BookOpenIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  RefreshCwIcon,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface HistoryEntry {
  id: string;
  student_id: string;
  course_id: string;
  topic_names: string[];
  attempt_no: number;
  marks: number;
  full_marks: number;
  precision: number | null;
  percentage: number | null;
  quiz_ids: string[];
  right_answers: { question: string; chosen_answer: string }[];
  wrong_answers: {
    question: string;
    chosen_answer: string;
    correct_answer: string;
  }[];
  created_at: string;
  updated_at: string;
}

interface QuizStats {
  total_attempts: number;
  avg_score: number | null;
  avg_percentage: number | null;
  topics_covered: number;
  avg_precision: number | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getScoreColor(pct: number | null) {
  if (pct == null) return 'text-muted-foreground';
  if (pct >= 80) return 'text-green-600 dark:text-green-400';
  if (pct >= 60) return 'text-blue-600 dark:text-blue-400';
  if (pct >= 40) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-500';
}

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function QuizHistoryPage() {
  const { user } = useAuthStore();
  const { toggleMobileMenu } = useMobileMenu();
  const router = useRouter();
  const studentId = user.profile?.id;

  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [stats, setStats] = useState<QuizStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const fetchStats = async () => {
    if (!studentId) return;
    setStatsLoading(true);
    try {
      const res = await fetch(`/api/performance/quiz/stats?student_id=${studentId}`);
      const data = await res.json();
      setStats(data);
    } catch { setStats(null); }
    finally { setStatsLoading(false); }
  };

  const fetchHistory = async () => {
    if (!studentId) { setLoading(false); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/performance/quiz/history?student_id=${studentId}`);
      const data = await res.json();
      setHistory(Array.isArray(data) ? data : []);
    } catch {
      setError('Failed to load quiz history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    fetchStats();
  }, [studentId]);

  return (
    <div className="min-h-screen bg-background">
      <FrostedHeader title="Quiz History" onMobileMenuToggle={toggleMobileMenu} showSearch={false} />

      <div className="p-6 space-y-6">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/user/performance">Performance</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/user/performance/quiz">Quiz</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>History</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-xl font-bold">Quiz History</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Your past quiz attempts and results
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchHistory}
              className="gap-2 text-muted-foreground"
            >
              <RefreshCwIcon className="h-3.5 w-3.5" />
              Refresh
            </Button>
            <Button
              size="sm"
              className="gap-2 bg-primary hover:bg-primary/90"
              onClick={() => router.push('/user/performance/quiz')}
            >
              <BrainCircuitIcon className="h-4 w-4" />
              New Quiz
            </Button>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statsLoading ? (
            [1,2,3,4].map(i => (
              <Card key={i} className="p-6">
                <Skeleton className="h-4 w-24 mb-3" />
                <Skeleton className="h-8 w-16" />
              </Card>
            ))
          ) : (
            <>
              <StatsCard icon={TrophyIcon} title="Total Attempts" value={stats?.total_attempts ?? 0} description="Quiz attempts made so far" />
              <StatsCard icon={TrendingUpIcon} title="Avg Score" value={stats?.avg_score != null ? stats.avg_score : '—'} description="Average marks across all quizzes" />
              <StatsCard icon={BookOpenIcon} title="Topics Covered" value={stats?.topics_covered ?? 0} description="Unique topics practised" />
              <StatsCard icon={TargetIcon} title="Avg Precision" value={stats?.avg_precision != null ? `${stats.avg_precision}%` : '—'} description="Accuracy on answered questions" />
            </>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="p-5">
                  <Skeleton className="h-5 w-32 mb-2" />
                  <Skeleton className="h-4 w-64 mb-3" />
                  <Skeleton className="h-4 w-48" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center border rounded-xl bg-muted/20">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchHistory}>
              Try Again
            </Button>
          </div>
        ) : history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center border rounded-xl bg-muted/20">
            <BrainCircuitIcon className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No quiz attempts yet.</p>
            <Button
              size="sm"
              onClick={() => router.push('/user/performance/quiz')}
              className="gap-2 mt-1 bg-primary hover:bg-primary/90"
            >
              <BrainCircuitIcon className="h-4 w-4" />
              Start Your First Quiz
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {history.map((entry, idx) => {
              const cardId = entry.id ?? `card-${idx}`;
              const pct = entry.percentage != null ? Math.round(entry.percentage) : null;
              const scoreColor = getScoreColor(pct);
              const scoreBg =
                pct == null ? 'bg-muted/50' :
                pct >= 80 ? 'bg-green-500/10' :
                pct >= 60 ? 'bg-blue-500/10' :
                pct >= 40 ? 'bg-amber-500/10' : 'bg-red-500/10';
              const accentBar =
                pct == null ? 'bg-muted' :
                pct >= 80 ? 'bg-green-500' :
                pct >= 60 ? 'bg-blue-500' :
                pct >= 40 ? 'bg-amber-500' : 'bg-red-500';
              const total = (entry.right_answers?.length ?? 0) + (entry.wrong_answers?.length ?? 0);
              const isExpanded = expandedId === cardId;
              const hasAnswers = total > 0;

              return (
                <Card
                  key={cardId}
                  className="border hover:border-primary/30 hover:shadow-md transition-all overflow-hidden"
                >
                  <CardContent className="p-0">

                    <div className="p-5 space-y-4">
                      {/* Row 1: topics + date + score */}
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        {/* Topics */}
                        <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
                          {(entry.topic_names ?? []).map((t) => (
                            <Badge key={t} variant="secondary" className="text-xs font-medium">
                              {t}
                            </Badge>
                          ))}
                        </div>

                        {/* Date */}
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
                          <CalendarIcon className="h-3.5 w-3.5" />
                          {formatDate(entry.updated_at || entry.created_at)}
                        </div>
                      </div>

                      {/* Row 2: stats + score */}
                      <div className="flex items-center justify-between gap-4 flex-wrap">
                        {/* Stats pills */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="flex items-center gap-1.5 text-xs rounded-full bg-green-500/10 border border-green-500/20 px-2.5 py-1">
                            <CheckCircle2Icon className="h-3.5 w-3.5 text-green-500" />
                            <span className="font-semibold text-green-600 dark:text-green-400">{entry.right_answers?.length ?? 0}</span>
                            <span className="text-muted-foreground">correct</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs rounded-full bg-red-500/10 border border-red-500/20 px-2.5 py-1">
                            <XCircleIcon className="h-3.5 w-3.5 text-red-500" />
                            <span className="font-semibold text-red-500">{entry.wrong_answers?.length ?? 0}</span>
                            <span className="text-muted-foreground">incorrect</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {entry.marks} / {entry.full_marks} marks
                          </div>
                        </div>

                        {/* Score + toggle */}
                        <div className="flex items-center gap-3 shrink-0">
                          <div className={`rounded-xl px-4 py-2 ${scoreBg} text-center`}>
                            <div className={`text-xl font-bold tabular-nums leading-none ${scoreColor}`}>
                              {pct != null ? `${pct}%` : '—'}
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5">score</div>
                          </div>

                          {hasAnswers && (
                            <button
                              type="button"
                              onClick={() => setExpandedId(isExpanded ? null : cardId)}
                              className={`flex items-center gap-1.5 text-xs rounded-lg border px-3 py-2 transition-all font-medium ${
                                isExpanded
                                  ? 'bg-primary text-primary-foreground border-primary'
                                  : 'text-muted-foreground hover:text-foreground hover:border-primary/40 border-border'
                              }`}
                            >
                              {isExpanded ? <ChevronUpIcon className="h-3.5 w-3.5" /> : <ChevronDownIcon className="h-3.5 w-3.5" />}
                              {isExpanded ? 'Hide' : 'Review'}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Progress bar */}
                      {/* {total > 0 && (
                        <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${accentBar}`}
                            style={{ width: `${pct ?? 0}%` }}
                          />
                        </div>
                      )} */}
                    </div>

                    {/* Expanded review */}
                    {isExpanded && (
                      <div className="px-5 pb-5 pt-2 space-y-3 border-t">
                        {/* Correct */}
                        {(entry.right_answers?.length ?? 0) > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs font-semibold text-green-600 dark:text-green-400 flex items-center gap-1">
                              <CheckCircle2Icon className="h-3.5 w-3.5" />
                              Correct
                            </p>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                              {entry.right_answers.map((a, i) => (
                                <div
                                  key={i}
                                  className="rounded-lg border border-green-500/20 bg-green-500/5 px-3 py-2 text-xs"
                                >
                                  <p className="font-medium text-foreground mb-1">{a.question}</p>
                                  <p className="text-green-600 dark:text-green-400">
                                    {a.chosen_answer}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Wrong */}
                        {(entry.wrong_answers?.length ?? 0) > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs font-semibold text-red-500 flex items-center gap-1">
                              <XCircleIcon className="h-3.5 w-3.5" />
                              Incorrect
                            </p>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                              {entry.wrong_answers.map((a, i) => (
                                <div
                                  key={i}
                                  className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs"
                                >
                                  <p className="font-medium text-foreground mb-1">{a.question}</p>
                                  <p className="text-red-500 line-through">{a.chosen_answer}</p>
                                  {a.correct_answer && (
                                    <p className="text-green-600 dark:text-green-400">
                                      ✓ {a.correct_answer}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
