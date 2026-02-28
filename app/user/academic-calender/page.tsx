'use client';

import { useEffect, useState } from 'react';
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
  CalendarDaysIcon,
  ChevronRightIcon,
  RefreshCwIcon,
  AlertTriangleIcon,
  GraduationCapIcon,
  BookOpenIcon,
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function titleToSlug(title: string): string {
  return encodeURIComponent(title);
}

function isRevised(title: string): boolean {
  return /\[Revised\]/i.test(title);
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function TitleSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 sm:p-5 border-b border-border last:border-b-0">
      <div className="h-9 w-9 rounded-xl bg-muted shrink-0" />
      <div className="flex-1 min-w-0 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/3" />
      </div>
      <Skeleton className="h-4 w-4 shrink-0" />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AcademicCalendarPage() {
  const { toggleMobileMenu } = useMobileMenu();

  const [titles, setTitles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTitles = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/academic-calendar/titles');
      if (!res.ok) throw new Error('Failed to fetch calendar titles.');
      const json: string[] = await res.json();
      setTitles(json);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTitles(); }, []);

  return (
    <div className="min-h-screen bg-background">
      <FrostedHeader title="Academic Calendar" onMobileMenuToggle={toggleMobileMenu} showSearch={false} />

      <div className="p-6 space-y-6">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/user">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Academic Calendar</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Hero banner */}
        <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-blue-500/15 via-blue-400/8 to-transparent border border-blue-500/20 p-6 sm:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,var(--tw-gradient-stops))] from-blue-400/10 via-transparent to-transparent pointer-events-none" />
          <div className="relative flex items-start justify-between gap-4 flex-wrap">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <CalendarDaysIcon className="h-4 w-4 text-blue-500" />
                </div>
                <Badge variant="secondary" className="text-xs bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 hover:bg-blue-500/15">
                  Official
                </Badge>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Academic Calendar</h1>
              <p className="text-sm text-muted-foreground max-w-lg">
                Browse semester schedules, exam timelines, holidays, and important academic dates for each trimester and program.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-blue-500/30 hover:bg-blue-500/10 hover:text-blue-600 hover:border-blue-500/50 shrink-0"
              onClick={fetchTitles}
              disabled={loading}
            >
              <RefreshCwIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {!loading && titles.length > 0 && (
            <div className="relative mt-5 pt-5 border-t border-blue-500/15 flex items-center gap-6 flex-wrap">
              <div>
                <p className="text-2xl font-bold text-foreground">{titles.length}</p>
                <p className="text-xs text-muted-foreground">Schedules available</p>
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
                onClick={fetchTitles}
                className="border-destructive/30 text-destructive hover:bg-destructive/10 shrink-0"
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Calendar title list */}
        {loading ? (
          <Card className="border overflow-hidden">
            {Array.from({ length: 7 }).map((_, i) => <TitleSkeleton key={i} />)}
          </Card>
        ) : !error && titles.length === 0 ? (
          <Card className="border">
            <CardContent className="py-20 flex flex-col items-center gap-3">
              <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center">
                <CalendarDaysIcon className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">No calendars found.</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="p-0 border overflow-hidden">
            {titles.map((title, idx) => {
              const slug = titleToSlug(title);
              const revised = isRevised(title);
              const cleanTitle = title.replace(/\s*\[Revised\]/i, '').trim();
              const isGrad = /graduate/i.test(title);
              const isPharm = /pharmacy/i.test(title);

              return (
                <Link
                  key={idx}
                  href={`/user/academic-calender/${slug}`}
                  className="flex items-center gap-4 p-4 sm:p-5 border-b border-border last:border-b-0 hover:bg-blue-500/5 transition-colors group"
                >
                  {/* Icon */}
                  <div className="h-9 w-9 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0 group-hover:bg-blue-500/20 transition-colors">
                    {isPharm
                      ? <BookOpenIcon className="h-4 w-4 text-blue-500" />
                      : <GraduationCapIcon className="h-4 w-4 text-blue-500" />
                    }
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-sm font-medium leading-snug text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {cleanTitle}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-muted-foreground">
                        {isPharm ? 'Pharmacy' : isGrad ? 'Graduate' : 'Undergraduate'} Program
                      </span>
                      {revised && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] px-1.5 py-0 h-4 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                        >
                          Revised
                        </Badge>
                      )}
                    </div>
                  </div>

                  <ChevronRightIcon className="h-4 w-4 text-muted-foreground shrink-0 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
                </Link>
              );
            })}
          </Card>
        )}
      </div>
    </div>
  );
}
