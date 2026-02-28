'use client';

import { FrostedHeader } from "@/components/custom/frosted-header";
import { StatsCard } from "@/components/dashboard/stats-card";
import { useMobileMenu } from "@/components/mobile-menu-context";
import ProtectedRoute from "@/components/ProtectedRoute";
import {
    Breadcrumb,
    BreadcrumbList,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbSeparator,
    BreadcrumbPage,
} from "@/components/ui/breadcrumb";
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
import { Skeleton } from "@/components/ui/skeleton";
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
    Edit,
    MoreHorizontal,
    Plus,
    Search,
    Timer,
    Trash2,
    X,
    CalendarDays,
    Hash,
} from "lucide-react";
import { useEffect, useState } from "react";
import { makeAuthenticatedJsonRequest } from "@/lib/api-helpers";
import { handleApiError } from "@/lib/error-handling";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Trimester {
    id: string;
    trimester: string;
    created_at: string;
    updated_at: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTrimesterLabel(code: string): string {
    if (code.length !== 3) return code;
    const year = code.slice(0, 2);
    const sem = code[2];
    const semLabel = sem === '1' ? 'Spring' : sem === '2' ? 'Summer' : 'Fall';
    return `${semLabel} ${year}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TrimastersPage() {
    const { toggleMobileMenu } = useMobileMenu();

    // Data
    const [trimesters, setTrimesters] = useState<Trimester[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [searchInput, setSearchInput] = useState('');

    // Dialog state
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedTrimester, setSelectedTrimester] = useState<Trimester | null>(null);

    // Form state
    const [addCode, setAddCode] = useState('');
    const [editCode, setEditCode] = useState('');
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    // ─── Data fetching ────────────────────────────────────────────────────────

    const fetchTrimesters = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await makeAuthenticatedJsonRequest('/api/course-management/trimesters');
            if (!result.success) throw new Error(result.error || 'Failed to fetch trimesters');
            const data = result.data;
            setTrimesters(Array.isArray(data?.trimesters) ? data.trimesters : []);
        } catch (err: any) {
            const msg = err.message || 'Failed to fetch trimesters';
            setError(msg);
            handleApiError(msg, 'Loading trimesters');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTrimesters();
    }, []);

    // ─── Filtered view ────────────────────────────────────────────────────────

    const filteredTrimesters = trimesters.filter((t) => {
        const q = searchInput.toLowerCase();
        return (
            !searchInput ||
            t.trimester.toLowerCase().includes(q) ||
            formatTrimesterLabel(t.trimester).toLowerCase().includes(q)
        );
    });

    // ─── CRUD handlers ────────────────────────────────────────────────────────

    const handleCreate = async () => {
        if (!addCode.trim()) {
            setFormError('Trimester code is required.');
            return;
        }
        setFormLoading(true);
        setFormError(null);
        try {
            const result = await makeAuthenticatedJsonRequest('/api/course-management/trimesters', {
                method: 'POST',
                body: JSON.stringify({ trimester: addCode.trim() }),
            });
            if (!result.success) {
                setFormError(result.error || 'Failed to create trimester');
                return;
            }
            toast.success('Trimester created successfully!', { duration: 4000 });
            setAddDialogOpen(false);
            setAddCode('');
            fetchTrimesters();
        } catch (err: any) {
            setFormError(err.message || 'An error occurred');
        } finally {
            setFormLoading(false);
        }
    };

    const handleEdit = async () => {
        if (!selectedTrimester) return;
        if (!editCode.trim()) {
            setFormError('Trimester code is required.');
            return;
        }
        setFormLoading(true);
        setFormError(null);
        try {
            const result = await makeAuthenticatedJsonRequest(
                `/api/course-management/trimesters/${selectedTrimester.id}`,
                { method: 'PUT', body: JSON.stringify({ trimester: editCode.trim() }) }
            );
            if (!result.success) {
                setFormError(result.error || 'Failed to update trimester');
                return;
            }
            toast.success('Trimester updated successfully!', { duration: 4000 });
            setEditDialogOpen(false);
            setSelectedTrimester(null);
            fetchTrimesters();
        } catch (err: any) {
            setFormError(err.message || 'An error occurred');
        } finally {
            setFormLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedTrimester) return;
        setFormLoading(true);
        try {
            const result = await makeAuthenticatedJsonRequest(
                `/api/course-management/trimesters/${selectedTrimester.id}`,
                { method: 'DELETE' }
            );
            if (!result.success) {
                handleApiError(result.error || 'Failed to delete trimester', 'Delete trimester');
                return;
            }
            toast.success(`Trimester "${selectedTrimester.trimester}" deleted successfully!`, { duration: 4000 });
            setDeleteDialogOpen(false);
            setSelectedTrimester(null);
            fetchTrimesters();
        } catch (err: any) {
            handleApiError(err.message || 'An error occurred while deleting', 'Delete trimester');
        } finally {
            setFormLoading(false);
        }
    };

    const openEditDialog = (t: Trimester) => {
        setSelectedTrimester(t);
        setEditCode(t.trimester);
        setFormError(null);
        setEditDialogOpen(true);
    };

    const openDeleteDialog = (t: Trimester) => {
        setSelectedTrimester(t);
        setDeleteDialogOpen(true);
    };

    // ─── Loading skeleton ─────────────────────────────────────────────────────

    if (loading) {
        return (
            <ProtectedRoute>
                <div className="min-h-screen bg-background">
                    <div className="bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm border-b border-border sticky top-0 z-40">
                        <div className="flex items-center justify-between px-6 py-4">
                            <Skeleton className="h-8 w-48" />
                            <Skeleton className="h-10 w-10 rounded-md" />
                        </div>
                    </div>
                    <div className="p-6">
                        <div className="flex items-center space-x-2 mb-6">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-4 w-4" />
                            <Skeleton className="h-4 w-32" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                            {[...Array(3)].map((_, i) => (
                                <Card key={i} className="p-6">
                                    <div className="flex items-center space-x-4">
                                        <Skeleton className="h-12 w-12 rounded-lg" />
                                        <div className="space-y-2">
                                            <Skeleton className="h-4 w-24" />
                                            <Skeleton className="h-8 w-16" />
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                        <Card>
                            <CardHeader className="pb-4">
                                <div className="flex items-center justify-between">
                                    <Skeleton className="h-6 w-40" />
                                    <Skeleton className="h-10 w-36" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-10 w-full mb-6" />
                                <div className="space-y-3">
                                    {[...Array(5)].map((_, i) => (
                                        <div key={i} className="flex items-center space-x-4 py-3">
                                            <Skeleton className="h-10 w-10 rounded-full" />
                                            <div className="space-y-2 flex-1">
                                                <Skeleton className="h-4 w-24" />
                                                <Skeleton className="h-3 w-40" />
                                            </div>
                                            <Skeleton className="h-4 w-32" />
                                            <Skeleton className="h-4 w-32" />
                                            <Skeleton className="h-8 w-8 rounded ml-auto" />
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </ProtectedRoute>
        );
    }

    // ─── Error state ──────────────────────────────────────────────────────────

    if (error) {
        return (
            <ProtectedRoute>
                <div className="min-h-screen bg-background flex items-center justify-center">
                    <div className="text-center">
                        <p className="text-destructive mb-4">{error}</p>
                        <Button onClick={fetchTrimesters} variant="outline">Retry</Button>
                    </div>
                </div>
            </ProtectedRoute>
        );
    }

    // ─── Main render ──────────────────────────────────────────────────────────

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-background">
                <FrostedHeader
                    title="Trimesters"
                    subtitle="Manage academic trimesters"
                    onMobileMenuToggle={toggleMobileMenu}
                />

                <div className="p-6">
                    {/* Breadcrumb */}
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/admin">Dashboard</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Trimesters</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>

                    {/* Stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                        <StatsCard
                            icon={Timer}
                            title="Total Trimesters"
                            value={trimesters.length}
                        />
                        <StatsCard
                            icon={CalendarDays}
                            title="Filtered Results"
                            value={filteredTrimesters.length}
                        />
                        <StatsCard
                            icon={Hash}
                            title="Latest Trimester"
                            value={trimesters.length > 0 ? trimesters[0].trimester : '—'}
                        />
                    </div>

                    {/* Main Table Card */}
                    <Card className="mt-5">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <Timer className="h-5 w-5" />
                                    Trimester Management
                                </CardTitle>
                                <Button onClick={() => {
                                    setAddCode('');
                                    setFormError(null);
                                    setAddDialogOpen(true);
                                }}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Trimester
                                </Button>
                            </div>
                        </CardHeader>

                        <CardContent>
                            {/* Search */}
                            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search by trimester code…"
                                        value={searchInput}
                                        onChange={(e) => setSearchInput(e.target.value)}
                                        className={`pl-10 ${searchInput ? 'pr-16' : 'pr-4'}`}
                                    />
                                    {searchInput && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setSearchInput('')}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* Table */}
                            <div className="bg-white dark:bg-card rounded-lg border shadow-sm overflow-hidden">
                                {filteredTrimesters.length === 0 ? (
                                    <div className="p-12 text-center">
                                        <Timer className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                        <h3 className="text-lg font-semibold mb-2">No trimesters found</h3>
                                        <p className="text-muted-foreground mb-4">
                                            {searchInput
                                                ? `No trimesters match "${searchInput}"`
                                                : 'No trimesters have been created yet.'}
                                        </p>
                                        {!searchInput && (
                                            <Button onClick={() => setAddDialogOpen(true)}>
                                                <Plus className="h-4 w-4 mr-2" />
                                                Add First Trimester
                                            </Button>
                                        )}
                                    </div>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-50 dark:hover:bg-gray-900/50">
                                                <TableHead className="font-semibold text-gray-900 dark:text-gray-100 py-4">Trimester</TableHead>
                                                <TableHead className="font-semibold text-gray-900 dark:text-gray-100 py-4">Label</TableHead>
                                                <TableHead className="font-semibold text-gray-900 dark:text-gray-100 py-4">Created</TableHead>
                                                <TableHead className="font-semibold text-gray-900 dark:text-gray-100 py-4">Updated</TableHead>
                                                <TableHead className="font-semibold text-gray-900 dark:text-gray-100 py-4 text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredTrimesters.map((t) => (
                                                <TableRow
                                                    key={t.id}
                                                    className="hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors"
                                                >
                                                    <TableCell className="py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                                                                <Timer className="h-5 w-5 text-primary" />
                                                            </div>
                                                            <span className="font-mono font-semibold text-base">{t.trimester}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-4 text-sm text-muted-foreground">
                                                        {formatTrimesterLabel(t.trimester)}
                                                    </TableCell>
                                                    <TableCell className="py-4 text-sm text-muted-foreground">
                                                        {new Date(t.created_at).toLocaleDateString('en-US', {
                                                            year: 'numeric',
                                                            month: 'short',
                                                            day: 'numeric',
                                                        })}
                                                    </TableCell>
                                                    <TableCell className="py-4 text-sm text-muted-foreground">
                                                        {new Date(t.updated_at).toLocaleDateString('en-US', {
                                                            year: 'numeric',
                                                            month: 'short',
                                                            day: 'numeric',
                                                        })}
                                                    </TableCell>
                                                    <TableCell className="py-4 text-right">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
                                                                >
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end" className="w-48">
                                                                <DropdownMenuItem onClick={() => openEditDialog(t)}>
                                                                    <Edit className="mr-2 h-4 w-4" />
                                                                    Edit Trimester
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    onClick={() => openDeleteDialog(t)}
                                                                    className="text-destructive focus:text-destructive"
                                                                >
                                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                                    Delete Trimester
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

                {/* ── Add Trimester Dialog ──────────────────────────────────── */}
                <Dialog open={addDialogOpen} onOpenChange={(open) => {
                    setAddDialogOpen(open);
                    if (!open) setFormError(null);
                }}>
                    <DialogContent className="sm:max-w-[420px]">
                        <DialogHeader>
                            <DialogTitle>Add New Trimester</DialogTitle>
                            <DialogDescription>
                                Enter a 3-digit trimester code. The first two digits are the year (e.g. 25 for 2025)
                                and the last digit is the trimester number (1, 2, or 3).
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="add-code">Trimester Code *</Label>
                                <Input
                                    id="add-code"
                                    placeholder="e.g. 251, 252, 261"
                                    value={addCode}
                                    maxLength={3}
                                    onChange={(e) => setAddCode(e.target.value)}
                                />
                                {addCode.length === 3 && (
                                    <p className="text-xs text-muted-foreground">
                                        Preview: <span className="font-medium">{formatTrimesterLabel(addCode)}</span>
                                    </p>
                                )}
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
                            <Button onClick={handleCreate} disabled={formLoading}>
                                {formLoading ? 'Creating…' : 'Create Trimester'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* ── Edit Trimester Dialog ─────────────────────────────────── */}
                <Dialog open={editDialogOpen} onOpenChange={(open) => {
                    setEditDialogOpen(open);
                    if (!open) setFormError(null);
                }}>
                    <DialogContent className="sm:max-w-[420px]">
                        <DialogHeader>
                            <DialogTitle>Edit Trimester</DialogTitle>
                            <DialogDescription>
                                Update the trimester code. Must be 3 digits (YY + 1/2/3).
                            </DialogDescription>
                        </DialogHeader>
                        {selectedTrimester && (
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-code">Trimester Code *</Label>
                                    <Input
                                        id="edit-code"
                                        value={editCode}
                                        maxLength={3}
                                        onChange={(e) => setEditCode(e.target.value)}
                                    />
                                    {editCode.length === 3 && (
                                        <p className="text-xs text-muted-foreground">
                                            Preview: <span className="font-medium">{formatTrimesterLabel(editCode)}</span>
                                        </p>
                                    )}
                                </div>
                                {formError && (
                                    <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                                        {formError}
                                    </div>
                                )}
                            </div>
                        )}
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={formLoading}>
                                Cancel
                            </Button>
                            <Button onClick={handleEdit} disabled={formLoading}>
                                {formLoading ? 'Updating…' : 'Update Trimester'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* ── Delete Trimester Dialog ───────────────────────────────── */}
                <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Delete Trimester</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to delete this trimester? This action cannot be undone.
                            </DialogDescription>
                        </DialogHeader>
                        {selectedTrimester && (
                            <div className="py-4">
                                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg space-y-1">
                                    <h4 className="font-mono font-semibold text-lg">{selectedTrimester.trimester}</h4>
                                    <p className="text-sm text-muted-foreground">
                                        {formatTrimesterLabel(selectedTrimester.trimester)}
                                    </p>
                                </div>
                            </div>
                        )}
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={formLoading}>
                                Cancel
                            </Button>
                            <Button variant="destructive" onClick={handleDelete} disabled={formLoading}>
                                {formLoading ? 'Deleting…' : 'Delete Trimester'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </ProtectedRoute>
    );
}
