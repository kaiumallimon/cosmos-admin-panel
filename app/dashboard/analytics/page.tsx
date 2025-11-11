"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart3Icon,
  TrendingUpIcon,
  UsersIcon,
  BookOpenIcon,
  ClockIcon,
  StarIcon,
  DownloadIcon,
  PlayIcon,
  GraduationCapIcon,
  AwardIcon,
} from "lucide-react";

export default function AnalyticsPage() {
  const stats = [
    {
      title: "Course Completion Rate",
      value: "78.5%",
      change: "+5.2%",
      trend: "up",
      icon: GraduationCapIcon,
    },
    {
      title: "Average Score",
      value: "85.3%",
      change: "+2.1%",
      trend: "up",
      icon: AwardIcon,
    },
    {
      title: "Study Hours",
      value: "12,450",
      change: "+15%",
      trend: "up",
      icon: ClockIcon,
    },
    {
      title: "Active Students",
      value: "1,892",
      change: "+8.3%",
      trend: "up",
      icon: UsersIcon,
    },
  ];

  const topCourses = [
    {
      title: "Advanced React Development",
      students: 156,
      completion: 85,
      rating: 4.8,
      revenue: "$12,450"
    },
    {
      title: "UI/UX Design Fundamentals",
      students: 203,
      completion: 92,
      rating: 4.9,
      revenue: "$15,220"
    },
    {
      title: "Data Science with Python",
      students: 89,
      completion: 67,
      rating: 4.7,
      revenue: "$8,900"
    },
    {
      title: "Digital Marketing Strategy",
      students: 67,
      completion: 78,
      rating: 4.6,
      revenue: "$6,700"
    },
  ];

  const learningProgress = [
    { month: "Jan", completed: 45, started: 52 },
    { month: "Feb", completed: 52, started: 61 },
    { month: "Mar", completed: 48, started: 55 },
    { month: "Apr", completed: 61, started: 67 },
    { month: "May", completed: 55, started: 58 },
    { month: "Jun", completed: 67, started: 72 },
  ];

  const questionStats = [
    {
      category: "React Development",
      total: 245,
      answered: 198,
      avgScore: 87,
    },
    {
      category: "CSS/Styling", 
      total: 178,
      answered: 156,
      avgScore: 82,
    },
    {
      category: "JavaScript",
      total: 312,
      answered: 278,
      avgScore: 79,
    },
    {
      category: "Database",
      total: 156,
      answered: 134,
      avgScore: 85,
    },
  ];

  return (
    <ProtectedRoute>
      <div className="flex-1 space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Track learning progress, course performance, and student engagement.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Select defaultValue="30">
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 3 months</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <DownloadIcon className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <Card key={index} className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold mt-2">{stat.value}</p>
                </div>
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <stat.icon className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div className="flex items-center mt-4">
                <TrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm font-medium text-green-500">
                  {stat.change}
                </span>
                <span className="text-sm text-muted-foreground ml-2">
                  from last month
                </span>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Learning Progress Chart */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Learning Progress Trends</h2>
              <Button variant="outline" size="sm">
                <BarChart3Icon className="h-4 w-4 mr-2" />
                View Details
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary"></div>
                  <span>Courses Completed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-secondary"></div>
                  <span>Courses Started</span>
                </div>
              </div>
              
              {/* Simple bar chart representation */}
              <div className="space-y-3">
                {learningProgress.map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-8 text-sm font-medium">{item.month}</div>
                    <div className="flex-1 flex items-center gap-1">
                      <div 
                        className="bg-primary h-6 rounded-sm flex items-center justify-center text-xs text-white font-medium"
                        style={{ width: `${(item.completed / 80) * 100}%`, minWidth: '20px' }}
                      >
                        {item.completed}
                      </div>
                      <div 
                        className="bg-secondary h-6 rounded-sm flex items-center justify-center text-xs font-medium"
                        style={{ width: `${(item.started / 80) * 100}%`, minWidth: '20px' }}
                      >
                        {item.started}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Top Performing Courses */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Top Performing Courses</h2>
              <Button variant="outline" size="sm">
                View All
              </Button>
            </div>
            
            <div className="space-y-4">
              {topCourses.map((course, index) => (
                <div key={index} className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
                  <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <BookOpenIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{course.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <span>{course.students} students</span>
                      <span>{course.completion}% completion</span>
                      <div className="flex items-center gap-1">
                        <StarIcon className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span>{course.rating}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-green-600">{course.revenue}</div>
                    <div className="text-xs text-muted-foreground">Revenue</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Question Bank Performance */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Question Bank Performance</h2>
            <Button variant="outline" size="sm">
              View Question Analytics
            </Button>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {questionStats.map((category, index) => (
              <div key={index} className="p-4 bg-muted/30 rounded-lg">
                <h3 className="font-medium mb-3">{category.category}</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Questions:</span>
                    <span className="font-medium">{category.total}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Answered:</span>
                    <span className="font-medium">{category.answered}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Avg Score:</span>
                    <span className="font-medium text-primary">{category.avgScore}%</span>
                  </div>
                  <div className="mt-2">
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${(category.answered / category.total) * 100}%` }}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {Math.round((category.answered / category.total) * 100)}% completion rate
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Activity Summary */}
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Recent Course Activity</h2>
            <div className="space-y-3">
              {[
                { action: "Course completed", course: "React Development", time: "2 min ago" },
                { action: "New enrollment", course: "UI/UX Design", time: "5 min ago" },
                { action: "Quiz submitted", course: "Data Science", time: "8 min ago" },
                { action: "Assignment uploaded", course: "Digital Marketing", time: "12 min ago" },
              ].map((activity, index) => (
                <div key={index} className="flex items-center gap-3 text-sm">
                  <div className="h-2 w-2 rounded-full bg-primary"></div>
                  <div className="flex-1">
                    <span className="font-medium">{activity.action}</span>
                    <span className="text-muted-foreground"> in {activity.course}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{activity.time}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Content Engagement</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PlayIcon className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">Video Views</span>
                </div>
                <span className="font-medium">8,245</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DownloadIcon className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Downloads</span>
                </div>
                <span className="font-medium">1,432</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpenIcon className="h-4 w-4 text-purple-500" />
                  <span className="text-sm">Assignments</span>
                </div>
                <span className="font-medium">567</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <StarIcon className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm">Reviews</span>
                </div>
                <span className="font-medium">234</span>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Performance Goals</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Monthly Enrollments</span>
                  <span>85/100</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: "85%" }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Course Completion</span>
                  <span>78/80%</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: "97.5%" }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Student Satisfaction</span>
                  <span>4.8/5.0</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div className="bg-yellow-500 h-2 rounded-full" style={{ width: "96%" }}></div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}