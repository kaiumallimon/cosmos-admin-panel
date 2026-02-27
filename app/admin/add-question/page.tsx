'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import { FrostedHeader } from "@/components/custom/frosted-header";
import { useMobileMenu } from "@/components/mobile-menu-context";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogClose,
} from "@/components/ui/dialog";
import {
    Breadcrumb,
    BreadcrumbList,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbPage,
    BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import { PlusIcon, UploadIcon } from "lucide-react";
import Link from "next/link";

const LOCAL_STORAGE_KEY = "cosmosFormData";

export default function AddQuestionPage() {
    const { toggleMobileMenu } = useMobileMenu();
    const [formData, setFormData] = useState({
        course_title: "",
        short: "",
        course_code: "",
        semester_term: "",
        exam_type: "",
        question_number: "",
        sub_question: "",
        marks: 0,
        total_question_mark: 0,
        contribution_percentage: 0,
        has_image: false,
        image_url: "",
        image_type: "",
        has_description: false,
        description_content: "",
        question: "",
        pdf_url: "",
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);

    const router = useRouter();

    // Initialize form data
    useEffect(() => {
        const initializeApp = () => {
            try {
                // Load saved form data
                const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
                if (savedData) {
                    setFormData(JSON.parse(savedData));
                }
                setIsInitialized(true);
            } catch (error) {
                console.error("Initialization error:", error);
                setIsInitialized(true);
            }
        };

        initializeApp();
    }, []);

    // Save form data to localStorage whenever it changes
    const handleChange = (field: keyof typeof formData, value: any) => {
        setFormData((prev) => {
            const updated = { ...prev, [field]: value };
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
            return updated;
        });
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/questions/upload", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Failed to submit question");

            toast.success(`Question submitted! Vector ID: ${data.id}`);
            console.log("Submitted:", data);

            if (data.id) {
                setIsConfirmationOpen(true);
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Submission failed");
            setIsDialogOpen(true);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmationOkay = () => {
        const updatedFormData = {
            ...formData,
            // Clear only specific fields after successful submission
            sub_question: "",
            marks: 0,
            question: "",
            // Clear image fields if they were used
            has_image: false,
            image_url: "",
            image_type: "",
            // Clear description fields if they were used
            has_description: false,
            description_content: "",
        };
        
        setFormData(updatedFormData);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedFormData));
        setIsConfirmationOpen(false);
    };

    // Show loading while initializing
    if (!isInitialized) {
        return (
            <ProtectedRoute>
                <>
                    <FrostedHeader title="Add Question" onMobileMenuToggle={toggleMobileMenu} />
                    <div className="p-6">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                            <p className="text-muted-foreground text-lg">Loading application...</p>
                        </div>
                    </div>
                </>
            </ProtectedRoute>
        );
    }



    return (
        <ProtectedRoute>
            <>
                <FrostedHeader title="Add Question" onMobileMenuToggle={toggleMobileMenu} />
                <div className="p-6">
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/admin">Dashboard</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/admin/add-question">Add Question</BreadcrumbLink>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>

                    {/* Form */}
                    <Card className="p-6 mt-8 border md:border-none shadow-sm md:shadow-none hover:shadow-sm hover:md:shadow-none transition-all  duration-300">
                        
                        <p>Fill up the following fields</p>
                        
                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                            {/* Course Title */}
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="course_title">Course Title</Label>
                                <Input
                                    id="course_title"
                                    value={formData.course_title}
                                    onChange={(e) => handleChange("course_title", e.target.value)}
                                    className="text-sm"
                                    placeholder="e.g., Structured Programming Language"
                                />
                            </div>

                            {/* Short */}
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="short">Short</Label>
                                <Input
                                    id="short"
                                    value={formData.short}
                                    onChange={(e) => handleChange("short", e.target.value)}
                                    className="text-sm"
                                    placeholder="e.g., spl"
                                />
                            </div>

                            {/* Course Code */}
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="course_code">Course Code</Label>
                                <Input
                                    id="course_code"
                                    value={formData.course_code}
                                    onChange={(e) => handleChange("course_code", e.target.value)}
                                    className="text-sm"
                                    placeholder="e.g., CSE-1111"
                                />
                            </div>

                            {/* Semester Term */}
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="semester_term">Semester Term</Label>
                                <Input
                                    id="semester_term"
                                    value={formData.semester_term}
                                    onChange={(e) => handleChange("semester_term", e.target.value)}
                                    className="text-sm"
                                    placeholder="e.g., 221"
                                />
                            </div>

                            {/* Exam Type */}
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="exam_type">Exam Type</Label>
                                <Input
                                    id="exam_type"
                                    value={formData.exam_type}
                                    onChange={(e) => handleChange("exam_type", e.target.value)}
                                    className="text-sm"
                                    placeholder="e.g., mid"
                                />
                            </div>

                            {/* Question Number */}
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="question_number">Question Number</Label>
                                <Input
                                    id="question_number"
                                    value={formData.question_number}
                                    onChange={(e) => handleChange("question_number", e.target.value)}
                                    className="text-sm"
                                    placeholder="e.g., 1"
                                />
                            </div>

                            {/* Sub Question */}
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="sub_question">Sub Question</Label>
                                <Input
                                    id="sub_question"
                                    value={formData.sub_question}
                                    onChange={(e) => handleChange("sub_question", e.target.value)}
                                    className="text-sm"
                                    placeholder="e.g., a"
                                />
                            </div>

                            {/* Marks */}
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="marks">Marks</Label>
                                <Input
                                    type="number"
                                    id="marks"
                                    value={formData.marks}
                                    onChange={(e) => handleChange("marks", Number(e.target.value))}
                                    className="text-sm"
                                />
                            </div>

                            {/* Total Question Mark */}
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="total_question_mark">Total Question Mark</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    id="total_question_mark"
                                    className="text-sm"
                                    value={formData.total_question_mark}
                                    onChange={(e) => handleChange("total_question_mark", parseFloat(e.target.value) || 0)}
                                />
                            </div>



                            {/* Question */}
                            <div className="md:col-span-2 flex flex-col gap-2">
                                <Label htmlFor="question">Question</Label>
                                <Textarea
                                    id="question"
                                    value={formData.question}
                                    onChange={(e) => handleChange("question", e.target.value)}
                                    className="min-h-[100px] sm:min-h-[120px] text-sm"
                                    placeholder="e.g., What is structured programming?"
                                />
                            </div>

                            {/* PDF URL */}
                            <div className="md:col-span-2 flex flex-col gap-2">
                                <Label htmlFor="pdf_url">PDF URL</Label>
                                <Input
                                    id="pdf_url"
                                    value={formData.pdf_url}
                                    onChange={(e) => handleChange("pdf_url", e.target.value)}
                                    className="text-sm"
                                    placeholder="e.g., https://example.com/question.pdf"
                                />
                            </div>

                            {/* Has Image */}
                            <div className="md:col-span-2 flex items-center gap-4">
                                <Switch
                                    id="has_image"
                                    checked={formData.has_image}
                                    className="text-sm"
                                    onCheckedChange={(checked) => handleChange("has_image", checked)}
                                />
                                <Label htmlFor="has_image">Has Image</Label>
                            </div>

                            {/* Conditionally show Image URL & Type */}
                            {formData.has_image && (
                                <>
                                    <div className="md:col-span-2 flex flex-col gap-2">
                                        <Label htmlFor="image_url">Image URL</Label>
                                        <Input
                                            id="image_url"
                                            value={formData.image_url}
                                            className="text-sm"
                                            onChange={(e) => handleChange("image_url", e.target.value)}
                                            placeholder="e.g., https://example.com/image.png"
                                        />
                                    </div>

                                    <div className="md:col-span-2 flex flex-col gap-2">
                                        <Label htmlFor="image_type">Image Type</Label>
                                        <Input
                                            id="image_type"
                                            value={formData.image_type}
                                            className="text-sm"
                                            onChange={(e) => handleChange("image_type", e.target.value)}
                                            placeholder="e.g., table, diagram, code"
                                        />
                                    </div>
                                </>
                            )}

                            {/* Has Description */}
                            <div className="md:col-span-2 flex items-center gap-4">
                                <Switch
                                    id="has_description"
                                    className="text-sm"
                                    checked={formData.has_description}
                                    onCheckedChange={(checked) => handleChange("has_description", checked)}
                                    />
                                <Label htmlFor="has_description">Has Description</Label>
                            </div>

                            {/* Conditionally show Description Content */}
                            {formData.has_description && (
                                <div className="md:col-span-2 flex flex-col gap-2">
                                    <Label htmlFor="description_content">Description</Label>
                                    <Textarea
                                        id="description_content"
                                        className="text-sm"
                                        value={formData.description_content}
                                        onChange={(e) => handleChange("description_content", e.target.value)}
                                        placeholder="e.g., Follow the question carefully and provide detailed answers.."
                                    />
                                </div>
                            )}

                            {/* Submit Button */}
                            <div className="md:col-span-2 flex justify-end mt-4 sm:mt-6">
                                <Button type="submit" disabled={loading} className="w-full sm:w-auto px-6 py-2 sm:py-3">
                                    <PlusIcon className="h-4 w-4 mr-2" />
                                    {loading ? "Submitting..." : "Submit Question"}
                                </Button>
                            </div>
                        </form>
                    </Card>

                </div>
            </>
        </ProtectedRoute>
    );
}