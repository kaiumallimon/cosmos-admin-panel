'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FrostedHeader } from '@/components/custom/frosted-header';
import { StatsCard } from '@/components/dashboard/stats-card';
import { useMobileMenu } from '@/components/mobile-menu-context';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  TrophyIcon,
  RefreshCwIcon,
  AlertTriangleIcon,
  HistoryIcon,
  TargetIcon,
  BookOpenIcon,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────

interface AnswerEntry {
  question_id: string;
  question: string;
  options: string[];
  chosen_index: number;
  chosen_answer: string;
  correct_index?: number;
  correct_answer?: string;
}

interface QuizResultData {
  marks: number;
  full_marks: number;
  percentage: number;
  attempt_no: number;
  right_answers: AnswerEntry[];
  wrong_answers: AnswerEntry[];
  quiz: {
    topics: string[];
    quiz_id: string;
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getScoreLabel(pct: number): { label: string; color: string } {
  if (pct >= 80) return { label: 'Excellent!', color: 'text-green-600 dark:text-green-400' };
  if (pct >= 60) return { label: 'Good job!', color: 'text-blue-600 dark:text-blue-400' };
  if (pct >= 40) return { label: 'Keep practicing!', color: 'text-amber-600 dark:text-amber-400' };
  return { label: 'Needs more work', color: 'text-red-600 dark:text-red-400' };
}

function getScoreBg(pct: number): string {
  if (pct >= 80) return 'bg-green-500/10 border-green-500/30';
  if (pct >= 60) return 'bg-blue-500/10 border-blue-500/30';
  if (pct >= 40) return 'bg-amber-500/10 border-amber-500/30';
  return 'bg-red-500/10 border-red-500/30';
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function QuizResultPage() {
  const { toggleMobileMenu } = useMobileMenu();
  const params = useParams<{ quiz_id: string }>();
  const router = useRouter();
  const quizId = params.quiz_id;

  const [result, setResult] = useState<QuizResultData | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem(`quiz_result_${quizId}`);
    if (raw) {
      try { setResult(JSON.parse(raw)); }
      catch { setNotFound(true); }
    } else {
      setNotFound(true);
    }
  }, [quizId]);

  if (notFound) {
    return (
      <div className="min-h-screen bg-background">
        <FrostedHeader title="Quiz Result" onMobileMenuToggle={toggleMobileMenu} showSearch={false} />
        <div className="flex flex-col items-center justify-center p-12 gap-4 text-center">
          <AlertTriangleIcon className="h-12 w-12 text-muted-foreground/40" />
          <h2 className="text-lg font-semibold">Result not found</h2>
          <p className="text-sm text-muted-foreground">This result session has expired or does not exist.</p>
          <Button onClick={() => router.push('/user/performance')} className="mt-2">Back to Performance</Button>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-background">
        <FrostedHeader title="Quiz Result" onMobileMenuToggle={toggleMobileMenu} showSearch={false} />
        <div className="p-6 space-y-6">
          <Skeleton className="h-5 w-56" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <Card key={i} className="p-6"><Skeleton className="h-4 w-24 mb-3" /><Skeleton className="h-8 w-16" /></Card>)}
          </div>
          <Skeleton className="h-32 w-full rounded-xl" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1,2].map(i => <Card key={i} className="p-5"><Skeleton className="h-5 w-32 mb-4" />{[1,2,3].map(j => <Skeleton key={j} className="h-16 w-full rounded-lg mb-2" />)}</Card>)}
          </div>
        </div>
      </div>
    );
  }

  const pct = Math.round(result.percentage ?? 0);
  const { label, color } = getScoreLabel(pct);
  const scoreBg = getScoreBg(pct);
  const rightAnswers = result.right_answers ?? [];
  const wrongAnswers = result.wrong_answers ?? [];
  const accuracy = result.full_marks > 0 ? Math.round((result.marks / result.full_marks) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      <FrostedHeader title="Quiz Result" onMobileMenuToggle={toggleMobileMenu} showSearch={false} />

      <div className="p-6 space-y-6">
        {/* Breadcrumb + actions row */}
        <div className="flex items-center justify-between flex-wrap gap-3">
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
                <BreadcrumbPage>Result</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => router.push('/user/performance')}>
              Back to Performance
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => router.push('/user/performance/quiz/history')}>
              <HistoryIcon className="h-4 w-4" />
              Quiz History
            </Button>
            <Button size="sm" className="gap-2 bg-primary hover:bg-primary/90" onClick={() => router.push('/user/performance/quiz')}>
              <RefreshCwIcon className="h-4 w-4" />
              Try Another Quiz
            </Button>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard icon={TrophyIcon} title="Score" value={`${pct}%`} description={label} />
          <StatsCard icon={TargetIcon} title="Marks" value={`${result.marks} / ${result.full_marks}`} description="Points earned" />
          <StatsCard icon={CheckCircle2Icon} title="Correct" value={rightAnswers.length} description="Questions answered right" />
          <StatsCard icon={XCircleIcon} title="Incorrect" value={wrongAnswers.length} description="Questions answered wrong" />
        </div>

        {/* Summary card */}
        <Card className={`border-2 ${scoreBg}`}>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
              <div className={`shrink-0 flex items-center justify-center h-24 w-24 rounded-full border-4 ${scoreBg}`}>
                <div className="text-center">
                  <p className={`text-2xl font-bold ${color}`}>{pct}%</p>
                  <p className="text-xs text-muted-foreground">Score</p>
                </div>
              </div>
              <div className="flex-1 space-y-2 text-center sm:text-left">
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  <TrophyIcon className={`h-5 w-5 ${color}`} />
                  <h2 className={`text-xl font-bold ${color}`}>{label}</h2>
                  {result.attempt_no != null && (
                    <Badge variant="outline" className="text-xs">Attempt #{result.attempt_no}</Badge>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start">
                  {(result.quiz?.topics ?? []).map((t) => (
                    <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                  ))}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground justify-center sm:justify-start">
                  <BookOpenIcon className="h-3.5 w-3.5" />
                  {rightAnswers.length + wrongAnswers.length} questions attempted
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Answer breakdown — side by side on large screens */}
        {(rightAnswers.length > 0 || wrongAnswers.length > 0) ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Correct answers */}
            <Card className="border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-green-600 dark:text-green-400 flex items-center gap-2">
                  <CheckCircle2Icon className="h-4 w-4" />
                  Correct Answers ({rightAnswers.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                {rightAnswers.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-4 text-center">No correct answers.</p>
                ) : rightAnswers.map((item) => (
                  <div key={item.question_id} className="rounded-lg border border-green-500/20 bg-green-500/5 p-3 space-y-1">
                    <div className="flex items-start gap-2">
                      <CheckCircle2Icon className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                      <p className="text-sm font-medium leading-snug">{item.question}</p>
                    </div>
                    <div className="ml-6 text-xs">
                      <span className="text-muted-foreground">Your answer: </span>
                      <span className="font-medium text-green-600 dark:text-green-400">{item.chosen_answer}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Wrong answers */}
            <Card className="border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-red-500 flex items-center gap-2">
                  <XCircleIcon className="h-4 w-4" />
                  Incorrect Answers ({wrongAnswers.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                {wrongAnswers.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-4 text-center">No incorrect answers.</p>
                ) : wrongAnswers.map((item) => (
                  <div key={item.question_id} className="rounded-lg border border-red-500/20 bg-red-500/5 p-3 space-y-2">
                    <div className="flex items-start gap-2">
                      <XCircleIcon className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                      <p className="text-sm font-medium leading-snug">{item.question}</p>
                    </div>
                    <div className="ml-6 space-y-1">
                      {item.options ? (
                        <div className="space-y-1">
                          {item.options.map((opt, i) => (
                            <div
                              key={i}
                              className={`px-3 py-1.5 rounded-lg text-xs ${
                                i === item.correct_index
                                  ? 'bg-green-500/10 border border-green-500/30 text-green-700 dark:text-green-300 font-medium'
                                  : i === item.chosen_index
                                  ? 'bg-red-500/10 border border-red-500/30 text-red-600 line-through'
                                  : 'bg-muted/40 text-muted-foreground'
                              }`}
                            >
                              {opt}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs space-y-0.5">
                          <div><span className="text-muted-foreground">Your answer: </span><span className="font-medium text-red-500">{item.chosen_answer}</span></div>
                          {item.correct_answer && (
                            <div><span className="text-muted-foreground">Correct: </span><span className="font-medium text-green-600 dark:text-green-400">{item.correct_answer}</span></div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

          </div>
        ) : (
          <div className="flex items-center justify-center py-10 text-sm text-muted-foreground gap-2">
            <BrainCircuitIcon className="h-5 w-5" />
            No answer breakdown available.
          </div>
        )}
      </div>
    </div>
  );
}
