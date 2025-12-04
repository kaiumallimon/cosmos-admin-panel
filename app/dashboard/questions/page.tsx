'use client';

import { FrostedHeader } from "@/components/custom/frosted-header";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Card, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator 
} from "@/components/ui/breadcrumb";
import { BookOpen, HelpCircle } from "lucide-react";
import { useMobileMenu } from "@/components/mobile-menu-context";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { StatsCard } from "@/components/dashboard/stats-card";
import { makeAuthenticatedRequest } from "@/lib/api-helpers";

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

        const dashboardRes = await makeAuthenticatedRequest(`/api/dashboard/questions/stats`);

        console.log('Dashboard API response status:', dashboardRes.status, dashboardRes.statusText);

        if (!dashboardRes.ok) {
          const errorText = await dashboardRes.text();
          console.error('Dashboard API error response:', errorText);
          throw new Error(`Failed to fetch dashboard data: ${dashboardRes.status} ${errorText}`);
        }

        const dashboardData = await dashboardRes.json();
        console.log('Dashboard API response data:', dashboardData);

        setCourses(dashboardData.data.courses || []);
        setTotalQuestions(dashboardData.data.totalQuestions || 0);
      } catch (err) {
        console.error(err);
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  function toTitleCase(str: string) {
    return str
      .split(" ")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }

  function toUpperCase(str: string | undefined) {
    return str ? str.toUpperCase() : '';
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background">
          {/* Header */}
          <Skeleton className="h-20 w-full mb-6" />

          {/* Breadcrumbs */}
          <div className="p-6 pb-0">
            <Skeleton className="h-5 w-48 mb-2" />
            <Skeleton className="h-5 w-36" />
          </div>

          {/* Top Cards */}
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
            {[0, 1].map((_, i) => (
              <Card key={i} className="bg-white dark:bg-card shadow rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Skeleton className="h-6 w-6 rounded-full" />
                  <Skeleton className="h-6 w-32" />
                </div>
                <Skeleton className="h-8 w-20" />
              </Card>
            ))}
          </div>

          {/* Courses */}
          <div className="p-6 mb-20">
            <Skeleton className="h-8 w-64 mb-4" />
            <div className="space-y-3">
              {Array(5)
                .fill(0)
                .map((_, idx) => (
                  <Card key={idx} className="p-4 bg-white dark:bg-card shadow rounded-lg">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-5 w-48" />
                    </div>
                  </Card>
                ))}
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error) return <p className="p-6 text-red-500">{error}</p>;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        {/* header  */}
        <FrostedHeader title="Questions" onMobileMenuToggle={toggleMobileMenu} />
        
        {/* breadcrumbs */}
        <div className="p-6 pb-0">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Questions</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        
        {/* top cards  */}
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
          
          {/* total courses card */}
          <StatsCard
          title="Total Courses"
          icon={BookOpen}
          value={courses.length}/>
          
          {/* active questions card */}
          <StatsCard
          title="Active Questions"
          icon={HelpCircle}
          value={totalQuestions}/>
        </div>

        {/* courses */}
        <div className="p-6 mb-20">
          <h2 className="text-xl md:text-2xl font-bold">Available Course Questions </h2>
          {courses.map((course)=>(
            <Card key={course.course_code} 
              className="mt-3 cursor-pointer hover:border-primary transition-colors duration-300"
              onClick={()=>router.push("/dashboard/questions/" + course.course_code)}>
              <CardHeader>
                <h1 className="opacity-75">{course.course_code}</h1>
                <h1 className="font-bold text-base">{toTitleCase(course.course_title)}{course.short ? ` (${toUpperCase(course.short)})` : ''}</h1>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </ProtectedRoute>
  );
}
