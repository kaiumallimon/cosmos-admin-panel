'use client';

import { FrostedHeader } from "@/components/custom/frosted-header";
import { StatsCard } from "@/components/dashboard/stats-card";
import { useMobileMenu } from "@/components/mobile-menu-context";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BookOpen, Building, Edit, Eye, MoreHorizontal, Plus, Search, Trash2, User, Users, X } from "lucide-react";
import { useEffect, useState } from "react";

interface Course {
    id: string;
    title: string;
    code: string;
    credit: number;
    created_at: string;
    updated_at: string;
    department: string | null;
}

interface CourseResponse {
    courses: Course[];
    totalCourses: number;
    totalDepartments: number;
}

export default function CoursesPage() {
    const { toggleMobileMenu } = useMobileMenu();
    const [courseResponse, setCourseResponse] = useState<CourseResponse | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [searchInput, setSearchInput] = useState('');
    const [departmentFilter, setDepartmentFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    // Dialog states
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

    // Form states
    const [formData, setFormData] = useState({
        title: '',
        code: '',
        credit: 1,
        department: ''
    });
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    const fetchCourses = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/course-management/courses');
            const data: CourseResponse = await res.json();
            setCourseResponse(data);
        } catch (error) {
            setError('Failed to fetch courses');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCourses();
    }, []);

    // Filter courses based on search and department
    const filteredCourses = courseResponse?.courses.filter(course => {
        const matchesSearch = !searchInput ||
            course.title.toLowerCase().includes(searchInput.toLowerCase()) ||
            course.code.toLowerCase().includes(searchInput.toLowerCase()) ||
            (course.department && course.department.toLowerCase().includes(searchInput.toLowerCase()));

        const matchesDepartment = departmentFilter === 'all' || course.department === departmentFilter;

        return matchesSearch && matchesDepartment;
    }) || [];

    // Form handlers
    const resetForm = () => {
        setFormData({ title: '', code: '', credit: 1, department: '' });
        setFormError(null);
    };

    const handleAddCourse = async () => {
        setFormLoading(true);
        setFormError(null);

        try {
            const res = await fetch('/api/course-management/courses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok) {
                setFormError(data.error || 'Failed to create course');
                return;
            }

            setAddDialogOpen(false);
            resetForm();
            fetchCourses();
        } catch (error) {
            setFormError('An error occurred while creating the course');
        } finally {
            setFormLoading(false);
        }
    };

    const handleEditCourse = async () => {
        if (!selectedCourse) return;

        setFormLoading(true);
        setFormError(null);

        try {
            const res = await fetch(`/api/course-management/courses/${selectedCourse.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok) {
                setFormError(data.error || 'Failed to update course');
                return;
            }

            setEditDialogOpen(false);
            resetForm();
            setSelectedCourse(null);
            fetchCourses();
        } catch (error) {
            setFormError('An error occurred while updating the course');
        } finally {
            setFormLoading(false);
        }
    };

    const handleDeleteCourse = async () => {
        if (!selectedCourse) return;

        setFormLoading(true);

        try {
            const res = await fetch(`/api/course-management/courses/${selectedCourse.id}`, {
                method: 'DELETE',
            });

            if (!res.ok) {
                const data = await res.json();
                alert(data.error || 'Failed to delete course');
                return;
            }

            setDeleteDialogOpen(false);
            setSelectedCourse(null);
            fetchCourses();
        } catch (error) {
            alert('An error occurred while deleting the course');
        } finally {
            setFormLoading(false);
        }
    };

    const openEditDialog = (course: Course) => {
        setSelectedCourse(course);
        setFormData({
            title: course.title,
            code: course.code,
            credit: course.credit,
            department: course.department || ''
        });
        setEditDialogOpen(true);
    };

    const openDeleteDialog = (course: Course) => {
        setSelectedCourse(course);
        setDeleteDialogOpen(true);
    };

    if (loading) {
        return (
            <ProtectedRoute>
                <div>Loading...</div>
            </ProtectedRoute>
        );
    }

    if (error) {
        return (
            <ProtectedRoute>
                <div>{error}</div>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-background">
                {/* header  */}
                <FrostedHeader title="Course Management" onMobileMenuToggle={toggleMobileMenu} />


                <div className="p-6">
                    {/* Breadcrumbs  */}
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Course Management</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>

                    {/* Stats Cards  */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 mt-6">
                        <StatsCard
                            icon={BookOpen}
                            title="Total Courses"
                            value={courseResponse?.totalCourses || 0}
                        />
                        <StatsCard
                            icon={Building}
                            title="Total Departments"
                            value={courseResponse?.totalDepartments || 0}
                        />
                    </div>

                    {/* Courses List */}

                    <Card className="mt-5">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <BookOpen className="h-5 w-5" />
                                    Course Management
                                </CardTitle>
                                <Button onClick={() => setAddDialogOpen(true)}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Course
                                </Button>
                            </div>
                        </CardHeader>


                        <CardContent>
                            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search by course title, code, or department..."
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

                                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                                    <SelectTrigger className="w-full sm:w-[180px]">
                                        <SelectValue placeholder="Filter by department" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Departments</SelectItem>
                                        {Array.from(new Set(courseResponse?.courses.map(course => course.department).filter(Boolean))).map((dept) => (
                                            <SelectItem key={dept} value={dept as string}>
                                                {dept}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Courses table */}
                            <div className="bg-white dark:bg-card rounded-lg border shadow-sm overflow-hidden">
                                {error ? (
                                    <div className="p-12 text-center">
                                        <div className="h-12 w-12 text-red-500 mx-auto mb-4">
                                            <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 18.5c-.77.833.192 2.5 1.732 2.5z" />
                                            </svg>
                                        </div>
                                        <h3 className="text-lg font-semibold mb-2 text-red-600 dark:text-red-400">Error Loading Courses</h3>
                                        <p className="text-muted-foreground mb-4">{error}</p>
                                        <Button
                                            onClick={() => {
                                                setError(null);
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
                                ) : filteredCourses.length === 0 ? (
                                    <div className="p-12 text-center">
                                        <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                        <h3 className="text-lg font-semibold mb-2">No courses found</h3>
                                        <p className="text-muted-foreground mb-4">
                                            {searchInput ? `No courses match "${searchInput}"` : 'No courses have been created yet.'}
                                        </p>
                                        {!searchInput && (
                                            <Button>
                                                <Plus className="h-4 w-4 mr-2" />
                                                Add First Course
                                            </Button>
                                        )}
                                    </div>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-50 dark:hover:bg-gray-900/50">
                                                <TableHead className="font-semibold text-gray-900 dark:text-gray-100 py-4">Course</TableHead>
                                                <TableHead className="font-semibold text-gray-900 dark:text-gray-100 py-4">Code</TableHead>
                                                <TableHead className="font-semibold text-gray-900 dark:text-gray-100 py-4">Credit</TableHead>
                                                <TableHead className="font-semibold text-gray-900 dark:text-gray-100 py-4">Department</TableHead>
                                                <TableHead className="font-semibold text-gray-900 dark:text-gray-100 py-4">Created</TableHead>
                                                <TableHead className="font-semibold text-gray-900 dark:text-gray-100 py-4">Updated</TableHead>
                                                <TableHead className="font-semibold text-gray-900 dark:text-gray-100 py-4 text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredCourses.map((course) => (
                                                <TableRow key={course.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
                                                    <TableCell className="py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                                                                <BookOpen className="h-5 w-5 text-primary" />
                                                            </div>
                                                            <div>
                                                                <div className="font-medium">{course.title}</div>
                                                                <div className="text-sm text-muted-foreground">{course.code}</div>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-4 font-mono text-sm font-medium">{course.code}</TableCell>
                                                    <TableCell className="py-4">
                                                        <Badge variant="outline" className="font-semibold">
                                                            {course.credit} Credit{course.credit !== 1 ? 's' : ''}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="py-4">
                                                        <Badge variant="secondary">
                                                            {course.department || 'N/A'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="py-4 text-sm text-muted-foreground">
                                                        {new Date(course.created_at).toLocaleDateString('en-US', {
                                                            year: 'numeric',
                                                            month: 'short',
                                                            day: 'numeric'
                                                        })}
                                                    </TableCell>
                                                    <TableCell className="py-4 text-sm text-muted-foreground">
                                                        {new Date(course.updated_at).toLocaleDateString('en-US', {
                                                            year: 'numeric',
                                                            month: 'short',
                                                            day: 'numeric'
                                                        })}
                                                    </TableCell>
                                                    <TableCell className="py-4 text-right">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800">
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end" className="w-48">
                                                                <DropdownMenuItem onClick={() => openEditDialog(course)}>
                                                                    <Edit className="mr-2 h-4 w-4" />
                                                                    Edit Course
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    onClick={() => openDeleteDialog(course)}
                                                                    className="text-destructive focus:text-destructive"
                                                                >
                                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                                    Delete Course
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
                        </CardContent>

                    </Card>

                </div>

                {/* Add Course Dialog */}
                <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Add New Course</DialogTitle>
                            <DialogDescription>
                                Create a new course. All fields marked with * are required.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="title">Course Title *</Label>
                                <Input
                                    id="title"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g., Data Structures and Algorithms"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="code">Course Code *</Label>
                                <Input
                                    id="code"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                    placeholder="e.g., CSE 1111"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="credit">Credit Hours *</Label>
                                <Input
                                    id="credit"
                                    type="number"
                                    min="1"
                                    max="10"
                                    value={formData.credit}
                                    onChange={(e) => setFormData({ ...formData, credit: parseInt(e.target.value) || 1 })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="department">Department</Label>
                                <Input
                                    id="department"
                                    value={formData.department}
                                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                    placeholder="e.g., CSE, EEE, BBA"
                                />
                            </div>
                            {formError && (
                                <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                                    {formError}
                                </div>
                            )}
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setAddDialogOpen(false)} disabled={formLoading}>
                                Cancel
                            </Button>
                            <Button onClick={handleAddCourse} disabled={formLoading}>
                                {formLoading ? 'Creating...' : 'Create Course'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Edit Course Dialog */}
                <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Edit Course</DialogTitle>
                            <DialogDescription>
                                Update course information. All fields marked with * are required.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="edit-title">Course Title *</Label>
                                <Input
                                    id="edit-title"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g., Data Structures and Algorithms"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-code">Course Code *</Label>
                                <Input
                                    id="edit-code"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                    placeholder="e.g., CSE 1111"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-credit">Credit Hours *</Label>
                                <Input
                                    id="edit-credit"
                                    type="number"
                                    min="1"
                                    max="10"
                                    value={formData.credit}
                                    onChange={(e) => setFormData({ ...formData, credit: parseInt(e.target.value) || 1 })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-department">Department</Label>
                                <Input
                                    id="edit-department"
                                    value={formData.department}
                                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                    placeholder="e.g., CSE, EEE, BBA"
                                />
                            </div>
                            {formError && (
                                <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                                    {formError}
                                </div>
                            )}
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={formLoading}>
                                Cancel
                            </Button>
                            <Button onClick={handleEditCourse} disabled={formLoading}>
                                {formLoading ? 'Updating...' : 'Update Course'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Delete Course Dialog */}
                <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Delete Course</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to delete this course? This action cannot be undone.
                            </DialogDescription>
                        </DialogHeader>
                        {selectedCourse && (
                            <div className="py-4">
                                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                                    <h4 className="font-medium">{selectedCourse.title}</h4>
                                    <p className="text-sm text-muted-foreground">{selectedCourse.code}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {selectedCourse.credit} Credit{selectedCourse.credit !== 1 ? 's' : ''} • {selectedCourse.department || 'No Department'}
                                    </p>
                                </div>
                            </div>
                        )}
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={formLoading}>
                                Cancel
                            </Button>
                            <Button variant="destructive" onClick={handleDeleteCourse} disabled={formLoading}>
                                {formLoading ? 'Deleting...' : 'Delete Course'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

            </div>
        </ProtectedRoute>
    );
}