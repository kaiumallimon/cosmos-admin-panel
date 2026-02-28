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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ClipboardListIcon, PlusIcon, PencilIcon, Trash2Icon, RefreshCwIcon } from 'lucide-react';

const ASSESSMENT_TYPES = ['ct', 'mid', 'final', 'assignment', 'project'] as const;
type AssessmentType = (typeof ASSESSMENT_TYPES)[number];

interface Course {
  id: string;
  enrollment_id: string;
  course_name: string;
  course_code: string;
}

interface Assessment {
  id: string;
  assessment_type: AssessmentType;
  ct_no?: number;
  marks: number;
  full_marks: number;
  course_id: string;
  course_name?: string;
}

const TYPE_COLORS: Record<AssessmentType | string, string> = {
  ct: 'bg-blue-500/10 text-blue-600',
  mid: 'bg-purple-500/10 text-purple-600',
  final: 'bg-red-500/10 text-red-600',
  assignment: 'bg-green-500/10 text-green-600',
  project: 'bg-amber-500/10 text-amber-600',
};

const DEFAULT_FORM = { course_id: '', assessment_type: 'ct' as AssessmentType, ct_no: '1', marks: '', full_marks: '' };

export default function AssessmentsPage() {
  const { user } = useAuthStore();
  const { toggleMobileMenu } = useMobileMenu();
  const studentId = user.profile?.id;

  const [courses, setCourses] = useState<Course[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [latestTrimester, setLatestTrimester] = useState<string>('');
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Assessment | null>(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Fetch the latest trimester (sorted by created_at desc) once on mount
  useEffect(() => {
    const fetchLatestTrimester = async () => {
      try {
        const res = await fetch('/api/course-management/trimesters');
        const data = await res.json();
        const raw: { trimester: string; created_at?: string }[] = Array.isArray(data?.trimesters)
          ? data.trimesters
          : [];
        const sorted = [...raw].sort(
          (a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
        );
        if (sorted.length > 0) setLatestTrimester(sorted[0].trimester);
      } catch { /* silent */ }
    };
    fetchLatestTrimester();
  }, []);

  const fetchData = async (sem = latestTrimester) => {
    if (!studentId || !sem) return;
    setLoading(true);
    try {
      const [cRes, aRes] = await Promise.all([
        fetch(`/api/performance/students/${studentId}/courses/${encodeURIComponent(sem)}`),
        fetch(`/api/performance/assessments/student/${studentId}`),
      ]);
      const cData = await cRes.json();
      setCourses(
        Array.isArray(cData)
          ? cData.map((c: any) => ({
              id: c.course_id ?? c.id ?? '',
              enrollment_id: c.enrollment_id ?? '',
              course_name: c.title ?? c.course_name ?? '',
              course_code: c.code ?? c.course_code ?? '',
            }))
          : []
      );
      const aData = await aRes.json();
      setAssessments(
        Array.isArray(aData)
          ? aData.map((a: any) => ({
              id: a.assessment_id ?? a.id ?? '',
              assessment_type: a.assessment_type ?? '',
              ct_no: a.ct_no,
              marks: a.marks ?? a.score ?? 0,
              full_marks: a.full_marks ?? a.max_score ?? 0,
              course_id: a.course_id ?? '',
            }))
          : []
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (latestTrimester) fetchData(latestTrimester); }, [studentId, latestTrimester]);

  const openAdd = () => {
    setEditItem(null);
    setForm(DEFAULT_FORM);
    setDialogOpen(true);
  };

  const openEdit = (a: Assessment) => {
    setEditItem(a);
    setForm({
      course_id: a.course_id,
      assessment_type: a.assessment_type,
      ct_no: String(a.ct_no ?? 1),
      marks: String(a.marks),
      full_marks: String(a.full_marks),
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.course_id || !form.marks || !form.full_marks) return;
    if (form.assessment_type === 'ct' && !form.ct_no) return;
    setSaving(true);
    try {
      const selectedCourseObj = courses.find((c) => c.id === form.course_id);
      const payload: Record<string, unknown> = {
        enrollment_id: selectedCourseObj?.enrollment_id ?? '',
        student_id: studentId,
        course_id: form.course_id,
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
      await fetchData();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await fetch(`/api/performance/assessments/${id}`, { method: 'DELETE' });
      await fetchData();
    } finally {
      setDeletingId(null);
    }
  };

  const filtered =
    selectedCourse === 'all'
      ? assessments
      : assessments.filter((a) => a.course_id === selectedCourse);

  const courseMap = Object.fromEntries(courses.map((c) => [c.id, c]));

  return (
    <div className="flex flex-col h-full">
      <FrostedHeader title="Assessments" onMobileMenuToggle={toggleMobileMenu} showSearch={false} />
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-xl font-bold">Assessments</h2>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={selectedCourse} onValueChange={setSelectedCourse}>
            <SelectTrigger className="w-44 h-9 text-sm">
              <SelectValue placeholder="All Courses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courses</SelectItem>
              {courses.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.course_code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => fetchData()}>
            <RefreshCwIcon className="h-4 w-4" />
          </Button>
          <Button size="sm" onClick={openAdd} className="gap-2 bg-primary hover:bg-primary/90">
            <PlusIcon />
            Add Assessment
          </Button>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4 h-16" />
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border shadow-sm">
          <CardContent className="p-10 flex flex-col items-center gap-3 text-center">
            <ClipboardListIcon className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No assessments recorded yet.</p>
            <Button size="sm" onClick={openAdd} className="gap-2 bg-primary hover:bg-primary/90">
              <PlusIcon /> Add First Assessment
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((a) => {
            const pct = Math.round((a.marks / (a.full_marks || 1)) * 100);
            const course = courseMap[a.course_id];
            return (
              <Card key={a.id} className="border shadow-sm">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        className={`text-xs uppercase font-semibold ${TYPE_COLORS[a.assessment_type] || ''}`}
                        variant="secondary"
                      >
                        {a.assessment_type}
                      </Badge>
                      {course && (
                        <span className="text-xs text-muted-foreground">{course.course_code}</span>
                      )}
                    </div>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-2 rounded-full bg-primary transition-all"
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold whitespace-nowrap">
                        {a.marks} / {a.full_marks} ({pct}%)
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(a)}>
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={deletingId === a.id}
                      onClick={() => handleDelete(a.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2Icon className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editItem ? 'Edit Assessment' : 'Add Assessment'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Course</label>
              <Select
                value={form.course_id}
                onValueChange={(v) => setForm((f) => ({ ...f, course_id: v }))}
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
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Assessment Type
              </label>
              <Select
                value={form.assessment_type}
                onValueChange={(v) => setForm((f) => ({ ...f, assessment_type: v as AssessmentType }))}
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
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">CT No.</label>
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
              disabled={saving || !form.course_id || !form.marks || !form.full_marks || (form.assessment_type === 'ct' && !form.ct_no)}
              onClick={handleSave}
              className="bg-primary hover:bg-primary/90"
            >
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}
