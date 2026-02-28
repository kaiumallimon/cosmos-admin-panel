'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuthStore } from '@/store/auth';
import { FrostedHeader } from '@/components/custom/frosted-header';
import { useMobileMenu } from '@/components/mobile-menu-context';
import { StatsCard } from '@/components/dashboard/stats-card';
import {
  DashboardBarChart,
  DashboardPieChart,
  ChartCard,
} from '@/components/dashboard/chart-components';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  BookOpenIcon,
  ClipboardListIcon,
  AlertTriangleIcon,
  BrainCircuitIcon,
  ArrowRightIcon,
  TrendingUpIcon,
  SparklesIcon,
  StarIcon,
  TargetIcon,
  GraduationCapIcon,
  BarChart3Icon,
  CheckCircle2Icon,
} from 'lucide-react';
import Link from 'next/link';
import {
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Tooltip,
} from 'recharts';

// ─── Types ────────────────────────────────────────────────────────────────────

type AssessmentType = 'ct' | 'mid' | 'final' | 'assignment' | 'project';

interface EnrolledCourse {
  enrollment_id: string;
  student_id: string;
  course_id: string;
  course_title: string;
  credit: number;
  trimester: string;
  section?: string | null;
  faculty?: string | null;
  ct_count?: number;
  assignment_count?: number;
}

interface Assessment {
  id?: string;
  assessment_id?: string;
  assessment_type: AssessmentType;
  marks?: number;
  score?: number;
  full_marks?: number;
  max_score?: number;
  course_id: string;
  /** Friendly label resolved at fetch time */
  course_name?: string;
  ct_no?: number;
}

interface Weakness {
  id: string;
  topic_name: string;
  course_name: string;
  course_id?: string;
  course_code?: string;
}

const TYPE_LABELS: Record<string, string> = {
  ct: 'Class Test',
  mid: 'Mid Term',
  final: 'Final Exam',
  assignment: 'Assignment',
  project: 'Project',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getScore(a: Assessment) {
  return a.marks ?? a.score ?? 0;
}

function getMax(a: Assessment) {
  return a.full_marks ?? a.max_score ?? 1;
}

function pct(a: Assessment) {
  return (getScore(a) / getMax(a)) * 100;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PerformanceOverviewPage() {
  const { user } = useAuthStore();
  const { toggleMobileMenu } = useMobileMenu();
  const studentId = user.profile?.id;
  const trimester = user.profile?.current_trimester;
  const cgpa = user.profile?.cgpa;

  const [courses, setCourses] = useState<EnrolledCourse[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [weaknesses, setWeaknesses] = useState<Weakness[]>([]);
  /** course_id → { title, code } from the `courses` MongoDB collection */
  const [courseMap, setCourseMap] = useState<Record<string, { title: string; code: string }>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentId) return;
    const fetchAll = async () => {
      setLoading(true);
      try {
        // Resolve trimester — use profile value, or fallback to latest from trimesters API
        let sem = trimester;
        if (!sem) {
          try {
            const tRes = await fetch('/api/course-management/trimesters');
            const tData = await tRes.json();
            const sorted = (Array.isArray(tData?.trimesters) ? tData.trimesters : [])
              .sort((a: { created_at?: string }, b: { created_at?: string }) =>
                new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
              );
            sem = sorted[0]?.trimester ?? '';
          } catch { /* silent */ }
        }

        const enrollUrl = sem
          ? `/api/performance/enrollments/${studentId}?trimester=${encodeURIComponent(sem)}`
          : `/api/performance/enrollments/${studentId}`;

        const [cRes, aRes, wRes] = await Promise.all([
          fetch(enrollUrl),
          fetch(`/api/performance/assessments/student/${studentId}`),
          fetch(`/api/performance/weaknesses/${studentId}`),
        ]);

        const cData = await cRes.json();
        setCourses(Array.isArray(cData) ? cData : []);

        // Build a quick name map from raw assessment data too (backend may include course_name)
        const aData = await aRes.json();
        const parsedAssessments: Assessment[] = Array.isArray(aData)
          ? aData.map((a: Record<string, string | number>) => ({
              id: String(a.assessment_id ?? a.id ?? ''),
              assessment_type: (a.assessment_type ?? 'other') as AssessmentType,
              marks: Number(a.marks ?? a.score ?? 0),
              full_marks: Number(a.full_marks ?? a.max_score ?? 1),
              course_id: String(a.course_id ?? ''),
              course_name: String(a.course_name ?? a.course_title ?? ''),
              ct_no: a.ct_no !== undefined ? Number(a.ct_no) : undefined,
            }))
          : [];
        setAssessments(parsedAssessments);

        // Fetch human-readable titles from the `courses` collection using the UUID `id` field
        const uniqueCourseIds = [...new Set(parsedAssessments.map((a) => a.course_id).filter(Boolean))];
        if (uniqueCourseIds.length > 0) {
          try {
            const crRes = await fetch(`/api/performance/courses?ids=${uniqueCourseIds.join(',')}`);
            const crData = await crRes.json();
            if (Array.isArray(crData)) {
              const map: Record<string, { title: string; code: string }> = {};
              for (const c of crData as { id: string; title: string; code: string }[]) {
                if (c.id) map[c.id] = { title: c.title, code: c.code };
              }
              setCourseMap(map);
            }
          } catch { /* silent */ }
        }

        const wData = await wRes.json();
        setWeaknesses(Array.isArray(wData) ? wData : []);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [studentId, trimester]);

  // ─── Derived analytics ──────────────────────────────────────────────────────

  const avgScore = useMemo(() => {
    if (!assessments.length) return null;
    return Math.round((assessments.reduce((s, a) => s + pct(a), 0) / assessments.length) * 10) / 10;
  }, [assessments]);

  const bestScore = useMemo(() => {
    if (!assessments.length) return null;
    return Math.round(Math.max(...assessments.map(pct)) * 10) / 10;
  }, [assessments]);

  // Score by assessment type (bar chart)
  const scoreByType = useMemo(() => {
    const groups: Record<string, number[]> = {};
    for (const a of assessments) {
      const t = a.assessment_type ?? 'other';
      if (t === 'final') continue; // Final Exam excluded from this chart
      if (!groups[t]) groups[t] = [];
      groups[t].push(pct(a));
    }
    return Object.entries(groups).map(([type, scores]) => ({
      type: TYPE_LABELS[type] ?? type,
      avg: Math.round((scores.reduce((s, v) => s + v, 0) / scores.length) * 10) / 10,
      count: scores.length,
    }));
  }, [assessments]);

  // Course name map — keyed by course_id, value is human-readable title
  // Priority: courses collection (by UUID `id`) > enrollment title > fallback
  const courseNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    // Seed from enrollments first (lowest priority)
    for (const c of courses) {
      if (!c.course_id) continue;
      map[c.course_id] = c.course_title || `Course ${c.course_id.slice(0, 6)}…`;
    }
    // Overwrite with authoritative titles from the `courses` collection (highest priority)
    for (const [id, info] of Object.entries(courseMap)) {
      const label = info.code ? `${info.code} – ${info.title}` : info.title;
      map[id] = label;
    }
    return map;
  }, [courses, courseMap]);

  // Score per course (bar chart)
  const scoreByCourse = useMemo(() => {
    const groups: Record<string, number[]> = {};
    const nameHint: Record<string, string> = {};
    for (const a of assessments) {
      if (!a.course_id) continue;
      if (!groups[a.course_id]) groups[a.course_id] = [];
      groups[a.course_id].push(pct(a));
      // Use assessment's embedded course_name as a lower-priority hint
      if (!nameHint[a.course_id] && a.course_name) nameHint[a.course_id] = a.course_name;
    }
    return Object.entries(groups).map(([cid, scores]) => {
      const label = courseNameMap[cid] || nameHint[cid] || `Course ${cid.slice(0, 6)}…`;
      return {
        course: label,
        avg: Math.round((scores.reduce((s, v) => s + v, 0) / scores.length) * 10) / 10,
      };
    });
  }, [assessments, courseNameMap]);

  // Assessment type distribution (pie)
  const typeDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const a of assessments) {
      const t = TYPE_LABELS[a.assessment_type] ?? a.assessment_type;
      counts[t] = (counts[t] ?? 0) + 1;
    }
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [assessments]);

  // Weakness distribution by course
  const weaknessByCourse = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const w of weaknesses) {
      const name = w.course_name ?? w.course_id ?? 'Unknown';
      counts[name] = (counts[name] ?? 0) + 1;
    }
    return Object.entries(counts)
      .map(([course, count]) => ({ course, count }))
      .sort((a, b) => b.count - a.count);
  }, [weaknesses]);

  // Radar chart data
  const radarData = useMemo(() => scoreByType.map(({ type, avg }) => ({ type, score: avg })), [scoreByType]);

  // Course performance rows
  const coursePerformance = useMemo(() => {
    return courses.map((c) => {
      const cid = c.course_id;
      const name = c.course_title;
      const credit = c.credit;
      const faculty = c.faculty ?? '';
      const sem = c.trimester ?? '';
      const courseAssessments = assessments.filter((a) => a.course_id === cid);
      const avg =
        courseAssessments.length > 0
          ? Math.round((courseAssessments.reduce((s, a) => s + pct(a), 0) / courseAssessments.length) * 10) / 10
          : null;
      const wcCount = weaknesses.filter((w) => w.course_id === cid).length;
      return { cid, name, credit, faculty, sem, avg, count: courseAssessments.length, wcCount };
    });
  }, [courses, assessments, weaknesses]);

  const completedAssessments = useMemo(
    () => assessments.filter((a) => pct(a) >= 40).length,
    [assessments],
  );

  // ─── Loading skeleton ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <FrostedHeader title="Performance Overview" onMobileMenuToggle={toggleMobileMenu} showSearch={false} />
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          <Skeleton className="h-36 rounded-2xl" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Skeleton className="h-80 rounded-xl" />
            <Skeleton className="h-80 rounded-xl" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Skeleton className="h-80 rounded-xl" />
            <Skeleton className="h-80 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full">
      <FrostedHeader title="Performance Overview" onMobileMenuToggle={toggleMobileMenu} showSearch={false} />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

        {/* ── Banner ──────────────────────────────────────────────────────────── */}
        <div className="rounded-2xl bg-primary text-white p-5 sm:p-6 shadow-md">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold mb-1 flex items-center gap-2">
                <TrendingUpIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                Performance Analytics
              </h2>
              <p className="text-white/80 text-sm max-w-md">
                A complete overview of your academic performance — scores, strengths, weaknesses, and AI-powered predictions.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap shrink-0">
              {trimester && (
                <Badge className="bg-white/20 text-white border-white/30">
                  Trimester {trimester}
                </Badge>
              )}
              {cgpa != null && (
                <Badge className="bg-white/20 text-white border-white/30">
                  CGPA {cgpa}
                </Badge>
              )}
            </div>
          </div>
          <div className="mt-4 flex gap-2 flex-wrap">
            <Button asChild size="sm" className="bg-white text-primary hover:bg-white/90 font-semibold gap-2">
              <Link href="/user/performance/predict">
                <SparklesIcon className="h-4 w-4" />
                Predict My Grade
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="border-white/30 text-white bg-white/10 hover:bg-white/20 gap-2">
              <Link href="/user/performance/quiz">
                <BrainCircuitIcon className="h-4 w-4" />
                Take a Quiz
              </Link>
            </Button>
          </div>
        </div>

        {/* ── Stats row ───────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          <StatsCard
            title="Enrolled Courses"
            value={courses.length}
            icon={BookOpenIcon}
            description={trimester ? `Trimester ${trimester}` : undefined}
          />
          <StatsCard
            title="Assessments"
            value={assessments.length}
            icon={ClipboardListIcon}
            description={`${completedAssessments} passed`}
          />
          <StatsCard
            title="Avg Score"
            value={avgScore !== null ? `${avgScore}%` : 'N/A'}
            icon={BarChart3Icon}
            description="Across all types"
          />
          <StatsCard
            title="Best Score"
            value={bestScore !== null ? `${bestScore}%` : 'N/A'}
            icon={StarIcon}
            description="Highest assessment"
          />
          <StatsCard
            title="Weaknesses"
            value={weaknesses.length}
            icon={AlertTriangleIcon}
            description="Topics to improve"
          />
          <StatsCard
            title="CGPA"
            value={cgpa ?? 'N/A'}
            icon={GraduationCapIcon}
            description="Cumulative GPA"
          />
        </div>

        {/* ── Charts row 1 ────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {scoreByType.length > 0 ? (
            <DashboardBarChart
              data={scoreByType}
              dataKey="avg"
              xAxisKey="type"
              title="Avg Score by Assessment Type"
              description="Your average percentage score grouped by type"
              multiColor
            />
          ) : (
            <EmptyChartCard title="Avg Score by Assessment Type" message="No assessments recorded yet." />
          )}

          {scoreByCourse.length > 0 ? (
            <DashboardBarChart
              data={scoreByCourse}
              dataKey="avg"
              xAxisKey="course"
              title="Avg Score by Course"
              description="Mean performance across your enrolled courses"
              multiColor
            />
          ) : (
            <EmptyChartCard title="Avg Score by Course" message="No course assessment data yet." />
          )}
        </div>

        {/* ── Charts row 2 ────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {typeDistribution.length > 0 ? (
            <DashboardPieChart
              data={typeDistribution}
              title="Assessment Type Distribution"
              description="Breakdown of assessments by type"
            />
          ) : (
            <EmptyChartCard title="Assessment Type Distribution" message="No assessments recorded yet." />
          )}

          {radarData.length >= 3 ? (
            <ChartCard
              title="Performance Radar"
              description="Relative strength across assessment types"
            >
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="type" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Radar
                  name="Score %"
                  dataKey="score"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.25}
                  strokeWidth={2}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                    fontSize: '12px',
                  }}
                  formatter={(val: number) => [`${val}%`, 'Score']}
                />
              </RadarChart>
            </ChartCard>
          ) : (
            <EmptyChartCard title="Performance Radar" message="Need at least 3 assessment types for radar." />
          )}
        </div>

        {/* ── Course-wise breakdown ────────────────────────────────────────────── */}
        {coursePerformance.length > 0 && (
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TargetIcon className="h-4 w-4 text-primary" />
                Course-wise Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {coursePerformance.map((c) => (
                  <div key={c.cid} className="flex items-center gap-3 px-4 sm:px-6 py-3">
                    <div className="shrink-0">
                      <Badge variant="secondary" className="text-[10px] font-semibold whitespace-nowrap">
                        {c.credit} cr
                      </Badge>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{c.name}</p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {[c.faculty, c.sem].filter(Boolean).join(' · ')} · {c.count} assessment{c.count !== 1 ? 's' : ''} · {c.wcCount} weakness{c.wcCount !== 1 ? 'es' : ''}
                      </p>
                    </div>
                    <div className="hidden sm:flex flex-col gap-1 w-32">
                      <Progress value={c.avg ?? 0} className="h-1.5" />
                      <span className="text-[10px] text-muted-foreground text-right">
                        {c.avg !== null ? `${c.avg}%` : 'No data'}
                      </span>
                    </div>
                    <div className="shrink-0 text-sm font-bold w-12 text-right">
                      {c.avg !== null ? (
                        <span className={
                          c.avg >= 80 ? 'text-green-600' :
                          c.avg >= 60 ? 'text-amber-600' :
                          'text-red-500'
                        }>
                          {c.avg}%
                        </span>
                      ) : (
                        <span className="text-muted-foreground/40">—</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Weakness analysis ────────────────────────────────────────────────── */}
        {weaknesses.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangleIcon className="h-4 w-4 text-amber-500" />
                  Weaknesses by Course
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {weaknessByCourse.map(({ course, count }) => {
                  const max = weaknessByCourse[0]?.count ?? 1;
                  return (
                    <div key={course} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground truncate max-w-[70%]">{course}</span>
                        <span className="font-semibold">{count}</span>
                      </div>
                      <Progress value={(count / max) * 100} className="h-1.5" />
                    </div>
                  );
                })}
                <Link
                  href="/user/performance/weaknesses"
                  className="mt-2 text-xs text-primary inline-flex items-center gap-1 hover:underline"
                >
                  Manage all weaknesses <ArrowRightIcon className="h-3 w-3" />
                </Link>
              </CardContent>
            </Card>

            <Card className="border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle2Icon className="h-4 w-4 text-primary" />
                  Topics to Improve
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {weaknesses.slice(0, 16).map((w) => (
                    <Badge key={w.id} variant="secondary" className="text-xs gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block shrink-0" />
                      {w.topic_name}
                      {w.course_code && (
                        <span className="text-muted-foreground ml-0.5">· {w.course_code}</span>
                      )}
                    </Badge>
                  ))}
                  {weaknesses.length > 16 && (
                    <Badge variant="outline" className="text-xs">+{weaknesses.length - 16} more</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── Quick navigation ─────────────────────────────────────────────────── */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Quick Access
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {[
              { label: 'My Courses', href: '/user/performance/courses', icon: BookOpenIcon, color: 'text-blue-500', bg: 'bg-blue-500/10', desc: 'Enrolled courses' },
              { label: 'Assessments', href: '/user/performance/assessments', icon: ClipboardListIcon, color: 'text-green-500', bg: 'bg-green-500/10', desc: 'Scores & results' },
              { label: 'Weaknesses', href: '/user/performance/weaknesses', icon: AlertTriangleIcon, color: 'text-amber-500', bg: 'bg-amber-500/10', desc: 'Areas to improve' },
              { label: 'Quiz', href: '/user/performance/quiz', icon: BrainCircuitIcon, color: 'text-purple-500', bg: 'bg-purple-500/10', desc: 'AI-generated practice' },
              { label: 'Grade Predict', href: '/user/performance/predict', icon: SparklesIcon, color: 'text-pink-500', bg: 'bg-pink-500/10', desc: 'Final grade forecast' },
            ].map((item) => (
              <Link key={item.href} href={item.href}>
                <Card className="border shadow-sm hover:shadow-md hover:border-primary/30 transition-all cursor-pointer h-full group">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className={`rounded-xl p-2 shrink-0 ${item.bg} group-hover:scale-110 transition-transform`}>
                      <item.icon className={`h-4 w-4 ${item.color}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{item.label}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{item.desc}</p>
                    </div>
                    <ArrowRightIcon className="h-3.5 w-3.5 text-muted-foreground/50 ml-auto shrink-0 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── Empty chart placeholder ──────────────────────────────────────────────────

function EmptyChartCard({ title, message }: { title: string; message: string }) {
  return (
    <Card className="border shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[268px] flex flex-col items-center justify-center gap-2 text-muted-foreground/50">
          <BarChart3Icon className="h-10 w-10" />
          <p className="text-sm text-center">{message}</p>
        </div>
      </CardContent>
    </Card>
  );
}
