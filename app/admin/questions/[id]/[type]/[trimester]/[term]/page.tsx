'use client'

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { FrostedHeader } from "@/components/custom/frosted-header";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { MoreVertical, Edit, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { JetBrains_Mono } from "next/font/google";
import { useMobileMenu } from "@/components/mobile-menu-context";

const jetbrainsMono = JetBrains_Mono({
    subsets: ["latin"],
    weight: ["400", "500", "700"],
});

// Markdown components: only code blocks use JetBrains Mono
const markdownComponents = {
  code({ node, inline, className, children, ...props }: any) {
    const content = Array.isArray(children) ? children.join("") : children;

    if (inline) {
      return (
        <code
          className={`bg-gray-100 dark:bg-gray-800 px-1 rounded text-sm font-mono ${jetbrainsMono.className}`}
          {...props}
        >
          {content}
        </code>
      );
    }

    return (
      <pre
        className={`mt-3 bg-gray-100 dark:bg-gray-800 px-5 py-4 rounded-md overflow-x-auto ${jetbrainsMono.className}`}
        {...props}
      >
        <code className="text-sm">{content}</code>
      </pre>
    );
  },
};


interface QuestionsModel {
    id: number;
    course_title: string;
    short: string;
    course_code: string;
    semester_term: string;
    exam_type: string;
    question_number: string;
    sub_question?: string | null;
    marks?: number | null;
    total_question_mark?: number | null;
    contribution_percentage?: number | null;
    has_image?: boolean | null;
    image_type?: string | null;
    image_url?: string | null;
    has_description?: boolean | null;
    description_content?: string | null;
    question: string;
    pdf_url?: string | null;
    created_at?: string | null;
    vector_id?: string | null;
}

export default function QuestionsPage() {
    const [questions, setQuestions] = useState<QuestionsModel[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Edit dialog state
    const [editDialogOpen, setEditDialogOpen] = useState<boolean>(false);
    const [editingQuestion, setEditingQuestion] = useState<QuestionsModel | null>(null);
    const [editForm, setEditForm] = useState<QuestionsModel | null>(null);
    const [editLoading, setEditLoading] = useState<boolean>(false);
    const [editError, setEditError] = useState<string | null>(null);

    const params = useParams();
    const course_code = params.id;
    const exam_type = params.type;
    const trimester_type = params.trimester;
    const semester_term = params.term;

    const fetchQuestions = async () => {
        if (!course_code || !exam_type || !semester_term) {
            setError("Missing required parameters");
            return;
        }

        try {
            setLoading(true);

            const response = await fetch(
                `/api/questions?course_code=${course_code}&exam_type=${exam_type}&semester_term=${semester_term}`
            );
            const data = await response.json();

            console.log('Response:', data);

            if (response.ok) {
                setQuestions(data.data || []);
                setError(null);
            } else {
                setError(data.error || "Failed to fetch questions");
            }
        } catch (error) {
            console.error("Fetch error:", error);
            setError("An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };



    useEffect(() => {
        setQuestions([]);
        fetchQuestions();
    }, [course_code, exam_type, semester_term]);

    // Delete question function
    const handleDelete = async (questionId: number) => {
        const questionToDelete = questions.find(q => q.id === questionId);
        const confirmMessage = `Are you sure you want to delete this question?\n\nQ${questionToDelete?.question_number}${questionToDelete?.sub_question ? `.${questionToDelete.sub_question}` : ""}\n\nThis action cannot be undone.`;

        if (!confirm(confirmMessage)) {
            return;
        }

        // Show loading toast
        const loadingToast = toast.loading("Deleting question from MongoDB and Pinecone...");

        try {
            const response = await fetch(`/api/questions/${questionId}`, {
                method: 'DELETE',
            });

            const result = await response.json();

            if (response.ok && result.transaction === 'completed' && !result.criticalError) {
                // Update local state immediately for better UX
                setQuestions(prev => prev.filter(q => q.id !== questionId));

                // Show success toast with details
                toast.success("Question deleted successfully!", {
                    description: `Q${questionToDelete?.question_number}${questionToDelete?.sub_question ? `.${questionToDelete.sub_question}` : ""} removed from both MongoDB and Pinecone`,
                    duration: 5000
                });

                // Verify deletion by refreshing data after a short delay
                setTimeout(async () => {
                    try {
                        const verifyResponse = await fetch(`/api/questions/${questionId}`, {
                            method: 'GET',
                        });

                        if (verifyResponse.ok) {
                            // Question still exists! Update UI to reflect reality
                            console.warn("Question still exists after deletion - refreshing data");
                            toast.warning("Deletion verification failed", {
                                description: "Question may still exist - refreshing data",
                                duration: 3000
                            });
                            fetchQuestions();
                        }
                        // If 404, question is properly deleted (expected)
                    } catch (verifyError) {
                        // Network error during verification, refresh to be safe
                        console.warn("Could not verify deletion:", verifyError);
                        fetchQuestions();
                    }
                }, 2000);
            } else if (response.ok && result.criticalError) {
                // Critical error - don't update local state, force refresh
                toast.error("Critical Error: Data Inconsistency!", {
                    description: result.message || "Manual intervention required - refreshing data...",
                    duration: 10000
                });

                // Force refresh the data to show actual server state
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            } else if (response.ok && result.transaction !== 'completed') {
                // Partial failure - don't update local state
                toast.error("Deletion Failed", {
                    description: result.error || "Transaction was not completed successfully",
                    duration: 5000
                });

                // Refresh data to ensure UI matches server state
                fetchQuestions();
            } else {
                // Standard error responses
                toast.error("Failed to delete question", {
                    description: result.error || "An unexpected error occurred",
                    duration: 5000
                });
            }
        } catch (error) {
            console.error("Delete error:", error);
            toast.error("Network Error", {
                description: "Failed to communicate with the server - data may be inconsistent",
                duration: 5000
            });

            // Refresh data to ensure UI matches server state after network error
            setTimeout(() => {
                fetchQuestions();
            }, 1000);
        } finally {
            // Dismiss loading toast
            toast.dismiss(loadingToast);
        }
    };

    // Open edit dialog
    const handleEdit = async (questionId: number) => {
        const question = questions.find(q => q.id === questionId);
        if (!question) return;

        setEditingQuestion(question);
        setEditForm({ ...question });
        setEditDialogOpen(true);
        setEditError(null);
    };

    const { toggleMobileMenu } = useMobileMenu();

    // Save edited question
    const handleSaveEdit = async () => {
        if (!editForm || !editingQuestion) return;

        setEditLoading(true);
        setEditError(null);

        try {
            const response = await fetch(`/api/questions/${editingQuestion.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm),
            });

            if (response.ok) {
                const updatedQuestion = await response.json();

                // Update local state with the edited question
                setQuestions(prev => prev.map(q =>
                    q.id === editingQuestion.id ? { ...editForm } : q
                ));

                // Close dialog
                setEditDialogOpen(false);
                setEditingQuestion(null);
                setEditForm(null);

                console.log("Question updated successfully");
            } else {
                const errorData = await response.json();
                setEditError(errorData.error || "Failed to update question");
            }
        } catch (error) {
            console.error("Edit error:", error);
            setEditError("An error occurred while updating the question");
        } finally {
            setEditLoading(false);
        }
    };

    // Close edit dialog
    const handleCancelEdit = () => {
        setEditDialogOpen(false);
        setEditingQuestion(null);
        setEditForm(null);
        setEditError(null);
    };

    const SkeletonCard = () => (
        <Card className="mt-3">
            <CardContent className="p-4 space-y-3">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-32 w-full rounded" />
            </CardContent>
        </Card>
    );

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-background">
                <FrostedHeader
                    title={`${course_code?.toString().replace(
                        "%20",
                        "-"
                    )} - ${exam_type} - ${trimester_type} ${semester_term} Questions`}
                    onMobileMenuToggle={toggleMobileMenu}
                />

                {/* breadcrumbs */}
                <div className="p-4 sm:p-6 pb-0">
                  <Breadcrumb>
                    <BreadcrumbList>
                      <BreadcrumbItem>
                        <BreadcrumbLink href="/admin">Dashboard</BreadcrumbLink>
                      </BreadcrumbItem>
                      <BreadcrumbSeparator />
                      <BreadcrumbItem>
                        <BreadcrumbLink href="/admin/questions">Questions</BreadcrumbLink>
                      </BreadcrumbItem>
                      <BreadcrumbSeparator />
                      <BreadcrumbItem>
                        <BreadcrumbLink href={`/admin/questions/${course_code}`}>{course_code?.toString().replace("%20", "-")}</BreadcrumbLink>
                      </BreadcrumbItem>
                      <BreadcrumbSeparator />
                      <BreadcrumbItem>
                        <BreadcrumbLink href={`/admin/questions/${course_code}/${exam_type}`}>{exam_type}</BreadcrumbLink>
                      </BreadcrumbItem>
                      <BreadcrumbSeparator />
                      <BreadcrumbItem>
                        <BreadcrumbPage>Trimester {semester_term}</BreadcrumbPage>
                      </BreadcrumbItem>
                    </BreadcrumbList>
                  </Breadcrumb>
                </div>

                <div className="p-4 sm:p-6 pb-12">
                    {/* Loading skeletons */}
                    {loading && (
                        <div className="animate-pulse">
                            {[...Array(4)].map((_, i) => (
                                <SkeletonCard key={i} />
                            ))}
                        </div>
                    )}

                    {/* Error */}
                    {error && !loading && (
                        <div className="flex items-center justify-center p-8">
                            <p className="text-red-500">Error: {error}</p>
                        </div>
                    )}

                    {/* No questions */}
                    {!loading && !error && questions.length === 0 && (
                        <div className="flex items-center justify-center p-8">
                            <p className="text-gray-500">
                                No questions found for this course and term.
                            </p>
                        </div>
                    )}

                    {/* Questions */}
                    {!loading &&
                        !error &&
                        questions.map((question, index) => (
                            <Card
                                key={question.id}
                                className={`mt-4 border border-border shadow-sm hover:shadow-md transition ${
                                    index === questions.length - 1 ? 'mb-8' : 'mb-4'
                                }`}
                            >
                                <CardContent className="py-5 px-4 sm:px-8 space-y-4">
                                    {/* Header */}
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-lg font-semibold">
                                            Q{question.question_number}
                                            {question.sub_question ? `.${question.sub_question}` : ""}
                                            {question.marks && ` (${question.marks} marks)`}
                                        </h3>
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm text-gray-500">
                                                {question.course_code} | {question.semester_term}
                                            </p>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                        onClick={() => handleEdit(question.id)}
                                                        className="cursor-pointer"
                                                    >
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => handleDelete(question.id)}
                                                        className="cursor-pointer text-red-600 hover:text-red-700"
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    {question.has_description && question.description_content && (
                                        <div className="mt-2 text-muted-foreground rounded-md">
                                            <div className="prose dark:prose-invert max-w-none">
                                                <ReactMarkdown
                                                    remarkPlugins={[remarkGfm]}
                                                    components={markdownComponents}
                                                >
                                                    {question.description_content}
                                                </ReactMarkdown>
                                            </div>
                                        </div>
                                    )}

                                    {/* Image */}
                                    {question.has_image && question.image_url && (
                                        <div className="mt-3">
                                            <img
                                                src={question.image_url}
                                                alt={question.image_type ?? "Question image"}
                                                className="max-w-full rounded border"
                                            />
                                        </div>
                                    )}

                                    {/* Question content */}
                                    <div className="mt-3 prose dark:prose-invert max-w-none leading-relaxed">
                                        <ReactMarkdown
                                            remarkPlugins={[remarkGfm]} components={markdownComponents}
                                        >
                                            {question.question}
                                        </ReactMarkdown>
                                    </div>

                                    {/* PDF reference */}
                                    {question.pdf_url && (
                                        <div className="mt-3 text-sm">
                                            <a
                                                href={question.pdf_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-500 underline"
                                            >
                                                View Question PDF
                                            </a>
                                        </div>
                                    )}

                                    {/* Footer with course shortname, created at */}
                                    <div className="mt-4 border-t border-border pt-2 text-sm text-gray-500 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                                        <span>Course: {question.short} ({question.course_title})</span>
                                        {question.created_at && <span>Created: {new Date(question.created_at).toLocaleDateString()}</span>}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}

                    {/* Total Questions Info */}
                    {!loading && !error && questions.length > 0 && (
                        <div className="mt-8 mb-8 flex justify-center">
                            <div className="text-sm text-gray-500 text-center">
                                Showing {questions.length} questions
                            </div>
                        </div>
                    )}

                    {/* Edit Question Dialog */}
                    <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>
                                    Edit Question {editingQuestion?.question_number}
                                    {editingQuestion?.sub_question && `.${editingQuestion.sub_question}`}
                                </DialogTitle>
                            </DialogHeader>

                            <div className="space-y-6">
                                {editError && (
                                    <div className="p-3 text-red-600 bg-red-50 dark:bg-red-950 rounded border border-red-200 dark:border-red-800">
                                        {editError}
                                    </div>
                                )}

                                {/* Basic Information */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="edit_course_title">Course Title</Label>
                                        <Input
                                            id="edit_course_title"
                                            value={editForm?.course_title || ""}
                                            onChange={(e) => setEditForm(prev => prev ? { ...prev, course_title: e.target.value } : null)}
                                            placeholder="Course Title"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="edit_course_code">Course Code</Label>
                                        <Input
                                            id="edit_course_code"
                                            value={editForm?.course_code || ""}
                                            onChange={(e) => setEditForm(prev => prev ? { ...prev, course_code: e.target.value } : null)}
                                            placeholder="Course Code"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="edit_short">Short Name</Label>
                                        <Input
                                            id="edit_short"
                                            value={editForm?.short || ""}
                                            onChange={(e) => setEditForm(prev => prev ? { ...prev, short: e.target.value } : null)}
                                            placeholder="Short Name"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="edit_semester_term">Semester Term</Label>
                                        <Input
                                            id="edit_semester_term"
                                            value={editForm?.semester_term || ""}
                                            onChange={(e) => setEditForm(prev => prev ? { ...prev, semester_term: e.target.value } : null)}
                                            placeholder="Semester Term"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="edit_exam_type">Exam Type</Label>
                                        <Input
                                            id="edit_exam_type"
                                            value={editForm?.exam_type || ""}
                                            onChange={(e) => setEditForm(prev => prev ? { ...prev, exam_type: e.target.value } : null)}
                                            placeholder="Exam Type"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="edit_question_number">Question Number</Label>
                                        <Input
                                            id="edit_question_number"
                                            value={editForm?.question_number || ""}
                                            onChange={(e) => setEditForm(prev => prev ? { ...prev, question_number: e.target.value } : null)}
                                            placeholder="Question Number"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="edit_sub_question">Sub Question</Label>
                                        <Input
                                            id="edit_sub_question"
                                            value={editForm?.sub_question || ""}
                                            onChange={(e) => setEditForm(prev => prev ? { ...prev, sub_question: e.target.value } : null)}
                                            placeholder="Sub Question"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="edit_marks">Marks</Label>
                                        <Input
                                            id="edit_marks"
                                            type="number"
                                            value={editForm?.marks || ""}
                                            onChange={(e) => setEditForm(prev => prev ? { ...prev, marks: Number(e.target.value) } : null)}
                                            placeholder="Marks"
                                        />
                                    </div>
                                </div>

                                {/* Switches */}
                                <div className="space-y-4">
                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            id="edit_has_image"
                                            checked={!!editForm?.has_image}
                                            onCheckedChange={(val) => setEditForm(prev => prev ? { ...prev, has_image: val } : null)}
                                        />
                                        <Label htmlFor="edit_has_image">Has Image</Label>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            id="edit_has_description"
                                            checked={!!editForm?.has_description}
                                            onCheckedChange={(val) => setEditForm(prev => prev ? { ...prev, has_description: val } : null)}
                                        />
                                        <Label htmlFor="edit_has_description">Has Description</Label>
                                    </div>
                                </div>

                                {/* Conditional Fields */}
                                {editForm?.has_image && (
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="edit_image_url">Image URL</Label>
                                            <Input
                                                id="edit_image_url"
                                                value={editForm?.image_url || ""}
                                                onChange={(e) => setEditForm(prev => prev ? { ...prev, image_url: e.target.value } : null)}
                                                placeholder="Image URL"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="edit_image_type">Image Type</Label>
                                            <Input
                                                id="edit_image_type"
                                                value={editForm?.image_type || ""}
                                                onChange={(e) => setEditForm(prev => prev ? { ...prev, image_type: e.target.value } : null)}
                                                placeholder="Image Type"
                                            />
                                        </div>
                                    </div>
                                )}

                                {editForm?.has_description && (
                                    <div className="space-y-2">
                                        <Label htmlFor="edit_description_content">Description Content</Label>
                                        <Textarea
                                            id="edit_description_content"
                                            value={editForm?.description_content || ""}
                                            onChange={(e) => setEditForm(prev => prev ? { ...prev, description_content: e.target.value } : null)}
                                            placeholder="Description Content"
                                            rows={4}
                                        />
                                    </div>
                                )}

                                {/* Question Content */}
                                <div className="space-y-2">
                                    <Label htmlFor="edit_question">Question</Label>
                                    <Textarea
                                        id="edit_question"
                                        value={editForm?.question || ""}
                                        onChange={(e) => setEditForm(prev => prev ? { ...prev, question: e.target.value } : null)}
                                        placeholder="Question content"
                                        rows={6}
                                    />
                                </div>

                                {/* Action Buttons */}
                                <div className="flex justify-end gap-2 pt-4">
                                    <Button
                                        variant="outline"
                                        onClick={handleCancelEdit}
                                        disabled={editLoading}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleSaveEdit}
                                        disabled={editLoading}
                                    >
                                        {editLoading ? "Saving..." : "Save Changes"}
                                    </Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
        </ProtectedRoute>
    );
}
