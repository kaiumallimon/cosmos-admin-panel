'use client';

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
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import { UserPlus, ArrowLeft, Save } from "lucide-react";
import { useMobileMenu } from "@/components/mobile-menu-context";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CreateUserPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'user',
    phone: '',
    gender: '',
    student_id: '',
    department: '',
    batch: '',
    program: '',
    current_trimester: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { toggleMobileMenu } = useMobileMenu();
  const router = useRouter();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        router.push('/dashboard/users');
      } else {
        setError(data.error || 'Failed to create user');
      }
    } catch (error) {
      setError('An error occurred while creating the user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <FrostedHeader title="Create User" onMobileMenuToggle={toggleMobileMenu} />

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
                <BreadcrumbPage>Create User</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Header */}
        <div className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <UserPlus className="h-6 w-6" />
              <h1 className="text-2xl font-bold">Create New User</h1>
            </div>
            <Link href="/dashboard/users">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Users
              </Button>
            </Link>
          </div>
        </div>

        {/* Form */}
        <div className="p-6 pt-5">
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
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      placeholder="Enter password"
                      required
                    />
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
                    <Label htmlFor="gender">Gender</Label>
                    <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
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
                          <SelectItem value="summer_2024">Summer 2024</SelectItem>
                          <SelectItem value="fall_2024">Fall 2024</SelectItem>
                          <SelectItem value="spring_2025">Spring 2025</SelectItem>
                          <SelectItem value="summer_2025">Summer 2025</SelectItem>
                          <SelectItem value="fall_2025">Fall 2025</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex items-center gap-4 pt-4">
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Create User
                    </>
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.push('/dashboard/users')}>
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