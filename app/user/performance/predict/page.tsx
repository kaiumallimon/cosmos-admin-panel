'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth';
import { FrostedHeader } from '@/components/custom/frosted-header';
import { useMobileMenu } from '@/components/mobile-menu-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SparklesIcon, TrendingUpIcon, PlusIcon, TrashIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Course {
  id: string;
  course_name: string;
  course_code: string;
}

interface CourseInput {
  course: string;
  ct: string;
  assignment: string;
  attendance: string;
  mid: string;
  final?: string;
  project?: string;
}

interface PrevTrimesterInput {
  trimester: string;
  courses: CourseInput[];
}

interface PredictionResult {
  predicted_grade?: string;
  predicted_gpa?: number;
  grade_probabilities?: Record<string, number>;
  insights?: string[];
  confidence?: number;
}

const EMPTY_COURSE: CourseInput = {
  course: '',
  ct: '',
  assignment: '',
  attendance: '',
  mid: '',
  final: '',
  project: '',
};

export default function PredictPage() {
  const { user } = useAuthStore();
  const { toggleMobileMenu } = useMobileMenu();
  const studentId = user.profile?.id;
  const trimester = user.profile?.current_trimester;
  const cgpa = user.profile?.cgpa;

  const [courses, setCourses] = useState<Course[]>([]);
  const [currentCourse, setCurrentCourse] = useState<CourseInput>({ ...EMPTY_COURSE });
  const [prevTrimesters, setPrevTrimesters] = useState<PrevTrimesterInput[]>([]);
  const [useMeta, setUseMeta] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!studentId) return;
    const fetch_ = async () => {
      try {
        const res = trimester
          ? await fetch(`/api/performance/students/${studentId}/courses/${encodeURIComponent(trimester)}`)
          : await fetch('/api/performance/courses');
        const data = await res.json();
        setCourses(Array.isArray(data) ? data : []);
      } catch { /* silent */ }
    };
    fetch_();
  }, [studentId, trimester]);

  // Auto-fill from assessments
  useEffect(() => {
    if (!studentId || !currentCourse.course) return;
    const fill = async () => {
      try {
        const res = await fetch(
          `/api/performance/assessments/student/${studentId}/course/${currentCourse.course}`,
        );
        const data = await res.json();
        if (!Array.isArray(data)) return;
        const updates: Partial<CourseInput> = {};
        data.forEach((a: { assessment_type: string; score: number; max_score: number }) => {
          const pct = ((a.score / (a.max_score || 1)) * 100).toFixed(1);
          if (a.assessment_type === 'ct') updates.ct = pct;
          else if (a.assessment_type === 'mid') updates.mid = pct;
          else if (a.assessment_type === 'assignment') updates.assignment = pct;
          else if (a.assessment_type === 'final') updates.final = pct;
          else if (a.assessment_type === 'project') updates.project = pct;
        });
        setCurrentCourse((prev) => ({ ...prev, ...updates }));
      } catch { /* silent */ }
    };
    fill();
  }, [currentCourse.course, studentId]);

  const handlePredict = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const payload: Record<string, unknown> = {
        current_course: {
          course: currentCourse.course,
          ct: Number(currentCourse.ct) || 0,
          assignment: Number(currentCourse.assignment) || 0,
          attendance: Number(currentCourse.attendance) || 0,
          mid: Number(currentCourse.mid) || 0,
          ...(currentCourse.final && { final: Number(currentCourse.final) }),
          ...(currentCourse.project && { project: Number(currentCourse.project) }),
        },
        cgpa: cgpa ?? undefined,
        current_trimester: trimester ?? undefined,
        use_meta_learning: useMeta,
      };
      if (prevTrimesters.length > 0) {
        payload.previous_trimesters = prevTrimesters.map((pt) => ({
          trimester: pt.trimester,
          courses: pt.courses.map((c) => ({
            course: c.course,
            ct: Number(c.ct) || 0,
            assignment: Number(c.assignment) || 0,
            attendance: Number(c.attendance) || 0,
            mid: Number(c.mid) || 0,
            ...(c.final && { final: Number(c.final) }),
            ...(c.project && { project: Number(c.project) }),
          })),
        }));
      }
      const res = await fetch('/api/performance/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setResult(data);
    } catch {
      setError('Prediction failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const addPrevTrimester = () => {
    setPrevTrimesters((p) => [...p, { trimester: '', courses: [{ ...EMPTY_COURSE }] }]);
  };

  const removePrevTrimester = (idx: number) => {
    setPrevTrimesters((p) => p.filter((_, i) => i !== idx));
  };

  const GradeColor = (grade?: string) => {
    if (!grade) return 'text-foreground';
    const g = grade.toUpperCase();
    if (g.startsWith('A')) return 'text-green-600';
    if (g.startsWith('B')) return 'text-blue-600';
    if (g.startsWith('C')) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <div className="flex flex-col h-full">
      <FrostedHeader title="Grade Prediction" onMobileMenuToggle={toggleMobileMenu} showSearch={false} />
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-bold">Grade Prediction</h2>
        {result && (
          <Button variant="outline" size="sm" onClick={() => setResult(null)}>
            Re-predict
          </Button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {!result ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-6"
          >
            {/* Current Course */}
            <Card className="border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Current Course Data</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    Course
                  </label>
                  <Select
                    value={currentCourse.course}
                    onValueChange={(v) => setCurrentCourse({ ...EMPTY_COURSE, course: v })}
                  >
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
                  {currentCourse.course && (
                    <p className="text-xs text-muted-foreground mt-1">
                      ✓ Assessment scores auto-filled from your records. Adjust if needed.
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { key: 'ct', label: 'CT Score (%)' },
                    { key: 'mid', label: 'Mid Score (%)' },
                    { key: 'assignment', label: 'Assignment (%)' },
                    { key: 'attendance', label: 'Attendance (%)' },
                    { key: 'final', label: 'Final Score (%) (opt)' },
                    { key: 'project', label: 'Project (%) (opt)' },
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">
                        {label}
                      </label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        placeholder="0–100"
                        value={currentCourse[key as keyof CourseInput] ?? ''}
                        onChange={(e) =>
                          setCurrentCourse((prev) => ({ ...prev, [key]: e.target.value }))
                        }
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Previous Trimesters (optional) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Previous Trimesters (optional)</p>
                <Button variant="outline" size="sm" onClick={addPrevTrimester} className="gap-1.5 text-xs">
                  <PlusIcon className="h-3.5 w-3.5" />
                  Add Trimester
                </Button>
              </div>
              {prevTrimesters.map((pt, ptIdx) => (
                <Card key={ptIdx} className="border shadow-sm">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <Input
                        placeholder="Trimester (e.g. Spring 2024)"
                        value={pt.trimester}
                        className="text-sm h-8"
                        onChange={(e) =>
                          setPrevTrimesters((prev) =>
                            prev.map((p, i) =>
                              i === ptIdx ? { ...p, trimester: e.target.value } : p,
                            ),
                          )
                        }
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removePrevTrimester(ptIdx)}
                        className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                    {pt.courses.map((c, cIdx) => (
                      <div key={cIdx} className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t">
                        {Object.entries(c).map(([key, val]) => (
                          <div key={key}>
                            <label className="text-xs text-muted-foreground block mb-1">
                              {key}
                            </label>
                            <Input
                              type={key === 'course' ? 'text' : 'number'}
                              placeholder={key}
                              value={val ?? ''}
                              className="text-xs h-8"
                              onChange={(e) =>
                                setPrevTrimesters((prev) =>
                                  prev.map((p, pi) =>
                                    pi === ptIdx
                                      ? {
                                          ...p,
                                          courses: p.courses.map((cc, ci) =>
                                            ci === cIdx ? { ...cc, [key]: e.target.value } : cc,
                                          ),
                                        }
                                      : p,
                                  ),
                                )
                              }
                            />
                          </div>
                        ))}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Meta Learning Toggle */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setUseMeta((v) => !v)}
                className={`h-5 w-9 rounded-full transition-colors relative shrink-0 ${
                  useMeta ? 'bg-[#007AFF]' : 'bg-muted'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                    useMeta ? 'translate-x-4' : ''
                  }`}
                />
              </button>
              <label className="text-sm text-muted-foreground cursor-pointer" onClick={() => setUseMeta((v) => !v)}>
                Use meta-learning for improved accuracy
              </label>
            </div>

            {error && <p className="text-xs text-destructive">{error}</p>}

            <Button
              disabled={!currentCourse.course || loading}
              onClick={handlePredict}
              className="w-full bg-[#007AFF] hover:bg-[#007AFF]/90 gap-2"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Predicting…
                </>
              ) : (
                <>
                  <SparklesIcon className="h-4 w-4" />
                  Predict My Grade
                </>
              )}
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            {/* Main Grade */}
            <Card className="border shadow-sm">
              <CardContent className="p-8 text-center space-y-4">
                <div className="flex items-center justify-center gap-2">
                  <TrendingUpIcon className="h-5 w-5 text-[#007AFF]" />
                  <span className="text-sm font-semibold text-muted-foreground">Predicted Grade</span>
                </div>
                <p className={`text-6xl font-bold ${GradeColor(result.predicted_grade)}`}>
                  {result.predicted_grade ?? 'N/A'}
                </p>
                {result.predicted_gpa !== undefined && (
                  <p className="text-sm text-muted-foreground">
                    Predicted GPA: <span className="font-semibold text-foreground">{result.predicted_gpa?.toFixed(2)}</span>
                  </p>
                )}
                {result.confidence !== undefined && (
                  <Badge variant="secondary" className="text-xs">
                    Confidence: {Math.round(result.confidence * 100)}%
                  </Badge>
                )}
              </CardContent>
            </Card>

            {/* Grade Probabilities */}
            {result.grade_probabilities &&
              Object.keys(result.grade_probabilities).length > 0 && (
                <Card className="border shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Grade Probabilities</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {Object.entries(result.grade_probabilities)
                      .sort(([, a], [, b]) => b - a)
                      .map(([grade, prob]) => (
                        <div key={grade} className="flex items-center gap-3">
                          <span className={`text-sm font-semibold w-8 ${GradeColor(grade)}`}>
                            {grade}
                          </span>
                          <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-2 rounded-full bg-[#007AFF] transition-all"
                              style={{ width: `${Math.round(prob * 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground w-10 text-right">
                            {Math.round(prob * 100)}%
                          </span>
                        </div>
                      ))}
                  </CardContent>
                </Card>
              )}

            {/* Insights */}
            {result.insights && result.insights.length > 0 && (
              <Card className="border shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <SparklesIcon className="h-4 w-4 text-[#007AFF]" />
                    AI Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {result.insights.map((insight, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex gap-2">
                        <span className="text-[#007AFF] shrink-0">•</span>
                        {insight}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}
