"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import {
  UsersIcon, 
  TrendingUpIcon, 
  DollarSignIcon, 
  ActivityIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  BookOpenIcon,
  HelpCircleIcon,
  FileIcon
} from "lucide-react";
import { useAuthStore } from "@/store/auth";

export default function DashboardPage() {
  const { user } = useAuthStore();

  const stats = [
    {
      title: "Total Users",
      value: "2,345",
      change: "+12%",
      trend: "up",
      icon: UsersIcon,
    },
    {
      title: "Active Courses",
      value: "48",
      change: "+18%",
      trend: "up",
      icon: BookOpenIcon,
    },
    {
      title: "Question Bank",
      value: "1,247",
      change: "+25%",
      trend: "up",
      icon: HelpCircleIcon,
    },
    {
      title: "Files Uploaded",
      value: "573",
      change: "+8%",
      trend: "up",
      icon: FileIcon,
    },
  ];

  return (
    <ProtectedRoute>
      <div className="flex-1 space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Welcome back, {user.profile?.full_name || user.email.split('@')[0]}! 👋
            </h1>
            <p className="text-muted-foreground mt-1">
              Here's what's happening with your dashboard today.
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <Card key={index} className="p-6 hover:shadow-md transition-shadow">
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
                {stat.trend === "up" ? (
                  <ArrowUpIcon className="h-4 w-4 text-green-500 mr-1" />
                ) : (
                  <ArrowDownIcon className="h-4 w-4 text-red-500 mr-1" />
                )}
                <span className={`text-sm font-medium ${
                  stat.trend === "up" ? "text-green-500" : "text-red-500"
                }`}>
                  {stat.change}
                </span>
                <span className="text-sm text-muted-foreground ml-2">
                  from last month
                </span>
              </div>
            </Card>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="col-span-2 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Recent Activity</h2>
            </div>
            <div className="space-y-4">
              {[
                { action: "New course created", user: "John Doe", time: "2 minutes ago" },
                { action: "Question added to bank", user: "Jane Smith", time: "5 minutes ago" },
                { action: "Video uploaded", user: "Dr. Mike Johnson", time: "10 minutes ago" },
                { action: "User registration", user: "sarah@example.com", time: "15 minutes ago" },
              ].map((activity, index) => (
                <div key={index} className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium">{activity.action}</p>
                    <p className="text-sm text-muted-foreground">{activity.user}</p>
                  </div>
                  <span className="text-sm text-muted-foreground">{activity.time}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link href="/dashboard/courses" className="block w-full text-left p-3 rounded-lg border hover:bg-accent transition-colors">
                <p className="font-medium">Create New Course</p>
                <p className="text-sm text-muted-foreground">Add training courses</p>
              </Link>
              <Link href="/dashboard/questions" className="block w-full text-left p-3 rounded-lg border hover:bg-accent transition-colors">
                <p className="font-medium">Add Questions</p>
                <p className="text-sm text-muted-foreground">Build question bank</p>
              </Link>
              <Link href="/dashboard/upload" className="block w-full text-left p-3 rounded-lg border hover:bg-accent transition-colors">
                <p className="font-medium">Upload Content</p>
                <p className="text-sm text-muted-foreground">Add learning materials</p>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}