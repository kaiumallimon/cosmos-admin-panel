'use client';

import React from "react";
import { FrostedHeader } from "@/components/custom/frosted-header";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import { UserPen, ArrowLeft, Save } from "lucide-react";
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

export default function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  const [user, setUser] = useState<UserData | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    role: '',
    full_name: '',
    phone: '',
    gender: '',
    student_id: '',
    department: '',
    batch: '',
    program: '',
    current_trimester: '',
    completed_credits: '',
    cgpa: '',
    trimester_credits: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
        setFormData({
          email: data.data.email || '',
          role: data.data.role || '',
          full_name: data.data.profile?.full_name || '',
          phone: data.data.profile?.phone || '',
          gender: data.data.profile?.gender || 'not_specified',
          student_id: data.data.profile?.student_id || '',
          department: data.data.profile?.department || 'not_specified',
          batch: data.data.profile?.batch || '',
          program: data.data.profile?.program || 'not_specified',
          current_trimester: data.data.profile?.current_trimester || 'not_specified',
          completed_credits: data.data.profile?.completed_credits?.toString() || '',
          cgpa: data.data.profile?.cgpa?.toString() || '',
          trimester_credits: data.data.profile?.trimester_credits?.toString() || ''
        });
      } else {
        setError(data.error || 'Failed to load user');
      }
    } catch (error) {
      setError('An error occurred while loading user data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const submitData = {
        ...formData,
        gender: formData.gender === 'not_specified' ? null : formData.gender,
        department: formData.department === 'not_specified' ? null : formData.department,
        program: formData.program === 'not_specified' ? null : formData.program,
        current_trimester: formData.current_trimester === 'not_specified' ? null : formData.current_trimester,
        completed_credits: formData.completed_credits ? parseInt(formData.completed_credits) : null,
        cgpa: formData.cgpa ? parseFloat(formData.cgpa) : null,
        trimester_credits: formData.trimester_credits ? parseInt(formData.trimester_credits) : null
      };

      const response = await fetch(`/api/users/${resolvedParams.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();

      if (response.ok) {
        router.push(`/dashboard/users/${resolvedParams.id}`);
      } else {
        setError(data.error || 'Failed to update user');
      }
    } catch (error) {
      setError('An error occurred while updating the user');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background">
          <FrostedHeader title="Edit User" onMobileMenuToggle={toggleMobileMenu} />
          <div className="p-6">
            <div className="space-y-6">
              <Skeleton className="h-8 w-64" />
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error && !user) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background">
          <FrostedHeader title="Edit User" onMobileMenuToggle={toggleMobileMenu} />
          <div className="p-6">
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-destructive mb-2">Error</h2>
              <p className="text-muted-foreground mb-4">{error}</p>
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
        <FrostedHeader title="Edit User" onMobileMenuToggle={toggleMobileMenu} />

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
                <BreadcrumbLink href={`/dashboard/users/${resolvedParams.id}`}>
                  {user?.profile?.full_name}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Edit</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Header */}
        <div className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <UserPen className="h-6 w-6" />
              <h1 className="text-2xl font-bold">Edit User</h1>
            </div>
            <Link href={`/dashboard/users/${resolvedParams.id}`}>
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to User
              </Button>
            </Link>
          </div>
        </div>

        {/* Form */}
        <div className="p-6 pt-0">
          <Card>
          <CardHeader>
            <CardTitle>User Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
                  {error}
                </div>
              )}

              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Basic Information</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name *</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => handleInputChange('full_name', e.target.value)}
                      placeholder="Enter full name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="Enter email address"
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="role">Role *</Label>
                    <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">Student</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="not_specified">Not specified</SelectItem>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Student Information */}
              {formData.role === 'user' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Student Information</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="student_id">Student ID</Label>
                      <Input
                        id="student_id"
                        value={formData.student_id}
                        onChange={(e) => handleInputChange('student_id', e.target.value)}
                        placeholder="Enter student ID"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="department">Department</Label>
                      <Select value={formData.department} onValueChange={(value) => handleInputChange('department', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="not_specified">Not specified</SelectItem>
                          <SelectItem value="CSE">Computer Science & Engineering</SelectItem>
                          <SelectItem value="EEE">Electrical & Electronic Engineering</SelectItem>
                          <SelectItem value="BBA">Business Administration</SelectItem>
                          <SelectItem value="ENG">English</SelectItem>
                          <SelectItem value="LAW">Law</SelectItem>
                          <SelectItem value="PHY">Physics</SelectItem>
                          <SelectItem value="MATH">Mathematics</SelectItem>
                          <SelectItem value="CHEM">Chemistry</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="batch">Batch</Label>
                      <Input
                        id="batch"
                        value={formData.batch}
                        onChange={(e) => handleInputChange('batch', e.target.value)}
                        placeholder="e.g., 2021"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="program">Program</Label>
                      <Select value={formData.program} onValueChange={(value) => handleInputChange('program', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select program" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="not_specified">Not specified</SelectItem>
                          <SelectItem value="undergraduate">Undergraduate</SelectItem>
                          <SelectItem value="graduate">Graduate</SelectItem>
                          <SelectItem value="postgraduate">Postgraduate</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="current_trimester">Current Trimester</Label>
                      <Select value={formData.current_trimester} onValueChange={(value) => handleInputChange('current_trimester', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select trimester" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="not_specified">Not specified</SelectItem>
                          <SelectItem value="summer_2024">Summer 2024</SelectItem>
                          <SelectItem value="fall_2024">Fall 2024</SelectItem>
                          <SelectItem value="spring_2025">Spring 2025</SelectItem>
                          <SelectItem value="summer_2025">Summer 2025</SelectItem>
                          <SelectItem value="fall_2025">Fall 2025</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Academic Performance */}
                  <h4 className="text-md font-semibold mt-6">Academic Performance</h4>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="completed_credits">Completed Credits</Label>
                      <Input
                        id="completed_credits"
                        type="number"
                        min="0"
                        value={formData.completed_credits}
                        onChange={(e) => handleInputChange('completed_credits', e.target.value)}
                        placeholder="Enter completed credits"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cgpa">CGPA</Label>
                      <Input
                        id="cgpa"
                        type="number"
                        min="0"
                        max="4"
                        step="0.01"
                        value={formData.cgpa}
                        onChange={(e) => handleInputChange('cgpa', e.target.value)}
                        placeholder="Enter CGPA"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="trimester_credits">Current Trimester Credits</Label>
                      <Input
                        id="trimester_credits"
                        type="number"
                        min="0"
                        value={formData.trimester_credits}
                        onChange={(e) => handleInputChange('trimester_credits', e.target.value)}
                        placeholder="Enter current credits"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex items-center gap-4 pt-4">
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.push(`/dashboard/users/${resolvedParams.id}`)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}