'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FrostedHeader } from '@/components/custom/frosted-header';
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
  MinusCircleIcon,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────

interface QuizQuestion {
  question_id: string;
  question: string;
  options: string[];
}

interface QuizData {
  student_id: string;
  course_id: string;
  quiz_id: string;
  topics: string[];
  generated_quiz: QuizQuestion[];
  created_at: string;
}

interface AnswerBreakdown {
  question_id: string;
  question: string;
  selected_option: string;
  correct_option?: string;
  is_correct?: boolean;
}

interface QuizResultData {
  // server-provided fields (may vary by backend)
  score?: number;
  total?: number;
  correct?: number;
  incorrect?: number;
  score_percent?: number;
  percentage?: number;
  breakdown?: AnswerBreakdown[];
  // locally computed
  quiz: QuizData;
  answers: Record<string, string>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getScorePercent(result: QuizResultData): number {
  if (result.score_percent != null) return Math.round(result.score_percent);
  if (result.percentage != null) return Math.round(result.percentage);
  const total = result.quiz.generated_quiz.length;
  const correct = result.correct ?? 0;
  return total > 0 ? Math.round((correct / total) * 100) : 0;
}

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

  // ─── Not found ──────────────────────────────────────────────────────────────
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

  // ─── Loading ─────────────────────────────────────────────────────────────────
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

  const pct = getScorePercent(result);
  const { label, color } = getScoreLabel(pct);
  const scoreBg = getScoreBg(pct);
  const total = result.quiz.generated_quiz.length;
  const correct = result.correct ?? result.breakdown?.filter((b) => b.is_correct).length ?? 0;
  const incorrect = result.incorrect ?? (total - correct);

  // Build per-question review from server breakdown or local answers
  const questionReview = result.quiz.generated_quiz.map((q) => {
    const serverItem = result.breakdown?.find((b) => b.question_id === q.question_id);
    const selected = result.answers[q.question_id] ?? '';
    return {
      question_id: q.question_id,
      question: q.question,
      selected_option: serverItem?.selected_option ?? selected,
      correct_option: serverItem?.correct_option,
      is_correct: serverItem?.is_correct,
    };
  });

  const hasCorrectInfo = questionReview.some((r) => r.correct_option != null || r.is_correct != null);

  return (
    <div className="min-h-screen bg-background">
      <FrostedHeader title="Quiz Result" onMobileMenuToggle={toggleMobileMenu} showSearch={false} />

      <div className="p-6 space-y-6 max-w-3xl mx-auto">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/user/performance">Performance</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={`/user/performance/quiz/${quizId}`}>Quiz</BreadcrumbLink>
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
              {/* Big score circle */}
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
                  {result.quiz.topics.map((t) => (
                    <Badge key={t} variant="secondary" className="text-xs">
                      {t}
                    </Badge>
                  ))}
                </div>

                {/* Stats row */}
                <div className="flex items-center gap-4 flex-wrap justify-center sm:justify-start">
                  <div className="flex items-center gap-1.5 text-sm">
                    <CheckCircle2Icon className="h-4 w-4 text-green-500" />
                    <span className="font-semibold text-green-600 dark:text-green-400">{correct}</span>
                    <span className="text-muted-foreground">correct</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm">
                    <XCircleIcon className="h-4 w-4 text-red-500" />
                    <span className="font-semibold text-red-600 dark:text-red-400">{incorrect}</span>
                    <span className="text-muted-foreground">incorrect</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm">
                    <MinusCircleIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">{total}</span>
                    <span className="text-muted-foreground">total</span>
                  </div>
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
            size="sm"
            className="gap-2 bg-primary hover:bg-primary/90"
            onClick={() => router.push('/user/performance/courses')}
          >
            <RefreshCwIcon className="h-4 w-4" />
            Try Another Quiz
          </Button>
        </div>

        {/* Question Review */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <BrainCircuitIcon className="h-4 w-4" />
            Question Review
          </h3>

          {questionReview.map((item, idx) => {
            const answered = !!item.selected_option;
            const isCorrect = item.is_correct;

            return (
              <Card
                key={item.question_id}
                className={`border transition-all ${
                  isCorrect === true
                    ? 'border-green-500/30'
                    : isCorrect === false
                    ? 'border-red-500/30'
                    : 'border-border'
                }`}
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start gap-2">
                    {isCorrect === true ? (
                      <CheckCircle2Icon className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                    ) : isCorrect === false ? (
                      <XCircleIcon className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                    ) : (
                      <span className="shrink-0 inline-flex items-center justify-center h-5 w-5 rounded-full bg-muted text-xs font-bold text-muted-foreground mt-0.5">
                        {idx + 1}
                      </span>
                    )}
                    <p className="text-sm font-medium leading-relaxed">{item.question}</p>
                  </div>

                  <div className="ml-6 space-y-1 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="text-muted-foreground">Your answer:</span>
                      <span
                        className={
                          isCorrect === true
                            ? 'text-green-600 dark:text-green-400 font-medium'
                            : isCorrect === false
                            ? 'text-red-500 font-medium'
                            : 'font-medium'
                        }
                      >
                        {answered ? item.selected_option : 'Not answered'}
                      </span>
                    </div>
                    {hasCorrectInfo && item.correct_option && isCorrect === false && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-muted-foreground">Correct answer:</span>
                        <span className="text-green-600 dark:text-green-400 font-medium">
                          {item.correct_option}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
