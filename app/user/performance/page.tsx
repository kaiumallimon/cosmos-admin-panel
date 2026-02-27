'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth';
import { FrostedHeader } from '@/components/custom/frosted-header';
import { useMobileMenu } from '@/components/mobile-menu-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  BookOpenIcon,
  ClipboardListIcon,
  AlertTriangleIcon,
  BrainCircuitIcon,
  ArrowRightIcon,
  TrendingUpIcon,
  SparklesIcon,
} from 'lucide-react';
import Link from 'next/link';

interface CourseEnrollment {
  id: string;
  course_name: string;
  course_code: string;
  trimester: string;
}

interface Assessment {
  id: string;
  assessment_type: string;
  score: number;
  max_score: number;
  course_id: string;
}

interface Weakness {
  id: string;
  topic_name: string;
  course_name: string;
}

export default function PerformanceOverviewPage() {
  const { user } = useAuthStore();
  const { toggleMobileMenu } = useMobileMenu();
  const studentId = user.profile?.id;
  const trimester = user.profile?.current_trimester;
  const cgpa = user.profile?.cgpa;

  const [courses, setCourses] = useState<CourseEnrollment[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [weaknesses, setWeaknesses] = useState<Weakness[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentId) return;
    const fetchAll = async () => {
      try {
        const [cRes, aRes, wRes] = await Promise.all([
          trimester
            ? fetch(`/api/performance/students/${studentId}/courses/${encodeURIComponent(trimester)}`)
            : Promise.resolve(null),
          fetch(`/api/performance/assessments/student/${studentId}`),
          fetch(`/api/performance/weaknesses/${studentId}`),
        ]);
        if (cRes) {
          const cData = await cRes.json();
          setCourses(Array.isArray(cData) ? cData : []);
        }
        const aData = await aRes.json();
        setAssessments(Array.isArray(aData) ? aData : []);
        const wData = await wRes.json();
        setWeaknesses(Array.isArray(wData) ? wData : []);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [studentId, trimester]);

  const avgScore =
    assessments.length > 0
      ? Math.round(
          (assessments.reduce((s, a) => s + (a.score / (a.max_score || 1)) * 100, 0) /
            assessments.length) *
            10,
        ) / 10
      : null;

  const quickLinks = [
    {
      label: 'My Courses',
      href: '/user/performance/courses',
      icon: BookOpenIcon,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      description: 'Manage your enrolled courses',
    },
    {
      label: 'Assessments',
      href: '/user/performance/assessments',
      icon: ClipboardListIcon,
      color: 'text-green-500',
      bg: 'bg-green-500/10',
      description: 'Track scores and add results',
    },
    {
      label: 'Weaknesses',
      href: '/user/performance/weaknesses',
      icon: AlertTriangleIcon,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
      description: 'Identify areas to improve',
    },
    {
      label: 'Quiz',
      href: '/user/performance/quiz',
      icon: BrainCircuitIcon,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
      description: 'Practice with AI-generated quizzes',
    },
    {
      label: 'Grade Prediction',
      href: '/user/performance/predict',
      icon: SparklesIcon,
      color: 'text-pink-500',
      bg: 'bg-pink-500/10',
      description: 'Predict your final grades',
    },
  ];

  return (
    <div className="flex flex-col h-full">
      <FrostedHeader title="Performance Overview" onMobileMenuToggle={toggleMobileMenu} showSearch={false} />
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
      {/* Welcome Banner */}
      <div className="rounded-2xl bg-[#007AFF] text-white p-6 shadow-md">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-2xl font-bold mb-1 flex items-center gap-2">
              <TrendingUpIcon className="h-6 w-6" />
              Performance Tracker
            </h2>
            <p className="text-white/80 text-sm max-w-md">
              Monitor your academic performance, identify weaknesses, practice quizzes, and predict your grades using AI.
            </p>
          </div>
          {trimester && (
            <Badge className="bg-white/20 text-white border-white/30 shrink-0 mt-1">
              Trimester {trimester}
            </Badge>
          )}
        </div>
        <div className="mt-5">
          <Button asChild className="bg-white text-[#007AFF] hover:bg-white/90 font-semibold gap-2">
            <Link href="/user/performance/predict">
              <SparklesIcon className="h-4 w-4" />
              Predict My Grade
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Enrolled Courses', value: loading ? '—' : courses.length.toString() },
          { label: 'Assessments', value: loading ? '—' : assessments.length.toString() },
          { label: 'Weaknesses', value: loading ? '—' : weaknesses.length.toString() },
          {
            label: 'Avg Score',
            value: loading ? '—' : avgScore !== null ? `${avgScore}%` : 'N/A',
          },
        ].map((stat) => (
          <Card key={stat.label} className="border shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
              <p className="text-2xl font-bold">{stat.value}</p>
              {stat.label === 'Avg Score' && cgpa !== undefined && cgpa !== null && (
                <p className="text-xs text-muted-foreground mt-1">CGPA: {cgpa}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Links */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Quick Access
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickLinks.map((item) => (
            <Link key={item.href} href={item.href}>
              <Card className="border shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="p-5 flex items-start gap-4">
                  <div className={`rounded-xl p-2.5 shrink-0 ${item.bg}`}>
                    <item.icon className={`h-5 w-5 ${item.color}`} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{item.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Weaknesses */}
      {weaknesses.length > 0 && (
        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangleIcon className="h-4 w-4 text-amber-500" />
              Recent Weaknesses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {weaknesses.slice(0, 8).map((w) => (
                <Badge key={w.id} variant="secondary" className="text-xs">
                  {w.topic_name}
                  {w.course_name && (
                    <span className="ml-1 text-muted-foreground">· {w.course_name}</span>
                  )}
                </Badge>
              ))}
              {weaknesses.length > 8 && (
                <Badge variant="outline" className="text-xs">
                  +{weaknesses.length - 8} more
                </Badge>
              )}
            </div>
            <Link
              href="/user/performance/weaknesses"
              className="mt-3 text-xs text-[#007AFF] inline-flex items-center gap-1 hover:underline"
            >
              Manage weaknesses <ArrowRightIcon className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>
      )}
      </div>
    </div>
  );
}
