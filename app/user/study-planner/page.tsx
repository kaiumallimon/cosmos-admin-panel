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
  CalendarDaysIcon,
  FilterIcon,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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

const DEFAULT_FORM = {
  title: '',
  description: '',
  type: 'task' as EventType,
  event_date: '',
  event_time: '',
  status: 'pending' as EventStatus,
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(timeStr: string) {
  const [h, m] = timeStr.split(':');
  const hour = parseInt(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

function todayIso() {
  return new Date().toISOString().split('T')[0];
}

function groupByDate(events: CalendarEvent[]): [string, CalendarEvent[]][] {
  const map = new Map<string, CalendarEvent[]>();
  for (const e of events) {
    if (!map.has(e.event_date)) map.set(e.event_date, []);
    map.get(e.event_date)!.push(e);
  }
  return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
}

function isOverdue(e: CalendarEvent) {
  return e.status === 'pending' && e.event_date < todayIso();
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function StudyPlannerPage() {
  const { user } = useAuthStore();
  const { toggleMobileMenu } = useMobileMenu();
  const studentId = user.profile?.id as string | undefined;

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Filters ─────────────────────────────────────────────────────────
  const [filterType, setFilterType] = useState<EventType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<EventStatus | 'all'>('all');

  // ── Dialog ──────────────────────────────────────────────────────────
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

  useEffect(() => {
    fetchEvents();
  }, [studentId]);

  // ── Derived stats ─────────────────────────────────────────────────

  const stats = useMemo(() => {
    const today = todayIso();
    return {
      total: events.length,
      pending: events.filter((e) => e.status === 'pending').length,
      completed: events.filter((e) => e.status === 'completed').length,
      today: events.filter((e) => e.event_date === today).length,
      overdue: events.filter(isOverdue).length,
    };
  }, [events]);

  // ── Filtered + grouped events ──────────────────────────────────────

  const filtered = useMemo(() => {
    return events.filter((e) => {
      if (filterType !== 'all' && e.type !== filterType) return false;
      if (filterStatus !== 'all' && e.status !== filterStatus) return false;
      return true;
    });
  }, [events, filterType, filterStatus]);

  const grouped = useMemo(() => groupByDate(filtered), [filtered]);

  // ── Handlers ──────────────────────────────────────────────────────

  const openAdd = () => {
    setEditItem(null);
    setForm({ ...DEFAULT_FORM, event_date: todayIso() });
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
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i} className="border shadow-sm">
                <CardContent className="p-5">
                  <Skeleton className="h-4 w-24 mb-3" />
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
          <Card className="border shadow-sm">
            <CardContent className="p-4"><Skeleton className="h-9 w-full" /></CardContent>
          </Card>
          <Card className="border shadow-sm">
            <CardHeader><Skeleton className="h-6 w-40" /></CardHeader>
            <CardContent className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────

  const today = todayIso();

  return (
    <div className="flex flex-col h-full">
      <FrostedHeader title="Study Planner" onMobileMenuToggle={toggleMobileMenu} showSearch={false} />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {([
            { label: 'Total Events', value: stats.total, color: 'text-foreground', bg: 'bg-primary/10' },
            { label: 'Pending', value: stats.pending, color: 'text-amber-600', bg: 'bg-amber-500/10' },
            { label: 'Completed', value: stats.completed, color: 'text-green-600', bg: 'bg-green-500/10' },
            { label: "Today's Events", value: stats.today, color: 'text-blue-600', bg: 'bg-blue-500/10' },
            { label: 'Overdue', value: stats.overdue, color: 'text-red-600', bg: 'bg-red-500/10' },
          ] as const).map((s) => (
            <Card key={s.label} className="border shadow-sm">
              <CardContent className="p-4 sm:p-5">
                <p className="text-xs text-muted-foreground mb-2">{s.label}</p>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── Controls ── */}
        <Card className="border shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Select value={filterType} onValueChange={(v) => setFilterType(v as EventType | 'all')}>
                <SelectTrigger className="h-9 w-[140px] text-sm">
                  <FilterIcon className="h-3.5 w-3.5 mr-1.5 text-muted-foreground shrink-0" />
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {EVENT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as EventStatus | 'all')}>
                <SelectTrigger className="h-9 w-[150px] text-sm">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {EVENT_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {(filterType !== 'all' || filterStatus !== 'all') && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => { setFilterType('all'); setFilterStatus('all'); }}
                >
                  Clear filters
                </Button>
              )}

              <div className="flex-1" />

              <Button variant="outline" size="sm" onClick={fetchEvents} className="h-9" title="Refresh">
                <RefreshCwIcon className="h-4 w-4" />
              </Button>
              <Button size="sm" className="h-9 gap-1.5 bg-primary hover:bg-primary/90" onClick={openAdd}>
                <PlusIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Add Event</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ── Events list ── */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <CalendarDaysIcon className="h-5 w-5" />
              Events
              {filtered.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs font-normal">
                  {filtered.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {grouped.length === 0 ? (
              <div className="py-16 flex flex-col items-center gap-3 text-center">
                <CalendarIcon className="h-12 w-12 text-muted-foreground/30" />
                <p className="text-sm font-medium text-muted-foreground">
                  {filterType !== 'all' || filterStatus !== 'all'
                    ? 'No events match the current filters.'
                    : 'No events yet. Add your first event to get started!'}
                </p>
                {filterType === 'all' && filterStatus === 'all' && (
                  <Button size="sm" className="gap-2 mt-1" onClick={openAdd}>
                    <PlusIcon className="h-4 w-4" />
                    Add Event
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {grouped.map(([date, dateEvents]) => {
                  const isToday = date === today;
                  const isPast = date < today;
                  return (
                    <div key={date}>
                      {/* Date header */}
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
                          isToday
                            ? 'bg-primary text-primary-foreground'
                            : isPast
                            ? 'bg-muted text-muted-foreground'
                            : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                        }`}>
                          <CalendarIcon className="h-3 w-3" />
                          {isToday ? 'Today' : formatDate(date)}
                        </div>
                        <div className="flex-1 h-px bg-border" />
                      </div>

                      {/* Event cards */}
                      <div className="space-y-2 pl-1">
                        {[...dateEvents]
                          .sort((a, b) => {
                            if (!a.event_time && !b.event_time) return 0;
                            if (!a.event_time) return 1;
                            if (!b.event_time) return -1;
                            return a.event_time.localeCompare(b.event_time);
                          })
                          .map((event) => {
                            const TypeIcon = TYPE_ICON[event.type];
                            const StatusIcon = STATUS_ICON[event.status];
                            const overdue = isOverdue(event);
                            return (
                              <div
                                key={event.id}
                                className={`flex items-start gap-3 p-3.5 rounded-xl border-l-4 border border-border bg-card hover:bg-accent/30 transition-colors ${TYPE_BORDER[event.type]} ${
                                  event.status === 'cancelled' ? 'opacity-50' : ''
                                }`}
                              >
                                {/* Type icon */}
                                <div className={`shrink-0 rounded-lg p-1.5 mt-0.5 border ${TYPE_STYLES[event.type]}`}>
                                  <TypeIcon className="h-3.5 w-3.5" />
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <p className={`text-sm font-semibold leading-snug ${event.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                                      {event.title}
                                    </p>
                                    {/* Actions */}
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
                                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
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
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

      </div>

      {/* ── Add / Edit Dialog ─────────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editItem ? 'Edit Event' : 'Add Event'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Title */}
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

            {/* Description */}
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

            {/* Type */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v as EventType }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date & Time */}
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

            {/* Status — edit only */}
            {editItem && (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm((f) => ({ ...f, status: v as EventStatus }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
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