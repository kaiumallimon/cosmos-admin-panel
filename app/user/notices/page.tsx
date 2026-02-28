'use client';

import { useEffect, useState } from 'react';
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
  RefreshCwIcon,
  BellIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  AlertTriangleIcon,
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
    <Card className="border">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2 min-w-0">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-3/4" />
          </div>
          <Skeleton className="h-8 w-20 shrink-0 rounded-lg" />
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NoticesPage() {
  const { toggleMobileMenu } = useMobileMenu();

  const [data, setData] = useState<NoticeListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const fetchNotices = async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/notices?page=${p}`);
      if (!res.ok) throw new Error('Failed to fetch notices.');
      const json: NoticeListResponse = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices(page);
  }, [page]);

  const totalPages = data?.pagination.total_pages ?? 1;

  const handlePrev = () => setPage((p) => Math.max(1, p - 1));
  const handleNext = () => setPage((p) => Math.min(totalPages, p + 1));

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

        {/* Page header row */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <BellIcon className="h-5 w-5 text-primary" />
              Official Notices
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Latest official notices from the university
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => fetchNotices(page)}
            disabled={loading}
          >
            <RefreshCwIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
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
        <div className="space-y-3">
          {loading
            ? Array.from({ length: 10 }).map((_, i) => <NoticeSkeleton key={i} />)
            : !error && data && data.notices.length === 0
              ? (
                <div className="text-center py-16">
                  <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                    <BellIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">No notices found.</p>
                </div>
              )
              : data?.notices.map((notice, idx) => (
                <Card
                  key={idx}
                  className="border hover:border-primary/30 hover:shadow-md transition-all"
                >
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <CalendarIcon className="h-3.5 w-3.5 shrink-0" />
                          <span>{notice.date}</span>
                        </div>
                        <p className="text-sm font-medium leading-snug text-foreground">
                          {notice.title}
                        </p>
                      </div>
                      <a
                        href={notice.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0"
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 text-xs h-8 hover:border-primary/40 hover:text-primary"
                        >
                          <ExternalLinkIcon className="h-3.5 w-3.5" />
                          View
                        </Button>
                      </a>
                    </div>
                  </CardContent>
                </Card>
              ))
          }
        </div>

        {/* Pagination */}
        {!loading && !error && data && totalPages > 1 && (
          <div className="flex items-center justify-between pt-2 flex-wrap gap-3">
            <p className="text-xs text-muted-foreground">
              Page <span className="font-medium text-foreground">{page}</span> of{' '}
              <span className="font-medium text-foreground">{totalPages}</span>
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 h-8"
                onClick={handlePrev}
                disabled={page === 1}
              >
                <ChevronLeftIcon className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 h-8"
                onClick={handleNext}
                disabled={page === totalPages}
              >
                Next
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}