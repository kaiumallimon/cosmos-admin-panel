'use client';

import { FrostedHeader } from "@/components/custom/frosted-header";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, HelpCircle } from "lucide-react";
import { useMobileMenu } from "@/components/mobile-menu-context";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function QuestionsCoursePage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toggleMobileMenu } = useMobileMenu();
  const router = useRouter();

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const [coursesRes, questionsRes] = await Promise.all([
          fetch(`/api/courses`),
          fetch(`/api/questions/count`),
        ]);

        if (!coursesRes.ok) {
          const errorData = await coursesRes.json().catch(() => ({}));
          throw new Error(`Failed to fetch courses: ${errorData.error || coursesRes.statusText}`);
        }

        if (!questionsRes.ok) {
          const errorData = await questionsRes.json().catch(() => ({}));
          throw new Error(`Failed to fetch questions count: ${errorData.error || questionsRes.statusText}`);
        }

        const coursesData = await coursesRes.json();
        const questionsData = await questionsRes.json();

        setCourses(coursesData.data || []);
        setTotalQuestions(questionsData.count || 0);
      } catch (err) {
        console.error(err);
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background">
          <FrostedHeader title="Questions" onMobileMenuToggle={toggleMobileMenu} />
          
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
            <Card className="bg-white dark:bg-card shadow rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <Skeleton className="h-6 w-24" />
              </div>
              <Skeleton className="h-8 w-16" />
            </Card>
            <Card className="bg-white dark:bg-card shadow rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <HelpCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <Skeleton className="h-6 w-28" />
              </div>
              <Skeleton className="h-8 w-20" />
            </Card>
          </div>
        </div>
      </ProtectedRoute>
    );
  }
  
  if (error) return <p className="p-6 text-red-500">{error}</p>;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <FrostedHeader title="Questions" onMobileMenuToggle={toggleMobileMenu} />

        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
          <Card className="bg-white dark:bg-card shadow rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-lg font-medium">Total Courses</h2>
            </div>
            <p className="text-3xl font-bold">{courses.length}</p>
          </Card>
          <Card className="bg-white dark:bg-card shadow rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <HelpCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-lg font-medium">Active Questions</h2>
            </div>
            <p className="text-3xl font-bold">{totalQuestions}</p>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
