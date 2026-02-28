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
} from 'lucide-react';
import { IconCalendarEvent, IconNotification } from '@tabler/icons-react';
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

interface EnrolledCourse {
  enrollment_id: string;
  student_id: string;
  course_id: string;
  course_title: string;
  credit: number;
  trimester: string;
  section?: string | null;
  faculty?: string | null;
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
        // Fetch academic data if student has an id
        if (studentId) {
          const enrollUrl = trimester
            ? `/api/performance/enrollments/${studentId}?trimester=${encodeURIComponent(trimester)}`
            : `/api/performance/enrollments/${studentId}`;

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
        // silent — user dashboard should not crash
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [studentId, trimester]);

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

  // Weakness by course (pie)
  const weaknessByCourse = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const w of weaknesses) {
      counts[w.course_name ?? 'Unknown'] = (counts[w.course_name ?? 'Unknown'] ?? 0) + 1;
    }
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [weaknesses]);

  // Radar data
  const radarData = useMemo(() => scoreByType.map(({ type, avg }) => ({ type, score: avg })), [scoreByType]);

  // ── Quick actions ──────────────────────────────────────────────────────────
  const quickActions: QuickAction[] = [
    { href: '/user/chat', icon: <MessageCircleIcon className="h-4 w-4" />, label: 'AI Chat', sub: 'Ask your study assistant', color: 'bg-primary/10 text-primary' },
    { href: '/user/roadmap', icon: <MapIcon className="h-4 w-4" />, label: 'Roadmap', sub: 'Visualize learning path', color: 'bg-violet-500/10 text-violet-600' },
    { href: '/user/performance', icon: <TrendingUpIcon className="h-4 w-4" />, label: 'Performance', sub: 'Detailed analytics', color: 'bg-blue-500/10 text-blue-600' },
    { href: '/user/performance/predict', icon: <SparklesIcon className="h-4 w-4" />, label: 'Grade Prediction', sub: 'AI-powered forecast', color: 'bg-amber-500/10 text-amber-600' },
    { href: '/user/performance/quiz', icon: <Trophy className="h-4 w-4" />, label: 'Quiz', sub: 'Practice questions', color: 'bg-orange-500/10 text-orange-600' },
    { href: '/user/study-planner', icon: <IconCalendarEvent className="h-4 w-4" />, label: 'Study Planner', sub: 'Plan study sessions', color: 'bg-teal-500/10 text-teal-600' },
    { href: '/user/cgpa', icon: <CalculatorIcon className="h-4 w-4" />, label: 'CGPA Calculator', sub: 'Simulate scenarios', color: 'bg-green-500/10 text-green-600' },
    { href: '/user/routines', icon: <CalendarDaysIcon className="h-4 w-4" />, label: 'Routines', sub: 'Exam & class schedule', color: 'bg-cyan-500/10 text-cyan-600' },
    { href: '/user/notices', icon: <IconNotification className="h-4 w-4" />, label: 'Notices', sub: 'Official announcements', color: 'bg-rose-500/10 text-rose-600' },
    { href: '/user/academic-calender', icon: <CalendarRangeIcon className="h-4 w-4" />, label: 'Academic Calendar', sub: 'Important dates', color: 'bg-pink-500/10 text-pink-600' },
    { href: '/user/performance/courses', icon: <BookOpenIcon className="h-4 w-4" />, label: 'My Courses', sub: 'Enrolled course details', color: 'bg-indigo-500/10 text-indigo-600' },
    { href: '/user/settings/profile', icon: <SettingsIcon className="h-4 w-4" />, label: 'Profile Settings', sub: 'Account & preferences', color: 'bg-slate-500/10 text-slate-600' },
  ];

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

        {/* ── Key Metrics Cards ── */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {loading ? (
            Array(6).fill(0).map((_, i) => (
              <Card key={i} className="p-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-3 w-32" />
              </Card>
            ))
          ) : (
            <>
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
            </>
          )}
        </div>

        {/* ── Academic Progress Bar ── */}
        {!loading && cgpa !== null && (
          <Card>
            <CardContent className="py-4 px-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="h-10 w-10 rounded-full object-cover ring-2 ring-border" />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold ring-2 ring-border">
                      {initials}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold">{greeting}, {displayName}!</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {profile?.department && <span>{profile.department}</span>}
                      {profile?.batch && <><span>·</span><span>{profile.batch}</span></>}
                      {profile?.student_id && <><span>·</span><span className="font-mono">{profile.student_id}</span></>}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center gap-1.5 text-sm font-bold px-3 py-1 rounded-full border ${cgpaBadgeClass(cgpa)}`}>
                    <GraduationCapIcon className="h-3.5 w-3.5" />
                    {cgpa.toFixed(2)} / 4.00
                  </span>
                </div>
              </div>
              <Progress value={(cgpa / 4.0) * 100} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>{completedCredits !== null ? `${completedCredits} credits completed` : ''}</span>
                <span>{trimesterCredits > 0 ? `${trimesterCredits} credits this trimester` : ''}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Charts Section ── */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            Array(3).fill(0).map((_, i) => (
              <Card key={i} className="p-6">
                <Skeleton className="h-6 w-32 mb-4" />
                <Skeleton className="h-[300px] w-full" />
              </Card>
            ))
          ) : (
            <>
              {/* Scores by course (bar) */}
              {scoreByCourse.length > 0 && (
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
              )}

              {/* Assessment type distribution (pie) */}
              {typeDistribution.length > 0 && (
                <DashboardPieChart
                  data={typeDistribution}
                  title="Assessment Distribution"
                  description="Breakdown by assessment type"
                />
              )}

              {/* Scores by type (bar) */}
              {scoreByType.length > 0 && (
                <div className="lg:col-span-2">
                  <DashboardBarChart
                    data={scoreByType}
                    dataKey="avg"
                    xAxisKey="type"
                    title="Average Score by Type"
                    description="How you perform across different assessment types"
                    multiColor
                  />
                </div>
              )}

              {/* Weakness distribution (pie) */}
              {weaknessByCourse.length > 0 && (
                <DashboardPieChart
                  data={weaknessByCourse}
                  title="Weakness Areas"
                  description="Weak topics by course"
                />
              )}

              {/* Radar chart — skill profile */}
              {radarData.length >= 3 && (
                <ChartCard title="Skill Radar" description="Performance profile across assessment types">
                  <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                    <PolarGrid stroke="rgba(128,128,128,0.2)" />
                    <PolarAngleAxis dataKey="type" tick={{ fontSize: 11, fill: '#888' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Radar
                      name="Score"
                      dataKey="score"
                      stroke="hsl(34, 100%, 50%)"
                      fill="hsl(34, 100%, 50%)"
                      fillOpacity={0.2}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px',
                      }}
                      formatter={(val: number) => [`${val}%`, 'Avg Score']}
                    />
                  </RadarChart>
                </ChartCard>
              )}
            </>
          )}
        </div>

        {/* ── Bottom Grid: Courses / Notices / Quick Nav ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

          {/* Current Courses + Notices (left 2 cols) */}
          <div className="lg:col-span-2 space-y-6">

            {/* Enrolled Courses */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                    <BookOpenIcon className="h-5 w-5 text-primary" />
                    Current Courses
                  </CardTitle>
                  <Button variant="ghost" size="sm" className="text-xs gap-1 h-7" asChild>
                    <Link href="/user/performance/courses">View all <ChevronRightIcon className="h-3 w-3" /></Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="grid gap-3 md:grid-cols-2">
                    {Array(4).fill(0).map((_, i) => (
                      <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-muted/30">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : courses.length === 0 ? (
                  <div className="text-center py-10">
                    <BookOpenIcon className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground mb-3">No courses enrolled yet</p>
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/user/performance/courses">Manage Courses</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2">
                    {courses.map((c) => (
                      <div
                        key={c.enrollment_id}
                        className="flex items-start gap-4 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-all duration-200 border border-border shadow-sm hover:shadow-md"
                      >
                        <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-800 flex items-center justify-center shrink-0">
                          <BookOpenIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium line-clamp-1">{c.course_title || 'Unnamed Course'}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {[c.faculty, c.section ? `Sec ${c.section}` : null].filter(Boolean).join(' · ') || '—'}
                          </p>
                          <Badge variant="outline" className="mt-1.5 text-xs">{c.credit} credit{c.credit !== 1 ? 's' : ''}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Latest Notices */}
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
                {loading ? (
                  <div className="space-y-3">
                    {Array(3).fill(0).map((_, i) => (
                      <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-muted/30">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : notices.length === 0 ? (
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

            {/* Weaknesses Table */}
            {!loading && weaknesses.length > 0 && (
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                    <AlertTriangleIcon className="h-5 w-5 text-amber-500" />
                    Weak Topics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 md:grid-cols-2">
                    {weaknesses.slice(0, 6).map((w) => (
                      <div
                        key={w.id}
                        className="flex items-start gap-4 p-4 rounded-xl bg-muted/30 border border-border shadow-sm"
                      >
                        <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/40 border border-amber-200 dark:border-amber-800 flex items-center justify-center shrink-0">
                          <TargetIcon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium line-clamp-1">{w.topic_name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{w.course_name}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
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
