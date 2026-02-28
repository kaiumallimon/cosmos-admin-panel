'use client';

import { useEffect, useState, useMemo } from 'react';
import { FrostedHeader } from '@/components/custom/frosted-header';
import { useMobileMenu } from '@/components/mobile-menu-context';
import { useAuthStore } from '@/store/auth';
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
import Link from 'next/link';
import {
  MessageCircleIcon,
  MapIcon,
  TrendingUpIcon,
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

function cgpaBadgeClass(cgpa: number) {
  if (cgpa >= 3.75) return 'bg-green-500/15 text-green-600 border-green-500/30';
  if (cgpa >= 3.0) return 'bg-blue-500/15 text-blue-600 border-blue-500/30';
  if (cgpa >= 2.5) return 'bg-amber-500/15 text-amber-600 border-amber-500/30';
  return 'bg-red-500/15 text-red-600 border-red-500/30';
}

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

// ─── Quick Action ─────────────────────────────────────────────────────────────

interface QuickAction {
  href: string;
  icon: React.ReactNode;
  label: string;
  sub: string;
  color: string;
}

function QuickActionCard({ href, icon, label, sub, color }: QuickAction) {
  return (
    <Link href={href}>
      <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-all duration-200 border border-border shadow-sm hover:shadow-md cursor-pointer">
        <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{label}</p>
          <p className="text-xs text-muted-foreground truncate">{sub}</p>
        </div>
        <ChevronRightIcon className="h-4 w-4 text-muted-foreground/50 shrink-0" />
      </div>
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
          // Fetch all enrollments (no trimester filter — same as performance page)
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

          // Resolve course names
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

        // Always fetch notices
        const nRes = await fetch('/api/notices?page=1');
        const nData = await nRes.json();
        setNotices(Array.isArray(nData?.notices) ? nData.notices.slice(0, 5) : []);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
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

  const passedAssessments = useMemo(
    () => assessments.filter((a) => pct(a) >= 40).length,
    [assessments],
  );

  // Score by assessment type (bar chart)
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

  // Course name helper
  const courseNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const c of courses) {
      if (c.course_id) map[c.course_id] = c.course_title || `Course ${c.course_id.slice(0, 6)}…`;
    }
    for (const [id, info] of Object.entries(courseMap)) {
      map[id] = info.code ? `${info.code} – ${info.title}` : info.title;
    }
    return map;
  }, [courses, courseMap]);

  // Score per course
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

  // Assessment type distribution (pie)
  const typeDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const a of assessments) {
      const t = TYPE_LABELS[a.assessment_type] ?? a.assessment_type;
      counts[t] = (counts[t] ?? 0) + 1;
    }
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [assessments]);

  // Weakness distribution by course (for progress bars)
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

  // Weakness pie data
  const weaknessPieData = useMemo(() => {
    return weaknessByCourse.map(({ course, count }) => ({ name: course, value: count }));
  }, [weaknessByCourse]);

  // Radar data
  const radarData = useMemo(() => scoreByType.map(({ type, avg }) => ({ type, score: avg })), [scoreByType]);

  // Course-wise performance breakdown (from performance page)
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

  // ── Quick actions ──────────────────────────────────────────────────────────
  const quickActions: QuickAction[] = [
    { href: '/user/chat', icon: <MessageCircleIcon className="h-4 w-4" />, label: 'AI Chat', sub: 'Ask your study assistant', color: 'bg-primary/10 text-primary' },
    { href: '/user/roadmap', icon: <MapIcon className="h-4 w-4" />, label: 'Roadmap', sub: 'Visualize learning path', color: 'bg-violet-500/10 text-violet-600' },
    { href: '/user/performance/predict', icon: <SparklesIcon className="h-4 w-4" />, label: 'Grade Prediction', sub: 'AI-powered forecast', color: 'bg-amber-500/10 text-amber-600' },
    { href: '/user/performance/quiz', icon: <Trophy className="h-4 w-4" />, label: 'Quiz', sub: 'Practice questions', color: 'bg-orange-500/10 text-orange-600' },
    { href: '/user/performance/quiz/history', icon: <HistoryIcon className="h-4 w-4" />, label: 'Quiz History', sub: 'Past quiz results', color: 'bg-fuchsia-500/10 text-fuchsia-600' },
    { href: '/user/study-planner', icon: <IconCalendarEvent className="h-4 w-4" />, label: 'Study Planner', sub: 'Plan study sessions', color: 'bg-teal-500/10 text-teal-600' },
    { href: '/user/cgpa', icon: <CalculatorIcon className="h-4 w-4" />, label: 'CGPA Calculator', sub: 'Simulate scenarios', color: 'bg-green-500/10 text-green-600' },
    { href: '/user/routines', icon: <CalendarDaysIcon className="h-4 w-4" />, label: 'Routines', sub: 'Exam & class schedule', color: 'bg-cyan-500/10 text-cyan-600' },
    { href: '/user/notices', icon: <IconNotification className="h-4 w-4" />, label: 'Notices', sub: 'Official announcements', color: 'bg-rose-500/10 text-rose-600' },
    { href: '/user/academic-calender', icon: <CalendarRangeIcon className="h-4 w-4" />, label: 'Academic Calendar', sub: 'Important dates', color: 'bg-pink-500/10 text-pink-600' },
    { href: '/user/performance/courses', icon: <BookOpenIcon className="h-4 w-4" />, label: 'My Courses', sub: 'Enrolled course details', color: 'bg-indigo-500/10 text-indigo-600' },
    { href: '/user/performance/weaknesses', icon: <AlertTriangleIcon className="h-4 w-4" />, label: 'Weaknesses', sub: 'Manage weak topics', color: 'bg-amber-500/10 text-amber-500' },
    { href: '/user/performance/assessments', icon: <ClipboardListIcon className="h-4 w-4" />, label: 'Assessments', sub: 'Scores & results', color: 'bg-blue-500/10 text-blue-600' },
    { href: '/user/settings/profile', icon: <SettingsIcon className="h-4 w-4" />, label: 'Profile Settings', sub: 'Account & preferences', color: 'bg-slate-500/10 text-slate-600' },
  ];

  // ── Loading skeleton ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex flex-col min-h-full">
        <FrostedHeader title="Dashboard" subtitle="Your academic overview at a glance." onMobileMenuToggle={toggleMobileMenu} showSearch={false} />
        <div className="flex-1 p-4 md:p-6 space-y-6">
          <Skeleton className="h-36 rounded-2xl" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {Array(6).fill(0).map((_, i) => (
              <Card key={i} className="p-6"><Skeleton className="h-4 w-24 mb-2" /><Skeleton className="h-8 w-16 mb-1" /><Skeleton className="h-3 w-32" /></Card>
            ))}
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

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-full">
      <FrostedHeader
        title="Dashboard"
        subtitle="Your academic overview at a glance."
        onMobileMenuToggle={toggleMobileMenu}
        showSearch={false}
      />

      <div className="flex-1 p-4 md:p-6 space-y-6">

        {/* ── Performance Banner ── */}
        <div className="rounded-2xl bg-primary text-white p-5 sm:p-6 shadow-md">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="h-12 w-12 rounded-full object-cover ring-2 ring-white/30" />
              ) : (
                <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center text-white text-lg font-bold ring-2 ring-white/30">
                  {initials}
                </div>
              )}
              <div>
                <h2 className="text-xl sm:text-2xl font-bold mb-0.5">
                  {greeting}, {displayName}!
                </h2>
                <p className="text-white/80 text-sm">
                  {profile?.department && <span>{profile.department}</span>}
                  {profile?.batch && <span> · {profile.batch}</span>}
                  {profile?.student_id && <span> · <span className="font-mono">{profile.student_id}</span></span>}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap shrink-0">
              {trimester && (
                <Badge className="bg-white/20 text-white border-white/30">
                  {trimesterLabel(trimester)}
                </Badge>
              )}
              {cgpa !== null && (
                <Badge className="bg-white/20 text-white border-white/30">
                  CGPA {cgpa.toFixed(2)}
                </Badge>
              )}
            </div>
          </div>
          {/* CGPA progress */}
          {cgpa !== null && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-white/70 mb-1">
                <span>{completedCredits !== null ? `${completedCredits} credits completed` : ''}</span>
                <span>{cgpaLabel(cgpa)} · {cgpa.toFixed(2)} / 4.00</span>
              </div>
              <div className="h-2 rounded-full bg-white/20 overflow-hidden">
                <div className="h-full rounded-full bg-white/80 transition-all duration-500" style={{ width: `${(cgpa / 4.0) * 100}%` }} />
              </div>
            </div>
          )}
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
            <Button asChild size="sm" variant="outline" className="border-white/30 text-white bg-white/10 hover:bg-white/20 gap-2">
              <Link href="/user/chat">
                <MessageCircleIcon className="h-4 w-4" />
                AI Chat
              </Link>
            </Button>
          </div>
        </div>

        {/* ── Key Metrics Cards ── */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <StatsCard
            title="CGPA"
            value={cgpa !== null ? cgpa.toFixed(2) : '—'}
            description={cgpa !== null ? cgpaLabel(cgpa) : 'Not available'}
            icon={GraduationCapIcon}
          />
          <StatsCard
            title="Enrolled Courses"
            value={courses.length}
            description={trimester ? trimesterLabel(trimester) : 'Current trimester'}
            icon={BookOpenIcon}
          />
          <StatsCard
            title="Assessments"
            value={assessments.length}
            description={`${passedAssessments} passed`}
            icon={ClipboardListIcon}
          />
          <StatsCard
            title="Avg Score"
            value={avgScore !== null ? `${avgScore}%` : 'N/A'}
            description="Across all types"
            icon={BarChart3Icon}
          />
          <StatsCard
            title="Best Score"
            value={bestScore !== null ? `${bestScore}%` : 'N/A'}
            description="Highest assessment"
            icon={StarIcon}
          />
          <StatsCard
            title="Weaknesses"
            value={weaknesses.length}
            description="Topics to improve"
            icon={AlertTriangleIcon}
          />
        </div>

        {/* ── Charts Row 1: Score by Course + Assessment Distribution ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {scoreByCourse.length > 0 ? (
            <div className="lg:col-span-2">
              <DashboardBarChart
                data={scoreByCourse}
                dataKey="avg"
                xAxisKey="course"
                title="Average Score by Course"
                description="Performance breakdown across your enrolled courses"
                multiColor
              />
            </div>
          ) : (
            <div className="lg:col-span-2">
              <EmptyChartCard title="Average Score by Course" message="No course assessment data yet." />
            </div>
          )}

          {typeDistribution.length > 0 ? (
            <DashboardPieChart
              data={typeDistribution}
              title="Assessment Distribution"
              description="Breakdown by assessment type"
            />
          ) : (
            <EmptyChartCard title="Assessment Distribution" message="No assessments recorded yet." />
          )}
        </div>

        {/* ── Charts Row 2: Score by Type + Radar ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {scoreByType.length > 0 ? (
            <DashboardBarChart
              data={scoreByType}
              dataKey="avg"
              xAxisKey="type"
              title="Average Score by Type"
              description="How you perform across different assessment types"
              multiColor
            />
          ) : (
            <EmptyChartCard title="Average Score by Type" message="No assessments recorded yet." />
          )}

          {radarData.length >= 3 ? (
            <ChartCard title="Performance Radar" description="Relative strength across assessment types">
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                <PolarGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                <PolarAngleAxis dataKey="type" tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} tickCount={5} axisLine={false} />
                <Radar
                  name="Score %"
                  dataKey="score"
                  stroke="hsl(34, 100%, 50%)"
                  fill="hsl(34, 100%, 50%)"
                  fillOpacity={0.45}
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: 'hsl(34, 100%, 50%)', strokeWidth: 0 }}
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

        {/* ── Course-wise Breakdown ────────────────────────────────────────── */}
        {coursePerformance.length > 0 && (
          <Card className="border shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <TargetIcon className="h-4 w-4 text-primary" />
                  Course-wise Breakdown
                </CardTitle>
                <Button variant="ghost" size="sm" className="text-xs gap-1 h-7" asChild>
                  <Link href="/user/performance/courses">View all <ChevronRightIcon className="h-3 w-3" /></Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {coursePerformance.map((c, i) => {
                  const color =
                    c.avg === null ? '#94a3b8'
                    : c.avg >= 80 ? '#16a34a'
                    : c.avg >= 60 ? '#d97706'
                    : '#dc2626';
                  const bgTint =
                    c.avg === null ? ''
                    : c.avg >= 80 ? 'hover:bg-green-50/60 dark:hover:bg-green-950/20'
                    : c.avg >= 60 ? 'hover:bg-amber-50/60 dark:hover:bg-amber-950/20'
                    : 'hover:bg-red-50/60 dark:hover:bg-red-950/20';
                  return (
                    <div key={c.cid} className={`flex items-center gap-4 px-5 sm:px-6 py-5 transition-colors ${bgTint}`}>
                      <div
                        className="shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                        style={{ backgroundColor: color }}
                      >
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold leading-tight truncate">{c.name}</p>
                          <Badge variant="outline" className="text-[10px] font-semibold shrink-0 px-1.5 py-0">
                            {c.credit} cr
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {[c.faculty, c.sem].filter(Boolean).join(' · ')}
                          {' · '}{c.count} assessment{c.count !== 1 ? 's' : ''}
                          {c.wcCount > 0 && ` · ${c.wcCount} weakness${c.wcCount !== 1 ? 'es' : ''}`}
                        </p>
                        <div className="flex items-center gap-2 pt-0.5">
                          <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${c.avg ?? 0}%`, backgroundColor: color }}
                            />
                          </div>
                        </div>
                      </div>
                      <div
                        className="shrink-0 w-16 h-10 rounded-lg flex items-center justify-center text-sm font-bold text-white shadow-sm"
                        style={{ backgroundColor: color }}
                      >
                        {c.avg !== null ? `${c.avg}%` : '—'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Weakness Analysis ────────────────────────────────────────────── */}
        {weaknesses.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangleIcon className="h-4 w-4 text-amber-500" />
                    Weaknesses by Course
                  </CardTitle>
                  <Button variant="ghost" size="sm" className="text-xs gap-1 h-7" asChild>
                    <Link href="/user/performance/weaknesses">Manage <ChevronRightIcon className="h-3 w-3" /></Link>
                  </Button>
                </div>
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

        {/* ── Bottom Grid: Notices / Quick Nav ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

          {/* Left (2 cols): Notices */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                    <BellIcon className="h-5 w-5 text-primary" />
                    Latest Notices
                  </CardTitle>
                  <Button variant="ghost" size="sm" className="text-xs gap-1 h-7" asChild>
                    <Link href="/user/notices">View all <ChevronRightIcon className="h-3 w-3" /></Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {notices.length === 0 ? (
                  <div className="text-center py-10">
                    <BellIcon className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No notices available</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notices.map((n, i) => (
                      <a
                        key={i}
                        href={n.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start gap-4 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-all duration-200 border border-border shadow-sm hover:shadow-md group"
                      >
                        <div className="h-10 w-10 rounded-full bg-rose-100 dark:bg-rose-900/40 border border-rose-200 dark:border-rose-800 flex items-center justify-center shrink-0">
                          <BellIcon className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">{n.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">{formatNoticeDate(n.date)}</p>
                        </div>
                        <ChevronRightIcon className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0 mt-1" />
                      </a>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Performance Quick Access */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Performance Quick Access
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

          {/* Right column: Quick Nav */}
          <div className="space-y-6">
            {/* AI CTA */}
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-5">
                <div className="flex items-start gap-3 mb-4">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <BrainCircuitIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">AI Study Assistant</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Get instant answers to your course questions.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground" size="sm" asChild>
                    <Link href="/user/chat"><MessageCircleIcon className="h-4 w-4" />Chat</Link>
                  </Button>
                  <Button variant="outline" className="flex-1 gap-2" size="sm" asChild>
                    <Link href="/user/performance/predict"><SparklesIcon className="h-4 w-4" />Predict</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Navigate */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                  <ArrowRightIcon className="h-5 w-5 text-primary" />
                  Quick Navigate
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {quickActions.map((a) => (
                  <QuickActionCard key={a.href} {...a} />
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

      </div>
    </div>
  );
}
