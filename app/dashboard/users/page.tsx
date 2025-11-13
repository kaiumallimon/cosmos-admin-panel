'use client';

import { FrostedHeader } from "@/components/custom/frosted-header";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  Users,
  Search,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Filter,
  Download,
  UserCheck,
  UserX,
  User,
  X,
  Key,
  EyeOff,
  GraduationCap,
  Shield
} from "lucide-react";
import { useMobileMenu } from "@/components/mobile-menu-context";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface User {
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

interface UserStats {
  totalUsers: number;
  roleDistribution: Record<string, number>;
  departmentDistribution: Record<string, number>;
  recentRegistrations: number;
  averageCgpa: number;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [resetPasswordUser, setResetPasswordUser] = useState<{ id: string; name: string; email: string } | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const { toggleMobileMenu } = useMobileMenu();
  const router = useRouter();

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(searchInput);
      setCurrentPage(1); // Reset to first page when searching
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    loadUsers();
    loadStats();
  }, [currentPage, searchTerm, roleFilter, departmentFilter]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [roleFilter, departmentFilter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(searchTerm && { search: searchTerm }),
        ...(roleFilter && roleFilter !== 'all' && { role: roleFilter }),
        ...(departmentFilter && departmentFilter !== 'all' && { department: departmentFilter }),
      });

      const response = await fetch(`/api/users?${params}`);
      const data = await response.json();

      if (response.ok) {
        setUsers(data.data || []);
        setTotalPages(data.pagination?.totalPages || 1);
      } else {
        console.error('Users API error:', {
          status: response.status,
          statusText: response.statusText,
          error: data.error || 'Unknown error',
          data
        });
        // Show user-friendly error
        setUsers([]);
        setTotalPages(1);
        setError(data.error || 'Failed to load users');
      }
    } catch (error) {
      console.error('Error loading users:', error);
      setUsers([]);
      setTotalPages(1);
      setError('Network error: Unable to load users');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/users/stats');
      const data = await response.json();

      if (response.ok) {
        setStats(data.data);
      } else {
        console.error('Stats API error:', data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        loadUsers();
        loadStats();
      }
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const generateRandomPassword = () => {
    const length = 12;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    
    // Ensure at least one of each type
    password += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)]; // uppercase
    password += "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)]; // lowercase
    password += "0123456789"[Math.floor(Math.random() * 10)]; // number
    password += "!@#$%^&*"[Math.floor(Math.random() * 8)]; // special
    
    // Fill the rest randomly
    for (let i = 4; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  };

  const handleResetPassword = async () => {
    if (!resetPasswordUser || !newPassword.trim()) return;

    try {
      setResettingPassword(true);
      const response = await fetch(`/api/users/${resetPasswordUser.id}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newPassword: newPassword.trim()
        }),
      });

      if (response.ok) {
        const userName = resetPasswordUser.name;
        setResetPasswordUser(null);
        setNewPassword('');
        setShowPassword(false);
        // Show success message - you could replace this with a toast notification
        setTimeout(() => {
          alert(`✅ Password reset successfully for ${userName}!`);
        }, 100);
      } else {
        const data = await response.json();
        alert(`❌ Error resetting password: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      alert('An error occurred while resetting the password');
    } finally {
      setResettingPassword(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
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

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <FrostedHeader title="Users" onMobileMenuToggle={toggleMobileMenu} />

        {/* Breadcrumbs */}
        <div className="p-6 pb-0">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Users</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 p-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
                <p className="text-xs text-muted-foreground">
                  +{stats.recentRegistrations} in last 30 days
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Students</CardTitle>
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.roleDistribution.user || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Regular students
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Admins</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.roleDistribution.admin || 0}</div>
                <p className="text-xs text-muted-foreground">
                  System administrators
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg CGPA</CardTitle>
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.averageCgpa}</div>
                <p className="text-xs text-muted-foreground">
                  Overall student performance
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Users Management */}
        <div className="p-6 pt-0">
          <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Management
              </CardTitle>
              <Link href="/dashboard/users/create">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </Link>
            </div>
          </CardHeader>

          <CardContent>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or student ID..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className={`pl-10 ${searchInput ? 'pr-20' : 'pr-4'}`}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                  {searchInput !== searchTerm && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  )}
                  {searchInput && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSearchInput('');
                        setSearchTerm('');
                      }}
                      className="h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="user">Students</SelectItem>
                  <SelectItem value="admin">Admins</SelectItem>
                </SelectContent>
              </Select>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  <SelectItem value="CSE">Computer Science</SelectItem>
                  <SelectItem value="EEE">Electrical Engineering</SelectItem>
                  <SelectItem value="BBA">Business Administration</SelectItem>
                  <SelectItem value="ENG">English</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Users Table */}
            <div className="bg-white dark:bg-card rounded-lg border shadow-sm overflow-hidden">
              {error ? (
                <div className="p-12 text-center">
                  <div className="h-12 w-12 text-red-500 mx-auto mb-4">
                    <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 18.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-red-600 dark:text-red-400">Error Loading Users</h3>
                  <p className="text-muted-foreground mb-4">{error}</p>
                  <Button 
                    onClick={() => {
                      setError(null);
                      loadUsers();
                    }}
                    variant="outline"
                  >
                    Try Again
                  </Button>
                </div>
              ) : loading ? (
                <div className="p-6 space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-[250px]" />
                        <Skeleton className="h-4 w-[200px]" />
                      </div>
                      <Skeleton className="h-8 w-24" />
                    </div>
                  ))}
                </div>
              ) : users.length === 0 ? (
                <div className="p-12 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No users found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchInput ? `No users match "${searchInput}"` : 'No users have been created yet.'}
                  </p>
                  {!searchInput && (
                    <Link href="/dashboard/users/create">
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add First User
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                <Table>
                  <TableHeader >
                    <TableRow className="bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-50 dark:hover:bg-gray-900/50">
                      <TableHead className="font-semibold text-gray-900 dark:text-gray-100 py-4">User</TableHead>
                      <TableHead className="font-semibold text-gray-900 dark:text-gray-100 py-4">Role</TableHead>
                      <TableHead className="font-semibold text-gray-900 dark:text-gray-100 py-4">Student ID</TableHead>
                      <TableHead className="font-semibold text-gray-900 dark:text-gray-100 py-4">Department</TableHead>
                      <TableHead className="font-semibold text-gray-900 dark:text-gray-100 py-4">CGPA</TableHead>
                      <TableHead className="font-semibold text-gray-900 dark:text-gray-100 py-4">Joined</TableHead>
                      <TableHead className="font-semibold text-gray-900 dark:text-gray-100 py-4 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
                        <TableCell className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                              <User className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <div className="font-medium">{user.profile?.full_name || 'No name'}</div>
                              <div className="text-sm text-muted-foreground">{user.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <Badge variant={getRoleBadgeVariant(user.role)}>
                            {user.role === 'admin' ? 'Admin' : 'Student'}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-4 font-mono text-sm">{user.profile?.student_id || '-'}</TableCell>
                        <TableCell className="py-4">{user.profile?.department || '-'}</TableCell>
                        <TableCell className="py-4 font-semibold">
                          {user.profile?.cgpa ? (
                            <span className={`${
                              parseFloat(String(user.profile.cgpa)) >= 3.5 ? 'text-green-600 dark:text-green-400' :
                              parseFloat(String(user.profile.cgpa)) >= 3.0 ? 'text-yellow-600 dark:text-yellow-400' :
                              'text-red-600 dark:text-red-400'
                            }`}>
                              {user.profile.cgpa}
                            </span>
                          ) : '-'}
                        </TableCell>
                        <TableCell className="py-4 text-sm text-muted-foreground">{formatDate(user.created_at)}</TableCell>
                        <TableCell className="py-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onClick={() => router.push(`/dashboard/users/${user.id}`)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => router.push(`/dashboard/users/${user.id}/edit`)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit User
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => setResetPasswordUser({
                                  id: user.id,
                                  name: user.profile?.full_name || user.email,
                                  email: user.email
                                })}
                                className="text-orange-600 focus:text-orange-600"
                              >
                                <Key className="mr-2 h-4 w-4" />
                                Reset Password
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteUser(user.id)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete User
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>

            {/* Pagination and Results Info */}
            {!loading && (
              <div className="flex items-center justify-between pt-4">
                <div className="text-sm text-muted-foreground">
                  {users.length > 0 ? (
                    <span>
                      Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, stats?.totalUsers || 0)} of {stats?.totalUsers || 0} users
                      {searchInput && ` matching "${searchInput}"`}
                    </span>
                  ) : (
                    <span>No users found</span>
                  )}
                </div>
                
                {totalPages > 1 && (
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const page = i + 1;
                        const isCurrentPage = page === currentPage;
                        return (
                          <Button
                            key={page}
                            variant={isCurrentPage ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className={`w-8 h-8 ${isCurrentPage ? '' : 'text-muted-foreground'}`}
                          >
                            {page}
                          </Button>
                        );
                      })}
                      {totalPages > 5 && (
                        <>
                          <span className="text-muted-foreground px-2">...</span>
                          <Button
                            variant={currentPage === totalPages ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(totalPages)}
                            className="w-8 h-8"
                          >
                            {totalPages}
                          </Button>
                        </>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
        </div>
      </div>

      {/* Password Reset Dialog */}
      <Dialog open={!!resetPasswordUser} onOpenChange={(open) => {
        if (!open) {
          setResetPasswordUser(null);
          setNewPassword('');
          setShowPassword(false);
        }
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Set a new password for <strong>{resetPasswordUser?.name}</strong> ({resetPasswordUser?.email})
              <br />
              <span className="text-orange-600 font-medium">⚠️ This will immediately change the user's password and they will need to use the new password to log in.</span>
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="newPassword">
                  New Password
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setNewPassword(generateRandomPassword())}
                  className="text-xs"
                >
                  Generate Random
                </Button>
              </div>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min. 6 characters)"
                  minLength={6}
                  className={`pr-10 ${
                    newPassword && newPassword.length < 6 
                      ? 'border-red-300 focus:border-red-500' 
                      : newPassword.length >= 6 
                      ? 'border-green-300 focus:border-green-500' 
                      : ''
                  }`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className={`h-2 w-2 rounded-full ${
                  newPassword.length >= 6 ? 'bg-green-500' : 'bg-gray-300'
                }`}></div>
                <span className={newPassword.length >= 6 ? 'text-green-600' : 'text-muted-foreground'}>
                  Minimum 6 characters
                </span>
              </div>
              {newPassword.length >= 8 && (
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <span className="text-green-600">Good password length</span>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setResetPasswordUser(null);
                setNewPassword('');
                setShowPassword(false);
              }}
            >
              Cancel
            </Button>
            <Button 
              type="button"
              onClick={handleResetPassword}
              disabled={resettingPassword || !newPassword.trim() || newPassword.length < 6}
            >
              {resettingPassword ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Resetting...
                </>
              ) : (
                <>
                  <Key className="h-4 w-4 mr-2" />
                  Reset Password
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ProtectedRoute>
  );
}