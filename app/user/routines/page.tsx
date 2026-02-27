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
  MapPinIcon,
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
  const [examTab, setExamTab] = useState<'upcoming' | 'past'>('upcoming');

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
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-md mx-auto space-y-4">

            {/* Privacy guarantee */}
            <Card className="border border-green-500/30 bg-green-500/5">
              <CardContent className="p-4 flex gap-3">
                <ShieldCheckIcon className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-green-700 dark:text-green-400">Your password is never stored</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Your UCAM credentials are used only to fetch your routine in real-time. They are never logged, saved to a database, or retained after the request completes. This is a pull-and-display only feature.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* SOSE-only notice */}
            <Card className="border border-amber-500/30 bg-amber-500/5">
              <CardContent className="p-4 flex gap-3">
                <InfoIcon className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">SOSE students only (for now)</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Currently this feature supports UIU SOSE students. Support for additional schools will be added soon.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Login form */}
            <Card className="border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <LockIcon className="h-4 w-4 text-[#007AFF]" />
                  Sign in with UCAM
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Student ID</label>
                  <Input
                    placeholder="e.g. 011221291"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleFetch()}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">UCAM Password</label>
                  <Input
                    type="password"
                    placeholder="Your UCAM portal password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleFetch()}
                  />
                </div>
                {error && (
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertCircleIcon className="h-4 w-4 shrink-0" />
                    {error}
                  </div>
                )}
                <Button
                  className="w-full gap-2 bg-[#007AFF] hover:bg-[#007AFF]/90"
                  disabled={loading}
                  onClick={handleFetch}
                >
                  {loading
                    ? <><RefreshCwIcon className="h-4 w-4 animate-spin" /> Fetching Routine…</>
                    : <><LogInIcon className="h-4 w-4" /> Fetch My Routine</>
                  }
                </Button>
              </CardContent>
            </Card>

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
  const pastExams = exams
    .filter((e) => isExamPast(e))
    .sort((a, b) => new Date(b.exam_date).getTime() - new Date(a.exam_date).getTime());
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
            <h2 className="font-semibold text-sm">Exam Schedule</h2>
          </div>

          <div className="flex gap-1 rounded-lg border p-1 w-fit mb-4">
            <button
              onClick={() => setExamTab('upcoming')}
              className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors ${
                examTab === 'upcoming' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Upcoming {upcomingExams.length > 0 && `(${upcomingExams.length})`}
            </button>
            <button
              onClick={() => setExamTab('past')}
              className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors ${
                examTab === 'past' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Recent / Past {pastExams.length > 0 && `(${pastExams.length})`}
            </button>
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
                    {(examTab === 'upcoming' ? upcomingExams : pastExams).length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center text-xs text-muted-foreground py-8">
                          No {examTab === 'upcoming' ? 'upcoming' : 'past'} exams
                        </td>
                      </tr>
                    ) : (
                      (examTab === 'upcoming' ? upcomingExams : pastExams).map((exam, i) => (
                        <tr
                          key={i}
                          className={`border-b last:border-0 transition-colors ${
                            examTab === 'past' ? 'opacity-55' : 'hover:bg-muted/30'
                          }`}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline" className="text-xs font-mono">{exam.course_code}</Badge>
                              <span className="text-xs text-muted-foreground">§{exam.section}</span>
                              {examTab === 'past' && (
                                <Badge variant="secondary" className="text-xs">Past</Badge>
                              )}
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
