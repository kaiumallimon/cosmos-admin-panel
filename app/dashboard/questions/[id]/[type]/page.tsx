'use client'

import { FrostedHeader } from "@/components/custom/frosted-header";
import { useMobileMenu } from "@/components/mobile-menu-context";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Card, CardContent } from "@/components/ui/card";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function QuestionsTypePage(){
    const params = useParams();
    const courseId = params.id;
    const questionType = params.type;
    const router = useRouter();

    const { toggleMobileMenu } = useMobileMenu();

    const [trimesterTerms, setTrimesterTerms] = useState<string[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(()=>{
        async function fetchTrimesterTerms() {
            try {
                setLoading(true);
                const response = await fetch(`/api/questions/trimester-wise?term=${questionType}&course_code=${courseId}`);
                const data = await response.json();
                if (response.ok) {
                    setTrimesterTerms(data.semester_terms);
                    setError(null);
                } else {
                    setError(data.error || 'Failed to fetch trimester terms');
                }
            } catch (error) {
                setError('An unexpected error occurred');
            } finally {
                setLoading(false);
            }
        }

        fetchTrimesterTerms();
    }, []);

    function sanitizeType(type: any) {
        return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
    }
    
    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-background">
                <FrostedHeader title={`${courseId?.toString().replace("%20", "-")} ${sanitizeType(questionType)} Questions`} onMobileMenuToggle={()=>{toggleMobileMenu()}} />
                <div className="p-6">
                    {loading && (
                        <div className="flex items-center justify-center p-8">
                            <p>Loading available terms...</p>
                        </div>
                    )}
                    
                    {error && (
                        <div className="flex items-center justify-center p-8">
                            <p className="text-red-500">Error: {error}</p>
                        </div>
                    )}
                    
                    {!loading && !error && trimesterTerms.length === 0 && (
                        <div className="flex flex-col items-center justify-center p-8 text-center">
                            <h3 className="text-lg font-semibold mb-2">No Terms Available</h3>
                            <p className="text-muted-foreground mb-4">
                                No {questionType} questions found for course {courseId}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                This could mean:
                            </p>
                            <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                                <li>• No {questionType} exams have been uploaded for this course</li>
                                <li>• The exam type might be named differently in the database</li>
                                <li>• The course code might not match exactly</li>
                            </ul>
                        </div>
                    )}
                    
                    {!loading && !error && trimesterTerms.map(term => (
                        <Card key={term} 
                        className="mt-3 cursor-pointer hover:border-primary transition-colors duration-300"
                        onClick={() => {router.push(`/dashboard/questions/${courseId}/${questionType}/trimester/${term}`)}}
                        >
                            <CardContent>
                                <h3 className="text-lg font-semibold">Trimester {term}</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Browse questions for trimester {term}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </ProtectedRoute>
    );
}