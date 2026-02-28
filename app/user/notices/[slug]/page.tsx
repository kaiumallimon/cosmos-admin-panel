'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FrostedHeader } from '@/components/custom/frosted-header';
import { useMobileMenu } from '@/components/mobile-menu-context';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  CalendarIcon,
  ExternalLinkIcon,
  ArrowLeftIcon,
  AlertTriangleIcon,
  BellIcon,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface NoticeDetail {
  title: string;
  publish_date: string;
  content_html: string;
  content_text: string;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-8 w-1/2" />
      </div>
      <Card className="border">
        <CardContent className="p-6 space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NoticeDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { toggleMobileMenu } = useMobileMenu();

  const [data, setData] = useState<NoticeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/notice/${encodeURIComponent(slug)}`);
      if (!res.ok) throw new Error('Failed to fetch notice.');
      const json: NoticeDetail = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (slug) fetchDetail();
  }, [slug]);

  // External URL to the original notice
  const externalUrl = `https://www.uiu.ac.bd/notice/${slug}/`;

  return (
    <div className="min-h-screen bg-background">
      <FrostedHeader title="Notice Detail" onMobileMenuToggle={toggleMobileMenu} showSearch={false} />

      <div className="p-6 space-y-6 max-w-4xl">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/user">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/user/notices">Notices</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="truncate max-w-[180px] sm:max-w-xs">
                {loading ? 'Loading…' : (data?.title ?? 'Detail')}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Back button */}
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 -ml-2 text-muted-foreground hover:text-foreground"
          onClick={() => router.back()}
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Notices
        </Button>

        {/* Content */}
        {loading ? (
          <DetailSkeleton />
        ) : error ? (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="p-5 flex items-center gap-3">
              <AlertTriangleIcon className="h-5 w-5 text-destructive shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-destructive font-medium">{error}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchDetail}
                className="border-destructive/30 text-destructive hover:bg-destructive/10 shrink-0"
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : data ? (
          <div className="space-y-5">
            {/* Title + meta */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <BellIcon className="h-4 w-4 text-primary" />
                </div>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Official Notice
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold leading-snug text-foreground">
                {data.title}
              </h1>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <CalendarIcon className="h-4 w-4 shrink-0" />
                  {data.publish_date}
                </div>
                <a
                  href={externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 h-8 text-xs hover:border-primary/40 hover:text-primary"
                  >
                    <ExternalLinkIcon className="h-3.5 w-3.5" />
                    View on UIU website
                  </Button>
                </a>
              </div>
            </div>

            {/* Notice body */}
            <Card className="border">
              <CardContent className="p-5 sm:p-7">
                <div className="overflow-x-auto">
                  <div
                    className="prose prose-sm dark:prose-invert max-w-none
                      prose-p:text-foreground prose-headings:text-foreground
                      prose-strong:text-foreground
                      prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground
                      prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                      prose-table:w-full prose-table:border-collapse
                      prose-thead:bg-muted/50
                      prose-th:border prose-th:border-border prose-th:px-3 prose-th:py-2 prose-th:text-left prose-th:font-semibold prose-th:text-foreground
                      prose-td:border prose-td:border-border prose-td:px-3 prose-td:py-2 prose-td:text-foreground
                      prose-tr:border-b prose-tr:border-border
                      [&_table]:w-full [&_table]:border-collapse [&_table]:text-sm
                      [&_th]:border [&_th]:border-border [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold [&_th]:bg-muted/50
                      [&_td]:border [&_td]:border-border [&_td]:px-3 [&_td]:py-2
                      [&_tr:nth-child(even)]:bg-muted/20"
                    dangerouslySetInnerHTML={{ __html: data.content_html }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </div>
    </div>
  );
}
