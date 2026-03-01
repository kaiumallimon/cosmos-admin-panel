'use client';

import { FrostedHeader } from "@/components/custom/frosted-header";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MoreHorizontal, Edit, Pause, Play, Users, CheckCircle, XCircle, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface Agent {
    id: string;
    name: string;
    display_name: string;
    description: string;
    system_prompt: string;
    question_processing_prompt?: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

const truncateText = (text: string, maxLength: number = 80): string => {
    if (!text) return "No description";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + "...";
};

export default function AgentsPage() {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [updatingAgent, setUpdatingAgent] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Agent | null>(null);
    const [deleting, setDeleting] = useState(false);
    const router = useRouter();

    const fetchAgents = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/agents?include_inactive=true');
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Failed to fetch agents');
            setAgents(result || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAgents(); }, []);

    const totalAgents = agents.length;
    const activeAgents = agents.filter(a => a.is_active).length;
    const inactiveAgents = totalAgents - activeAgents;

    const statsArray = [
        { title: "Total Agents", value: totalAgents, icon: Users },
        { title: "Active Agents", value: activeAgents, icon: CheckCircle },
        { title: "Inactive Agents", value: inactiveAgents, icon: XCircle },
    ];

    const handleToggleActive = async (agent: Agent) => {
        setUpdatingAgent(agent.id);
        try {
            const response = await fetch(`/api/agents/${agent.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_active: !agent.is_active }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Failed to update agent');
            setAgents(prev =>
                prev.map(a => a.id === agent.id ? { ...a, is_active: !agent.is_active } : a)
            );
            toast.success(`Agent ${agent.is_active ? 'deactivated' : 'activated'} successfully`);
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setUpdatingAgent(null);
        }
    };

    const handleDelete = async (hard: boolean) => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            const response = await fetch(`/api/agents/${deleteTarget.id}?hard=${hard}`, {
                method: 'DELETE',
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Failed to delete agent');
            if (hard) {
                setAgents(prev => prev.filter(a => a.id !== deleteTarget.id));
            } else {
                setAgents(prev => prev.map(a => a.id === deleteTarget.id ? { ...a, is_active: false } : a));
            }
            toast.success(result.message || 'Agent deleted successfully');
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setDeleting(false);
            setDeleteTarget(null);
        }
    };

    const handleEditAgent = (agentId: string) => router.push(`/admin/agents/${agentId}/edit`);

    if (loading) return <ProtectedRoute><div className="fixed inset-0 flex items-center justify-center bg-background/80">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-orange-500 mx-auto mb-4"></div>
    </div></ProtectedRoute>;
    if (error) return <ProtectedRoute><div className="fixed inset-0 flex items-center justify-center text-red-500">{error}</div></ProtectedRoute>;

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-background">
                <FrostedHeader title="Course Based Agents" subtitle="Manage active & inactive agents" />

                <div className="p-6 pb-0">
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem><BreadcrumbLink href="/admin">Dashboard</BreadcrumbLink></BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem><BreadcrumbPage>Agents</BreadcrumbPage></BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>

                <div>
                    {/* Stats Cards */}
                    <div className="grid gap-4 md:grid-cols-3 p-4 sm:p-6">
                        {statsArray.map((stat, index) => (
                            <Card key={index} className="p-5 sm:p-8 hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                                        <stat.icon className="h-6 w-6 text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-muted-foreground">{stat.title}</p>
                                        <p className="text-2xl font-bold mt-1">{stat.value}</p>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>

                    {/* Agents Table */}
                    <div className="mt-5 px-6 pb-8">
                        {agents.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">No agents found.</div>
                        ) : (
                            <div className="border rounded-lg">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Description</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Created</TableHead>
                                            <TableHead>Updated</TableHead>
                                            <TableHead className="w-12">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {agents.map(agent => (
                                            <TableRow key={agent.id}>
                                                <TableCell>
                                                    <div>
                                                        <div className="font-medium">{agent.display_name}</div>
                                                        <div className="text-xs text-muted-foreground font-mono">{agent.name}</div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <p className="text-sm max-w-sm" title={agent.description}>
                                                        {truncateText(agent.description, 90)}
                                                    </p>
                                                </TableCell>
                                                <TableCell>
                                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${agent.is_active ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"}`}>
                                                        {agent.is_active ? "Active" : "Inactive"}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-sm text-muted-foreground">{new Date(agent.created_at).toLocaleDateString()}</span>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-sm text-muted-foreground">{new Date(agent.updated_at).toLocaleDateString()}</span>
                                                </TableCell>
                                                <TableCell>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled={updatingAgent === agent.id}>
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => handleEditAgent(agent.id)} className="cursor-pointer">
                                                                <Edit className="mr-2 h-4 w-4" />Edit
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleToggleActive(agent)} disabled={updatingAgent === agent.id} className="cursor-pointer">
                                                                {agent.is_active
                                                                    ? <><Pause className="mr-2 h-4 w-4" />Deactivate</>
                                                                    : <><Play className="mr-2 h-4 w-4" />Activate</>}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem onClick={() => setDeleteTarget(agent)} className="cursor-pointer text-destructive focus:text-destructive">
                                                                <Trash2 className="mr-2 h-4 w-4" />Delete
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Delete confirmation dialog */}
            <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open && !deleting) setDeleteTarget(null); }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Agent</DialogTitle>
                        <DialogDescription>
                            How would you like to delete <strong>{deleteTarget?.display_name}</strong>?
                            <br /><br />
                            <span className="text-sm">
                                • <strong>Soft delete</strong>: deactivates the agent (can be re-activated)<br />
                                • <strong>Hard delete</strong>: permanently removes the agent
                            </span>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex-col sm:flex-row gap-2">
                        <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</Button>
                        <Button variant="secondary" onClick={() => handleDelete(false)} disabled={deleting} loading={deleting}>
                            Soft Delete
                        </Button>
                        <Button variant="destructive" onClick={() => handleDelete(true)} disabled={deleting} loading={deleting}>
                            Hard Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </ProtectedRoute>
    );
}
