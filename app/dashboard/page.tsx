'use client';

import { FrostedHeader } from "@/components/custom/frosted-header";
import { useMobileMenu } from "@/components/mobile-menu-context";
import ProtectedRoute from "@/components/ProtectedRoute";
import { StatsCard } from "@/components/dashboard/stats-card";
import { DashboardAreaChart, DashboardPieChart, DashboardBarChart } from "@/components/dashboard/chart-components";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Users, 
  BookOpen, 
  Bot, 
  TrendingUp, 
  UserPlus, 
  GraduationCap,
  BarChart3,
  Activity,
  FileText,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Database,
  Shield,
  Zap,
  Globe
} from "lucide-react";
import { useState, useEffect } from "react";

interface DashboardAnalytics {
  overview: {
    totalUsers: number;
    totalCourses: number;
    totalQuestions: number;
    totalAgents: number;
    systemOperations: number;
    successRate: number;
  };
  users: {
    roleDistribution: Record<string, number>;
    departmentDistribution: Record<string, number>;
    recentRegistrations: number;
    averageCGPA: number;
    studentsByBatch: Record<string, number>;
    genderDistribution: Record<string, number>;
  };
  courses: {
    departmentDistribution: Record<string, number>;
    creditDistribution: Record<string, number>;
    recentlyAdded: number;
  };
  questions: {
    subjectDistribution: Record<string, number>;
    examTypeDistribution: Record<string, number>;
    semesterDistribution: Record<string, number>;
    imageQuestions: number;
    totalMarks: number;
    questionsWithDescription: number;
  };
  agents: {
    activeAgents: number;
    inactiveAgents: number;
    toolsCount: number;
    configurationsCount: number;
    examplesCount: number;
  };
  system: {
    recentLogs: Array<{
      id: string;
      admin_name: string;
      method: string;
      description: string;
      timestamp: string;
      success: boolean;
    }>;
    errorRate: number;
    operationsByType: Record<string, number>;
    adminActivity: Record<string, number>;
    hourlyActivity: Record<string, number>;
  };
  growth: {
    usersLastMonth: number;
    questionsLastMonth: number;
    coursesLastMonth: number;
    operationsLastWeek: number;
  };
}

export default function DashboardHome() {
  const { toggleMobileMenu } = useMobileMenu();
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        setError(null);

        const analyticsRes = await fetch('/api/dashboard/analytics');

        if (analyticsRes.ok) {
          const analyticsData = await analyticsRes.json();
          if (analyticsData.success) {
            setAnalytics(analyticsData.data);
          } else {
            throw new Error('Failed to fetch analytics data');
          }
        } else {
          throw new Error('Failed to fetch analytics');
        }

      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  // Process data for charts
  const roleChartData = analytics?.users.roleDistribution ? 
    Object.entries(analytics.users.roleDistribution).map(([name, value]) => ({ name, value: value as number })) : [];

  const departmentChartData = analytics?.users.departmentDistribution ? 
    Object.entries(analytics.users.departmentDistribution).map(([name, value]) => ({ name, value: value as number })) : [];

  const subjectChartData = analytics?.questions.subjectDistribution ? 
    Object.entries(analytics.questions.subjectDistribution)
      .slice(0, 10) // Show top 10 subjects
      .map(([name, value]) => ({ name, value: value as number })) : [];

   return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <FrostedHeader 
          title="Dashboard" 
          subtitle="Welcome to your dashboard overview." 
          onMobileMenuToggle={toggleMobileMenu}
          showSearch={true}
        />

        <div className="p-6 space-y-6">
          {error && (
            <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
              <CardContent className="pt-6">
                <p className="text-red-600 dark:text-red-400">{error}</p>
              </CardContent>
            </Card>
          )}

          {/* Key Metrics Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
            {loading ? (
              Array(6).fill(0).map((_, i) => (
                <Card key={i} className="p-6">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-16 mb-1" />
                  <Skeleton className="h-3 w-32" />
                </Card>
              ))
            ) : (
              <>
                <StatsCard
                  title="Total Users"
                  value={analytics?.overview.totalUsers || 0}
                  description="Registered users in the system"
                  icon={Users}
                  trend={{
                    value: analytics?.growth.usersLastMonth || 0,
                    isPositive: true
                  }}
                />
                <StatsCard
                  title="Questions Bank"
                  value={analytics?.overview.totalQuestions || 0}
                  description={`${analytics?.questions.imageQuestions || 0} with images`}
                  icon={BookOpen}
                  trend={{
                    value: analytics?.growth.questionsLastMonth || 0,
                    isPositive: true
                  }}
                />
                <StatsCard
                  title="AI Agents"
                  value={analytics?.agents.activeAgents || 0}
                  description={`${analytics?.agents.toolsCount || 0} tools configured`}
                  icon={Bot}
                />
                <StatsCard
                  title="Courses"
                  value={analytics?.overview.totalCourses || 0}
                  description={`${analytics?.courses.recentlyAdded || 0} added this month`}
                  icon={FileText}
                  trend={{
                    value: analytics?.growth.coursesLastMonth || 0,
                    isPositive: true
                  }}
                />
                <StatsCard
                  title="System Health"
                  value={`${analytics?.overview.successRate || 0}%`}
                  description={`${analytics?.system.errorRate || 0}% error rate`}
                  icon={analytics && analytics.overview.successRate >= 95 ? CheckCircle2 : 
                        analytics && analytics.overview.successRate >= 80 ? AlertTriangle : Shield}
                />
                <StatsCard
                  title="Average CGPA"
                  value={analytics?.users.averageCGPA.toFixed(2) || '0.00'}
                  description="Student academic performance"
                  icon={GraduationCap}
                />
              </>
            )}
          </div>

          {/* Charts Section */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              Array(3).fill(0).map((_, i) => (
                <Card key={i} className="p-6">
                  <Skeleton className="h-6 w-32 mb-4" />
                  <Skeleton className="h-[300px] w-full" />
                </Card>
              ))
            ) : (
              <>
                {subjectChartData.length > 0 && (
                  <div className="lg:col-span-2">
                    <DashboardBarChart
                      data={subjectChartData}
                      dataKey="value"
                      xAxisKey="name"
                      title="Questions by Subject"
                      description="Distribution of questions across different subjects"
                    />
                  </div>
                )}

                {roleChartData.length > 0 && (
                  <DashboardPieChart
                    data={roleChartData}
                    title="User Roles Distribution"
                    description="Distribution of users by role"
                  />
                )}

                {departmentChartData.length > 0 && (
                  <div className="lg:col-span-2">
                    <DashboardBarChart
                      data={departmentChartData}
                      dataKey="value"
                      xAxisKey="name"
                      title="Students by Department"
                      description="Distribution of students across departments"
                    />
                  </div>
                )}
              </>
            )}
          </div>

          {/* Recent System Activity - Full Width */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                  <Activity className="h-6 w-6 text-primary" />
                  Recent System Activity
                </CardTitle>
                <div className="text-sm text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                  Live Updates
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {Array(6).fill(0).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : analytics && analytics.system.recentLogs.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {analytics.system.recentLogs.map((log, index) => (
                    <div key={log.id} className="flex items-start gap-4 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-all duration-200 border border-border shadow-sm hover:shadow-md">
                      <div className={`h-12 w-12 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                        log.success 
                          ? 'bg-green-100 dark:bg-green-900/40 border border-green-200 dark:border-green-800' 
                          : 'bg-red-100 dark:bg-red-900/40 border border-red-200 dark:border-red-800'
                      }`}>
                        {log.success ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`inline-block w-2 h-2 rounded-full ${
                            log.success ? 'bg-green-500' : 'bg-red-500'
                          }`}></span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            log.success 
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            {log.method}
                          </span>
                        </div>
                        <p className="text-sm font-medium line-clamp-2 mb-2">{log.description}</p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="font-medium">{log.admin_name}</span>
                          <span>{new Date(log.timestamp).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Activity className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="text-foreground text-lg font-medium mb-2">No recent activity</p>
                  <p className="text-muted-foreground text-sm">System activity will appear here as it happens</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {Array(3).fill(0).map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="space-y-1 flex-1">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <UserPlus className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {analytics?.growth.usersLastMonth || 0} new users registered
                      </p>
                      <p className="text-xs text-muted-foreground">In the last 30 days</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                      <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {analytics?.questions.questionsWithDescription || 0} detailed questions
                      </p>
                      <p className="text-xs text-muted-foreground">With comprehensive descriptions</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {analytics?.agents.activeAgents || 0} active AI agents
                      </p>
                      <p className="text-xs text-muted-foreground">
                        With {analytics?.agents.examplesCount || 0} example prompts
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                      <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {Object.keys(analytics?.users.departmentDistribution || {}).length} departments
                      </p>
                      <p className="text-xs text-muted-foreground">Across the university</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}

