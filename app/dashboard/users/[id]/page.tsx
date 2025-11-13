'use client';

import React from "react";
import { FrostedHeader } from "@/components/custom/frosted-header";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import {
  User,
  ArrowLeft,
  Edit,
  Trash2,
  Mail,
  Phone,
  Calendar,
  GraduationCap,
  Building,
  BookOpen,
  Award,
  UserCheck
} from "lucide-react";
import { useMobileMenu } from "@/components/mobile-menu-context";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface UserData {
  id: string;
  email: string;
  role: string;
  created_at: string;
  updated_at: string;
  profile: {
    full_name: string;
    phone?: string;
    gender?: string;
    student_id?: string;
    department?: string;
    batch?: string;
    program?: string;
    current_trimester?: string;
    completed_credits?: number;
    cgpa?: number;
    trimester_credits?: number;
  };
}

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { toggleMobileMenu } = useMobileMenu();
  const router = useRouter();

  useEffect(() => {
    loadUser();
  }, [resolvedParams.id]);

  const loadUser = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/users/${resolvedParams.id}`);
      const data = await response.json();

      if (response.ok) {
        setUser(data.data);
      } else {
        setError(data.error || 'Failed to load user');
      }
    } catch (error) {
      setError('An error occurred while loading user data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

    try {
      const response = await fetch(`/api/users/${resolvedParams.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/dashboard/users');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete user');
      }
    } catch (error) {
      setError('An error occurred while deleting the user');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'user':
        return 'default';
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background">
          <FrostedHeader title="User Details" onMobileMenuToggle={toggleMobileMenu} />
          <div className="p-6">
            <div className="space-y-6">
              <Skeleton className="h-8 w-64" />
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <Skeleton className="h-6 w-32" />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <Skeleton className="h-6 w-32" />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !user) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background">
          <FrostedHeader title="User Details" onMobileMenuToggle={toggleMobileMenu} />
          <div className="p-6">
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-destructive mb-2">Error</h2>
              <p className="text-muted-foreground mb-4">{error || 'User not found'}</p>
              <Link href="/dashboard/users">
                <Button>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Users
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <FrostedHeader title="User Details" onMobileMenuToggle={toggleMobileMenu} />

        {/* Breadcrumbs */}
        <div className="p-6 pb-0">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard/users">Users</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{user.profile?.full_name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Header */}
        <div className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <User className="h-6 w-6" />
              <div>
                <h1 className="text-2xl font-bold">{user.profile?.full_name}</h1>
                <p className="text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href={`/dashboard/users/${resolvedParams.id}/edit`}>
                <Button variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </Link>
              <Button variant="outline" onClick={handleDeleteUser}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
              <Link href="/dashboard/users">
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* User Overview Cards */}
        <div className="mt-5 p-6 pt-0">
          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <Card className="bg-white dark:bg-card shadow rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-lg font-medium">User Profile</h2>
              </div>
              <p className="text-3xl font-bold">{user.profile?.full_name}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </Card>

            <Card className="bg-white dark:bg-card shadow rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <UserCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-lg font-medium">Account Status</h2>
              </div>
              <Badge variant={getRoleBadgeVariant(user.role)} className="mb-2">
                {user.role === 'admin' ? 'Administrator' : 'Student'}
              </Badge>
              <p className="text-sm text-muted-foreground">
                Joined {formatDate(user.created_at).split(' at')[0]}
              </p>
            </Card>

            {user.role === 'user' && user.profile?.cgpa && (
              <Card className="bg-white dark:bg-card shadow rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                    <Award className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <h2 className="text-lg font-medium">Academic Standing</h2>
                </div>
                <p className="text-3xl font-bold text-primary">{user.profile.cgpa}</p>
                <p className="text-sm text-muted-foreground">Current CGPA</p>
              </Card>
            )}
          </div>
        </div>

        {/* Detailed Information */}
        <div className="p-6 pt-0">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Personal & Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal & Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
                    <span className="text-sm font-medium text-muted-foreground">Full Name</span>
                    <span className="font-medium">{user.profile?.full_name || 'Not provided'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
                    <span className="text-sm font-medium text-muted-foreground">Email Address</span>
                    <span className="font-medium">{user.email}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
                    <span className="text-sm font-medium text-muted-foreground">Phone Number</span>
                    <span className="font-medium">{user.profile?.phone || 'Not provided'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
                    <span className="text-sm font-medium text-muted-foreground">Gender</span>
                    <span className="font-medium capitalize">{user.profile?.gender || 'Not specified'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm font-medium text-muted-foreground">Account Role</span>
                    <Badge variant={getRoleBadgeVariant(user.role)}>
                      {user.role === 'admin' ? 'Administrator' : 'Student'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Academic Information */}
            {user.role === 'user' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5" />
                    Academic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
                      <span className="text-sm font-medium text-muted-foreground">Student ID</span>
                      <span className="font-medium">{user.profile?.student_id || 'Not assigned'}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
                      <span className="text-sm font-medium text-muted-foreground">Department</span>
                      <span className="font-medium">{user.profile?.department || 'Not specified'}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
                      <span className="text-sm font-medium text-muted-foreground">Batch</span>
                      <span className="font-medium">{user.profile?.batch || 'Not specified'}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
                      <span className="text-sm font-medium text-muted-foreground">Program</span>
                      <span className="font-medium capitalize">{user.profile?.program || 'Not specified'}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm font-medium text-muted-foreground">Current Trimester</span>
                      <span className="font-medium">
                        {user.profile?.current_trimester 
                          ? user.profile.current_trimester.replace('_', ' ').toUpperCase()
                          : 'Not specified'
                        }
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Account Timeline */}
            <Card className={user.role === 'admin' ? 'lg:col-span-1' : ''}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Account Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                  <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-full">
                    <User className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="font-medium">Account Created</p>
                    <p className="text-sm text-muted-foreground">{formatDate(user.created_at)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                    <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium">Last Updated</p>
                    <p className="text-sm text-muted-foreground">{formatDate(user.updated_at)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Academic Performance - Only for students with performance data */}
            {user.role === 'user' && (user.profile?.cgpa || user.profile?.completed_credits || user.profile?.trimester_credits) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Academic Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 sm:grid-cols-3">
                    {user.profile?.cgpa && (
                      <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/10 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600 dark:text-orange-400 mb-1">
                          {user.profile.cgpa}
                        </div>
                        <p className="text-sm text-muted-foreground">CGPA</p>
                      </div>
                    )}

                    {user.profile?.completed_credits && (
                      <div className="text-center p-4 bg-green-50 dark:bg-green-900/10 rounded-lg">
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                          {user.profile.completed_credits}
                        </div>
                        <p className="text-sm text-muted-foreground">Completed Credits</p>
                      </div>
                    )}

                    {user.profile?.trimester_credits && (
                      <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                          {user.profile.trimester_credits}
                        </div>
                        <p className="text-sm text-muted-foreground">Current Credits</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}