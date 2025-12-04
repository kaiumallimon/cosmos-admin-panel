'use client';

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { FrostedHeader } from "@/components/custom/frosted-header";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, FileText, Clipboard, Calculator, Trophy } from "lucide-react";
import { useMobileMenu } from "@/components/mobile-menu-context";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from "@/components/ui/breadcrumb";

interface CourseStats {
  course_code: string;
  course_title: string;
  counts: {
    total: number;
    mid: number;
    final: number;
  };
}

interface UpsertStatus {
  success: boolean;
  message: string;
  vectorId: string;
  namespace: string;
}

interface UpdatedQuestion {
  id: number;
  vectorId: string;
  course_code: string;
  course_title: string;
  question_number: string;
  sub_question: string | null;
  exam_type: string;
  semester_term: string;
  namespace: string;
  vector_dimensions: number;
  upsert_status: UpsertStatus;
}

interface EmbeddingResponse {
  success: boolean;
  message: string;
  timestamp: string;
  total: number;
  updated: UpdatedQuestion[];
  failed: any[];
  course_code: string;
  summary: {
    total_processed: number;
    successful_upserts: number;
    failed_upserts: number;
    vector_errors: number;
    supabase_errors: number;
  };
}

export default function EmbeddCoursePage() {
  const params = useParams();
  const id = params.id as string;

  const [courseStats, setCourseStats] = useState<CourseStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [errorStats, setErrorStats] = useState<string | null>(null);

  const [embeddingStatus, setEmbeddingStatus] = useState<string>("");
  const [embeddingLoading, setEmbeddingLoading] = useState(false);
  const [embeddingSummary, setEmbeddingSummary] = useState<EmbeddingResponse | null>(null);

  const { toggleMobileMenu } = useMobileMenu();

  // Fetch course stats
  useEffect(() => {
    const fetchCourseStats = async () => {
      setLoadingStats(true);
      try {
        const res = await fetch(`/api/update-embeddings?course_code=${id}`);
        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          setErrorStats(errData?.error || "Failed to fetch course stats");
          return;
        }
        const data = await res.json();
        setCourseStats(data);
      } catch (err) {
        console.error("Fetch course stats error:", err);
        setErrorStats("Internal error while fetching course stats");
      } finally {
        setLoadingStats(false);
      }
    };
    fetchCourseStats();
  }, [id]);

  // Start embedding
  const startEmbedding = async () => {
    if (!courseStats) return;

    setEmbeddingLoading(true);
    setEmbeddingStatus("Initializing embedding...");
    setEmbeddingSummary(null);

    try {
      const res = await fetch(`/api/update-embeddings/${id}?course_code=${id}`, { method: "POST" });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        setEmbeddingStatus(errData?.error || "Failed to start embedding");
        setEmbeddingLoading(false);
        return;
      }

      const data: EmbeddingResponse = await res.json();

      if (!data.success) {
        setEmbeddingStatus("Embedding failed");
        setEmbeddingLoading(false);
        return;
      }

      // Animate embedding per question
      for (let i = 0; i < data.updated.length; i++) {
        const q = data.updated[i];
        setEmbeddingStatus(
          `Embedding Q${q.question_number}${q.sub_question ? q.sub_question : ""} (${i + 1}/${data.updated.length})...`
        );
        await new Promise((r) => setTimeout(r, 300)); // shimmer effect
      }

      setEmbeddingStatus("Embedding completed!");
      setEmbeddingSummary(data);
    } catch (err) {
      console.error("Embedding error:", err);
      setEmbeddingStatus("Error during embedding.");
    } finally {
      setEmbeddingLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background ">
        <FrostedHeader
          title={`Embedding Course: ${id}`}
          onMobileMenuToggle={toggleMobileMenu}
        />


        <div className="p-6">

          {/* ───────── BREADCRUMB ───────── */}
          <Breadcrumb className="mb-6">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard/update-embeddings">Update Embeddings</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{courseStats?.course_title}</BreadcrumbPage>
              </BreadcrumbItem>

            </BreadcrumbList>
          </Breadcrumb>

          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 my-6">
            {loadingStats
              ? [1, 2, 3].map((_, index) => (
                <Card key={index} className="p-4 sm:p-6 animate-pulse">
                  <div className="h-12 w-12 bg-primary/10 rounded-lg mb-2" />
                  <div className="h-4 bg-gray-200 rounded mb-1" />
                  <div className="h-6 bg-gray-200 rounded w-1/2" />
                </Card>
              ))
              : courseStats &&
              [
                { title: "Total Questions", value: courseStats.counts.total, icon: BookOpen, color: "text-blue-500" },
                { title: "Mid Questions", value: courseStats.counts.mid, icon: Calculator, color: "text-purple-500" },
                { title: "Final Questions", value: courseStats.counts.final, icon: Trophy, color: "text-green-500" },
              ].map((stat, index) => {
                const Icon = stat.icon; // assign to uppercase variable
                return (
                  <Card key={index} className="p-4 sm:p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                        <Icon className={`h-6 w-6 ${stat.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-muted-foreground">{stat.title}</p>
                        <p className="text-2xl font-bold mt-1">{stat.value}</p>
                      </div>
                    </div>
                  </Card>
                );
              })
            }
          </div>

          {/* Centered Embedding Card */}
          <Card className="w-full p-6 mt-8 bg-background flex flex-col items-center justify-center text-center hover:border-orange-500 transition-colors duration-300 hover:bg-orange-500/5">
            <p className="p-4 text-gray-800 dark:text-gray-200 text-sm md:text-base text-left">
              Update Embedding is a bulk operation that replaces existing embeddings for all questions in this course. This process may take several minutes depending on the number of questions. Please ensure you have a stable internet connection and do not navigate away from this page until the process is complete. Otherwise, you may need to restart the update process from the beginning.
            </p>

            <div className="flex flex-col items-center justify-center mt-4">
              <Button
                variant="default"
                className="mt-4"
                onClick={startEmbedding}
                disabled={embeddingLoading}
              >
                {embeddingLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Processing...
                  </span>
                ) : embeddingSummary ? (
                  "Re-Embed "
                ) : (
                  "Start Embedding"
                )}
              </Button>
            </div>

            {embeddingStatus && !embeddingLoading && (
              <div className="text-gray-800 dark:text-gray-200 mt-4">{embeddingStatus}</div>
            )}
          </Card>

          {/* Full-width Summary Cards */}
          {embeddingSummary && (
            <div className="mt-6 space-y-4">
              {/* Summary */}
              <Card className="w-full p-6 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md hover:border-orange-500 transition-colors duration-300 hover:bg-orange-500/5">
                <p className="font-semibold text-lg mb-2">Embedding Summary</p>
                <div className="grid grid-cols-2 gap-2 text-gray-700 dark:text-gray-300">
                  <p>Total Processed:</p>
                  <p className="font-semibold">{embeddingSummary.summary.total_processed}</p>
                  <p>Successful Upserts:</p>
                  <p className="font-semibold text-green-600 dark:text-green-400">{embeddingSummary.summary.successful_upserts}</p>
                  <p>Failed Upserts:</p>
                  <p className="font-semibold text-red-600 dark:text-red-400">{embeddingSummary.summary.failed_upserts}</p>
                  <p>Vector Errors:</p>
                  <p className="font-semibold">{embeddingSummary.summary.vector_errors}</p>
                  <p>Supabase Errors:</p>
                  <p className="font-semibold">{embeddingSummary.summary.supabase_errors}</p>
                </div>
              </Card>

              {/* Updated Questions */}
              {embeddingSummary.updated.length > 0 && (
                <Card className="w-full p-6 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md hover:border-orange-500 transition-colors duration-300 hover:bg-orange-500/5">
                  <p className="font-semibold text-lg mb-2">Updated Questions ({embeddingSummary.updated.length})</p>
                  <div className="space-y-2">
                    {embeddingSummary.updated.map((item, idx) => (
                      <div key={item.id} className="bg-gray-50 dark:bg-gray-800 rounded p-3 border border-gray-200 dark:border-gray-700">
                        <p className="font-semibold text-gray-800 dark:text-gray-200">
                          [{idx + 1}] Question {item.question_number}{item.sub_question ? `(${item.sub_question})` : ""} - {item.exam_type} - {item.semester_term}
                        </p>
                        <div className="mt-1 text-gray-600 dark:text-gray-400 text-xs space-y-1">
                          <p>ID: {item.id}</p>
                          <p>Vector ID: <span className="text-purple-600 dark:text-purple-400">{item.vectorId}</span></p>
                          <p>Namespace: {item.namespace}</p>
                          <p>Dimensions: {item.vector_dimensions}</p>
                          <p className="text-green-600 dark:text-green-400">{item.upsert_status.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Failed Questions */}
              {embeddingSummary.failed.length > 0 && (
                <Card className="w-full p-6 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-600 rounded-md">
                  <p className="font-semibold text-lg text-red-600 dark:text-red-400 mb-2">Failed Questions ({embeddingSummary.failed.length})</p>
                  <div className="space-y-2">
                    {embeddingSummary.failed.map((item, idx) => (
                      <div key={idx} className="bg-red-100 dark:bg-red-800/40 rounded p-3 border border-red-200 dark:border-red-700">
                        <pre className="text-red-700 dark:text-red-300 whitespace-pre-wrap">{JSON.stringify(item, null, 2)}</pre>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          )}

          {errorStats && <p className="p-4 text-red-500">{errorStats}</p>}

        </div>
      </div>
    </ProtectedRoute>
  );
}
