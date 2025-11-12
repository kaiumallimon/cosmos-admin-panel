"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { FrostedHeader } from "@/components/custom/frosted-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ProtectedRoute from "@/components/ProtectedRoute";

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

export default function EditQuestionPage() {
    const router = useRouter();
    const { id } = useParams();
    const [form, setForm] = useState<QuestionsModel | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Skeleton components
    const SkeletonInput = () => <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded animate-pulse w-full" />;
    const SkeletonTextarea = () => <div className="h-20 bg-gray-200 dark:bg-gray-800 rounded animate-pulse w-full" />;

    useEffect(() => {
        async function loadQuestion() {
            try {
                setLoading(true);
                const res = await fetch(`/api/questions/${id}`, { cache: "no-store" });
                
                if (!res.ok) {
                    throw new Error(`Failed to load question: ${res.statusText}`);
                }
                
                const data = await res.json();
                setForm(data);
                setError(null);
            } catch (err: any) {
                console.error("Load question error:", err);
                setError(err.message || "Failed to load question");
            } finally {
                setLoading(false);
            }
        }
        
        if (id) {
            loadQuestion();
        }
    }, [id]);

    async function handleSave() {
        if (!form) return;
        
        setSaving(true);
        setError(null);
        
        try {
            const res = await fetch(`/api/questions/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Update failed");
            }
            
            // Successfully saved, close the tab/window
            alert("Question updated successfully!");
            window.close();
        } catch (err: any) {
            console.error("Save error:", err);
            setError(err.message || "Update failed");
        } finally {
            setSaving(false);
        }
    }

    if (error && !form) {
        return (
            <ProtectedRoute>
                <div className="min-h-screen bg-background">
                    <FrostedHeader title="Edit Question" onMobileMenuToggle={() => {}} />
                    <div className="p-6">
                        <p className="text-red-500 p-4">{error}</p>
                        <Button onClick={() => router.back()}>Go Back</Button>
                    </div>
                </div>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-background">
                <FrostedHeader title="Edit Question" onMobileMenuToggle={() => {}} />

                <div className="max-w-4xl mx-auto p-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span>Edit Question {form?.question_number || ""}</span>
                                <div className="flex gap-2">
                                    <Button onClick={handleSave} disabled={loading || saving}>
                                        {saving ? "Saving..." : "Save Changes"}
                                    </Button>
                                    <Button variant="outline" onClick={() => window.close()} disabled={saving}>
                                        Cancel
                                    </Button>
                                </div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {error && (
                                <div className="p-3 text-red-600 bg-red-50 dark:bg-red-950 rounded border border-red-200 dark:border-red-800">
                                    {error}
                                </div>
                            )}

                            {/* Basic Information */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="course_title">Course Title</Label>
                                    {loading ? (
                                        <SkeletonInput />
                                    ) : (
                                        <Input
                                            id="course_title"
                                            value={form?.course_title || ""}
                                            onChange={(e) => setForm(prev => prev ? { ...prev, course_title: e.target.value } : null)}
                                            placeholder="Course Title"
                                        />
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="course_code">Course Code</Label>
                                    {loading ? (
                                        <SkeletonInput />
                                    ) : (
                                        <Input
                                            id="course_code"
                                            value={form?.course_code || ""}
                                            onChange={(e) => setForm(prev => prev ? { ...prev, course_code: e.target.value } : null)}
                                            placeholder="Course Code"
                                        />
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="short">Short Name</Label>
                                    {loading ? (
                                        <SkeletonInput />
                                    ) : (
                                        <Input
                                            id="short"
                                            value={form?.short || ""}
                                            onChange={(e) => setForm(prev => prev ? { ...prev, short: e.target.value } : null)}
                                            placeholder="Short Name"
                                        />
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="semester_term">Semester Term</Label>
                                    {loading ? (
                                        <SkeletonInput />
                                    ) : (
                                        <Input
                                            id="semester_term"
                                            value={form?.semester_term || ""}
                                            onChange={(e) => setForm(prev => prev ? { ...prev, semester_term: e.target.value } : null)}
                                            placeholder="Semester Term"
                                        />
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="exam_type">Exam Type</Label>
                                    {loading ? (
                                        <SkeletonInput />
                                    ) : (
                                        <Input
                                            id="exam_type"
                                            value={form?.exam_type || ""}
                                            onChange={(e) => setForm(prev => prev ? { ...prev, exam_type: e.target.value } : null)}
                                            placeholder="Exam Type"
                                        />
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="question_number">Question Number</Label>
                                    {loading ? (
                                        <SkeletonInput />
                                    ) : (
                                        <Input
                                            id="question_number"
                                            value={form?.question_number || ""}
                                            onChange={(e) => setForm(prev => prev ? { ...prev, question_number: e.target.value } : null)}
                                            placeholder="Question Number"
                                        />
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="sub_question">Sub Question</Label>
                                    {loading ? (
                                        <SkeletonInput />
                                    ) : (
                                        <Input
                                            id="sub_question"
                                            value={form?.sub_question || ""}
                                            onChange={(e) => setForm(prev => prev ? { ...prev, sub_question: e.target.value } : null)}
                                            placeholder="Sub Question"
                                        />
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="marks">Marks</Label>
                                    {loading ? (
                                        <SkeletonInput />
                                    ) : (
                                        <Input
                                            id="marks"
                                            type="number"
                                            value={form?.marks || ""}
                                            onChange={(e) => setForm(prev => prev ? { ...prev, marks: Number(e.target.value) } : null)}
                                            placeholder="Marks"
                                        />
                                    )}
                                </div>
                            </div>

                            {/* Switches */}
                            <div className="space-y-4">
                                <div className="flex items-center space-x-2">
                                    {loading ? (
                                        <SkeletonInput />
                                    ) : (
                                        <>
                                            <Switch
                                                id="has_image"
                                                checked={!!form?.has_image}
                                                onCheckedChange={(val) => setForm(prev => prev ? { ...prev, has_image: val } : null)}
                                            />
                                            <Label htmlFor="has_image">Has Image</Label>
                                        </>
                                    )}
                                </div>

                                <div className="flex items-center space-x-2">
                                    {loading ? (
                                        <SkeletonInput />
                                    ) : (
                                        <>
                                            <Switch
                                                id="has_description"
                                                checked={!!form?.has_description}
                                                onCheckedChange={(val) => setForm(prev => prev ? { ...prev, has_description: val } : null)}
                                            />
                                            <Label htmlFor="has_description">Has Description</Label>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Conditional Fields */}
                            {form?.has_image && (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="image_url">Image URL</Label>
                                        <Input
                                            id="image_url"
                                            value={form?.image_url || ""}
                                            onChange={(e) => setForm(prev => prev ? { ...prev, image_url: e.target.value } : null)}
                                            placeholder="Image URL"
                                        />
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label htmlFor="image_type">Image Type</Label>
                                        <Input
                                            id="image_type"
                                            value={form?.image_type || ""}
                                            onChange={(e) => setForm(prev => prev ? { ...prev, image_type: e.target.value } : null)}
                                            placeholder="Image Type"
                                        />
                                    </div>
                                </div>
                            )}

                            {form?.has_description && (
                                <div className="space-y-2">
                                    <Label htmlFor="description_content">Description Content</Label>
                                    {loading ? (
                                        <SkeletonTextarea />
                                    ) : (
                                        <Textarea
                                            id="description_content"
                                            value={form?.description_content || ""}
                                            onChange={(e) => setForm(prev => prev ? { ...prev, description_content: e.target.value } : null)}
                                            placeholder="Description Content"
                                            rows={4}
                                        />
                                    )}
                                </div>
                            )}

                            {/* Question Content */}
                            <div className="space-y-2">
                                <Label htmlFor="question">Question</Label>
                                {loading ? (
                                    <SkeletonTextarea />
                                ) : (
                                    <Textarea
                                        id="question"
                                        value={form?.question || ""}
                                        onChange={(e) => setForm(prev => prev ? { ...prev, question: e.target.value } : null)}
                                        placeholder="Question content"
                                        rows={6}
                                    />
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </ProtectedRoute>
    );
}