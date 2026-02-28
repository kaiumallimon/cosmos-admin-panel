'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
  TrophyIcon,
  RefreshCwIcon,
  AlertTriangleIcon,
  HistoryIcon,
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
      try {
        setResult(JSON.parse(raw));
      } catch {
        setNotFound(true);
      }
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
          <Button onClick={() => router.push('/user/performance')} className="mt-2">
            Back to Performance
          </Button>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-background">
        <FrostedHeader title="Quiz Result" onMobileMenuToggle={toggleMobileMenu} showSearch={false} />
        <div className="p-6 max-w-3xl mx-auto space-y-4">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-6 w-40" />
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
        </div>
      </div>
    );
  }

  const pct = Math.round(result.percentage ?? 0);
  const { label, color } = getScoreLabel(pct);
  const scoreBg = getScoreBg(pct);
  const rightAnswers = result.right_answers ?? [];
  const wrongAnswers = result.wrong_answers ?? [];

  return (
    <div className="min-h-screen bg-background">
      <FrostedHeader title="Quiz Result" onMobileMenuToggle={toggleMobileMenu} showSearch={false} />

      <div className="p-6 space-y-6 max-w-4xl mx-auto">
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
              <BreadcrumbPage>Result</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Score card */}
        <Card className={`border-2 ${scoreBg}`}>
          <CardContent className="p-8">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div
                className={`shrink-0 flex items-center justify-center h-28 w-28 rounded-full border-4 ${scoreBg}`}
              >
                <div className="text-center">
                  <p className={`text-3xl font-bold ${color}`}>{pct}%</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Score</p>
                </div>
              </div>

              <div className="flex-1 text-center sm:text-left space-y-3">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <TrophyIcon className={`h-5 w-5 ${color}`} />
                  <h2 className={`text-xl font-bold ${color}`}>{label}</h2>
                </div>

                <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                  {(result.quiz?.topics ?? []).map((t) => (
                    <Badge key={t} variant="secondary" className="text-xs">
                      {t}
                    </Badge>
                  ))}
                </div>

                {/* Stats row */}
                <div className="flex items-center gap-4 flex-wrap justify-center sm:justify-start">
                  <div className="flex items-center gap-1.5 text-sm">
                    <CheckCircle2Icon className="h-4 w-4 text-green-500" />
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      {result.marks}
                    </span>
                    <span className="text-muted-foreground">/ {result.full_marks}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm">
                    <CheckCircle2Icon className="h-4 w-4 text-green-500" />
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      {rightAnswers.length}
                    </span>
                    <span className="text-muted-foreground">correct</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm">
                    <XCircleIcon className="h-4 w-4 text-red-500" />
                    <span className="font-semibold text-red-600 dark:text-red-400">
                      {wrongAnswers.length}
                    </span>
                    <span className="text-muted-foreground">incorrect</span>
                  </div>
                  {result.attempt_no != null && (
                    <div className="flex items-center gap-1.5 text-sm">
                      <span className="text-muted-foreground">Attempt #{result.attempt_no}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/user/performance')}
          >
            Back to Performance
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => router.push('/user/performance/quiz/history')}
          >
            <HistoryIcon className="h-4 w-4" />
            Quiz History
          </Button>
          <Button
            size="sm"
            className="gap-2 bg-primary hover:bg-primary/90"
            onClick={() => router.push('/user/performance/quiz')}
          >
            <RefreshCwIcon className="h-4 w-4" />
            Try Another Quiz
          </Button>
        </div>

        {/* Correct answers */}
        {rightAnswers.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-green-600 dark:text-green-400 uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2Icon className="h-4 w-4" />
              Correct Answers ({rightAnswers.length})
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {rightAnswers.map((item) => (
                <Card key={item.question_id} className="border border-green-500/30">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start gap-2">
                      <CheckCircle2Icon className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                      <p className="text-sm font-medium leading-relaxed">{item.question}</p>
                    </div>
                    <div className="ml-6 text-xs">
                      <span className="text-muted-foreground">Your answer: </span>
                      <span className="font-medium text-green-600 dark:text-green-400">
                        {item.chosen_answer}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Wrong answers */}
        {wrongAnswers.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider flex items-center gap-2">
              <XCircleIcon className="h-4 w-4" />
              Incorrect Answers ({wrongAnswers.length})
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {wrongAnswers.map((item) => (
                <Card key={item.question_id} className="border border-red-500/30">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start gap-2">
                      <XCircleIcon className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                      <p className="text-sm font-medium leading-relaxed">{item.question}</p>
                    </div>
                    <div className="ml-6 space-y-1 text-xs">
                      <div>
                        <span className="text-muted-foreground">Your answer: </span>
                        <span className="font-medium text-red-500">{item.chosen_answer}</span>
                      </div>
                      {item.correct_answer && (
                        <div>
                          <span className="text-muted-foreground">Correct answer: </span>
                          <span className="font-medium text-green-600 dark:text-green-400">
                            {item.correct_answer}
                          </span>
                        </div>
                      )}
                      {item.options && (
                        <div className="mt-2 space-y-1">
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
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {rightAnswers.length === 0 && wrongAnswers.length === 0 && (
          <div className="flex items-center justify-center py-10 text-sm text-muted-foreground gap-2">
            <BrainCircuitIcon className="h-5 w-5" />
            No answer breakdown available.
          </div>
        )}
      </div>
    </div>
  );
}
