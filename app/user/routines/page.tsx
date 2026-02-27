'use client';

import { useState } from 'react';
import { FrostedHeader } from '@/components/custom/frosted-header';
import { useMobileMenu } from '@/components/mobile-menu-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  CalendarDaysIcon,
  ClockIcon,
  BookOpenIcon,
  GraduationCapIcon,
  ShieldCheckIcon,
  LockIcon,
  LogInIcon,
  LogOutIcon,
  RefreshCwIcon,
  InfoIcon,
  AlertCircleIcon,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface RoutineClass {
  course_code: string;
  course_title: string;
  time: string;
}

interface ExamEntry {
  course_code: string;
  section: string;
  exam_date: string;
  exam_time: string;
  teacher: string;
  room: string | null;
  room_detail: string;
  csv_course_code: string;
}

interface UIUProfile {
  name: string;
  student_id: string;
  image_url: string;
  blood_group: string;
  dob: string;
}

interface RoutineData {
  profile: UIUProfile;
  routine: Record<string, RoutineClass[]>;
  exams: ExamEntry[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function isExamPast(exam: ExamEntry): boolean {
  const d = new Date(exam.exam_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d < today;
}

function sortByTime(classes: RoutineClass[]): RoutineClass[] {
  return [...classes].sort((a, b) => {
    const toMin = (t: string) => {
      const [time, period] = t.trim().split(' ');
      const [h, m] = time.split(':').map(Number);
      return (period === 'PM' && h !== 12 ? h + 12 : h === 12 && period === 'AM' ? 0 : h) * 60 + m;
    };
    return toMin(a.time.split('-')[0]) - toMin(b.time.split('-')[0]);
  });
}

const TODAY_NAME = new Date().toLocaleDateString('en-US', { weekday: 'long' });

// ── Component ─────────────────────────────────────────────────────────────────

export default function RoutinesPage() {
  const { toggleMobileMenu } = useMobileMenu();

  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<RoutineData | null>(null);
  const [activeDay, setActiveDay] = useState('');

  const handleFetch = async () => {
    if (!studentId.trim() || !password.trim()) {
      setError('Please enter both Student ID and Password.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/tools/uiu-exam-routine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId.trim(), password }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error ?? 'Failed to fetch. Check your credentials and try again.');
        return;
      }
      setData(json);
      const days = Object.keys(json.routine ?? {});
      setActiveDay(days.includes(TODAY_NAME) ? TODAY_NAME : (days[0] ?? ''));
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
      setPassword(''); // never keep password in state longer than needed
    }
  };

  const handleReset = () => {
    setData(null);
    setStudentId('');
    setPassword('');
    setError('');
  };

  // ── Pre-login ─────────────────────────────────────────────────────────────
  if (!data) {
    return (
      <div className="flex flex-col h-full">
        <FrostedHeader title="Exam & Class Routines" onMobileMenuToggle={toggleMobileMenu} showSearch={false} />
        <div className="flex-1 overflow-y-auto">

          {/* Hero section */}
          <div className="w-full border-b bg-muted/20 px-6 py-12 flex flex-col items-center text-center gap-4">
            <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-[#007AFF]/10 border border-[#007AFF]/20 mb-1">
              <CalendarDaysIcon className="h-7 w-7 text-[#007AFF]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">UIU Exam &amp; Class Routine Finder</h1>
              <p className="text-sm text-muted-foreground mt-1.5 max-w-lg">
                Find your personalized exam schedule and class routine quickly. Login with your UCAM student ID and password — no data is ever stored or retained.
              </p>
            </div>

            {/* SOSE badge */}
            <div className="flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 px-3 py-1 text-xs font-medium text-amber-600 dark:text-amber-400">
              <InfoIcon className="h-3.5 w-3.5 shrink-0" />
              Only SOSE is supported (for now)
            </div>

            {/* Inline credential row */}
            <div className="w-full max-w-xl mt-2 space-y-3">
              <div className="flex flex-col sm:flex-row gap-2 w-full">
                <Input
                  placeholder="Student ID (e.g. 011221291)"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleFetch()}
                  className="flex-1"
                />
                <Input
                  type="password"
                  placeholder="UCAM Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleFetch()}
                  className="flex-1"
                />
                <Button
                  className="gap-2 bg-[#007AFF] hover:bg-[#007AFF]/90 shrink-0"
                  disabled={loading}
                  onClick={handleFetch}
                >
                  {loading
                    ? <><RefreshCwIcon className="h-4 w-4 animate-spin" /> Loading…</>
                    : <><LogInIcon className="h-4 w-4" /> Load</>
                  }
                </Button>
              </div>
              {error && (
                <div className="flex items-center justify-center gap-2 text-sm text-destructive">
                  <AlertCircleIcon className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}
            </div>

            {/* Privacy strip */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
              <ShieldCheckIcon className="h-3.5 w-3.5 text-green-500 shrink-0" />
              Your password is used only for this request and is never stored, logged, or retained.
            </div>
          </div>

          {/* Empty state hint */}
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center text-muted-foreground px-6">
            <LockIcon className="h-10 w-10 opacity-15" />
            <p className="text-sm">Enter your UCAM credentials above to load your routine and exam schedule.</p>
          </div>

        </div>
      </div>
    );
  }

  // ── Post-login: data loaded ───────────────────────────────────────────────
  const { profile, routine, exams } = data;
  const routineDays = Object.keys(routine);
  const upcomingExams = exams
    .filter((e) => !isExamPast(e))
    .sort((a, b) => new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime());
  const currentDayClasses = sortByTime(routine[activeDay] ?? []);
  const todayClasses = sortByTime(routine[TODAY_NAME] ?? []);

  return (
    <div className="flex flex-col h-full">
      <FrostedHeader title="Exam & Class Routines" onMobileMenuToggle={toggleMobileMenu} showSearch={false} />
      <div className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* Profile row */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            {profile.image_url ? (
              <img src={profile.image_url} alt={profile.name} className="h-12 w-12 rounded-full ring-2 ring-border object-cover shrink-0" />
            ) : (
              <div className="h-12 w-12 rounded-full bg-[#007AFF] flex items-center justify-center text-white font-bold text-lg ring-2 ring-border shrink-0">
                {profile.name.charAt(0)}
              </div>
            )}
            <div>
              <p className="font-semibold text-sm">{profile.name}</p>
              <p className="text-xs text-muted-foreground">{profile.student_id}</p>
              <div className="flex gap-1.5 mt-1 flex-wrap">
                {profile.dob && <Badge variant="outline" className="text-xs">{profile.dob}</Badge>}
                {profile.blood_group && profile.blood_group !== 'Unknown' && (
                  <Badge variant="secondary" className="text-xs">{profile.blood_group}</Badge>
                )}
              </div>
            </div>
          </div>
          <Button variant="outline" size="sm" className="gap-2 text-muted-foreground" onClick={handleReset}>
            <LogOutIcon className="h-4 w-4" />
            Sign out
          </Button>
        </div>

        {/* Privacy reminder strip */}
        <div className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/5 px-3 py-2 text-xs text-green-700 dark:text-green-400">
          <ShieldCheckIcon className="h-3.5 w-3.5 shrink-0" />
          Your password was never saved — session is local only.
        </div>

        {/* Today's classes */}
        {todayClasses.length > 0 && (
          <Card className="border border-[#007AFF]/30 bg-[#007AFF]/5 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-[#007AFF]">
                <ClockIcon className="h-4 w-4" />
                Today&apos;s Classes — {TODAY_NAME}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {todayClasses.map((cls, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2">
                    <span className="text-xs font-bold text-[#007AFF] shrink-0 whitespace-nowrap">
                      {cls.time.split('-')[0].trim()}
                    </span>
                    <div>
                      <p className="font-medium text-xs">{cls.course_code}</p>
                      <p className="text-xs text-muted-foreground max-w-40 truncate">{cls.course_title}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Class Routine ── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <BookOpenIcon className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-semibold text-sm">Current Trimester Class Routine</h2>
            <Badge variant="outline" className="text-xs ml-auto">UCAM</Badge>
          </div>

          {/* Day tabs */}
          <div className="flex gap-1 flex-wrap mb-4">
            {routineDays.map((day) => (
              <button
                key={day}
                onClick={() => setActiveDay(day)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors border ${
                  activeDay === day
                    ? 'bg-primary text-primary-foreground border-transparent'
                    : 'text-muted-foreground border-border hover:bg-accent'
                }`}
              >
                {day}
                {day === TODAY_NAME && <span className="ml-1 opacity-60">(today)</span>}
              </button>
            ))}
          </div>

          <Card className="border shadow-sm">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Time</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Course Code</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Course Title</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentDayClasses.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="text-center text-xs text-muted-foreground py-8">
                          No classes on {activeDay}
                        </td>
                      </tr>
                    ) : (
                      currentDayClasses.map((cls, i) => (
                        <tr key={i} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-2.5 whitespace-nowrap">
                            <span className="text-xs font-mono font-semibold text-[#007AFF]">{cls.time}</span>
                          </td>
                          <td className="px-4 py-2.5">
                            <Badge variant="outline" className="text-xs font-mono">{cls.course_code}</Badge>
                          </td>
                          <td className="px-4 py-2.5 text-xs">{cls.course_title}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Exam Schedule ── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <GraduationCapIcon className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-semibold text-sm">Upcoming Exam Schedule</h2>
            {upcomingExams.length > 0 && (
              <Badge variant="outline" className="text-xs ml-auto">{upcomingExams.length} exam{upcomingExams.length !== 1 ? 's' : ''}</Badge>
            )}
          </div>

          <Card className="border shadow-sm">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Course</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Date</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Time</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Room</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Faculty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {upcomingExams.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center text-xs text-muted-foreground py-8">
                          No upcoming exams
                        </td>
                      </tr>
                    ) : (
                      upcomingExams.map((exam, i) => (
                        <tr
                          key={i}
                          className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline" className="text-xs font-mono">{exam.course_code}</Badge>
                              <span className="text-xs text-muted-foreground">§{exam.section}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-xs font-medium">{exam.exam_date}</span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-xs font-mono text-[#007AFF]">{exam.exam_time}</span>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-xs font-medium">{exam.room ?? '—'}</p>
                            {exam.room_detail && (
                              <p
                                className="text-[10px] text-muted-foreground mt-0.5 max-w-[180px] truncate"
                                title={exam.room_detail.trim()}
                              >
                                {exam.room_detail.trim().replace(/\s{2,}/g, ' · ').split(' · ')[0]}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs text-muted-foreground">{exam.teacher}</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer notice */}
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2.5 text-xs text-amber-700 dark:text-amber-400">
          <InfoIcon className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span>
            Data sourced directly from UIU UCAM portal. Currently available for <strong>SOSE</strong> students only — more schools coming soon.
          </span>
        </div>

      </div>
    </div>
  );
}
