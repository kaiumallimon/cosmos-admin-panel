'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { PlusIcon, Trash2Icon } from 'lucide-react';
import { AlertTriangleIcon, RefreshCwIcon } from 'lucide-react';

interface Course {
  id: string;
  course_name: string;
  course_code: string;
}

interface Topic {
  id: string;
  topic_name: string;
}

interface Weakness {
  id: string;
  topic_id: string;
  topic_name: string;
  course_id: string;
  course_name: string;
  course_code?: string;
}

export default function WeaknessesPage() {
  const { user } = useAuthStore();
  const studentId = user.profile?.id;
  const trimester = user.profile?.current_trimester ?? '';

  const [courses, setCourses] = useState<Course[]>([]);
  const [weaknesses, setWeaknesses] = useState<Weakness[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCourse, setFilterCourse] = useState<string>('all');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchData = async () => {
    if (!studentId) return;
    setLoading(true);
    try {
      const [cRes, wRes] = await Promise.all([
        trimester
          ? fetch(`/api/performance/students/${studentId}/courses/${encodeURIComponent(trimester)}`)
          : fetch('/api/performance/courses'),
        fetch(`/api/performance/weaknesses/${studentId}`),
      ]);
      const cData = await cRes.json();
      setCourses(Array.isArray(cData) ? cData : []);
      const wData = await wRes.json();
      setWeaknesses(Array.isArray(wData) ? wData : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [studentId, trimester]);

  const loadTopics = async (courseId: string) => {
    setLoadingTopics(true);
    setTopics([]);
    setSelectedTopic('');
    try {
      const res = await fetch('/api/performance/course-topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ course_id: courseId }),
      });
      const data = await res.json();
      setTopics(Array.isArray(data) ? data : data?.topics ?? []);
    } finally {
      setLoadingTopics(false);
    }
  };

  const handleCourseChange = (courseId: string) => {
    setSelectedCourse(courseId);
    if (courseId) loadTopics(courseId);
  };

  const handleAdd = async () => {
    if (!studentId || !selectedCourse || !selectedTopic) return;
    setAdding(true);
    try {
      await fetch('/api/performance/weaknesses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId, course_id: selectedCourse, topic_id: selectedTopic }),
      });
      setDialogOpen(false);
      await fetchData();
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (w: Weakness) => {
    setDeletingId(w.id);
    try {
      await fetch('/api/performance/weaknesses', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId, topic_id: w.topic_id }),
      });
      await fetchData();
    } finally {
      setDeletingId(null);
    }
  };

  const openDialog = () => {
    setSelectedCourse('');
    setSelectedTopic('');
    setTopics([]);
    setDialogOpen(true);
  };

  const filtered =
    filterCourse === 'all' ? weaknesses : weaknesses.filter((w) => w.course_id === filterCourse);

  // Group by course
  const grouped: Record<string, { course: string; code?: string; items: Weakness[] }> = {};
  filtered.forEach((w) => {
    if (!grouped[w.course_id]) {
      grouped[w.course_id] = { course: w.course_name, code: w.course_code, items: [] };
    }
    grouped[w.course_id].items.push(w);
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-xl font-bold">Weaknesses</h2>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={filterCourse} onValueChange={setFilterCourse}>
            <SelectTrigger className="w-44 h-9 text-sm">
              <SelectValue placeholder="All Courses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courses</SelectItem>
              {courses.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.course_code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCwIcon className="h-4 w-4" />
          </Button>
          <Button size="sm" onClick={openDialog} className="gap-2 bg-[#007AFF] hover:bg-[#007AFF]/90">
            <PlusIcon /> Add Weakness
          </Button>
        </div>
      </div>

      {/* Weakness Groups */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-5 h-20" />
            </Card>
          ))}
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <Card className="border shadow-sm">
          <CardContent className="p-10 flex flex-col items-center gap-3 text-center">
            <AlertTriangleIcon className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              No weaknesses recorded. Mark topics you find difficult to track them.
            </p>
            <Button size="sm" onClick={openDialog} className="gap-2 bg-[#007AFF] hover:bg-[#007AFF]/90">
              <PlusIcon /> Add Weakness
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-5">
          {Object.entries(grouped).map(([courseId, group]) => (
            <Card key={courseId} className="border shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangleIcon className="h-4 w-4 text-amber-500" />
                  <span className="font-semibold text-sm">{group.course}</span>
                  {group.code && (
                    <Badge variant="outline" className="text-xs">
                      {group.code}
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {group.items.map((w) => (
                    <div
                      key={w.id}
                      className="flex items-center gap-1.5 bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-full px-3 py-1 text-xs font-medium"
                    >
                      {w.topic_name}
                      <button
                        disabled={deletingId === w.id}
                        onClick={() => handleDelete(w)}
                        className="ml-0.5 hover:text-destructive transition-colors"
                      >
                        <Trash2Icon className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Weakness Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Weakness</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Course</label>
              <Select value={selectedCourse} onValueChange={handleCourseChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.course_code} — {c.course_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Topic</label>
              <Select
                value={selectedTopic}
                onValueChange={setSelectedTopic}
                disabled={!selectedCourse || loadingTopics}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      loadingTopics ? 'Loading topics…' : !selectedCourse ? 'Select course first' : 'Select topic'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {topics.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.topic_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={adding || !selectedCourse || !selectedTopic}
              onClick={handleAdd}
              className="bg-[#007AFF] hover:bg-[#007AFF]/90"
            >
              {adding ? 'Adding…' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
