'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuthStore } from '@/store/auth';
import { FrostedHeader } from '@/components/custom/frosted-header';
import { useMobileMenu } from '@/components/mobile-menu-context';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  PlusIcon,
  RefreshCwIcon,
  MoreHorizontal,
  PencilIcon,
  Trash2Icon,
  CalendarIcon,
  ClockIcon,
  CheckCircle2Icon,
  CircleIcon,
  XCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClipboardListIcon,
  BookOpenIcon,
  FlaskConicalIcon,
  TagIcon,
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────────

type EventType = 'task' | 'assignment' | 'ct' | 'other';
type EventStatus = 'pending' | 'completed' | 'cancelled';

interface CalendarEvent {
  id: string;
  student_id: string;
  title: string;
  description?: string | null;
  type: EventType;
  event_date: string; // YYYY-MM-DD
  event_time?: string | null; // HH:MM:SS
  status: EventStatus;
  created_at: string;
  updated_at: string;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const EVENT_TYPES: { value: EventType; label: string }[] = [
  { value: 'task', label: 'Task' },
  { value: 'assignment', label: 'Assignment' },
  { value: 'ct', label: 'Class Test (CT)' },
  { value: 'other', label: 'Other' },
];

const EVENT_STATUSES: { value: EventStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const TYPE_STYLES: Record<EventType, string> = {
  task: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  assignment: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
  ct: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
  other: 'bg-muted text-muted-foreground border-border',
};

const TYPE_BORDER: Record<EventType, string> = {
  task: 'border-l-blue-500',
  assignment: 'border-l-green-500',
  ct: 'border-l-purple-500',
  other: 'border-l-muted-foreground/40',
};

const TYPE_DOT: Record<EventType, string> = {
  task: 'bg-blue-500',
  assignment: 'bg-green-500',
  ct: 'bg-purple-500',
  other: 'bg-muted-foreground/50',
};

const TYPE_ICON: Record<EventType, React.ElementType> = {
  task: ClipboardListIcon,
  assignment: BookOpenIcon,
  ct: FlaskConicalIcon,
  other: TagIcon,
};

const STATUS_STYLES: Record<EventStatus, string> = {
  pending: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  completed: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
  cancelled: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
};

const STATUS_ICON: Record<EventStatus, React.ElementType> = {
  pending: CircleIcon,
  completed: CheckCircle2Icon,
  cancelled: XCircleIcon,
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DEFAULT_FORM = {
  title: '',
  description: '',
  type: 'task' as EventType,
  event_date: '',
  event_time: '',
  status: 'pending' as EventStatus,
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function todayIso() {
  return new Date().toISOString().split('T')[0];
}

function toIso(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function formatDateLong(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

function formatTime(timeStr: string) {
  const [h, m] = timeStr.split(':');
  const hour = parseInt(h);
  return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
}

function isOverdue(e: CalendarEvent) {
  return e.status === 'pending' && e.event_date < todayIso();
}

// Build calendar grid: N rows × 7 cols (null = outside current month)
function buildCalendarGrid(year: number, month: number): (number | null)[][] {
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const rows: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  return rows;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function StudyPlannerPage() {
  const { user } = useAuthStore();
  const { toggleMobileMenu } = useMobileMenu();
  const studentId = user.profile?.id as string | undefined;

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Calendar navigation ──────────────────────────────────────────────
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  // ── Selected date sheet ──────────────────────────────────────────────
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // ── Add / Edit dialog ────────────────────────────────────────────────
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<CalendarEvent | null>(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  // ── Fetch ────────────────────────────────────────────────────────────

  const fetchEvents = async () => {
    if (!studentId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/events/student/${studentId}`);
      const data = await res.json();
      setEvents(Array.isArray(data) ? data : []);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEvents(); }, [studentId]);

  // ── Derived ──────────────────────────────────────────────────────────

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const e of events) {
      if (!map.has(e.event_date)) map.set(e.event_date, []);
      map.get(e.event_date)!.push(e);
    }
    return map;
  }, [events]);

  const stats = useMemo(() => {
    const today = todayIso();
    return {
      pending: events.filter((e) => e.status === 'pending').length,
      completed: events.filter((e) => e.status === 'completed').length,
      overdue: events.filter(isOverdue).length,
      today: events.filter((e) => e.event_date === today).length,
    };
  }, [events]);

  const calendarGrid = useMemo(() => buildCalendarGrid(viewYear, viewMonth), [viewYear, viewMonth]);

  const selectedEvents = useMemo(() => {
    if (!selectedDate) return [];
    return [...(eventsByDate.get(selectedDate) ?? [])].sort((a, b) => {
      if (!a.event_time && !b.event_time) return 0;
      if (!a.event_time) return 1;
      if (!b.event_time) return -1;
      return a.event_time.localeCompare(b.event_time);
    });
  }, [selectedDate, eventsByDate]);

  // ── Navigation ───────────────────────────────────────────────────────

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };
  const goToday = () => { setViewYear(now.getFullYear()); setViewMonth(now.getMonth()); };

  // ── Handlers ─────────────────────────────────────────────────────────

  const openDaySheet = (dateStr: string) => {
    setSelectedDate(dateStr);
    setSheetOpen(true);
  };

  const openAdd = (prefillDate?: string) => {
    setEditItem(null);
    setForm({ ...DEFAULT_FORM, event_date: prefillDate ?? todayIso() });
    setDialogOpen(true);
  };

  const openEdit = (e: CalendarEvent) => {
    setEditItem(e);
    setForm({
      title: e.title,
      description: e.description ?? '',
      type: e.type,
      event_date: e.event_date,
      event_time: e.event_time ? e.event_time.slice(0, 5) : '',
      status: e.status,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.event_date || !studentId) return;
    setSaving(true);
    try {
      if (editItem) {
        await fetch(`/api/events/${editItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: form.title.trim(),
            description: form.description.trim() || null,
            type: form.type,
            event_date: form.event_date,
            event_time: form.event_time || null,
            status: form.status,
          }),
        });
      } else {
        await fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            student_id: studentId,
            title: form.title.trim(),
            description: form.description.trim() || null,
            type: form.type,
            event_date: form.event_date,
            event_time: form.event_time || null,
          }),
        });
      }
      setDialogOpen(false);
      await fetchEvents();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await fetch(`/api/events/${id}`, { method: 'DELETE' });
      await fetchEvents();
    } finally {
      setDeletingId(null);
    }
  };

  const handleStatusChange = async (event: CalendarEvent, status: EventStatus) => {
    setUpdatingStatusId(event.id);
    try {
      await fetch(`/api/events/${event.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      await fetchEvents();
    } finally {
      setUpdatingStatusId(null);
    }
  };

  // ─── Loading ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <FrostedHeader title="Study Planner" onMobileMenuToggle={toggleMobileMenu} showSearch={false} />
        <div className="flex-1 min-h-0 flex flex-col px-4 sm:px-6 py-4 gap-3">
          <div className="flex items-center justify-between shrink-0">
            <Skeleton className="h-7 w-44" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-8 w-24 rounded-lg" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
          </div>
          <div className="flex-1 min-h-0 rounded-2xl border border-border overflow-hidden">
            <div className="grid grid-cols-7 border-b border-border shrink-0">
              {Array(7).fill(0).map((_, i) => <Skeleton key={i} className="h-9 rounded-none" />)}
            </div>
            <div className="grid grid-cols-7 h-full">
              {Array(42).fill(0).map((_, i) => <Skeleton key={i} className="rounded-none opacity-50" />)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────

  const today = todayIso();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <FrostedHeader title="Study Planner" onMobileMenuToggle={toggleMobileMenu} showSearch={false} />

      <div className="flex-1 min-h-0 flex flex-col px-4 sm:px-6 py-4 gap-3">

          {/* ── Header row ── */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Month nav */}
            <div className="flex items-center gap-1.5">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg" onClick={prevMonth}>
                <ChevronLeftIcon className="h-4 w-4" />
              </Button>
              <span className="text-lg font-bold tracking-tight w-44 text-center">
                {MONTHS[viewMonth]} {viewYear}
              </span>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg" onClick={nextMonth}>
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
            </div>

            {(viewYear !== now.getFullYear() || viewMonth !== now.getMonth()) && (
              <button
                onClick={goToday}
                className="text-[11px] font-medium text-primary hover:underline underline-offset-2"
              >
                Today
              </button>
            )}

            <div className="flex-1" />

            {/* Stats pills */}
            <div className="hidden sm:flex items-center gap-1.5">
              {stats.overdue > 0 && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 border border-red-500/20 font-medium tabular-nums">
                  {stats.overdue} overdue
                </span>
              )}
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border font-medium tabular-nums">
                {stats.pending} pending
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 font-medium tabular-nums">
                {stats.completed} done
              </span>
            </div>

            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg text-muted-foreground" onClick={fetchEvents} title="Refresh">
              <RefreshCwIcon className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" className="h-8 gap-1.5 rounded-lg text-xs font-semibold" onClick={() => openAdd()}>
              <PlusIcon className="h-3.5 w-3.5" />
              <span>Add Event</span>
            </Button>
          </div>

          {/* ── Calendar card ── */}
          <div className="flex-1 min-h-0 flex flex-col rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            {/* Weekday header */}
            <div className="grid grid-cols-7 border-b border-border shrink-0">
              {WEEKDAYS.map((d) => (
                <div key={d} className="py-2.5 text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
                  {d}
                </div>
              ))}
            </div>

            {/* Day grid — fills remaining height */}
            <div className="flex-1 min-h-0 grid" style={{ gridTemplateRows: `repeat(${calendarGrid.length}, 1fr)` }}>
              {calendarGrid.map((row, rowIdx) => (
                <div key={rowIdx} className="grid grid-cols-7 divide-x divide-border border-b border-border last:border-b-0">
                  {row.map((day, colIdx) => {
                    if (day === null) {
                      return (
                        <div
                          key={colIdx}
                          className="bg-muted/30"
                        />
                      );
                    }
                    const dateStr = toIso(viewYear, viewMonth, day);
                    const dayEvents = eventsByDate.get(dateStr) ?? [];
                    const isToday = dateStr === today;
                    const isSelected = dateStr === selectedDate && sheetOpen;
                    const isPast = dateStr < today;
                    const hasEvents = dayEvents.length > 0;
                    const dotTypes = [...new Set(dayEvents.map((e) => e.type))].slice(0, 3);
                    const hasOverdue = dayEvents.some(isOverdue);

                    return (
                      <button
                        key={colIdx}
                        onClick={() => openDaySheet(dateStr)}
                        className={`
                          flex flex-col items-center justify-start pt-2 gap-1
                          hover:bg-accent/60 focus:outline-none focus-visible:ring-inset focus-visible:ring-2 focus-visible:ring-primary/40
                          transition-colors relative group w-full h-full
                          ${isSelected ? 'bg-primary/8' : isToday ? 'bg-primary/5' : isPast ? 'bg-muted/10' : 'bg-card'}
                        `}
                      >
                        {/* Day number */}
                        <span className={`
                          text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full leading-none transition-colors
                          ${isToday
                            ? 'bg-primary text-primary-foreground text-[11px]'
                            : isSelected
                            ? 'bg-primary/20 text-primary'
                            : isPast && !hasEvents
                            ? 'text-muted-foreground/30'
                            : 'text-foreground group-hover:text-primary'
                          }
                        `}>
                          {day}
                        </span>

                        {/* Dots row */}
                        {hasEvents && (
                          <div className="flex items-center gap-0.5">
                            {dotTypes.map((type) => (
                              <span key={type} className={`w-1 h-1 rounded-full ${TYPE_DOT[type]}`} />
                            ))}
                            {hasOverdue && (
                              <span className="w-1 h-1 rounded-full bg-red-500 animate-pulse" />
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* ── Legend ── */}
          <div className="flex items-center gap-4 shrink-0 pb-1">
            {EVENT_TYPES.map((t) => (
              <div key={t.value} className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${TYPE_DOT[t.value]}`} />
                <span className="text-[11px] text-muted-foreground">{t.label}</span>
              </div>
            ))}
          </div>

      </div>

      {/* ── Day events Sheet ─────────────────────────────────────────────────── */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:w-[420px] flex flex-col p-0">
          <SheetHeader className="px-5 pt-5 pb-3 border-b border-border shrink-0">
            <SheetTitle className="text-sm font-semibold">
              {selectedDate
                ? selectedDate === today
                  ? `Today — ${formatDateLong(selectedDate)}`
                  : formatDateLong(selectedDate)
                : ''}
            </SheetTitle>
          </SheetHeader>

          <div className="px-5 py-3 border-b border-border shrink-0">
            <Button
              size="sm"
              className="w-full gap-2 bg-primary hover:bg-primary/90"
              onClick={() => openAdd(selectedDate ?? undefined)}
            >
              <PlusIcon className="h-4 w-4" />
              Add Event on this day
            </Button>
          </div>

          <ScrollArea className="flex-1 min-h-0">
            <div className="px-5 py-4">
              {selectedEvents.length === 0 ? (
                <div className="py-16 flex flex-col items-center gap-2 text-center">
                  <CalendarIcon className="h-10 w-10 text-muted-foreground/25" />
                  <p className="text-sm text-muted-foreground">No events on this day.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedEvents.map((event) => {
                    const TypeIcon = TYPE_ICON[event.type];
                    const StatusIcon = STATUS_ICON[event.status];
                    const overdue = isOverdue(event);
                    return (
                      <div
                        key={event.id}
                        className={`flex items-start gap-3 p-3.5 rounded-xl border-l-4 border border-border bg-card transition-colors ${TYPE_BORDER[event.type]} ${
                          event.status === 'cancelled' ? 'opacity-50' : ''
                        }`}
                      >
                        <div className={`shrink-0 rounded-lg p-1.5 mt-0.5 border ${TYPE_STYLES[event.type]}`}>
                          <TypeIcon className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-sm font-semibold leading-snug ${event.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                              {event.title}
                            </p>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 shrink-0 text-muted-foreground hover:text-foreground"
                                  disabled={deletingId === event.id || updatingStatusId === event.id}
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                {event.status !== 'completed' && (
                                  <DropdownMenuItem onClick={() => handleStatusChange(event, 'completed')}>
                                    <CheckCircle2Icon className="mr-2 h-4 w-4 text-green-500" />
                                    Mark Complete
                                  </DropdownMenuItem>
                                )}
                                {event.status !== 'pending' && (
                                  <DropdownMenuItem onClick={() => handleStatusChange(event, 'pending')}>
                                    <CircleIcon className="mr-2 h-4 w-4 text-amber-500" />
                                    Mark Pending
                                  </DropdownMenuItem>
                                )}
                                {event.status !== 'cancelled' && (
                                  <DropdownMenuItem onClick={() => handleStatusChange(event, 'cancelled')}>
                                    <XCircleIcon className="mr-2 h-4 w-4 text-red-500" />
                                    Cancel Event
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => openEdit(event)}>
                                  <PencilIcon className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  disabled={deletingId === event.id}
                                  onClick={() => handleDelete(event.id)}
                                >
                                  <Trash2Icon className="mr-2 h-4 w-4" />
                                  {deletingId === event.id ? 'Deleting…' : 'Delete'}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          {event.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-3">
                              {event.description}
                            </p>
                          )}
                          <div className="flex flex-wrap items-center gap-1.5 mt-2">
                            <Badge className={`text-[11px] border px-1.5 py-0 ${TYPE_STYLES[event.type]}`}>
                              {EVENT_TYPES.find((t) => t.value === event.type)?.label ?? event.type}
                            </Badge>
                            <Badge className={`text-[11px] border px-1.5 py-0 flex items-center gap-1 ${STATUS_STYLES[event.status]}`}>
                              <StatusIcon className="h-2.5 w-2.5" />
                              {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                            </Badge>
                            {overdue && (
                              <Badge className="text-[11px] border px-1.5 py-0 bg-red-500/10 text-red-600 border-red-500/20">
                                Overdue
                              </Badge>
                            )}
                            {event.event_time && (
                              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                <ClockIcon className="h-3 w-3" />
                                {formatTime(event.event_time)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* ── Add / Edit Dialog ─────────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editItem ? 'Edit Event' : 'Add Event'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="e.g. CT 1 for CSE 1111"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Description <span className="text-muted-foreground/60">(optional)</span>
              </Label>
              <Textarea
                placeholder="Add notes or details…"
                className="resize-none text-sm min-h-[72px]"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v as EventType }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="date"
                  value={form.event_date}
                  onChange={(e) => setForm((f) => ({ ...f, event_date: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Time <span className="text-muted-foreground/60">(optional)</span>
                </Label>
                <Input
                  type="time"
                  value={form.event_time}
                  onChange={(e) => setForm((f) => ({ ...f, event_time: e.target.value }))}
                />
              </div>
            </div>

            {editItem && (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as EventStatus }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EVENT_STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button
              className="bg-primary hover:bg-primary/90"
              disabled={saving || !form.title.trim() || !form.event_date}
              onClick={handleSave}
            >
              {saving ? 'Saving…' : editItem ? 'Save Changes' : 'Add Event'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
