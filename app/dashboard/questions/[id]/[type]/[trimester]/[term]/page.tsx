'use client'

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { FrostedHeader } from "@/components/custom/frosted-header";
import { Card, CardContent } from "@/components/ui/card";

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
    created_at?: string | null;
    vector_id?: string | null;
    pdf_url?: string | null;
}

export default function QuestionsPage() {
    const [questions, setQuestions] = useState<QuestionsModel[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const params = useParams();
    const course_code = params.id;
    const exam_type = params.type;
    const trimester_type = params.trimester;
    const semester_term = params.term;

    useEffect(() => {
        async function fetchQuestions() {
            if (!course_code || !exam_type || !semester_term) {
                setError('Missing required parameters');
                return;
            }

            try {
                setLoading(true);
                const response = await fetch(`/api/questions?course_code=${course_code}&exam_type=${exam_type}&semester_term=${semester_term}`);
                const data = await response.json();

                if (response.ok) {
                    setQuestions(data.data || []);
                    setError(null);
                } else {
                    setError(data.error || 'Failed to fetch questions');
                }
            } catch (error) {
                console.error('Fetch error:', error);
                setError('An unexpected error occurred');
            } finally {
                setLoading(false);
            }
        }

        fetchQuestions();
    }, [course_code, exam_type, semester_term]);

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-background">
                <FrostedHeader
                    title={`Questions for ${course_code} - ${exam_type} - ${trimester_type} ${semester_term}`}
                    onMobileMenuToggle={() => {}}
                />

                <div className="p-6">
                    {loading && (
                        <div className="flex items-center justify-center p-8">
                            <p>Loading questions...</p>
                        </div>
                    )}
                    
                    {error && (
                        <div className="flex items-center justify-center p-8">
                            <p className="text-red-500">Error: {error}</p>
                        </div>
                    )}
                    
                    {!loading && !error && questions.length === 0 && (
                        <div className="flex items-center justify-center p-8">
                            <p className="text-gray-500">No questions found for this course and term.</p>
                        </div>
                    )}

                    {!loading && !error && questions.map((question) => (
                        <Card key={question.id} className="mt-3">
                            <CardContent className="p-4">
                                <h3 className="text-lg font-semibold">
                                    Q{question.question_number}
                                    {question.sub_question ? `.${question.sub_question}` : ""}
                                    {question.marks && ` (${question.marks} marks)`}
                                </h3>

                                <p className="mt-2 whitespace-pre-wrap">{question.question}</p>

                                {question.has_description && question.description_content && (
                                    <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded">
                                        <strong>Description:</strong>
                                        <p className="whitespace-pre-wrap">{question.description_content}</p>
                                    </div>
                                )}

                                {question.has_image && question.image_url && (
                                    <div className="mt-2">
                                        <img
                                            src={question.image_url}
                                            alt={question.image_type ?? "Question image"}
                                            className="max-w-full rounded border"
                                        />
                                    </div>
                                )}

                                <div className="mt-2 text-sm text-gray-500">
                                    Course: {question.course_title} | Code: {question.course_code} | Term: {question.semester_term}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </ProtectedRoute>
    );
}