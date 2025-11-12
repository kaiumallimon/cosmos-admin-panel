'use client'

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { FrostedHeader } from "@/components/custom/frosted-header";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
    Pagination, 
    PaginationContent, 
    PaginationEllipsis, 
    PaginationItem, 
    PaginationLink, 
    PaginationNext, 
    PaginationPrevious 
} from "@/components/ui/pagination";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { MoreVertical, Edit, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { JetBrains_Mono } from "next/font/google";

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
    const [page, setPage] = useState<number>(1);
    const [totalPages, setTotalPages] = useState<number>(0);
    const [totalQuestions, setTotalQuestions] = useState<number>(0);
    
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

    const fetchQuestions = async (pageNum: number = 1) => {
        if (!course_code || !exam_type || !semester_term) {
            setError("Missing required parameters");
            return;
        }

        try {
            setLoading(true);

            const response = await fetch(
                `/api/questions?course_code=${course_code}&exam_type=${exam_type}&semester_term=${semester_term}&page=${pageNum}&limit=10`
            );
            const data = await response.json();

            console.log(`Page ${pageNum} response:`, data);

            if (response.ok) {
                setQuestions(data.data || []);
                setTotalPages(data.pagination?.totalPages || 0);
                setTotalQuestions(data.pagination?.total || 0);
                setError(null);

                console.log('Pagination info:', data.pagination);
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

    // Pagination navigation functions
    const goToPage = (pageNum: number) => {
        if (pageNum >= 1 && pageNum <= totalPages && pageNum !== page) {
            setPage(pageNum);
            fetchQuestions(pageNum);
        }
    };

    const goToPreviousPage = () => {
        if (page > 1) {
            const prevPage = page - 1;
            setPage(prevPage);
            fetchQuestions(prevPage);
        }
    };

    const goToNextPage = () => {
        if (page < totalPages) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchQuestions(nextPage);
        }
    };

    useEffect(() => {
        setPage(1);
        setQuestions([]);
        fetchQuestions(1);
    }, [course_code, exam_type, semester_term]);

    // Refetch when page changes (for direct page navigation)
    useEffect(() => {
        if (page > 1) {
            fetchQuestions(page);
        }
    }, [page]);

    // Delete question function
    const handleDelete = async (questionId: number) => {
        const questionToDelete = questions.find(q => q.id === questionId);
        const confirmMessage = `Are you sure you want to delete this question?\n\nQ${questionToDelete?.question_number}${questionToDelete?.sub_question ? `.${questionToDelete.sub_question}` : ""}\n\nThis action cannot be undone.`;
        
        if (!confirm(confirmMessage)) {
            return;
        }

        try {
            const response = await fetch(`/api/questions/${questionId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                // Update local state by removing the deleted question
                setQuestions(prev => prev.filter(q => q.id !== questionId));
                setTotalQuestions(prev => prev - 1);
                
                // If current page becomes empty and it's not the first page, go to previous page
                if (questions.length === 1 && page > 1) {
                    const prevPage = page - 1;
                    setPage(prevPage);
                    fetchQuestions(prevPage);
                } else if (questions.length === 1 && page === 1) {
                    // If we're on the first page and it becomes empty, just refresh
                    fetchQuestions(1);
                }
                
                console.log("Question deleted successfully");
            } else {
                const errorData = await response.json();
                alert(`Failed to delete question: ${errorData.error}`);
            }
        } catch (error) {
            console.error("Delete error:", error);
            alert("An error occurred while deleting the question");
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
                    onMobileMenuToggle={() => { }}
                />

                <div className="p-6">
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
                        questions.map((question) => (
                            <Card
                                key={question.id}
                                className="mt-4 border border-border shadow-sm hover:shadow-md transition"
                            >
                                <CardContent className="p-5 space-y-4">
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
                                        <div className="mt-2 p-4 bg-muted rounded-md">
                                            <strong className="block mb-1">Description:</strong>
                                            <div className="prose dark:prose-invert text-sm max-w-none">
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

                    {/* Pagination Controls */}
                    {!loading && !error && questions.length > 0 && totalPages > 1 && (
                        <div className="mt-8 flex flex-col items-center space-y-4">
                            {/* Pagination Info */}
                            <div className="text-sm text-gray-500 text-center">
                                Showing page {page} of {totalPages} ({totalQuestions} total questions)
                            </div>
                            
                            {/* Pagination Component */}
                            <Pagination>
                                <PaginationContent>
                                    <PaginationItem>
                                        <PaginationPrevious 
                                            onClick={goToPreviousPage}
                                            className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                        />
                                    </PaginationItem>
                                    
                                    {/* Page Numbers */}
                                    {(() => {
                                        const pages = [];
                                        const maxVisiblePages = 5;
                                        let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
                                        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
                                        
                                        // Adjust start page if we're near the end
                                        if (endPage - startPage + 1 < maxVisiblePages) {
                                            startPage = Math.max(1, endPage - maxVisiblePages + 1);
                                        }
                                        
                                        // First page + ellipsis
                                        if (startPage > 1) {
                                            pages.push(
                                                <PaginationItem key={1}>
                                                    <PaginationLink onClick={() => goToPage(1)} className="cursor-pointer">
                                                        1
                                                    </PaginationLink>
                                                </PaginationItem>
                                            );
                                            if (startPage > 2) {
                                                pages.push(
                                                    <PaginationItem key="ellipsis-start">
                                                        <PaginationEllipsis />
                                                    </PaginationItem>
                                                );
                                            }
                                        }
                                        
                                        // Visible page range
                                        for (let i = startPage; i <= endPage; i++) {
                                            pages.push(
                                                <PaginationItem key={i}>
                                                    <PaginationLink 
                                                        onClick={() => goToPage(i)}
                                                        isActive={i === page}
                                                        className="cursor-pointer"
                                                    >
                                                        {i}
                                                    </PaginationLink>
                                                </PaginationItem>
                                            );
                                        }
                                        
                                        // Last page + ellipsis
                                        if (endPage < totalPages) {
                                            if (endPage < totalPages - 1) {
                                                pages.push(
                                                    <PaginationItem key="ellipsis-end">
                                                        <PaginationEllipsis />
                                                    </PaginationItem>
                                                );
                                            }
                                            pages.push(
                                                <PaginationItem key={totalPages}>
                                                    <PaginationLink onClick={() => goToPage(totalPages)} className="cursor-pointer">
                                                        {totalPages}
                                                    </PaginationLink>
                                                </PaginationItem>
                                            );
                                        }
                                        
                                        return pages;
                                    })()}
                                    
                                    <PaginationItem>
                                        <PaginationNext 
                                            onClick={goToNextPage}
                                            className={page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                        />
                                    </PaginationItem>
                                </PaginationContent>
                            </Pagination>
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
