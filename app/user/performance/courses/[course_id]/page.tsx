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
} from 'lucide-react';

// ─── Constants ─────────────────────────────────────────────────────────────────

const ASSESSMENT_TYPES = ['ct', 'mid', 'final', 'assignment', 'project'] as const;
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
  avg_ct_percentage: number | null;
  ct_assessments_taken: number;
  total_assessments: number;
}

const TYPE_COLORS: Record<string, string> = {
  ct: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  mid: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  final: 'bg-red-500/10 text-red-600 dark:text-red-400',
  assignment: 'bg-green-500/10 text-green-600 dark:text-green-400',
  project: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
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

  useEffect(() => {
    fetchAssessments();
    fetchStats();
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
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
        title="Assessments"
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
              stats?.avg_ct_percentage != null
                ? `${stats.avg_ct_percentage}%`
                : '—'
            }
            description={
              stats?.ct_assessments_taken
                ? `Based on ${stats.ct_assessments_taken} CT(s) taken`
                : 'No CTs recorded yet'
            }
          />
        </div>

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
        </Card>
      </div>

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
    </div>
  );
}
