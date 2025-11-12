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
                                        <p className="text-sm text-gray-500">
                                            {question.course_code} | {question.semester_term}
                                        </p>
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
                </div>
            </div>
        </ProtectedRoute>
    );
}
