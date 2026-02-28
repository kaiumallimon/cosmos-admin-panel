'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { FrostedHeader } from '@/components/custom/frosted-header';
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

  useEffect(() => { fetchHistory(); }, [studentId]);

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
          <div className="space-y-3">
            {history.map((entry) => {
              const pct = entry.percentage != null ? Math.round(entry.percentage) : null;
              const scoreColor = getScoreColor(pct);
              const isExpanded = expandedId === entry.id;
              const hasAnswers =
                (entry.right_answers?.length ?? 0) + (entry.wrong_answers?.length ?? 0) > 0;

              return (
                <Card
                  key={entry.id}
                  className="border hover:border-primary/30 transition-all"
                >
                  <CardContent className="p-5 space-y-3">
                    {/* Top row */}
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex-1 min-w-0 space-y-2">
                        {/* Topics */}
                        <div className="flex flex-wrap gap-1.5">
                          {(entry.topic_names ?? []).map((t) => (
                            <Badge key={t} variant="secondary" className="text-xs">
                              {t}
                            </Badge>
                          ))}
                        </div>

                        {/* Meta row */}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                          <div className="flex items-center gap-1.5">
                            <CalendarIcon className="h-3.5 w-3.5" />
                            {formatDate(entry.updated_at || entry.created_at)}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2Icon className="h-3.5 w-3.5 text-green-500" />
                            {entry.right_answers?.length ?? 0} correct
                          </div>
                          <div className="flex items-center gap-1.5">
                            <XCircleIcon className="h-3.5 w-3.5 text-red-500" />
                            {entry.wrong_answers?.length ?? 0} incorrect
                          </div>
                        </div>
                      </div>

                      {/* Score badge */}
                      <div className="shrink-0 flex flex-col items-end gap-1">
                        <div
                          className={`text-2xl font-bold ${scoreColor}`}
                        >
                          {pct != null ? `${pct}%` : '—'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {entry.marks} / {entry.full_marks} marks
                        </div>
                      </div>
                    </div>

                    {/* Expand/collapse button */}
                    {hasAnswers && (
                      <button
                        type="button"
                        onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUpIcon className="h-3.5 w-3.5" />
                            Hide review
                          </>
                        ) : (
                          <>
                            <ChevronDownIcon className="h-3.5 w-3.5" />
                            Show review
                          </>
                        )}
                      </button>
                    )}

                    {/* Expanded review */}
                    {isExpanded && (
                      <div className="pt-2 space-y-3 border-t">
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
