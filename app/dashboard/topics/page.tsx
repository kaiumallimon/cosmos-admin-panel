'use client';

import { FrostedHeader } from "@/components/custom/frosted-header";
import { StatsCard } from "@/components/dashboard/stats-card";
import { useMobileMenu } from "@/components/mobile-menu-context";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Badge } from "@/components/ui/badge";
import {
    Breadcrumb,
    BreadcrumbList,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbSeparator,
    BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    BookOpen,
    Edit,
    MoreHorizontal,
    Plus,
    Search,
    Tag,
    Trash2,
    X,
    Layers,
} from "lucide-react";
import { useEffect, useState } from "react";
import { makeAuthenticatedJsonRequest } from "@/lib/api-helpers";
import { handleApiError } from "@/lib/error-handling";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Topic {
    id: string;
    course_id: string;
    course_title: string | null;
    name: string;
    code: string;
    exam_type: 'ct' | 'mid' | 'final' | 'assignment' | 'project' | null;
    ct_no: number | null;
    created_at: string;
    updated_at: string;
}

interface PerformanceCourse {
    id: string;
    code: string;
    title: string;
    credit: number;
}

const EXAM_TYPES = [
    { value: 'ct', label: 'Class Test (CT)' },
    { value: 'mid', label: 'Mid-Term' },
    { value: 'final', label: 'Final Exam' },
    { value: 'assignment', label: 'Assignment' },
    { value: 'project', label: 'Project' },
] as const;

const EXAM_TYPE_BADGE: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
    ct: { label: 'CT', variant: 'default' },
    mid: { label: 'Mid', variant: 'secondary' },
    final: { label: 'Final', variant: 'destructive' },
    assignment: { label: 'Assignment', variant: 'outline' },
    project: { label: 'Project', variant: 'outline' },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function TopicsPage() {
    const { toggleMobileMenu } = useMobileMenu();

    // Data
    const [topics, setTopics] = useState<Topic[]>([]);
    const [courses, setCourses] = useState<PerformanceCourse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [searchInput, setSearchInput] = useState('');
    const [courseFilter, setCourseFilter] = useState('all');
    const [examTypeFilter, setExamTypeFilter] = useState('all');

    // Dialog state
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);

    // Form state
    type CreateForm = { course_id: string; name: string; code: string; exam_type: string; ct_no: string };
    type EditForm = { name: string; code: string; exam_type: string; ct_no: string };

    const defaultCreateForm: CreateForm = { course_id: '', name: '', code: '', exam_type: '', ct_no: '' };
    const defaultEditForm: EditForm = { name: '', code: '', exam_type: '', ct_no: '' };

    const [createForm, setCreateForm] = useState<CreateForm>(defaultCreateForm);
    const [editForm, setEditForm] = useState<EditForm>(defaultEditForm);
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    // ─── Data fetching ───────────────────────────────────────────────────────

    const fetchTopics = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await makeAuthenticatedJsonRequest('/api/performance/topics');
            if (!result.success) throw new Error(result.error || 'Failed to fetch topics');
            setTopics(Array.isArray(result.data) ? result.data : []);
        } catch (err: any) {
            const msg = err.message || 'Failed to fetch topics';
            setError(msg);
            handleApiError(msg, 'Loading topics');
        } finally {
            setLoading(false);
        }
    };

    const fetchCourses = async () => {
        try {
            const result = await makeAuthenticatedJsonRequest('/api/performance/courses');
            if (result.success) {
                setCourses(Array.isArray(result.data) ? result.data : []);
            }
        } catch {
            // non-critical; just means the course dropdown will be empty
        }
    };

    useEffect(() => {
        fetchTopics();
        fetchCourses();
    }, []);

    // ─── Filtered view ───────────────────────────────────────────────────────

    const filteredTopics = topics.filter(t => {
        const q = searchInput.toLowerCase();
        const matchesSearch =
            !searchInput ||
            t.name.toLowerCase().includes(q) ||
            t.code.toLowerCase().includes(q) ||
            (t.course_title?.toLowerCase().includes(q) ?? false);
        const matchesCourse = courseFilter === 'all' || t.course_id === courseFilter;
        const matchesExam = examTypeFilter === 'all' || t.exam_type === examTypeFilter;
        return matchesSearch && matchesCourse && matchesExam;
    });

    // ─── Stats ───────────────────────────────────────────────────────────────

    const uniqueCourseIds = new Set(topics.map(t => t.course_id)).size;

    // ─── CRUD handlers ───────────────────────────────────────────────────────

    const handleCreateTopic = async () => {
        if (!createForm.course_id || !createForm.name.trim() || !createForm.code.trim()) {
            setFormError('Course, Name, and Code are required.');
            return;
        }
        setFormLoading(true);
        setFormError(null);
        try {
            const payload: Record<string, any> = {
                course_id: createForm.course_id,
                name: createForm.name.trim(),
                code: createForm.code.trim(),
            };
            if (createForm.exam_type) payload.exam_type = createForm.exam_type;
            if (createForm.ct_no) payload.ct_no = parseInt(createForm.ct_no, 10);

            const result = await makeAuthenticatedJsonRequest('/api/performance/topics', {
                method: 'POST',
                body: JSON.stringify(payload),
            });
            if (!result.success) {
                setFormError(result.error || 'Failed to create topic');
                return;
            }
            toast.success('Topic created successfully!', { duration: 4000 });
            setAddDialogOpen(false);
            setCreateForm(defaultCreateForm);
            fetchTopics();
        } catch (err: any) {
            setFormError(err.message || 'An error occurred');
        } finally {
            setFormLoading(false);
        }
    };

    const handleEditTopic = async () => {
        if (!selectedTopic) return;
        if (!editForm.name.trim() || !editForm.code.trim()) {
            setFormError('Name and Code are required.');
            return;
        }
        setFormLoading(true);
        setFormError(null);
        try {
            const payload: Record<string, any> = {
                name: editForm.name.trim(),
                code: editForm.code.trim(),
            };
            if (editForm.exam_type) payload.exam_type = editForm.exam_type;
            else payload.exam_type = null;
            payload.ct_no = editForm.ct_no ? parseInt(editForm.ct_no, 10) : null;

            const result = await makeAuthenticatedJsonRequest(
                `/api/performance/topics/${selectedTopic.id}`,
                { method: 'PUT', body: JSON.stringify(payload) }
            );
            if (!result.success) {
                setFormError(result.error || 'Failed to update topic');
                return;
            }
            toast.success('Topic updated successfully!', { duration: 4000 });
            setEditDialogOpen(false);
            setSelectedTopic(null);
            fetchTopics();
        } catch (err: any) {
            setFormError(err.message || 'An error occurred');
        } finally {
            setFormLoading(false);
        }
    };

    const handleDeleteTopic = async () => {
        if (!selectedTopic) return;
        setFormLoading(true);
        try {
            const result = await makeAuthenticatedJsonRequest(
                `/api/performance/topics/${selectedTopic.id}`,
                { method: 'DELETE' }
            );
            if (!result.success) {
                handleApiError(result.error || 'Failed to delete topic', 'Delete topic');
                return;
            }
            toast.success(`Topic "${selectedTopic.name}" deleted successfully!`, { duration: 4000 });
            setDeleteDialogOpen(false);
            setSelectedTopic(null);
            fetchTopics();
        } catch (err: any) {
            handleApiError(err.message || 'An error occurred while deleting', 'Delete topic');
        } finally {
            setFormLoading(false);
        }
    };

    const openEditDialog = (topic: Topic) => {
        setSelectedTopic(topic);
        setEditForm({
            name: topic.name,
            code: topic.code,
            exam_type: topic.exam_type || '',
            ct_no: topic.ct_no?.toString() || '',
        });
        setFormError(null);
        setEditDialogOpen(true);
    };

    const openDeleteDialog = (topic: Topic) => {
        setSelectedTopic(topic);
        setDeleteDialogOpen(true);
    };

    // ─── Loading skeleton ─────────────────────────────────────────────────────

    if (loading) {
        return (
            <ProtectedRoute>
                <div className="min-h-screen bg-background">
                    <div className="bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm border-b border-border sticky top-0 z-40">
                        <div className="flex items-center justify-between px-6 py-4">
                            <Skeleton className="h-8 w-48" />
                            <Skeleton className="h-10 w-10 rounded-md" />
                        </div>
                    </div>
                    <div className="p-6">
                        <div className="flex items-center space-x-2 mb-6">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-4 w-4" />
                            <Skeleton className="h-4 w-32" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                            {[...Array(3)].map((_, i) => (
                                <Card key={i} className="p-6">
                                    <div className="flex items-center space-x-4">
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
                            <CardHeader className="pb-4">
                                <div className="flex items-center justify-between">
                                    <Skeleton className="h-6 w-40" />
                                    <Skeleton className="h-10 w-32" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                                    <Skeleton className="h-10 flex-1" />
                                    <Skeleton className="h-10 w-full sm:w-[180px]" />
                                    <Skeleton className="h-10 w-full sm:w-[180px]" />
                                </div>
                                <div className="space-y-3">
                                    {[...Array(5)].map((_, i) => (
                                        <div key={i} className="flex items-center space-x-4 py-3">
                                            <Skeleton className="h-10 w-10 rounded-full" />
                                            <div className="space-y-2 flex-1">
                                                <Skeleton className="h-4 w-40" />
                                                <Skeleton className="h-3 w-24" />
                                            </div>
                                            <Skeleton className="h-6 w-20 rounded-full" />
                                            <Skeleton className="h-6 w-16 rounded-full" />
                                            <Skeleton className="h-4 w-20" />
                                            <Skeleton className="h-8 w-8 rounded ml-auto" />
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </ProtectedRoute>
        );
    }

    // ─── Error state ──────────────────────────────────────────────────────────

    if (error) {
        return (
            <ProtectedRoute>
                <div className="min-h-screen bg-background flex items-center justify-center">
                    <div className="text-center">
                        <p className="text-destructive mb-4">{error}</p>
                        <Button onClick={() => fetchTopics()} variant="outline">Retry</Button>
                    </div>
                </div>
            </ProtectedRoute>
        );
    }

    // ─── Main render ──────────────────────────────────────────────────────────

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-background">
                <FrostedHeader
                    title="Topics"
                    subtitle="Manage course topics for the performance tracker"
                    onMobileMenuToggle={toggleMobileMenu}
                />

                <div className="p-6">
                    {/* Breadcrumb */}
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Topics</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>

                    {/* Stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                        <StatsCard
                            icon={Tag}
                            title="Total Topics"
                            value={topics.length}
                        />
                        <StatsCard
                            icon={BookOpen}
                            title="Courses with Topics"
                            value={uniqueCourseIds}
                        />
                        <StatsCard
                            icon={Layers}
                            title="Filtered Results"
                            value={filteredTopics.length}
                        />
                    </div>

                    {/* Main Table Card */}
                    <Card className="mt-5">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <Tag className="h-5 w-5" />
                                    Topic Management
                                </CardTitle>
                                <Button onClick={() => {
                                    setCreateForm(defaultCreateForm);
                                    setFormError(null);
                                    setAddDialogOpen(true);
                                }}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Topic
                                </Button>
                            </div>
                        </CardHeader>

                        <CardContent>
                            {/* Filters */}
                            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search by name, code, or course..."
                                        value={searchInput}
                                        onChange={(e) => setSearchInput(e.target.value)}
                                        className={`pl-10 ${searchInput ? 'pr-16' : 'pr-4'}`}
                                    />
                                    {searchInput && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setSearchInput('')}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    )}
                                </div>

                                <Select value={courseFilter} onValueChange={setCourseFilter}>
                                    <SelectTrigger className="w-full sm:w-[200px]">
                                        <SelectValue placeholder="Filter by course" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Courses</SelectItem>
                                        {Array.from(
                                            new Map(topics.map(t => [t.course_id, t.course_title]))
                                        ).map(([id, title]) => (
                                            <SelectItem key={id} value={id}>
                                                {title || id}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Select value={examTypeFilter} onValueChange={setExamTypeFilter}>
                                    <SelectTrigger className="w-full sm:w-[180px]">
                                        <SelectValue placeholder="Filter by exam type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Exam Types</SelectItem>
                                        {EXAM_TYPES.map(et => (
                                            <SelectItem key={et.value} value={et.value}>
                                                {et.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Table */}
                            <div className="bg-white dark:bg-card rounded-lg border shadow-sm overflow-hidden">
                                {filteredTopics.length === 0 ? (
                                    <div className="p-12 text-center">
                                        <Tag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                        <h3 className="text-lg font-semibold mb-2">No topics found</h3>
                                        <p className="text-muted-foreground mb-4">
                                            {searchInput
                                                ? `No topics match "${searchInput}"`
                                                : 'No topics have been created yet.'}
                                        </p>
                                        {!searchInput && (
                                            <Button onClick={() => setAddDialogOpen(true)}>
                                                <Plus className="h-4 w-4 mr-2" />
                                                Add First Topic
                                            </Button>
                                        )}
                                    </div>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-50 dark:hover:bg-gray-900/50">
                                                <TableHead className="font-semibold text-gray-900 dark:text-gray-100 py-4">Topic</TableHead>
                                                <TableHead className="font-semibold text-gray-900 dark:text-gray-100 py-4">Code</TableHead>
                                                <TableHead className="font-semibold text-gray-900 dark:text-gray-100 py-4">Course</TableHead>
                                                <TableHead className="font-semibold text-gray-900 dark:text-gray-100 py-4">Exam Type</TableHead>
                                                <TableHead className="font-semibold text-gray-900 dark:text-gray-100 py-4">CT #</TableHead>
                                                <TableHead className="font-semibold text-gray-900 dark:text-gray-100 py-4">Created</TableHead>
                                                <TableHead className="font-semibold text-gray-900 dark:text-gray-100 py-4">Updated</TableHead>
                                                <TableHead className="font-semibold text-gray-900 dark:text-gray-100 py-4 text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredTopics.map((topic) => (
                                                <TableRow
                                                    key={topic.id}
                                                    className="hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors"
                                                >
                                                    <TableCell className="py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                                                                <Tag className="h-5 w-5 text-primary" />
                                                            </div>
                                                            <div>
                                                                <div className="font-medium">{topic.name}</div>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-4 font-mono text-sm font-medium">
                                                        {topic.code}
                                                    </TableCell>
                                                    <TableCell className="py-4">
                                                        <Badge variant="secondary">
                                                            {topic.course_title || topic.course_id}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="py-4">
                                                        {topic.exam_type ? (
                                                            <Badge variant={EXAM_TYPE_BADGE[topic.exam_type]?.variant ?? 'outline'}>
                                                                {EXAM_TYPE_BADGE[topic.exam_type]?.label ?? topic.exam_type}
                                                            </Badge>
                                                        ) : (
                                                            <span className="text-muted-foreground text-sm">—</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="py-4 text-sm text-muted-foreground">
                                                        {topic.ct_no ?? '—'}
                                                    </TableCell>
                                                    <TableCell className="py-4 text-sm text-muted-foreground">
                                                        {new Date(topic.created_at).toLocaleDateString('en-US', {
                                                            year: 'numeric',
                                                            month: 'short',
                                                            day: 'numeric',
                                                        })}
                                                    </TableCell>
                                                    <TableCell className="py-4 text-sm text-muted-foreground">
                                                        {new Date(topic.updated_at).toLocaleDateString('en-US', {
                                                            year: 'numeric',
                                                            month: 'short',
                                                            day: 'numeric',
                                                        })}
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
                                                            <DropdownMenuContent align="end" className="w-48">
                                                                <DropdownMenuItem onClick={() => openEditDialog(topic)}>
                                                                    <Edit className="mr-2 h-4 w-4" />
                                                                    Edit Topic
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    onClick={() => openDeleteDialog(topic)}
                                                                    className="text-destructive focus:text-destructive"
                                                                >
                                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                                    Delete Topic
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* ── Add Topic Dialog ─────────────────────────────────────── */}
                <Dialog open={addDialogOpen} onOpenChange={(open) => {
                    setAddDialogOpen(open);
                    if (!open) setFormError(null);
                }}>
                    <DialogContent className="sm:max-w-[480px]">
                        <DialogHeader>
                            <DialogTitle>Add New Topic</DialogTitle>
                            <DialogDescription>
                                Create a new topic under a course. Fields marked * are required.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            {/* Course */}
                            <div className="grid gap-2">
                                <Label>Course *</Label>
                                <Select
                                    value={createForm.course_id}
                                    onValueChange={(v) => setCreateForm({ ...createForm, course_id: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a course…" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {courses.length === 0 ? (
                                            <SelectItem value="_none" disabled>No courses available</SelectItem>
                                        ) : (
                                            courses.map(c => (
                                                <SelectItem key={c.id} value={c.id}>
                                                    {c.code} — {c.title}
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Name */}
                            <div className="grid gap-2">
                                <Label htmlFor="add-name">Topic Name *</Label>
                                <Input
                                    id="add-name"
                                    placeholder="e.g., Arrays and Linked Lists"
                                    value={createForm.name}
                                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                                />
                            </div>

                            {/* Code */}
                            <div className="grid gap-2">
                                <Label htmlFor="add-code">Topic Code *</Label>
                                <Input
                                    id="add-code"
                                    placeholder="e.g., DSA-01"
                                    value={createForm.code}
                                    onChange={(e) => setCreateForm({ ...createForm, code: e.target.value })}
                                />
                            </div>

                            {/* Exam Type */}
                            <div className="grid gap-2">
                                <Label>Exam Type</Label>
                                <Select
                                    value={createForm.exam_type}
                                    onValueChange={(v) => setCreateForm({ ...createForm, exam_type: v, ct_no: v !== 'ct' ? '' : createForm.ct_no })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select exam type (optional)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {EXAM_TYPES.map(et => (
                                            <SelectItem key={et.value} value={et.value}>
                                                {et.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* CT Number — only when exam_type = ct */}
                            {createForm.exam_type === 'ct' && (
                                <div className="grid gap-2">
                                    <Label htmlFor="add-ct-no">CT Number</Label>
                                    <Input
                                        id="add-ct-no"
                                        type="number"
                                        min={1}
                                        placeholder="e.g., 1"
                                        value={createForm.ct_no}
                                        onChange={(e) => setCreateForm({ ...createForm, ct_no: e.target.value })}
                                    />
                                </div>
                            )}

                            {formError && (
                                <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                                    {formError}
                                </div>
                            )}
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setAddDialogOpen(false)} disabled={formLoading}>
                                Cancel
                            </Button>
                            <Button onClick={handleCreateTopic} disabled={formLoading}>
                                {formLoading ? 'Creating…' : 'Create Topic'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* ── Edit Topic Dialog ────────────────────────────────────── */}
                <Dialog open={editDialogOpen} onOpenChange={(open) => {
                    setEditDialogOpen(open);
                    if (!open) setFormError(null);
                }}>
                    <DialogContent className="sm:max-w-[480px]">
                        <DialogHeader>
                            <DialogTitle>Edit Topic</DialogTitle>
                            <DialogDescription>
                                Update topic details. The course cannot be changed after creation.
                            </DialogDescription>
                        </DialogHeader>
                        {selectedTopic && (
                            <div className="grid gap-4 py-4">
                                {/* Course (read-only) */}
                                <div className="grid gap-2">
                                    <Label>Course</Label>
                                    <div className="flex h-10 items-center rounded-md border bg-muted/40 px-3 text-sm text-muted-foreground">
                                        {selectedTopic.course_title || selectedTopic.course_id}
                                        <Badge variant="outline" className="ml-2 text-xs">immutable</Badge>
                                    </div>
                                </div>

                                {/* Name */}
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-name">Topic Name *</Label>
                                    <Input
                                        id="edit-name"
                                        value={editForm.name}
                                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                    />
                                </div>

                                {/* Code */}
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-code">Topic Code *</Label>
                                    <Input
                                        id="edit-code"
                                        value={editForm.code}
                                        onChange={(e) => setEditForm({ ...editForm, code: e.target.value })}
                                    />
                                </div>

                                {/* Exam Type */}
                                <div className="grid gap-2">
                                    <Label>Exam Type</Label>
                                    <Select
                                        value={editForm.exam_type}
                                        onValueChange={(v) => setEditForm({ ...editForm, exam_type: v, ct_no: v !== 'ct' ? '' : editForm.ct_no })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select exam type (optional)" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="">None</SelectItem>
                                            {EXAM_TYPES.map(et => (
                                                <SelectItem key={et.value} value={et.value}>
                                                    {et.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* CT Number */}
                                {editForm.exam_type === 'ct' && (
                                    <div className="grid gap-2">
                                        <Label htmlFor="edit-ct-no">CT Number</Label>
                                        <Input
                                            id="edit-ct-no"
                                            type="number"
                                            min={1}
                                            value={editForm.ct_no}
                                            onChange={(e) => setEditForm({ ...editForm, ct_no: e.target.value })}
                                        />
                                    </div>
                                )}

                                {formError && (
                                    <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                                        {formError}
                                    </div>
                                )}
                            </div>
                        )}
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={formLoading}>
                                Cancel
                            </Button>
                            <Button onClick={handleEditTopic} disabled={formLoading}>
                                {formLoading ? 'Updating…' : 'Update Topic'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* ── Delete Topic Dialog ──────────────────────────────────── */}
                <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Delete Topic</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to delete this topic? This action cannot be undone.
                            </DialogDescription>
                        </DialogHeader>
                        {selectedTopic && (
                            <div className="py-4">
                                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg space-y-1">
                                    <h4 className="font-medium">{selectedTopic.name}</h4>
                                    <p className="text-sm text-muted-foreground font-mono">{selectedTopic.code}</p>
                                    <p className="text-sm text-muted-foreground">
                                        Course: {selectedTopic.course_title || selectedTopic.course_id}
                                    </p>
                                    {selectedTopic.exam_type && (
                                        <p className="text-sm text-muted-foreground">
                                            Exam type: {EXAM_TYPE_BADGE[selectedTopic.exam_type]?.label ?? selectedTopic.exam_type}
                                            {selectedTopic.ct_no ? ` (CT #${selectedTopic.ct_no})` : ''}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={formLoading}>
                                Cancel
                            </Button>
                            <Button variant="destructive" onClick={handleDeleteTopic} disabled={formLoading}>
                                {formLoading ? 'Deleting…' : 'Delete Topic'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </ProtectedRoute>
    );
}
