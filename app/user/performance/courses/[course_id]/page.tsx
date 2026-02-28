'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { FrostedHeader } from '@/components/custom/frosted-header';
import { StatsCard } from '@/components/dashboard/stats-card';
import { useMobileMenu } from '@/components/mobile-menu-context';
import { Badge } from '@/components/ui/badge';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ClipboardListIcon,
  PlusIcon,
  Trash2Icon,
  RefreshCwIcon,
  MoreHorizontal,
  PencilIcon,
  TrendingUpIcon,
  BookOpenIcon,
  CheckSquareIcon,
  AwardIcon,
  AlertTriangleIcon,
} from 'lucide-react';

// ─── Constants ─────────────────────────────────────────────────────────────────

const ASSESSMENT_TYPES = ['ct', 'mid', 'final', 'assignment', 'project', 'attendance'] as const;
type AssessmentType = (typeof ASSESSMENT_TYPES)[number];

interface Assessment {
  id: string;
  assessment_type: AssessmentType;
  ct_no?: number;
  marks: number;
  full_marks: number;
  course_id: string;
}

interface CourseStats {
  ct_count: number;
  assignment_count: number;
  avg_ct_mark: number | null;
  avg_ct_percentage: number | null;
  ct_assessments_taken: number;
  total_assessments: number;
}

interface Weakness {
  id: string;
  topic_id: string;
  topic_name: string;
  course_id: string;
  course_name: string;
  course_code?: string;
}

interface Topic {
  id: string;
  topic_name: string;
}

const TYPE_COLORS: Record<string, string> = {
  ct: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  mid: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  final: 'bg-red-500/10 text-red-600 dark:text-red-400',
  assignment: 'bg-green-500/10 text-green-600 dark:text-green-400',
  project: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  attendance: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
};

const DEFAULT_FORM = {
  assessment_type: 'ct' as AssessmentType,
  ct_no: '1',
  marks: '',
  full_marks: '',
};

// ─── Component ─────────────────────────────────────────────────────────────────

export default function CourseAssessmentsPage() {
  const { user } = useAuthStore();
  const { toggleMobileMenu } = useMobileMenu();
  const params = useParams<{ course_id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();

  const courseId = params.course_id;
  const enrollmentId = searchParams.get('enrollment_id') ?? '';
  const courseName = searchParams.get('name') ?? '';
  const courseCode = searchParams.get('code') ?? '';
  const studentId = user.profile?.id;

  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [stats, setStats] = useState<CourseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Assessment | null>(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ─── Weakness state ────────────────────────────────────────────────────
  const [weaknesses, setWeaknesses] = useState<Weakness[]>([]);
  const [weaknessLoading, setWeaknessLoading] = useState(false);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [weaknessDialogOpen, setWeaknessDialogOpen] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [addingWeakness, setAddingWeakness] = useState(false);
  const [deletingWeaknessId, setDeletingWeaknessId] = useState<string | null>(null);

  // ─── Fetch ──────────────────────────────────────────────────────────────────

  const fetchAssessments = async () => {
    if (!studentId || !courseId) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/performance/assessments/student/${studentId}/course/${courseId}`,
      );
      const data = await res.json();
      setAssessments(
        Array.isArray(data)
          ? data.map((a: any) => ({
              id: a.assessment_id ?? a.id ?? '',
              assessment_type: a.assessment_type ?? 'ct',
              ct_no: a.ct_no,
              marks: a.marks ?? a.score ?? 0,
              full_marks: a.full_marks ?? a.max_score ?? 0,
              course_id: a.course_id ?? courseId,
            }))
          : [],
      );
    } catch {
      setAssessments([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!studentId || !courseId) return;
    setStatsLoading(true);
    try {
      const res = await fetch(
        `/api/performance/students/${studentId}/course-stats/${courseId}`,
      );
      const data = await res.json();
      setStats(data);
    } catch {
      setStats(null);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchWeaknesses = async () => {
    if (!studentId) return;
    setWeaknessLoading(true);
    try {
      const res = await fetch(`/api/performance/weaknesses/${studentId}`);
      const data = await res.json();
      const all: Weakness[] = Array.isArray(data) ? data : [];
      setWeaknesses(all.filter((w) => w.course_id === courseId));
    } catch {
      setWeaknesses([]);
    } finally {
      setWeaknessLoading(false);
    }
  };

  const loadTopics = async () => {
    if (!courseId) return;
    setTopicsLoading(true);
    try {
      const res = await fetch('/api/performance/course-topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ course_id: courseId }),
      });
      const data = await res.json();
      const raw: any[] = Array.isArray(data) ? data : data?.topics ?? [];
      setTopics(raw.map((t: any) => ({ id: t.id, topic_name: t.topic_name ?? t.name ?? '' })));
    } finally {
      setTopicsLoading(false);
    }
  };

  const handleAddWeakness = async () => {
    if (!studentId || !selectedTopic) return;
    setAddingWeakness(true);
    try {
      await fetch('/api/performance/weaknesses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId, course_id: courseId, topic_id: selectedTopic }),
      });
      setWeaknessDialogOpen(false);
      setSelectedTopic('');
      await fetchWeaknesses();
    } finally {
      setAddingWeakness(false);
    }
  };

  const handleDeleteWeakness = async (w: Weakness) => {
    setDeletingWeaknessId(w.id);
    try {
      await fetch('/api/performance/weaknesses', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId, topic_id: w.topic_id }),
      });
      await fetchWeaknesses();
    } finally {
      setDeletingWeaknessId(null);
    }
  };

  const openWeaknessDialog = () => {
    setSelectedTopic('');
    setWeaknessDialogOpen(true);
    if (topics.length === 0) loadTopics();
  };

  useEffect(() => {
    fetchAssessments();
    fetchStats();
    fetchWeaknesses();
    loadTopics();
  }, [studentId, courseId]);

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const openAdd = () => {
    setEditItem(null);
    setForm(DEFAULT_FORM);
    setDialogOpen(true);
  };

  const openEdit = (a: Assessment) => {
    setEditItem(a);
    setForm({
      assessment_type: a.assessment_type,
      ct_no: String(a.ct_no ?? 1),
      marks: String(a.marks),
      full_marks: String(a.full_marks),
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.marks || !form.full_marks) return;
    if (form.assessment_type === 'ct' && !form.ct_no) return;
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        enrollment_id: enrollmentId,
        student_id: studentId,
        course_id: courseId,
        assessment_type: form.assessment_type,
        marks: Number(form.marks),
        full_marks: Number(form.full_marks),
      };
      if (form.assessment_type === 'ct') payload.ct_no = Number(form.ct_no);

      if (editItem) {
        await fetch(`/api/performance/assessments/${editItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch('/api/performance/assessments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      setDialogOpen(false);
      await Promise.all([fetchAssessments(), fetchStats()]);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await fetch(`/api/performance/assessments/${id}`, { method: 'DELETE' });
      await Promise.all([fetchAssessments(), fetchStats()]);
    } finally {
      setDeletingId(null);
    }
  };

  // ─── Derived: total score across all components ────────────────────────────

  const totalMarks = (() => {
    if (!assessments.length) return null;
    let obtained = 0;
    let full = 0;

    // CT: use avg_ct_mark as the CT component score
    if (stats?.avg_ct_mark != null) {
      const ctSample = assessments.find((a) => a.assessment_type === 'ct');
      const ctFull = ctSample?.full_marks ?? 0;
      obtained += stats.avg_ct_mark;
      full += ctFull;
    }

    // All other types: sum their marks
    const otherTypes = ['mid', 'final', 'assignment', 'project', 'attendance'] as const;
    otherTypes.forEach((type) => {
      assessments
        .filter((a) => a.assessment_type === type)
        .forEach((a) => {
          obtained += a.marks;
          full += a.full_marks;
        });
    });

    return { obtained: Math.round(obtained * 100) / 100, full };
  })();

  // ─── Loading skeleton ────────────────────────────────────────────────────────

  if (loading && statsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm border-b border-border sticky top-0 z-40">
          <div className="flex items-center justify-between px-6 py-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-10 rounded-md" />
          </div>
        </div>
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="p-6">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-9 w-36" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-4 py-3">
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-12 ml-auto" />
                    <Skeleton className="h-8 w-8 rounded" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      <FrostedHeader
        title="Course Performance"
        onMobileMenuToggle={toggleMobileMenu}
        showSearch={false}
      />

      <div className="p-6 space-y-6">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/user/performance">Performance</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/user/performance/courses">My Courses</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{courseCode || 'Assessments'}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Course header */}
        <div>
          <h2 className="text-xl font-bold">{courseCode} — Assessments</h2>
          {courseName && (
            <p className="text-sm text-muted-foreground mt-0.5">{courseName}</p>
          )}
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            icon={ClipboardListIcon}
            title="CT Count"
            value={stats?.ct_count ?? '—'}
            description="Scheduled CTs for this course"
          />
          <StatsCard
            icon={CheckSquareIcon}
            title="Assignment Count"
            value={stats?.assignment_count ?? '—'}
            description="Scheduled assignments"
          />
          <StatsCard
            icon={TrendingUpIcon}
            title="Avg CT Mark"
            value={
              stats?.avg_ct_mark != null
                ? `${stats.avg_ct_mark}${
                    stats.avg_ct_percentage != null ? ` (${stats.avg_ct_percentage}%)` : ''
                  }`
                : stats?.avg_ct_percentage != null
                  ? `${stats.avg_ct_percentage}%`
                  : '—'
            }
            description={
              stats?.ct_assessments_taken
                ? `Best ${Math.min(stats.ct_count, stats.ct_assessments_taken)} of ${stats.ct_assessments_taken} CT(s) taken`
                : 'No CTs recorded yet'
            }
          />
          <StatsCard
            icon={AwardIcon}
            title="Total Score"
            value={
              totalMarks
                ? `${totalMarks.obtained} / ${totalMarks.full}`
                : '—'
            }
            description={
              totalMarks
                ? `${Math.round((totalMarks.obtained / (totalMarks.full || 1)) * 1000) / 10}% overall`
                : 'No assessments recorded'
            }
          />
        </div>

        <Tabs defaultValue="assessments">
          <TabsList>
            <TabsTrigger value="assessments" className="flex items-center gap-2">
              <ClipboardListIcon className="h-4 w-4" />
              Assessments
            </TabsTrigger>
            <TabsTrigger value="weaknesses" className="flex items-center gap-2">
              <AlertTriangleIcon className="h-4 w-4" />
              Weaknesses
            </TabsTrigger>
          </TabsList>

          <TabsContent value="assessments" className="mt-4">
        {/* Assessments table card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <CardTitle className="flex items-center gap-2">
                <ClipboardListIcon className="h-5 w-5" />
                Assessment Records
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { fetchAssessments(); fetchStats(); }}
                >
                  <RefreshCwIcon className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  className="gap-2 bg-primary hover:bg-primary/90"
                  onClick={openAdd}
                >
                  <PlusIcon className="h-4 w-4" />
                  Add Assessment
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="bg-white dark:bg-card rounded-lg border shadow-sm overflow-hidden">
              {assessments.length === 0 ? (
                <div className="p-12 text-center">
                  <ClipboardListIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No assessments yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Start adding assessment records for this course.
                  </p>
                  <Button onClick={openAdd} className="gap-2">
                    <PlusIcon className="h-4 w-4" />
                    Add First Assessment
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-50 dark:hover:bg-gray-900/50">
                      <TableHead className="font-semibold text-gray-900 dark:text-gray-100 py-4">
                        Type
                      </TableHead>
                      <TableHead className="font-semibold text-gray-900 dark:text-gray-100 py-4">
                        CT #
                      </TableHead>
                      <TableHead className="font-semibold text-gray-900 dark:text-gray-100 py-4">
                        Marks
                      </TableHead>
                      <TableHead className="font-semibold text-gray-900 dark:text-gray-100 py-4">
                        Full Marks
                      </TableHead>
                      <TableHead className="font-semibold text-gray-900 dark:text-gray-100 py-4">
                        Score
                      </TableHead>
                      <TableHead className="font-semibold text-gray-900 dark:text-gray-100 py-4 text-right">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assessments.map((a) => {
                      const pct = Math.round((a.marks / (a.full_marks || 1)) * 100);
                      return (
                        <TableRow
                          key={a.id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors"
                        >
                          <TableCell className="py-4">
                            <Badge
                              className={`text-xs uppercase font-semibold ${TYPE_COLORS[a.assessment_type] ?? ''}`}
                              variant="secondary"
                            >
                              {a.assessment_type}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-4 text-sm text-muted-foreground">
                            {a.assessment_type === 'ct' && a.ct_no != null ? `#${a.ct_no}` : '—'}
                          </TableCell>
                          <TableCell className="py-4 font-semibold">{a.marks}</TableCell>
                          <TableCell className="py-4 text-muted-foreground">{a.full_marks}</TableCell>
                          <TableCell className="py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-20 h-2 rounded-full bg-muted overflow-hidden">
                                <div
                                  className="h-2 rounded-full bg-primary transition-all"
                                  style={{ width: `${Math.min(pct, 100)}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium">{pct}%</span>
                            </div>
                          </TableCell>
                          <TableCell className="py-4 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-40">
                                <DropdownMenuItem onClick={() => openEdit(a)}>
                                  <PencilIcon className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  disabled={deletingId === a.id}
                                  onClick={() => handleDelete(a.id)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2Icon className="mr-2 h-4 w-4" />
                                  {deletingId === a.id ? 'Deleting…' : 'Delete'}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </div>
          </CardContent>
        </Card>          </TabsContent>

          <TabsContent value="weaknesses" className="mt-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangleIcon className="h-5 w-5 text-amber-500" />
                    Weaknesses
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={fetchWeaknesses}>
                      <RefreshCwIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      className="gap-2 bg-primary hover:bg-primary/90"
                      onClick={openWeaknessDialog}
                    >
                      <PlusIcon className="h-4 w-4" />
                      Add Weakness
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {weaknessLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="rounded-lg border p-4 animate-pulse bg-muted/40 h-14" />
                    ))}
                  </div>
                ) : weaknesses.length === 0 ? (
                  <div className="p-10 flex flex-col items-center gap-3 text-center">
                    <AlertTriangleIcon className="h-10 w-10 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">
                      No weaknesses recorded for this course. Mark topics you find difficult.
                    </p>
                    <Button size="sm" onClick={openWeaknessDialog} className="gap-2 bg-primary hover:bg-primary/90">
                      <PlusIcon className="h-4 w-4" />
                      Add Weakness
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2 py-2">
                    {weaknesses.map((w) => (
                      <div
                        key={w.id}
                        className="flex items-center gap-1.5 bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-full px-3 py-1.5 text-sm font-medium"
                      >
                        {w.topic_name}
                        <button
                          disabled={deletingWeaknessId === w.id}
                          onClick={() => handleDeleteWeakness(w)}
                          className="ml-0.5 hover:text-destructive transition-colors"
                        >
                          <Trash2Icon className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>      </div>

      {/* ── Add / Edit Dialog ──────────────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editItem ? 'Edit Assessment' : 'Add Assessment'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Course info (read-only) */}
            <div className="rounded-lg border p-3 bg-muted/40">
              <p className="text-xs font-medium text-muted-foreground">Course</p>
              <p className="text-sm font-semibold mt-0.5">
                {courseCode}{courseName ? ` — ${courseName}` : ''}
              </p>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Assessment Type
              </label>
              <Select
                value={form.assessment_type}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, assessment_type: v as AssessmentType }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ASSESSMENT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t.toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {form.assessment_type === 'ct' && (
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  CT No.
                </label>
                <Input
                  type="number"
                  min={1}
                  placeholder="e.g. 1"
                  value={form.ct_no}
                  onChange={(e) => setForm((f) => ({ ...f, ct_no: e.target.value }))}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Marks
                </label>
                <Input
                  type="number"
                  min={0}
                  placeholder="e.g. 18"
                  value={form.marks}
                  onChange={(e) => setForm((f) => ({ ...f, marks: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Full Marks
                </label>
                <Input
                  type="number"
                  min={1}
                  placeholder="e.g. 20"
                  value={form.full_marks}
                  onChange={(e) => setForm((f) => ({ ...f, full_marks: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-primary hover:bg-primary/90"
              disabled={
                saving ||
                !form.marks ||
                !form.full_marks ||
                (form.assessment_type === 'ct' && !form.ct_no)
              }
              onClick={handleSave}
            >
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add Weakness Dialog ─────────────────────────────────────────────────── */}
      <Dialog open={weaknessDialogOpen} onOpenChange={setWeaknessDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Weakness</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg border p-3 bg-muted/40">
              <p className="text-xs font-medium text-muted-foreground">Course</p>
              <p className="text-sm font-semibold mt-0.5">
                {courseCode}{courseName ? ` — ${courseName}` : ''}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Topic</label>
              <Select
                value={selectedTopic}
                onValueChange={setSelectedTopic}
                disabled={topicsLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={topicsLoading ? 'Loading topics…' : 'Select topic'} />
                </SelectTrigger>
                <SelectContent>
                  {topics.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.topic_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => setWeaknessDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={addingWeakness || !selectedTopic}
              onClick={handleAddWeakness}
              className="bg-primary hover:bg-primary/90"
            >
              {addingWeakness ? 'Adding…' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
