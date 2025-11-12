'use client';

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Card } from "@/components/ui/card";
import { FrostedHeader } from "@/components/custom/frosted-header";
import {
  FileTextIcon,
  ImageIcon,
  CloudIcon,
  DownloadIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from "@/components/ui/breadcrumb";

interface CDNStatistics {
  totalFiles: number;
  pdfCount: number;
  imageCount: number;
  totalSizeBytes: number;
  totalSizeHuman: string;
}

export default function CdnPage() {
  const [statistics, setStatistics] = useState<CDNStatistics | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    async function fetchStatistics() {
      try {
        setLoading(true);
        const response = await fetch("/api/cdn/stats");
        const data = await response.json();
        if (response.ok) {
          setStatistics(data.statistics);
        } else {
          toast.error(data.error || "Failed to fetch CDN statistics");
        }
      } catch (error) {
        toast.error("An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchStatistics();
  }, []);

  // Convert statistics object into array with icons
  const statsArray = statistics
    ? [
        {
          title: "Total Files",
          value: statistics.totalFiles,
          icon: FileTextIcon,
        },
        {
          title: "PDF Files",
          value: statistics.pdfCount,
          icon: FileTextIcon,
        },
        {
          title: "Image Files",
          value: statistics.imageCount,
          icon: ImageIcon,
        },
        {
          title: "Storage Used",
          value: statistics.totalSizeHuman,
          icon: CloudIcon,
        },
      ]
    : [];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <FrostedHeader title="Server Contents" />

        <div className="p-6 pb-0">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Uploads</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 p-6">
          {statsArray.map((stat, index) => (
            <Card key={index} className="p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                  <stat.icon className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </ProtectedRoute>
  );
}
