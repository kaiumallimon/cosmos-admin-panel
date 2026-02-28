'use client';

import { useEffect, useState, useMemo } from 'react';
import { FrostedHeader } from '@/components/custom/frosted-header';
import { useMobileMenu } from '@/components/mobile-menu-context';
import { useAuthStore } from '@/store/auth';
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
import Link from 'next/link';
import {
  MessageCircleIcon,
  MapIcon,
  CalculatorIcon,
  CalendarDaysIcon,
  CalendarRangeIcon,
  SettingsIcon,
  BookOpenIcon,
  SparklesIcon,
  BellIcon,
  ChevronRightIcon,
  GraduationCapIcon,
  BarChart3Icon,
  BrainCircuitIcon,
  AlertTriangleIcon,
  Trophy,
  StarIcon,
  ClipboardListIcon,
  TargetIcon,
  ArrowRightIcon,
  CheckCircle2Icon,
  HistoryIcon,
  TrendingUpIcon,
} from 'lucide-react';
import { IconCalendarEvent, IconNotification } from '@tabler/icons-react';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Tooltip,
} from 'recharts';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

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
  assessment_type: string;
  marks?: number;
  score?: number;
  full_marks?: number;
  max_score?: number;
  course_id: string;
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

interface Notice {
  date: string;
  title: string;
  url: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  ct: 'Class Test',
  mid: 'Midterm',
  final: 'Final',
  assignment: 'Assignment',
  project: 'Project',
};

function getScore(a: Assessment) { return a.marks ?? a.score ?? 0; }
function getMax(a: Assessment) { return a.full_marks ?? a.max_score ?? 1; }
function pct(a: Assessment) { return (getScore(a) / getMax(a)) * 100; }

function cgpaLabel(cgpa: number) {
  if (cgpa >= 3.75) return 'Excellent';
  if (cgpa >= 3.0) return 'Good';
  if (cgpa >= 2.5) return 'Average';
  return 'Needs Improvement';
}

function formatNoticeDate(d: string) {
  if (!d) return '';
  const date = new Date(d);
  return isNaN(date.getTime()) ? d : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function trimesterLabel(t: string) {
  return t ? t.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : '—';
}

// ─── Bento Cell ───────────────────────────────────────────────────────────────

function BentoCell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-border bg-card shadow-sm overflow-hidden transition-shadow hover:shadow-md',
        className,
      )}
    >
      {children}
    </div>
  );
}

// ─── Metric Pill ──────────────────────────────────────────────────────────────

function MetricPill({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="flex items-center gap-3 p-3 sm:p-4">
      <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center shrink-0', accent ?? 'bg-primary/10')}>
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold leading-none">{typeof value === 'number' ? value.toLocaleString() : value}</p>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">{label}</p>
        {sub && <p className="text-[10px] text-muted-foreground/70 truncate">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Quick Nav Item ───────────────────────────────────────────────────────────

function QuickNavItem({
  href,
  icon: Icon,
  label,
  color,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  color: string;
}) {
  return (
    <Link href={href} className="group flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-muted/50 transition-colors">
      <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110', color)}>
        <Icon className="h-4 w-4" />
      </div>
      <span className="text-[10px] font-medium text-center leading-tight text-muted-foreground group-hover:text-foreground transition-colors">{label}</span>
    </Link>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function UserDashboardPage() {
  const { user } = useAuthStore();
  const { toggleMobileMenu } = useMobileMenu();

  const profile = user?.profile;
  const studentId = profile?.id;
  const trimester = profile?.current_trimester;
  const cgpa = profile?.cgpa ? Number(profile.cgpa) : null;
  const completedCredits = profile?.completed_credits ? Number(profile.completed_credits) : null;
  const displayName = profile?.full_name?.split(' ')[0] || 'Student';
  const avatarUrl = profile?.avatar_url;
  const initials = (profile?.full_name || user?.email || 'S').charAt(0).toUpperCase();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  // ── Data state ──────────────────────────────────────────────────────────────
  const [courses, setCourses] = useState<EnrolledCourse[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [weaknesses, setWeaknesses] = useState<Weakness[]>([]);
  const [courseMap, setCourseMap] = useState<Record<string, { title: string; code: string }>>({});
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        if (studentId) {
          const enrollUrl = `/api/performance/enrollments/${studentId}`;
          const [cRes, aRes, wRes] = await Promise.all([
            fetch(enrollUrl),
            fetch(`/api/performance/assessments/student/${studentId}`),
            fetch(`/api/performance/weaknesses/${studentId}`),
          ]);
          const cData = await cRes.json();
          setCourses(Array.isArray(cData) ? cData : []);

          const aData = await aRes.json();
          const parsed: Assessment[] = Array.isArray(aData)
            ? aData.map((a: Record<string, string | number>) => ({
                id: String(a.assessment_id ?? a.id ?? ''),
                assessment_type: (a.assessment_type ?? 'other') as string,
                marks: Number(a.marks ?? a.score ?? 0),
                full_marks: Number(a.full_marks ?? a.max_score ?? 1),
                course_id: String(a.course_id ?? ''),
                course_name: String(a.course_name ?? a.course_title ?? ''),
                ct_no: a.ct_no !== undefined ? Number(a.ct_no) : undefined,
              }))
            : [];
          setAssessments(parsed);

          const ids = [...new Set(parsed.map((a) => a.course_id).filter(Boolean))];
          if (ids.length > 0) {
            try {
              const crRes = await fetch(`/api/performance/courses?ids=${ids.join(',')}`);
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
        }
        const nRes = await fetch('/api/notices?page=1');
        const nData = await nRes.json();
        setNotices(Array.isArray(nData?.notices) ? nData.notices.slice(0, 5) : []);
      } catch { /* silent */ }
      finally { setLoading(false); }
    };
    load();
  }, [studentId]);

  // ── Derived analytics ───────────────────────────────────────────────────────

  const trimesterCredits = courses.reduce((s, c) => s + (c.credit ?? 0), 0);

  const avgScore = useMemo(() => {
    if (!assessments.length) return null;
    return Math.round((assessments.reduce((s, a) => s + pct(a), 0) / assessments.length) * 10) / 10;
  }, [assessments]);

  const bestScore = useMemo(() => {
    if (!assessments.length) return null;
    return Math.round(Math.max(...assessments.map(pct)) * 10) / 10;
  }, [assessments]);

  const passedAssessments = useMemo(() => assessments.filter((a) => pct(a) >= 40).length, [assessments]);

  const scoreByType = useMemo(() => {
    const groups: Record<string, number[]> = {};
    for (const a of assessments) {
      const t = a.assessment_type ?? 'other';
      if (!groups[t]) groups[t] = [];
      groups[t].push(pct(a));
    }
    return Object.entries(groups).map(([type, scores]) => ({
      type: TYPE_LABELS[type] ?? type,
      avg: Math.round((scores.reduce((s, v) => s + v, 0) / scores.length) * 10) / 10,
      count: scores.length,
    }));
  }, [assessments]);

  const courseNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const c of courses) if (c.course_id) map[c.course_id] = c.course_title || `Course ${c.course_id.slice(0, 6)}…`;
    for (const [id, info] of Object.entries(courseMap)) map[id] = info.code ? `${info.code} – ${info.title}` : info.title;
    return map;
  }, [courses, courseMap]);

  const scoreByCourse = useMemo(() => {
    const groups: Record<string, number[]> = {};
    const nameHint: Record<string, string> = {};
    for (const a of assessments) {
      if (!a.course_id) continue;
      if (!groups[a.course_id]) groups[a.course_id] = [];
      groups[a.course_id].push(pct(a));
      if (!nameHint[a.course_id] && a.course_name) nameHint[a.course_id] = a.course_name;
    }
    return Object.entries(groups).map(([cid, scores]) => ({
      course: courseNameMap[cid] || nameHint[cid] || `${cid.slice(0, 8)}…`,
      avg: Math.round((scores.reduce((s, v) => s + v, 0) / scores.length) * 10) / 10,
    }));
  }, [assessments, courseNameMap]);

  const typeDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const a of assessments) { const t = TYPE_LABELS[a.assessment_type] ?? a.assessment_type; counts[t] = (counts[t] ?? 0) + 1; }
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [assessments]);

  const weaknessByCourse = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const w of weaknesses) { const name = w.course_name ?? w.course_id ?? 'Unknown'; counts[name] = (counts[name] ?? 0) + 1; }
    return Object.entries(counts).map(([course, count]) => ({ course, count })).sort((a, b) => b.count - a.count);
  }, [weaknesses]);

  const radarData = useMemo(() => scoreByType.map(({ type, avg }) => ({ type, score: avg })), [scoreByType]);

  const coursePerformance = useMemo(() => {
    return courses.map((c) => {
      const cid = c.course_id;
      const courseAssessments = assessments.filter((a) => a.course_id === cid);
      const avg = courseAssessments.length > 0
        ? Math.round((courseAssessments.reduce((s, a) => s + pct(a), 0) / courseAssessments.length) * 10) / 10
        : null;
      const wcCount = weaknesses.filter((w) => w.course_id === cid).length;
      return { cid, name: c.course_title, credit: c.credit, faculty: c.faculty ?? '', sem: c.trimester ?? '', avg, count: courseAssessments.length, wcCount };
    });
  }, [courses, assessments, weaknesses]);

  // ── Loading ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex flex-col min-h-full">
        <FrostedHeader title="Dashboard" subtitle="Your academic overview at a glance." onMobileMenuToggle={toggleMobileMenu} showSearch={false} />
        <div className="flex-1 p-4 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-[minmax(120px,auto)]">
            {Array(10).fill(0).map((_, i) => (
              <Skeleton key={i} className={cn('rounded-2xl', i === 0 ? 'md:col-span-2 md:row-span-2' : i < 3 ? '' : 'lg:col-span-2')} style={{ minHeight: i === 0 ? 280 : 160 }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-full">
      <FrostedHeader title="Dashboard" subtitle="Your academic overview at a glance." onMobileMenuToggle={toggleMobileMenu} showSearch={false} />

      <div className="flex-1 p-4 md:p-6">
        {/* ═══════════════════════════════════════════════════════════════════
            BENTO GRID  — 4-column base on lg, asymmetric spanning
           ═══════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-[minmax(0,auto)]">

          {/* ╔═══════════════════════════════════════════════════════════════╗
              ║ 1  HERO / WELCOME — spans 2 cols & 2 rows on lg            ║
              ╚═══════════════════════════════════════════════════════════════╝ */}
          <BentoCell className="md:col-span-2 lg:row-span-2 bg-linear-to-br from-primary via-primary to-primary/90 text-white border-primary/20">
            <div className="p-5 sm:p-6 h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="" className="h-14 w-14 rounded-2xl object-cover ring-2 ring-white/30 shadow-lg" />
                  ) : (
                    <div className="h-14 w-14 rounded-2xl bg-white/20 flex items-center justify-center text-white text-xl font-bold ring-2 ring-white/30 shadow-lg">
                      {initials}
                    </div>
                  )}
                  <div>
                    <h2 className="text-2xl font-bold">{greeting}, {displayName}!</h2>
                    <p className="text-white/70 text-sm mt-0.5">
                      {profile?.department}{profile?.batch ? ` · ${profile.batch}` : ''}
                      {profile?.student_id ? ` · ${profile.student_id}` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-5">
                  {trimester && <Badge className="bg-white/15 text-white border-white/20 backdrop-blur-sm">{trimesterLabel(trimester)}</Badge>}
                  {cgpa !== null && <Badge className="bg-white/15 text-white border-white/20 backdrop-blur-sm">CGPA {cgpa.toFixed(2)}</Badge>}
                  {completedCredits !== null && <Badge className="bg-white/15 text-white border-white/20 backdrop-blur-sm">{completedCredits} credits</Badge>}
                  {trimesterCredits > 0 && <Badge className="bg-white/15 text-white border-white/20 backdrop-blur-sm">{trimesterCredits} cr this tri</Badge>}
                </div>

                {cgpa !== null && (
                  <div className="mb-5">
                    <div className="flex justify-between text-xs text-white/60 mb-1.5">
                      <span>CGPA Progress</span>
                      <span>{cgpaLabel(cgpa)} · {cgpa.toFixed(2)} / 4.00</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-white/15 overflow-hidden backdrop-blur-sm">
                      <div className="h-full rounded-full bg-white/80 transition-all duration-700 ease-out" style={{ width: `${(cgpa / 4.0) * 100}%` }} />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2 flex-wrap">
                <Button asChild size="sm" className="bg-white text-primary hover:bg-white/90 font-semibold gap-2 shadow-md">
                  <Link href="/user/performance/predict"><SparklesIcon className="h-4 w-4" />Predict Grade<ArrowRightIcon className="h-3.5 w-3.5" /></Link>
                </Button>
                <Button asChild size="sm" variant="outline" className="border-white/30 text-white bg-white/10 hover:bg-white/20 gap-2">
                  <Link href="/user/performance/quiz"><BrainCircuitIcon className="h-4 w-4" />Take Quiz</Link>
                </Button>
                <Button asChild size="sm" variant="outline" className="border-white/30 text-white bg-white/10 hover:bg-white/20 gap-2">
                  <Link href="/user/chat"><MessageCircleIcon className="h-4 w-4" />AI Chat</Link>
                </Button>
              </div>
            </div>
          </BentoCell>

          {/* ╔═══════════════════════════════════════════════════════════════╗
              ║ 2–5  STAT PILLS — 4 small cells to the right of hero       ║
              ╚═══════════════════════════════════════════════════════════════╝ */}
          <BentoCell>
            <MetricPill icon={GraduationCapIcon} label="CGPA" value={cgpa !== null ? cgpa.toFixed(2) : '—'} sub={cgpa !== null ? cgpaLabel(cgpa) : 'Not set'} accent="bg-green-500/10" />
          </BentoCell>

          <BentoCell>
            <MetricPill icon={BookOpenIcon} label="Enrolled Courses" value={courses.length} sub={trimester ? trimesterLabel(trimester) : 'Current'} accent="bg-blue-500/10" />
          </BentoCell>

          <BentoCell>
            <MetricPill icon={ClipboardListIcon} label="Assessments" value={assessments.length} sub={`${passedAssessments} passed`} accent="bg-violet-500/10" />
          </BentoCell>

          <BentoCell>
            <MetricPill icon={BarChart3Icon} label="Avg Score" value={avgScore !== null ? `${avgScore}%` : 'N/A'} sub="All assessment types" accent="bg-amber-500/10" />
          </BentoCell>

          {/* ╔═══════════════════════════════════════════════════════════════╗
              ║ 6  SCORE BY COURSE — bar chart, wide (3 cols)               ║
              ╚═══════════════════════════════════════════════════════════════╝ */}
          <div className="lg:col-span-3">
              {scoreByCourse.length > 0 ? (
                <DashboardBarChart
                  data={scoreByCourse}
                  dataKey="avg"
                  xAxisKey="course"
                  title="Average Score by Course"
                  description="Performance across enrolled courses"
                  multiColor
                />
              ) : (
                <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden transition-shadow hover:shadow-md p-6">
                  <p className="text-sm font-semibold mb-1">Average Score by Course</p>
                  <div className="h-[260px] flex flex-col items-center justify-center text-muted-foreground/40">
                    <BarChart3Icon className="h-10 w-10 mb-2" />
                    <p className="text-sm">No course data yet</p>
                  </div>
                </div>
              )}
          </div>

          {/* ╔═══════════════════════════════════════════════════════════════╗
              ║ 7  ASSESSMENT DISTRIBUTION — pie chart (1 col)              ║
              ╚═══════════════════════════════════════════════════════════════╝ */}
          <div>
              {typeDistribution.length > 0 ? (
                <DashboardPieChart
                  data={typeDistribution}
                  title="Assessment Types"
                  description="Distribution breakdown"
                />
              ) : (
                <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden transition-shadow hover:shadow-md p-6">
                  <p className="text-sm font-semibold mb-1">Assessment Types</p>
                  <div className="h-[260px] flex flex-col items-center justify-center text-muted-foreground/40">
                    <BarChart3Icon className="h-10 w-10 mb-2" />
                    <p className="text-sm">No data yet</p>
                  </div>
                </div>
              )}
          </div>

          {/* ╔═══════════════════════════════════════════════════════════════╗
              ║ 8  SCORE BY TYPE — bar chart (2 cols)                       ║
              ╚═══════════════════════════════════════════════════════════════╝ */}
          <div className="md:col-span-2">
              {scoreByType.length > 0 ? (
                <DashboardBarChart
                  data={scoreByType}
                  dataKey="avg"
                  xAxisKey="type"
                  title="Average Score by Type"
                  description="Performance across assessment types"
                  multiColor
                />
              ) : (
                <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden transition-shadow hover:shadow-md p-6">
                  <p className="text-sm font-semibold mb-1">Average Score by Type</p>
                  <div className="h-[260px] flex flex-col items-center justify-center text-muted-foreground/40">
                    <BarChart3Icon className="h-10 w-10 mb-2" />
                    <p className="text-sm">No assessments yet</p>
                  </div>
                </div>
              )}
          </div>

          {/* ╔═══════════════════════════════════════════════════════════════╗
              ║ 9  PERFORMANCE RADAR — (2 cols)                             ║
              ╚═══════════════════════════════════════════════════════════════╝ */}
          <div className="md:col-span-2">
            {radarData.length >= 3 ? (
              <ChartCard title="Performance Radar" description="Strength across assessment categories">
                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                  <PolarGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                  <PolarAngleAxis dataKey="type" tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} tickCount={5} axisLine={false} />
                  <Radar name="Score %" dataKey="score" stroke="hsl(34, 100%, 50%)" fill="hsl(34, 100%, 50%)" fillOpacity={0.4} strokeWidth={2.5} dot={{ r: 4, fill: 'hsl(34, 100%, 50%)', strokeWidth: 0 }} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} formatter={(val: number) => [`${val}%`, 'Score']} />
                </RadarChart>
              </ChartCard>
            ) : (
              <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden transition-shadow hover:shadow-md p-6">
                <p className="text-sm font-semibold mb-1">Performance Radar</p>
                <div className="h-[260px] flex flex-col items-center justify-center text-muted-foreground/40">
                  <TargetIcon className="h-10 w-10 mb-2" />
                  <p className="text-sm">Need 3+ assessment types</p>
                </div>
              </div>
            )}
          </div>

          {/* ╔═══════════════════════════════════════════════════════════════╗
              ║ 10  COURSE BREAKDOWN — spans 2 cols, taller                 ║
              ╚═══════════════════════════════════════════════════════════════╝ */}
          {coursePerformance.length > 0 && (
            <BentoCell className="md:col-span-2 lg:row-span-2">
              <div className="p-5 h-full flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <TargetIcon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Course Breakdown</p>
                      <p className="text-[11px] text-muted-foreground">{courses.length} courses enrolled</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-xs gap-1 h-7" asChild>
                    <Link href="/user/performance/courses">View all <ChevronRightIcon className="h-3 w-3" /></Link>
                  </Button>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 -mr-1">
                  {coursePerformance.map((c, i) => {
                    const color = c.avg === null ? '#94a3b8' : c.avg >= 80 ? '#16a34a' : c.avg >= 60 ? '#d97706' : '#dc2626';
                    return (
                      <div key={c.cid} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors border border-transparent hover:border-border">
                        <div className="shrink-0 h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ backgroundColor: color }}>
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-semibold truncate">{c.name}</p>
                            <Badge variant="outline" className="text-[9px] font-medium px-1 py-0 shrink-0">{c.credit}cr</Badge>
                          </div>
                          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${c.avg ?? 0}%`, backgroundColor: color }} />
                          </div>
                        </div>
                        <span className="text-xs font-bold tabular-nums shrink-0" style={{ color }}>{c.avg !== null ? `${c.avg}%` : '—'}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </BentoCell>
          )}

          {/* ╔═══════════════════════════════════════════════════════════════╗
              ║ 11  LATEST NOTICES — 2 cols                                 ║
              ╚═══════════════════════════════════════════════════════════════╝ */}
          <BentoCell className={cn('lg:row-span-2', coursePerformance.length === 0 ? 'md:col-span-2' : 'md:col-span-2')}>
            <div className="p-5 h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-rose-500/10 flex items-center justify-center">
                    <BellIcon className="h-4 w-4 text-rose-500" />
                  </div>
                  <p className="text-sm font-semibold">Latest Notices</p>
                </div>
                <Button variant="ghost" size="sm" className="text-xs gap-1 h-7" asChild>
                  <Link href="/user/notices">View all <ChevronRightIcon className="h-3 w-3" /></Link>
                </Button>
              </div>
              {notices.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground/40">
                  <BellIcon className="h-10 w-10 mb-2" />
                  <p className="text-sm">No notices yet</p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 -mr-1">
                  {notices.map((n, i) => (
                    <a key={i} href={n.url} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-all border border-transparent hover:border-border group">
                      <div className="h-8 w-8 rounded-lg bg-rose-500/10 flex items-center justify-center shrink-0 mt-0.5">
                        <BellIcon className="h-3.5 w-3.5 text-rose-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium line-clamp-2 group-hover:text-primary transition-colors">{n.title}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">{formatNoticeDate(n.date)}</p>
                      </div>
                      <ChevronRightIcon className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-primary shrink-0 mt-1 transition-colors" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          </BentoCell>

          {/* ╔═══════════════════════════════════════════════════════════════╗
              ║ 12–13  WEAKNESS CELLS — side by side                        ║
              ╚═══════════════════════════════════════════════════════════════╝ */}
          {weaknesses.length > 0 && (
            <>
              <BentoCell className="md:col-span-2">
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                        <AlertTriangleIcon className="h-4 w-4 text-amber-500" />
                      </div>
                      <p className="text-sm font-semibold">Weaknesses by Course</p>
                    </div>
                    <Button variant="ghost" size="sm" className="text-xs gap-1 h-7" asChild>
                      <Link href="/user/performance/weaknesses">Manage <ChevronRightIcon className="h-3 w-3" /></Link>
                    </Button>
                  </div>
                  <div className="space-y-2.5">
                    {weaknessByCourse.slice(0, 5).map(({ course, count }) => {
                      const max = weaknessByCourse[0]?.count ?? 1;
                      return (
                        <div key={course} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground truncate max-w-[75%]">{course}</span>
                            <span className="font-bold text-amber-600">{count}</span>
                          </div>
                          <Progress value={(count / max) * 100} className="h-1.5" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </BentoCell>

              <BentoCell className="md:col-span-2">
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <CheckCircle2Icon className="h-4 w-4 text-primary" />
                    </div>
                    <p className="text-sm font-semibold">Topics to Improve</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {weaknesses.slice(0, 12).map((w) => (
                      <Badge key={w.id} variant="secondary" className="text-[10px] gap-1 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block shrink-0" />
                        {w.topic_name}
                        {w.course_code && <span className="text-muted-foreground">· {w.course_code}</span>}
                      </Badge>
                    ))}
                    {weaknesses.length > 12 && <Badge variant="outline" className="text-[10px]">+{weaknesses.length - 12} more</Badge>}
                  </div>
                </div>
              </BentoCell>
            </>
          )}

          {/* ╔═══════════════════════════════════════════════════════════════╗
              ║ 14  EXTRA STAT PILLS — best score + weaknesses              ║
              ╚═══════════════════════════════════════════════════════════════╝ */}
          <BentoCell>
            <MetricPill icon={StarIcon} label="Best Score" value={bestScore !== null ? `${bestScore}%` : 'N/A'} sub="Highest assessment" accent="bg-yellow-500/10" />
          </BentoCell>

          <BentoCell>
            <MetricPill icon={AlertTriangleIcon} label="Weak Topics" value={weaknesses.length} sub="Areas to improve" accent="bg-red-500/10" />
          </BentoCell>

          {/* ╔═══════════════════════════════════════════════════════════════╗
              ║ 15  AI ASSISTANT CTA                                        ║
              ╚═══════════════════════════════════════════════════════════════╝ */}
          <BentoCell className="md:col-span-2 bg-linear-to-br from-primary/5 via-primary/3 to-transparent border-primary/15">
            <div className="p-5 flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                <BrainCircuitIcon className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">AI Study Assistant</p>
                <p className="text-xs text-muted-foreground mt-0.5">Get instant answers, generate quizzes, and predict grades.</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button className="gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm" size="sm" asChild>
                  <Link href="/user/chat"><MessageCircleIcon className="h-3.5 w-3.5" />Chat</Link>
                </Button>
                <Button variant="outline" className="gap-1.5" size="sm" asChild>
                  <Link href="/user/performance/predict"><SparklesIcon className="h-3.5 w-3.5" />Predict</Link>
                </Button>
              </div>
            </div>
          </BentoCell>

          {/* ╔═══════════════════════════════════════════════════════════════╗
              ║ 16  QUICK NAVIGATE — full width bento cell                  ║
              ╚═══════════════════════════════════════════════════════════════╝ */}
          <BentoCell className="md:col-span-2 lg:col-span-4">
            <div className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <ArrowRightIcon className="h-4 w-4 text-primary" />
                </div>
                <p className="text-sm font-semibold">Quick Navigate</p>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-7 lg:grid-cols-14 gap-1">
                <QuickNavItem href="/user/chat" icon={MessageCircleIcon} label="AI Chat" color="bg-primary/10 text-primary" />
                <QuickNavItem href="/user/roadmap" icon={MapIcon} label="Roadmap" color="bg-violet-500/10 text-violet-600" />
                <QuickNavItem href="/user/performance/predict" icon={SparklesIcon} label="Predict" color="bg-amber-500/10 text-amber-600" />
                <QuickNavItem href="/user/performance/quiz" icon={Trophy} label="Quiz" color="bg-orange-500/10 text-orange-600" />
                <QuickNavItem href="/user/performance/quiz/history" icon={HistoryIcon} label="History" color="bg-fuchsia-500/10 text-fuchsia-600" />
                <QuickNavItem href="/user/study-planner" icon={IconCalendarEvent} label="Planner" color="bg-teal-500/10 text-teal-600" />
                <QuickNavItem href="/user/cgpa" icon={CalculatorIcon} label="CGPA" color="bg-green-500/10 text-green-600" />
                <QuickNavItem href="/user/routines" icon={CalendarDaysIcon} label="Routines" color="bg-cyan-500/10 text-cyan-600" />
                <QuickNavItem href="/user/notices" icon={IconNotification} label="Notices" color="bg-rose-500/10 text-rose-600" />
                <QuickNavItem href="/user/academic-calender" icon={CalendarRangeIcon} label="Calendar" color="bg-pink-500/10 text-pink-600" />
                <QuickNavItem href="/user/performance/courses" icon={BookOpenIcon} label="Courses" color="bg-indigo-500/10 text-indigo-600" />
                <QuickNavItem href="/user/performance/weaknesses" icon={AlertTriangleIcon} label="Weak" color="bg-amber-500/10 text-amber-500" />
                <QuickNavItem href="/user/performance/assessments" icon={ClipboardListIcon} label="Assess" color="bg-blue-500/10 text-blue-600" />
                <QuickNavItem href="/user/settings/profile" icon={SettingsIcon} label="Profile" color="bg-slate-500/10 text-slate-600" />
              </div>
            </div>
          </BentoCell>

        </div>
      </div>
    </div>
  );
}
