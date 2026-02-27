'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth';
import { FrostedHeader } from '@/components/custom/frosted-header';
import { useMobileMenu } from '@/components/mobile-menu-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BrainCircuitIcon, CheckCircle2Icon, XCircleIcon, RefreshCwIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Course {
  id: string;
  course_name: string;
  course_code: string;
}

interface QuizQuestion {
  question: string;
  options: string[];
  correct_answer: string;
  topic?: string;
}

interface QuizResult {
  total: number;
  correct: number;
  score_percent: number;
  breakdown?: { question: string; correct: boolean; your_answer: string; correct_answer: string }[];
}

type Stage = 'setup' | 'generating' | 'taking' | 'result';

export default function QuizPage() {
  const { user } = useAuthStore();
  const { toggleMobileMenu } = useMobileMenu();
  const studentId = user.profile?.id;
  const trimester = user.profile?.current_trimester ?? '';

  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [numQuestions, setNumQuestions] = useState('5');
  const [stage, setStage] = useState<Stage>('setup');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [result, setResult] = useState<QuizResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!studentId) return;
    const fetchCourses = async () => {
      try {
        const res = trimester
          ? await fetch(`/api/performance/students/${studentId}/courses/${encodeURIComponent(trimester)}`)
          : await fetch('/api/performance/courses');
        const data = await res.json();
        setCourses(Array.isArray(data) ? data : []);
      } catch { /* silent */ }
    };
    fetchCourses();
  }, [studentId, trimester]);

  const handleGenerate = async () => {
    if (!selectedCourse) return;
    setStage('generating');
    setError('');
    try {
      const res = await fetch('/api/performance/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: studentId,
          course_id: selectedCourse,
          num_questions: Number(numQuestions),
        }),
      });
      const data = await res.json();
      const qs: QuizQuestion[] = Array.isArray(data) ? data : data?.questions ?? [];
      if (qs.length === 0) {
        setError('No questions were generated. Try a different course.');
        setStage('setup');
        return;
      }
      setQuestions(qs);
      setAnswers({});
      setCurrentQ(0);
      setStage('taking');
    } catch {
      setError('Failed to generate quiz. Please try again.');
      setStage('setup');
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = {
        student_id: studentId,
        course_id: selectedCourse,
        questions: questions.map((q, i) => ({
          question: q.question,
          correct_answer: q.correct_answer,
          your_answer: answers[i] ?? '',
        })),
      };
      const res = await fetch('/api/performance/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      const correct = Object.entries(answers).filter(
        ([idx, ans]) => ans === questions[Number(idx)]?.correct_answer,
      ).length;
      setResult({
        total: questions.length,
        correct: data?.correct ?? correct,
        score_percent: data?.score_percent ?? Math.round((correct / questions.length) * 100),
        breakdown: data?.breakdown ?? questions.map((q, i) => ({
          question: q.question,
          correct: answers[i] === q.correct_answer,
          your_answer: answers[i] ?? 'Not answered',
          correct_answer: q.correct_answer,
        })),
      });
      setStage('result');
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setStage('setup');
    setQuestions([]);
    setAnswers({});
    setResult(null);
    setCurrentQ(0);
    setError('');
  };

  const allAnswered = questions.length > 0 && Object.keys(answers).length === questions.length;

  return (
    <div className="flex flex-col h-full">
      <FrostedHeader title="Practice Quiz" onMobileMenuToggle={toggleMobileMenu} showSearch={false} />
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-bold">Practice Quiz</h2>
        {stage !== 'setup' && (
          <Button variant="outline" size="sm" onClick={reset} className="gap-2">
            <RefreshCwIcon className="h-4 w-4" />
            New Quiz
          </Button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {/* Setup Stage */}
        {stage === 'setup' && (
          <motion.div
            key="setup"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card className="border shadow-sm">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BrainCircuitIcon className="h-5 w-5 text-purple-500" />
                  Configure Your Quiz
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Course</label>
                  <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.course_code} — {c.course_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    Number of Questions
                  </label>
                  <Select value={numQuestions} onValueChange={setNumQuestions}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {['3', '5', '10', '15', '20'].map((n) => (
                        <SelectItem key={n} value={n}>
                          {n} questions
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {error && <p className="text-xs text-destructive">{error}</p>}
                <Button
                  disabled={!selectedCourse}
                  onClick={handleGenerate}
                  className="w-full bg-[#007AFF] hover:bg-[#007AFF]/90 gap-2"
                >
                  <BrainCircuitIcon className="h-4 w-4" />
                  Generate Quiz
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Generating */}
        {stage === 'generating' && (
          <motion.div
            key="generating"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-20 gap-4"
          >
            <div className="h-12 w-12 rounded-full border-4 border-[#007AFF] border-t-transparent animate-spin" />
            <p className="text-sm text-muted-foreground">Generating your quiz…</p>
          </motion.div>
        )}

        {/* Quiz Taking */}
        {stage === 'taking' && (
          <motion.div
            key="taking"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Progress */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-2 rounded-full bg-[#007AFF] transition-all duration-300"
                  style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {currentQ + 1} / {questions.length}
              </span>
            </div>

            {/* Question Card */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQ}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <Card className="border shadow-sm">
                  <CardContent className="p-6 space-y-5">
                    {questions[currentQ]?.topic && (
                      <Badge variant="secondary" className="text-xs">
                        {questions[currentQ].topic}
                      </Badge>
                    )}
                    <p className="text-base font-semibold leading-relaxed">
                      {questions[currentQ]?.question}
                    </p>
                    <div className="space-y-2">
                      {questions[currentQ]?.options.map((opt) => (
                        <button
                          key={opt}
                          onClick={() => setAnswers((a) => ({ ...a, [currentQ]: opt }))}
                          className={`w-full text-left px-4 py-3 rounded-xl text-sm border transition-all ${
                            answers[currentQ] === opt
                              ? 'border-[#007AFF] bg-[#007AFF]/10 text-[#007AFF] font-medium'
                              : 'border-border hover:border-[#007AFF]/50 hover:bg-accent/50'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center justify-between gap-3">
              <Button
                variant="outline"
                disabled={currentQ === 0}
                onClick={() => setCurrentQ((q) => q - 1)}
              >
                Previous
              </Button>
              {currentQ < questions.length - 1 ? (
                <Button
                  disabled={!answers[currentQ]}
                  onClick={() => setCurrentQ((q) => q + 1)}
                  className="bg-[#007AFF] hover:bg-[#007AFF]/90"
                >
                  Next
                </Button>
              ) : (
                <Button
                  disabled={!allAnswered || submitting}
                  onClick={handleSubmit}
                  className="bg-[#007AFF] hover:bg-[#007AFF]/90"
                >
                  {submitting ? 'Submitting…' : 'Submit Quiz'}
                </Button>
              )}
            </div>

            {/* Answer dots */}
            <div className="flex flex-wrap gap-1.5 justify-center">
              {questions.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentQ(i)}
                  className={`h-6 w-6 rounded-full text-xs font-semibold transition-colors ${
                    i === currentQ
                      ? 'bg-[#007AFF] text-white'
                      : answers[i]
                      ? 'bg-green-500/20 text-green-600 dark:text-green-400'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Results */}
        {stage === 'result' && result && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            <Card className="border shadow-sm">
              <CardContent className="p-8 text-center space-y-3">
                <div
                  className={`inline-flex items-center justify-center h-20 w-20 rounded-full text-3xl font-bold mx-auto ${
                    result.score_percent >= 70
                      ? 'bg-green-500/10 text-green-600'
                      : result.score_percent >= 50
                      ? 'bg-amber-500/10 text-amber-600'
                      : 'bg-red-500/10 text-red-600'
                  }`}
                >
                  {result.score_percent}%
                </div>
                <h3 className="text-lg font-bold">
                  {result.score_percent >= 70
                    ? 'Great job!'
                    : result.score_percent >= 50
                    ? 'Keep practicing!'
                    : 'Needs more work'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {result.correct} out of {result.total} correct
                </p>
              </CardContent>
            </Card>

            {result.breakdown && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Question Review
                </h3>
                {result.breakdown.map((b, i) => (
                  <Card key={i} className={`border ${b.correct ? 'border-green-500/30' : 'border-red-500/30'}`}>
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-start gap-2">
                        {b.correct ? (
                          <CheckCircle2Icon className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                        ) : (
                          <XCircleIcon className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                        )}
                        <p className="text-sm font-medium">{b.question}</p>
                      </div>
                      {!b.correct && (
                        <div className="ml-6 space-y-1 text-xs">
                          <p className="text-red-500">Your answer: {b.your_answer}</p>
                          <p className="text-green-600 dark:text-green-400">
                            Correct: {b.correct_answer}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}
