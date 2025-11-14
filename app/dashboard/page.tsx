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
  Activity
} from "lucide-react";
import { useState, useEffect } from "react";

interface UserStats {
  totalUsers: number;
  roleDistribution: Record<string, number>;
  departmentDistribution: Record<string, number>;
  recentRegistrations: number;
  dailyRegistrations: Record<string, number>;
  averageCgpa: string;
}

export default function DashboardHome() {
  const { toggleMobileMenu } = useMobileMenu();
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [questionCount, setQuestionCount] = useState<number>(0);
  const [agentCount, setAgentCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        setError(null);

        const [userStatsRes, questionCountRes, agentsRes] = await Promise.all([
          fetch('/api/users/stats'),
          fetch('/api/questions/count'),
          fetch('/api/agents')
        ]);

        if (userStatsRes.ok) {
          const userStatsData = await userStatsRes.json();
          setUserStats(userStatsData.data);
        }

        if (questionCountRes.ok) {
          const questionData = await questionCountRes.json();
          setQuestionCount(questionData.count || 0);
        }

        if (agentsRes.ok) {
          const agentsData = await agentsRes.json();
          setAgentCount(Array.isArray(agentsData) ? agentsData.length : 0);
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
  const roleChartData = userStats?.roleDistribution ? 
    Object.entries(userStats.roleDistribution).map(([name, value]) => ({ name, value })) : [];

  const departmentChartData = userStats?.departmentDistribution ? 
    Object.entries(userStats.departmentDistribution).map(([name, value]) => ({ name, value })) : [];

  const dailyRegistrationsData = userStats?.dailyRegistrations ? 
    Object.entries(userStats.dailyRegistrations)
      .map(([date, count]) => ({ 
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), 
        registrations: count 
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) : [];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <FrostedHeader 
          title="Dashboard" 
          subtitle="Welcome to your dashboard overview." 
          onMobileMenuToggle={toggleMobileMenu}
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {loading ? (
              Array(4).fill(0).map((_, i) => (
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
                  value={userStats?.totalUsers || 0}
                  description="Registered users in the system"
                  icon={Users}
                  trend={{
                    value: userStats?.recentRegistrations ? 
                      Math.round((userStats.recentRegistrations / (userStats.totalUsers || 1)) * 100) : 0,
                    isPositive: true
                  }}
                />
                <StatsCard
                  title="Questions Bank"
                  value={questionCount}
                  description="Total questions available"
                  icon={BookOpen}
                />
                <StatsCard
                  title="AI Agents"
                  value={agentCount}
                  description="Active AI agents configured"
                  icon={Bot}
                />
                <StatsCard
                  title="Average CGPA"
                  value={userStats?.averageCgpa || '0.00'}
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
                {dailyRegistrationsData.length > 0 && (
                  <div className="lg:col-span-2">
                    <DashboardAreaChart
                      data={dailyRegistrationsData}
                      dataKey="registrations"
                      xAxisKey="date"
                      title="User Registrations"
                      description="Daily user registrations over the last 7 days"
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
                        {userStats?.recentRegistrations || 0} new users registered
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
                        {questionCount} questions in database
                      </p>
                      <p className="text-xs text-muted-foreground">Available for student practice</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {agentCount} AI agents configured
                      </p>
                      <p className="text-xs text-muted-foreground">Ready to assist students</p>
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

