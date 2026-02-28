'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { BrainCircuitIcon, CheckCircle2Icon, CircleIcon, AlertTriangleIcon } from 'lucide-react';

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

// ─── Component ───────────────────────────────────────────────────────────────

export default function QuizTakingPage() {
  const { user } = useAuthStore();
  const { toggleMobileMenu } = useMobileMenu();
  const params = useParams<{ quiz_id: string }>();
  const router = useRouter();
  const quizId = params.quiz_id;

  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  // ─── Load quiz from sessionStorage ──────────────────────────────────────
  useEffect(() => {
    const raw = sessionStorage.getItem(`quiz_${quizId}`);
    if (raw) {
      try {
        setQuiz(JSON.parse(raw));
      } catch {
        setNotFound(true);
      }
    } else {
      setNotFound(true);
    }
  }, [quizId]);

  // ─── Submit ──────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!quiz) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      const payload = {
        student_id: quiz.student_id,
        quiz_id: quiz.quiz_id,
        answers: quiz.generated_quiz.map((q) => ({
          question_id: q.question_id,
          selected_option: answers[q.question_id] ?? '',
        })),
      };
      const res = await fetch('/api/performance/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      // Store result for result page
      sessionStorage.setItem(
        `quiz_result_${quiz.quiz_id}`,
        JSON.stringify({ ...data, quiz, answers }),
      );
      router.push(`/user/performance/quiz/${quiz.quiz_id}/result`);
    } catch {
      setSubmitError('Failed to submit quiz. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Derived ─────────────────────────────────────────────────────────────
  const totalQ = quiz?.generated_quiz.length ?? 0;
  const answeredCount = Object.keys(answers).length;
  const allAnswered = totalQ > 0 && answeredCount === totalQ;
  const unansweredCount = totalQ - answeredCount;

  // ─── Not found state ──────────────────────────────────────────────────────
  if (notFound) {
    return (
      <div className="min-h-screen bg-background">
        <FrostedHeader title="Quiz" onMobileMenuToggle={toggleMobileMenu} showSearch={false} />
        <div className="flex flex-col items-center justify-center p-12 gap-4 text-center">
          <AlertTriangleIcon className="h-12 w-12 text-muted-foreground/40" />
          <h2 className="text-lg font-semibold">Quiz not found</h2>
          <p className="text-sm text-muted-foreground">
            This quiz session has expired or does not exist.
          </p>
          <Button onClick={() => router.push('/user/performance')} className="mt-2">
            Back to Performance
          </Button>
        </div>
      </div>
    );
  }

  // ─── Loading state ────────────────────────────────────────────────────────
  if (!quiz) {
    return (
      <div className="min-h-screen bg-background">
        <FrostedHeader title="Quiz" onMobileMenuToggle={toggleMobileMenu} showSearch={false} />
        <div className="p-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6 space-y-4">
                <Skeleton className="h-5 w-3/4" />
                <div className="space-y-2">
                  {[1, 2, 3, 4].map((j) => <Skeleton key={j} className="h-12 w-full rounded-xl" />)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      <FrostedHeader title="Quiz" onMobileMenuToggle={toggleMobileMenu} showSearch={false} />

      <div className="p-6 space-y-6 max-w-3xl mx-auto">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/user/performance">Performance</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Quiz</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Quiz header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <BrainCircuitIcon className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold">Practice Quiz</h2>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {quiz.topics.map((topic) => (
                <Badge key={topic} variant="secondary" className="text-xs">
                  {topic}
                </Badge>
              ))}
            </div>
          </div>

          {/* Progress indicator */}
          <div className="flex items-center gap-3 bg-muted/40 rounded-lg px-4 py-2.5 border">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{answeredCount}</p>
              <p className="text-xs text-muted-foreground">Answered</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center">
              <p className="text-2xl font-bold">{totalQ}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-2 rounded-full bg-primary transition-all duration-300"
            style={{ width: `${totalQ > 0 ? (answeredCount / totalQ) * 100 : 0}%` }}
          />
        </div>

        {/* Questions */}
        <div className="space-y-5">
          {quiz.generated_quiz.map((q, idx) => {
            const selected = answers[q.question_id];
            return (
              <Card
                key={q.question_id}
                className={`border transition-all ${selected ? 'border-primary/30 shadow-sm' : 'border-border'}`}
              >
                <CardContent className="p-6 space-y-4">
                  {/* Question number + text */}
                  <div className="flex items-start gap-3">
                    <span
                      className={`shrink-0 inline-flex items-center justify-center h-7 w-7 rounded-full text-sm font-bold ${
                        selected
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <p className="text-sm font-medium leading-relaxed pt-0.5">{q.question}</p>
                  </div>

                  {/* Options */}
                  <div className="space-y-2 ml-10">
                    {q.options.map((opt) => {
                      const isSelected = selected === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() =>
                            setAnswers((prev) => ({ ...prev, [q.question_id]: opt }))
                          }
                          className={`w-full flex items-center gap-3 text-left px-4 py-3 rounded-xl text-sm border transition-all ${
                            isSelected
                              ? 'border-primary bg-primary/10 text-primary font-medium'
                              : 'border-border hover:border-primary/50 hover:bg-accent/50'
                          }`}
                        >
                          {isSelected ? (
                            <CheckCircle2Icon className="h-4 w-4 shrink-0 text-primary" />
                          ) : (
                            <CircleIcon className="h-4 w-4 shrink-0 text-muted-foreground/50" />
                          )}
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Submit section */}
        <div className="sticky bottom-6">
          <div className="bg-background/80 backdrop-blur-sm border rounded-xl p-4 shadow-lg flex items-center justify-between gap-4 flex-wrap">
            <div>
              {!allAnswered ? (
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-amber-500">{unansweredCount}</span>{' '}
                  question{unansweredCount !== 1 ? 's' : ''} left unanswered
                </p>
              ) : (
                <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                  All questions answered — ready to submit!
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => setConfirmOpen(true)}
                disabled={answeredCount === 0 || submitting}
                className="bg-primary hover:bg-primary/90 gap-2"
              >
                <BrainCircuitIcon className="h-4 w-4" />
                {submitting ? 'Submitting…' : 'Submit Quiz'}
              </Button>
            </div>
          </div>
        </div>

        {submitError && (
          <p className="text-sm text-destructive text-center">{submitError}</p>
        )}
      </div>

      {/* Confirm submit dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Submit Quiz?</DialogTitle>
            <DialogDescription>
              {!allAnswered
                ? `You have ${unansweredCount} unanswered question${unansweredCount !== 1 ? 's' : ''}. Unanswered questions will be marked incorrect.`
                : 'You have answered all questions. Are you ready to submit?'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Go Back
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-primary hover:bg-primary/90"
            >
              {submitting ? 'Submitting…' : 'Submit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
