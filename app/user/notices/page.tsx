'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { FrostedHeader } from '@/components/custom/frosted-header';
import { useMobileMenu } from '@/components/mobile-menu-context';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
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
  ChevronRightIcon,
  RefreshCwIcon,
  BellIcon,
  ChevronLeftIcon,
  AlertTriangleIcon,
  FileTextIcon,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Notice {
  date: string;
  title: string;
  url: string;
}

interface Pagination {
  current_page: number;
  total_pages: number;
  next_page_url: string | null;
}

interface NoticeListResponse {
  notices: Notice[];
  pagination: Pagination;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function NoticeSkeleton() {
  return (
    <div className="flex items-start gap-4 p-4 sm:p-5 border-b border-border last:border-b-0">
      <div className="h-9 w-9 rounded-xl bg-muted shrink-0" />
      <div className="flex-1 min-w-0 space-y-2">
        <Skeleton className="h-3.5 w-28" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <Skeleton className="h-4 w-4 shrink-0 mt-2.5" />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function NoticesContent() {
  const { toggleMobileMenu } = useMobileMenu();
  const searchParams = useSearchParams();

  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1);

  const [data, setData] = useState<NoticeListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotices = useCallback(async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/notices?page=${p}`);
      if (!res.ok) throw new Error('Failed to fetch notices.');
      const json: NoticeListResponse = await res.json();
      setData(json);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotices(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page, fetchNotices]);

  const totalPages = data?.pagination.total_pages ?? 1;

  return (
    <div className="min-h-screen bg-background">
      <FrostedHeader title="Notices" onMobileMenuToggle={toggleMobileMenu} showSearch={false} />

      <div className="p-6 space-y-6">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/user">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Notices</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Hero banner */}
        <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-orange-500/15 via-orange-400/8 to-transparent border border-orange-500/20 p-6 sm:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,var(--tw-gradient-stops))] from-orange-400/10 via-transparent to-transparent pointer-events-none" />
          <div className="relative flex items-start justify-between gap-4 flex-wrap">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-orange-500/20 flex items-center justify-center">
                  <BellIcon className="h-4 w-4 text-orange-500" />
                </div>
                <Badge variant="secondary" className="text-xs bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20 hover:bg-orange-500/15">
                  Official
                </Badge>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">University Notices</h1>
              <p className="text-sm text-muted-foreground max-w-lg">
                Stay up to date with official announcements, academic schedules, and important updates from the university.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-orange-500/30 hover:bg-orange-500/10 hover:text-orange-600 hover:border-orange-500/50 shrink-0"
              onClick={() => fetchNotices(page)}
              disabled={loading}
            >
              <RefreshCwIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>

          </div>

          {!loading && data && (
            <div className="relative mt-5 pt-5 border-t border-orange-500/15 flex items-center gap-6 flex-wrap">
              <div>
                <p className="text-2xl font-bold text-foreground">{data.notices.length}</p>
                <p className="text-xs text-muted-foreground">On this page</p>
              </div>
              <div className="w-px h-8 bg-border hidden sm:block" />
              <div>
                <p className="text-2xl font-bold text-foreground">{totalPages}</p>
                <p className="text-xs text-muted-foreground">Total pages</p>
              </div>
              <div className="w-px h-8 bg-border hidden sm:block" />
              <div>
                <p className="text-2xl font-bold text-foreground">{page}</p>
                <p className="text-xs text-muted-foreground">Current page</p>
              </div>
            </div>
          )}
        </div>

        {/* Error state */}
        {error && (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertTriangleIcon className="h-5 w-5 text-destructive shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-destructive font-medium">{error}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchNotices(page)}
              className="border-destructive/30 text-destructive hover:bg-destructive/10 shrink-0"
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Notice list */}
        <Card className="border overflow-hidden">
          {loading ? (
            <div>
              {Array.from({ length: 10 }).map((_, i) => (
                <NoticeSkeleton key={i} />
              ))}
            </div>
          ) : !error && data && data.notices.length === 0 ? (
            <CardContent className="py-20 flex flex-col items-center gap-3">
              <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center">
                <BellIcon className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">No notices found for this page.</p>
            </CardContent>
          ) : (
            <div>
              {data?.notices.map((notice, idx) => {
                const slug = notice.url.split('/notice/')[1]?.replace(/\/$/, '') ?? '';
                const href = slug ? `/user/notices/${slug}` : notice.url;
                const isExternal = !slug;

                return (
                  <Link
                    key={idx}
                    href={href}
                    target={isExternal ? '_blank' : undefined}
                    rel={isExternal ? 'noopener noreferrer' : undefined}
                    className="flex items-start gap-4 p-4 sm:p-5 border-b border-border last:border-b-0 hover:bg-muted/40 transition-colors group"
                  >
                    {/* Icon */}
                    <div className="h-9 w-9 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0 group-hover:bg-orange-500/20 transition-colors mt-0.5">
                      <FileTextIcon className="h-4 w-4 text-orange-500" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <CalendarIcon className="h-3 w-3 shrink-0" />
                        <span>{notice.date}</span>
                      </div>
                      <p className="text-sm font-medium leading-snug text-foreground group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                        {notice.title}
                      </p>
                    </div>

                    {/* Arrow */}
                    <ChevronRightIcon className="h-4 w-4 text-muted-foreground shrink-0 mt-2.5 group-hover:text-orange-500 group-hover:translate-x-0.5 transition-all" />
                  </Link>
                );
              })}
            </div>
          )}
        </Card>

        {/* Pagination */}
        {!loading && !error && data && totalPages > 1 && (
          <div className="flex items-center justify-between pt-1 flex-wrap gap-3">
            <p className="text-xs text-muted-foreground">
              Page <span className="font-semibold text-foreground">{page}</span> of{' '}
              <span className="font-semibold text-foreground">{totalPages}</span>
            </p>
            <div className="flex items-center gap-2">
              {/* Previous — use Link so URL updates */}
              {page === 1 ? (
                <Button variant="outline" size="sm" className="gap-1.5 h-8" disabled>
                  <ChevronLeftIcon className="h-4 w-4" />
                  Previous
                </Button>
              ) : (
                <Link href={page - 1 === 1 ? '/user/notices' : `/user/notices?page=${page - 1}`}>
                  <Button variant="outline" size="sm" className="gap-1.5 h-8">
                    <ChevronLeftIcon className="h-4 w-4" />
                    Previous
                  </Button>
                </Link>
              )}

              {/* Page number pills */}
              <div className="hidden sm:flex items-center gap-1">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  // Sliding window of 5 pages centred on current page
                  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
                  const p = start + i;
                  if (p > totalPages) return null;
                  const isCurrent = p === page;
                  return (
                    <Link key={p} href={p === 1 ? '/user/notices' : `/user/notices?page=${p}`}>
                      <Button
                        variant={isCurrent ? 'default' : 'outline'}
                        size="sm"
                        className={`h-8 w-8 p-0 text-xs ${
                          isCurrent
                            ? 'bg-orange-500 hover:bg-orange-600 text-white border-orange-500'
                            : 'hover:border-orange-500/40 hover:text-orange-600'
                        }`}
                      >
                        {p}
                      </Button>
                    </Link>
                  );
                })}
              </div>

              {/* Next */}
              {page === totalPages ? (
                <Button variant="outline" size="sm" className="gap-1.5 h-8" disabled>
                  Next
                  <ChevronRightIcon className="h-4 w-4" />
                </Button>
              ) : (
                <Link href={`/user/notices?page=${page + 1}`}>
                  <Button variant="outline" size="sm" className="gap-1.5 h-8 border-orange-500/30 hover:bg-orange-500/10 hover:text-orange-600 hover:border-orange-500/50">
                    Next
                    <ChevronRightIcon className="h-4 w-4" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function NoticesPage() {
  return (
    <Suspense>
      <NoticesContent />
    </Suspense>
  );
}
