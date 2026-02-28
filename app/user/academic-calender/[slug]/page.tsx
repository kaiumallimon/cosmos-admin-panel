'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
import {
  CalendarDaysIcon,
  ArrowLeftIcon,
  AlertTriangleIcon,
  DownloadIcon,
  InfoIcon,
  ClockIcon,
  CalendarIcon,
  AlignLeftIcon,
  SunIcon,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CalendarEvent {
  date: string;
  day: string;
  details: string;
}

interface CalendarTable {
  title: string;
  events: CalendarEvent[];
  extra_details: string;
  pdf_url: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isHoliday(details: string): boolean {
  return /holiday/i.test(details);
}

function isExam(details: string): boolean {
  return /exam/i.test(details);
}

function isDeadline(details: string): boolean {
  return /last day|last date|deadline/i.test(details);
}

function isClassBegin(details: string): boolean {
  return /classes begin/i.test(details);
}

// ─── Skeletons ────────────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <Card className="border-0 overflow-hidden shadow-sm rounded-xl bg-card">
      <div className="grid grid-cols-[140px_90px_1fr] bg-muted border-b-2 border-border">
        {['w-16', 'w-10', 'w-24'].map((w, i) => (
          <div key={i} className={`flex items-center gap-2 px-4 py-3 ${i < 2 ? 'border-r border-border/60' : ''}`}>
            <Skeleton className="h-3.5 w-3.5 rounded" />
            <Skeleton className={`h-3.5 ${w}`} />
          </div>
        ))}
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="grid grid-cols-[140px_90px_1fr] border-l-[3px] border-l-transparent">
            <div className="flex items-center gap-2 px-4 py-3.5 border-r border-border/60">
              <Skeleton className="h-2 w-2 rounded-full" />
              <Skeleton className="h-3.5 w-20" />
            </div>
            <div className="px-4 py-3.5 border-r border-border/60">
              <Skeleton className="h-3.5 w-10" />
            </div>
            <div className="px-4 py-3.5">
              <Skeleton className={`h-3.5 ${i % 3 === 0 ? 'w-full' : i % 3 === 1 ? 'w-4/5' : 'w-3/5'}`} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AcademicCalendarDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { toggleMobileMenu } = useMobileMenu();

  const title = decodeURIComponent(slug);

  const [data, setData] = useState<CalendarTable | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCalendar = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/academic-calendar/table?title=${encodeURIComponent(title)}`);
      if (!res.ok) throw new Error('Failed to fetch calendar.');
      const json: CalendarTable = await res.json();
      setData(json);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (slug) fetchCalendar();
  }, [slug]);

  const isRevised = /\[Revised\]/i.test(title);
  const cleanTitle = title.replace(/\s*\[Revised\]/i, '').trim();

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
              <BreadcrumbLink href="/user/academic-calender">Academic Calendar</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="truncate max-w-[180px] sm:max-w-xs">
                {loading ? 'Loading…' : cleanTitle}
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
          Back to Academic Calendar
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
                onClick={fetchCalendar}
                className="border-destructive/30 text-destructive hover:bg-destructive/10 shrink-0"
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Header */}
        {!loading && data && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-blue-500/15 flex items-center justify-center shrink-0">
                <CalendarDaysIcon className="h-4 w-4 text-blue-500" />
              </div>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Academic Calendar
              </span>
              {isRevised && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
                  Revised
                </Badge>
              )}
            </div>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold leading-snug text-foreground">
                {cleanTitle}
              </h1>
              {data.pdf_url && (
                <a href={data.pdf_url} target="_blank" rel="noopener noreferrer">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 h-8 text-xs border-blue-500/30 hover:border-blue-500/50 hover:text-blue-600 hover:bg-blue-500/10 shrink-0"
                  >
                    <DownloadIcon className="h-3.5 w-3.5" />
                    Download PDF
                  </Button>
                </a>
              )}
            </div>
          </div>
        )}

        {/* Table */}
        {loading ? (
          <TableSkeleton />
        ) : data ? (
          <div className="space-y-5">

            {/* Legend */}
            <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Legend:</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-red-500/70 shrink-0" />Holiday</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-blue-500/70 shrink-0" />Exam</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-500/70 shrink-0" />Deadline</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-green-500/70 shrink-0" />Classes Begin</span>
            </div>

            {/* Events table */}
            <Card className="border-0 p-0 overflow-hidden shadow-sm rounded-xl">
              {/* Column headers */}
              <div className="grid grid-cols-[140px_90px_1fr] bg-primary/10 border-b border-border ">
                <div className="flex items-center gap-2 px-4 py-3 border-r border-border/60">
                  <CalendarIcon className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="text-xs font-semibold text-foreground tracking-wide">Date</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-3 border-r border-border/60">
                  <SunIcon className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="text-xs font-semibold text-foreground tracking-wide">Day</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-3">
                  <AlignLeftIcon className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="text-xs font-semibold text-foreground tracking-wide">Details</span>
                </div>
              </div>

              <div className="divide-y divide-border">
                {data.events.map((event, idx) => {
                  const holiday = isHoliday(event.details);
                  const exam = isExam(event.details);
                  const deadline = isDeadline(event.details);
                  const classBegin = isClassBegin(event.details);

                  const rowAccent = holiday
                    ? 'border-l-red-500'
                    : exam
                    ? 'border-l-blue-500'
                    : deadline
                    ? 'border-l-amber-500'
                    : classBegin
                    ? 'border-l-green-500'
                    : 'border-l-transparent';

                  const rowBg = holiday
                    ? 'bg-red-500/[0.04] hover:bg-red-500/[0.08]'
                    : exam
                    ? 'bg-blue-500/[0.04] hover:bg-blue-500/[0.08]'
                    : deadline
                    ? 'bg-amber-500/[0.04] hover:bg-amber-500/[0.08]'
                    : classBegin
                    ? 'bg-green-500/[0.04] hover:bg-green-500/[0.08]'
                    : 'hover:bg-muted/30';

                  const dotColor = holiday
                    ? 'bg-red-500/70'
                    : exam
                    ? 'bg-blue-500/70'
                    : deadline
                    ? 'bg-amber-500/70'
                    : classBegin
                    ? 'bg-green-500/70'
                    : null;

                  return (
                    <div
                      key={idx}
                      className={`relative grid grid-cols-[140px_90px_1fr] border-l-[3px] ${rowAccent} ${rowBg} transition-colors group`}
                    >
                      {/* Date */}
                      <div className="flex items-start gap-2 px-4 py-3.5 border-r border-border/60">
                        {dotColor ? (
                          <span className={`mt-[5px] h-2 w-2 rounded-full shrink-0 ${dotColor}`} />
                        ) : (
                          <span className="mt-[5px] h-2 w-2 rounded-full shrink-0 bg-transparent" />
                        )}
                        <span className="text-xs font-semibold text-foreground leading-snug tabular-nums">
                          {event.date}
                        </span>
                      </div>

                      {/* Day */}
                      <div className="flex items-center px-4 py-3.5 border-r border-border/60">
                        <span className="text-xs font-medium text-muted-foreground leading-snug">
                          {event.day}
                        </span>
                      </div>

                      {/* Details */}
                      <div className="flex items-start px-4 py-3.5">
                        <span className="text-xs text-foreground leading-relaxed">
                          {event.details}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer: event count */}
              <div className="px-4 py-2.5 bg-muted/50 border-t-2 border-border flex items-center gap-1.5">
                <ClockIcon className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {data.events.length} scheduled events
                </span>
              </div>
            </Card>

            {/* Extra details */}
            {data.extra_details && (() => {
              // Merge orphaned ordinal lines (e.g. "1\nst" → "1st")
              const merged = data.extra_details
                .replace(/(\d)\n(st|nd|rd|th)\n?/g, '$1$2 ')
                .replace(/\n{3,}/g, '\n\n');

              // Split into non-empty lines
              const lines = merged.split('\n').filter(l => l.trim().length > 0);

              return (
                <Card className="border overflow-hidden">
                  <div className="relative px-4 py-3.5 bg-linear-to-r from-blue-500/10 to-transparent border-b border-border">
                    <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-blue-500 rounded-r-full" />
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-md bg-blue-500/15 flex items-center justify-center shrink-0">
                        <InfoIcon className="h-3.5 w-3.5 text-blue-500" />
                      </div>
                      <p className="text-sm font-semibold text-foreground">Additional Notes</p>
                    </div>
                  </div>
                  <div className="p-5 space-y-2">
                    {lines.map((line, i) => {
                      const trimmed = line.trim();
                      // Footnote lines: start with * or ** or ***
                      const footnoteMatch = trimmed.match(/^(\*+)\s*(.*)/);
                      if (footnoteMatch) {
                        const stars = footnoteMatch[1];
                        const text = footnoteMatch[2];
                        return (
                          <div key={i} className="flex gap-2 items-start">
                            <span className="shrink-0 mt-0.5 text-[11px] font-bold text-blue-500 leading-relaxed w-5 text-right">
                              {stars}
                            </span>
                            <p className="text-xs text-muted-foreground leading-relaxed">{text}</p>
                          </div>
                        );
                      }
                      // Bullet lines: start with •
                      if (trimmed.startsWith('•')) {
                        return (
                          <div key={i} className="flex gap-2 items-start">
                            <span className="shrink-0 mt-1 h-1.5 w-1.5 rounded-full bg-blue-500/60" />
                            <p className="text-xs text-muted-foreground leading-relaxed">{trimmed.slice(1).trim()}</p>
                          </div>
                        );
                      }
                      // NOTE / label lines (all caps start)
                      if (/^NOTE:/i.test(trimmed)) {
                        return (
                          <p key={i} className="text-xs font-semibold text-foreground leading-relaxed pt-1">
                            {trimmed}
                          </p>
                        );
                      }
                      // Regular paragraph
                      return (
                        <p key={i} className="text-xs text-muted-foreground leading-relaxed">
                          {trimmed}
                        </p>
                      );
                    })}
                  </div>
                </Card>
              );
            })()}
          </div>
        ) : null}
      </div>
    </div>
  );
}
