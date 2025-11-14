'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import ProtectedRoute from "@/components/ProtectedRoute";
import { FrostedHeader } from "@/components/custom/frosted-header";
import { useMobileMenu } from "@/components/mobile-menu-context";

import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Code2Icon } from "lucide-react";

export default function EmbeddingsCoursePage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const { toggleMobileMenu } = useMobileMenu();

  // ─────────────────────────────────────────────
  // Fetch Courses
  // ─────────────────────────────────────────────
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        const res = await fetch(`/api/courses`);
        if (!res.ok) {
          const err = await res.json().catch(() => null);
          throw new Error(err?.error ?? res.statusText);
        }

        const json = await res.json();
        setCourses(json.data || []);
      } catch (err) {
        console.error(err);
        setError("Failed to load courses");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Helper
  const toTitleCase = (str: string) =>
    str
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");

  // ─────────────────────────────────────────────
  // Skeleton Loading State
  // ─────────────────────────────────────────────
  const LoadingState = () => (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header Skeleton */}
      <div className="p-6">
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-80" />
      </div>

      {/* Breadcrumb Skeleton */}
      <div className="px-6 pb-4 flex items-center gap-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-4 rounded-full" />
        <Skeleton className="h-4 w-32" />
      </div>

      {/* Stats Skeleton */}
      <div className="px-6 grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-6 w-32" />
          </Card>
        ))}
      </div>

      {/* Action Bar Skeleton */}
      <div className="px-6 mb-4 flex justify-between items-center">
        <Skeleton className="h-6 w-72" />
        <Skeleton className="h-10 w-28 rounded-md" />
      </div>

      {/* Course List Skeleton */}
      <main className="grow px-6 grid grid-cols-1 gap-4">
        {[1, 2, 3].map((n) => (
          <Card key={n} className="p-4">
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-6 w-40" />
          </Card>
        ))}
      </main>
    </div>
  );

  // ─────────────────────────────────────────────
  // Main UI
  // ─────────────────────────────────────────────

  if (loading) {
    return (
      <ProtectedRoute>
        <LoadingState />
      </ProtectedRoute>
    );
  }

  if (error) {
    return <p className="p-6 text-red-500">{error}</p>;
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background flex flex-col">

        {/* ───────── HEADER ───────── */}
        <FrostedHeader
          title="Embeddings Update – Course Selection"
          subtitle="Select a course to regenerate question embeddings."
          onMobileMenuToggle={toggleMobileMenu}
        />

        <main className="grow p-6">

          {/* ───────── BREADCRUMB ───────── */}
          <Breadcrumb className="mb-6">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Update Embeddings</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* ───────── STATS CARDS — NEW ───────── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader>
                <p className="text-sm text-muted-foreground">Total Courses</p>
                <p className="text-2xl font-semibold">{courses.length}</p>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <p className="text-sm text-muted-foreground">Embeddable Questions</p>
                <p className="text-2xl font-semibold">—</p>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <p className="text-sm text-muted-foreground">Pending Updates</p>
                <p className="text-2xl font-semibold">—</p>
              </CardHeader>
            </Card>
          </div>

          {/* ───────── ACTION BAR ───────── */}
          <div className="flex items-center justify-between my-6">
            <p className="font-semibold text-lg">
              Embed All Available Questions (one click embed)
            </p>

            <Button>
              <Code2Icon className="mr-2" />
              Embed All
            </Button>
          </div>

          {/* ───────── COURSE LIST ───────── */}
          <div className="grid grid-cols-1 gap-4">
            {courses.map((course) => (
              <Card
                key={course.course_code}
                onClick={() =>
                  router.push("/dashboard/update-embeddings/" + course.course_code)
                }
                className="cursor-pointer hover:border-primary transition-all"
              >
                <CardHeader>
                  <p className="text-muted-foreground">{course.course_code}</p>
                  <p className="font-semibold">
                    {toTitleCase(course.course_title)}
                  </p>
                </CardHeader>
              </Card>
            ))}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
