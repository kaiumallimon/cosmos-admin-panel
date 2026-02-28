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
  Trophy,
  BrainCircuitIcon,
  Info,
  MessageCircle,
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
  grade?: string;
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
  grade: '',
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

  // ─── Count dialog state ─────────────────────────────────────────────────
  const [countDialogOpen, setCountDialogOpen] = useState(false);
  const [countDialogType, setCountDialogType] = useState<'ct' | 'assignment'>('ct');
  const [countValue, setCountValue] = useState('1');
  const [countSaving, setCountSaving] = useState(false);

  // ─── Quiz state ────────────────────────────────────────────────────────
  const [quizDialogOpen, setQuizDialogOpen] = useState(false);
  const [quizTopics, setQuizTopics] = useState<Topic[]>([]);
  const [quizTopicsLoading, setQuizTopicsLoading] = useState(false);
  const [quizSelectedTopics, setQuizSelectedTopics] = useState<string[]>([]);
  const [quizGenerating, setQuizGenerating] = useState(false);

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
            grade: a.grade ?? undefined,
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

  const loadQuizTopics = async (cid: string) => {
    if (!cid) return;
    setQuizTopicsLoading(true);
    setQuizSelectedTopics([]);
    try {
      const res = await fetch('/api/performance/course-topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ course_id: cid }),
      });
      const data = await res.json();
      const raw: any[] = Array.isArray(data) ? data : data?.topics ?? [];
      setQuizTopics(raw.map((t: any) => ({ id: t.id, topic_name: t.topic_name ?? t.name ?? '' })));
    } finally {
      setQuizTopicsLoading(false);
    }
  };

  const openQuizDialog = () => {
    setQuizSelectedTopics([]);
    setQuizDialogOpen(true);
    // Reuse already-loaded topics if available, else fetch
    if (topics.length > 0) {
      setQuizTopics(topics);
    } else {
      loadQuizTopics(courseId);
    }
  };

  const handleTalkToAgent = () => {
    const coursePart = courseName ? `${courseCode} — ${courseName}` : courseCode;
    let prompt: string;
    if (weaknesses.length === 0) {
      prompt = `I am a student enrolled in **${coursePart}**. I would like you to give me an overview of the key topics in this course and help me study effectively.`;
    } else {
      const topicList = weaknesses.map((w, i) => `${i + 1}. ${w.topic_name}`).join('\n');
      prompt = `I am struggling with the following topics in my course **${coursePart}**:\n\n${topicList}\n\nPlease explain each of these topics clearly and concisely to help me overcome my weaknesses. Use simple language, provide examples where helpful, and structure the explanation so I can understand and revise effectively.`;
    }
    sessionStorage.setItem('chatAutoPrompt', prompt);
    router.push('/user/chat');
  };

  const handleGenerateQuiz = async () => {
    if (!studentId || !courseId || quizSelectedTopics.length === 0) return;
    setQuizGenerating(true);
    try {
      const res = await fetch('/api/performance/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: studentId,
          course_id: courseId,
          topic_ids: quizSelectedTopics,
        }),
      });
      const data = await res.json();
      if (data?.quiz_id && data?.generated_quiz) {
        sessionStorage.setItem(`quiz_${data.quiz_id}`, JSON.stringify(data));
        setQuizDialogOpen(false);
        router.push(`/user/performance/quiz/${data.quiz_id}`);
      }
    } finally {
      setQuizGenerating(false);
    }
  };

  useEffect(() => {
    fetchAssessments();
    fetchStats();
    fetchWeaknesses();
    loadTopics();
  }, [studentId, courseId]);

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const openCountDialog = (type: 'ct' | 'assignment') => {
    setCountDialogType(type);
    setCountValue(
      String(type === 'ct' ? (stats?.ct_count ?? 1) : (stats?.assignment_count ?? 1)),
    );
    setCountDialogOpen(true);
  };

  const handleSaveCount = async () => {
    const best_count = Number(countValue);
    if (!studentId || !courseId || isNaN(best_count) || best_count < 1 || best_count > 3) return;
    setCountSaving(true);
    try {
      const endpoint =
        countDialogType === 'ct'
          ? '/api/performance/ct-count'
          : '/api/performance/assignment-count';
      await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId, course_id: courseId, best_count }),
      });
      setCountDialogOpen(false);
      fetchStats();
    } finally {
      setCountSaving(false);
    }
  };

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
      grade: a.grade ?? '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const isFinal = form.assessment_type === 'final';
    const hasGrade = isFinal && !!form.grade.trim();
    if (!hasGrade && (!form.marks || !form.full_marks)) return;
    if (form.assessment_type === 'ct' && !form.ct_no) return;
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        enrollment_id: enrollmentId,
        student_id: studentId,
        course_id: courseId,
        assessment_type: form.assessment_type,
      };
      if (hasGrade) {
        payload.grade = form.grade.trim();
      } else {
        payload.marks = Number(form.marks);
        payload.full_marks = Number(form.full_marks);
      }
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

    // All other types: sum their marks (exclude final — grade-only)
    const otherTypes = ['mid', 'assignment', 'project', 'attendance'] as const;
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
          {/* CT Count — editable */}
          <Card className="relative group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">CT Count</CardTitle>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => openCountDialog('ct')}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                  title="Edit CT count"
                >
                  <PencilIcon className="h-3.5 w-3.5" />
                </button>
                <ClipboardListIcon className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.ct_count ?? '—'}</div>
              <p className="text-xs text-muted-foreground mt-1">Scheduled CTs for this course</p>
            </CardContent>
          </Card>

          {/* Assignment Count — editable */}
          <Card className="relative group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Assignment Count</CardTitle>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => openCountDialog('assignment')}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                  title="Edit assignment count"
                >
                  <PencilIcon className="h-3.5 w-3.5" />
                </button>
                <CheckSquareIcon className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.assignment_count ?? '—'}</div>
              <p className="text-xs text-muted-foreground mt-1">Scheduled assignments</p>
            </CardContent>
          </Card>
          <StatsCard
            icon={TrendingUpIcon}
            title="Avg CT Mark"
            value={
              stats?.avg_ct_mark != null
                ? `${stats.avg_ct_mark}${stats.avg_ct_percentage != null ? ` (${stats.avg_ct_percentage}%)` : ''
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

              <div className="flex items-center gap-2 px-6 mb-4 mx-auto w-full justify-center text-muted-foreground text-sm">
                <Info className="h-4 w-4 inline-block text-blue-500" />
                <p>For accurate grade prediction, please complete all assessments of an enrolled course!</p>
              </div>

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
                          const isFinal = a.assessment_type === 'final';
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
                              <TableCell className="py-4 font-semibold">
                                {isFinal ? '—' : a.marks}
                              </TableCell>
                              <TableCell className="py-4 text-muted-foreground">
                                {isFinal ? '—' : a.full_marks}
                              </TableCell>
                              <TableCell className="py-4">
                                {isFinal ? (
                                  a.grade ? (
                                    <Badge className="text-sm font-bold bg-red-500/10 text-red-600 dark:text-red-400 border-0 px-2.5 py-1">
                                      {a.grade}
                                    </Badge>
                                  ) : (
                                    <span className="text-sm text-muted-foreground">—</span>
                                  )
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <div className="w-20 h-2 rounded-full bg-muted overflow-hidden">
                                      <div
                                        className="h-2 rounded-full bg-primary transition-all"
                                        style={{ width: `${Math.min(pct, 100)}%` }}
                                      />
                                    </div>
                                    <span className="text-sm font-medium">{pct}%</span>
                                  </div>
                                )}
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
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={fetchWeaknesses} title="Refresh">
                      <RefreshCwIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      className="gap-1.5 bg-primary hover:bg-primary/90"
                      onClick={openWeaknessDialog}
                    >
                      <PlusIcon className="h-4 w-4" />
                      <span className="hidden sm:inline">Add Weakness</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={openQuizDialog}
                      className="gap-1.5"
                      title="Attempt Quiz"
                    >
                      <Trophy className="h-4 w-4" />
                      <span className="hidden sm:inline">Attempt Quiz</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleTalkToAgent}
                      className="gap-1.5"
                      title="Talk to Agent"
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span className="hidden sm:inline">Talk to Agent</span>
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

      {/* ── CT / Assignment Count Dialog ──────────────────────────────────────── */}
      <Dialog open={countDialogOpen} onOpenChange={setCountDialogOpen}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>
              Edit {countDialogType === 'ct' ? 'CT' : 'Assignment'} Count
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg border p-3 bg-muted/40">
              <p className="text-xs font-medium text-muted-foreground">Course</p>
              <p className="text-sm font-semibold mt-0.5">
                {courseCode}{courseName ? ` — ${courseName}` : ''}
              </p>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Best count <span className="text-muted-foreground font-normal">(1 – 3)</span>
              </label>
              <Select
                value={countValue}
                onValueChange={setCountValue}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select count" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                The best {countValue} {countDialogType === 'ct' ? 'CT' : 'assignment'}{Number(countValue) > 1 ? 's' : ''} will be used in grade calculation.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCountDialogOpen(false)} disabled={countSaving}>
              Cancel
            </Button>
            <Button onClick={handleSaveCount} disabled={countSaving}>
              {countSaving ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

            {form.assessment_type === 'final' && (
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Final Grade
                  <span className="ml-1 text-muted-foreground/60 font-normal">(optional if marks provided)</span>
                </label>
                <Input
                  placeholder="e.g. A+, A, A-, B+, B …"
                  value={form.grade}
                  onChange={(e) => setForm((f) => ({ ...f, grade: e.target.value }))}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Marks{form.assessment_type === 'final' && form.grade.trim() && <span className="ml-1 text-muted-foreground/60 font-normal">(auto from grade)</span>}
                </label>
                <Input
                  type="number"
                  min={0}
                  placeholder="e.g. 18"
                  value={form.marks}
                  disabled={form.assessment_type === 'final' && !!form.grade.trim()}
                  onChange={(e) => setForm((f) => ({ ...f, marks: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Full Marks{form.assessment_type === 'final' && form.grade.trim() && <span className="ml-1 text-muted-foreground/60 font-normal">(auto from grade)</span>}
                </label>
                <Input
                  type="number"
                  min={1}
                  placeholder="e.g. 100"
                  value={form.full_marks}
                  disabled={form.assessment_type === 'final' && !!form.grade.trim()}
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
                (form.assessment_type === 'ct' && !form.ct_no) ||
                (
                  form.assessment_type === 'final'
                    ? !form.grade.trim() && (!form.marks || !form.full_marks)
                    : !form.marks || !form.full_marks
                )
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

      {/* ── Attempt Quiz Dialog ─────────────────────────────────────────────── */}
      <Dialog open={quizDialogOpen} onOpenChange={setQuizDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BrainCircuitIcon className="h-5 w-5 text-primary" />
              Attempt Quiz
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Course info (read-only) */}
            <div className="rounded-lg border p-3 bg-muted/40">
              <p className="text-xs font-medium text-muted-foreground">Course</p>
              <p className="text-sm font-semibold mt-0.5">
                {courseCode}{courseName ? ` — ${courseName}` : ''}
              </p>
            </div>

            {/* Topic multi-select chips */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Select Topics{quizSelectedTopics.length > 0 && ` (${quizSelectedTopics.length} selected)`}
              </label>
              {quizTopicsLoading ? (
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-8 w-24 rounded-full" />)}
                </div>
              ) : quizTopics.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2">No topics available for this course.</p>
              ) : (
                <div className="flex flex-wrap gap-2 max-h-52 overflow-y-auto py-1 pr-1">
                  {quizTopics.map((t) => {
                    const selected = quizSelectedTopics.includes(t.id);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() =>
                          setQuizSelectedTopics((prev) =>
                            selected ? prev.filter((id) => id !== t.id) : [...prev, t.id],
                          )
                        }
                        className={`text-sm px-3 py-1.5 rounded-full border transition-all ${
                          selected
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-muted/40 text-muted-foreground border-border hover:border-primary/50 hover:text-foreground'
                        }`}
                      >
                        {t.topic_name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => setQuizDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={quizGenerating || quizSelectedTopics.length === 0}
              onClick={handleGenerateQuiz}
              className="bg-primary hover:bg-primary/90 gap-2"
            >
              {quizGenerating ? (
                <>
                  <div className="h-4 w-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <BrainCircuitIcon className="h-4 w-4" />
                  Generate Quiz
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
