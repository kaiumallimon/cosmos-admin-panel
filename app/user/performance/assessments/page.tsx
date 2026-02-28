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
  course_name: string;
  course_code: string;
}

interface Assessment {
  id: string;
  assessment_type: AssessmentType;
  score: number;
  max_score: number;
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

const DEFAULT_FORM = { course_id: '', assessment_type: 'ct' as AssessmentType, score: '', max_score: '' };

export default function AssessmentsPage() {
  const { user } = useAuthStore();
  const { toggleMobileMenu } = useMobileMenu();
  const studentId = user.profile?.id;
  const trimester = user.profile?.current_trimester ?? '';

  const [courses, setCourses] = useState<Course[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Assessment | null>(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchData = async () => {
    if (!studentId) return;
    setLoading(true);
    try {
      const [cRes, aRes] = await Promise.all([
        trimester
          ? fetch(`/api/performance/students/${studentId}/courses/${encodeURIComponent(trimester)}`)
          : fetch('/api/performance/courses'),
        fetch(`/api/performance/assessments/student/${studentId}`),
      ]);
      const cData = await cRes.json();
      setCourses(Array.isArray(cData) ? cData : []);
      const aData = await aRes.json();
      setAssessments(Array.isArray(aData) ? aData : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [studentId, trimester]);

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
      score: String(a.score),
      max_score: String(a.max_score),
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.course_id || !form.score || !form.max_score) return;
    setSaving(true);
    try {
      const payload = {
        student_id: studentId,
        course_id: form.course_id,
        assessment_type: form.assessment_type,
        score: Number(form.score),
        max_score: Number(form.max_score),
      };
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
          <Button variant="outline" size="sm" onClick={fetchData}>
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
            const pct = Math.round((a.score / (a.max_score || 1)) * 100);
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
                        {a.score} / {a.max_score} ({pct}%)
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
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Score
                </label>
                <Input
                  type="number"
                  min={0}
                  placeholder="e.g. 18"
                  value={form.score}
                  onChange={(e) => setForm((f) => ({ ...f, score: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Max Score
                </label>
                <Input
                  type="number"
                  min={1}
                  placeholder="e.g. 20"
                  value={form.max_score}
                  onChange={(e) => setForm((f) => ({ ...f, max_score: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={saving || !form.course_id || !form.score || !form.max_score}
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
