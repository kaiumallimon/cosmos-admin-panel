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
import Link from 'next/link';
import {
  CalendarIcon,
  ExternalLinkIcon,
  ArrowLeftIcon,
  AlertTriangleIcon,
  BellIcon,
  ChevronRightIcon,
  FileTextIcon,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface RelatedNotice {
  date: string;
  title: string;
  url: string;
}

interface NoticeDetail {
  title: string;
  publish_date: string;
  content_html: string;
  content_text: string;
  related_notices?: RelatedNotice[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slugFromUrl(url: string): string {
  return url.split('/notice/')[1]?.replace(/\/$/, '') ?? '';
}

// ─── Skeletons ────────────────────────────────────────────────────────────────

function HeaderSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Skeleton className="h-7 w-7 rounded-lg" />
        <Skeleton className="h-3.5 w-28" />
      </div>
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-7 w-3/4" />
      <div className="flex items-center justify-between pt-1">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-36" />
      </div>
    </div>
  );
}

function ContentSkeleton() {
  return (
    <Card className="border">
      <CardContent className="p-6 space-y-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <Skeleton key={i} className={`h-4 ${i % 3 === 2 ? 'w-4/5' : 'w-full'}`} />
        ))}
      </CardContent>
    </Card>
  );
}

function SidebarSkeleton() {
  return (
    <Card className="border">
      <CardContent className="p-4 space-y-3">
        <Skeleton className="h-4 w-32" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-start gap-2 py-2">
            <Skeleton className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3.5 w-full" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
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

  const relatedNotices = data?.related_notices ?? [];

  return (
    <div className="min-h-screen bg-background">
      <FrostedHeader title="Notice Detail" onMobileMenuToggle={toggleMobileMenu} showSearch={false} />

      <div className="p-6 space-y-6">
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

        {/* Error state */}
        {error && (
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
        )}

        {/* Full-width title / meta header */}
        {loading ? (
          <HeaderSkeleton />
        ) : data ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-orange-500/15 flex items-center justify-center shrink-0">
                <BellIcon className="h-4 w-4 text-orange-500" />
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
              <a href={externalUrl} target="_blank" rel="noopener noreferrer">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 h-8 text-xs hover:border-orange-500/40 hover:text-orange-600"
                >
                  <ExternalLinkIcon className="h-3.5 w-3.5" />
                  View on UIU website
                </Button>
              </a>
            </div>
          </div>
        ) : null}

        {/* Two-column layout — cards only */}
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">
            <ContentSkeleton />
            <SidebarSkeleton />
          </div>
        ) : data ? (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">

            {/* ── Body card ── */}
            <Card className="border">
              <CardContent className="p-5 sm:p-7">
                  <div className="overflow-x-auto">
                    <div
                      className="prose prose-sm dark:prose-invert max-w-none
                        prose-p:text-foreground prose-headings:text-foreground
                        prose-strong:text-foreground
                        prose-blockquote:border-l-orange-500 prose-blockquote:text-muted-foreground
                        prose-a:text-orange-500 prose-a:no-underline hover:prose-a:underline
                        prose-table:w-full prose-table:border-collapse
                        prose-thead:bg-muted/50
                        prose-th:border prose-th:border-border prose-th:px-3 prose-th:py-2 prose-th:text-left prose-th:font-semibold prose-th:text-foreground
                        prose-td:border prose-td:border-border prose-td:px-3 prose-td:py-2 prose-td:text-foreground
                        prose-tr:border-b prose-tr:border-border
                        [&_table]:w-full [&_table]:border-collapse [&_table]:text-sm
                        [&_th]:border [&_th]:border-border [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold [&_th]:bg-muted/50
                        [&_td]:border [&_td]:border-border [&_td]:px-3 [&_td]:py-2
                        [&_tr:nth-child(even)_td]:bg-muted/20"
                      dangerouslySetInnerHTML={{ __html: data.content_html }}
                    />
                  </div>
                </CardContent>
            </Card>

            {/* ── Sidebar: Related Notices ── */}
            {relatedNotices.length > 0 && (
              <div className="space-y-4">
                <Card className="border sticky top-20">
                  <div className="px-4 pt-4 pb-3 border-b border-border">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-md bg-orange-500/15 flex items-center justify-center shrink-0">
                        <FileTextIcon className="h-3.5 w-3.5 text-orange-500" />
                      </div>
                      <p className="text-sm font-semibold text-foreground">Related Notices</p>
                    </div>
                  </div>
                  <div className="divide-y divide-border">
                    {relatedNotices.map((item, idx) => {
                      const itemSlug = slugFromUrl(item.url);
                      const href = itemSlug ? `/user/notices/${itemSlug}` : item.url;
                      const isExternal = !itemSlug;
                      return (
                        <Link
                          key={idx}
                          href={href}
                          target={isExternal ? '_blank' : undefined}
                          rel={isExternal ? 'noopener noreferrer' : undefined}
                          className="flex items-start gap-3 px-4 py-3 hover:bg-muted/40 transition-colors group"
                        >
                          <div className="flex-1 min-w-0 space-y-0.5">
                            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                              <CalendarIcon className="h-3 w-3 shrink-0" />
                              <span>{item.date}</span>
                            </div>
                            <p className="text-xs font-medium leading-snug text-foreground group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors line-clamp-2">
                              {item.title}
                            </p>
                          </div>
                          <ChevronRightIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-1.5 group-hover:text-orange-500 group-hover:translate-x-0.5 transition-all" />
                        </Link>
                      );
                    })}
                  </div>
                </Card>
              </div>
            )}

          </div>
        ) : null}
      </div>
    </div>
  );
}
