'use client';

import { FrostedHeader } from "@/components/custom/frosted-header";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Pause, Play } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface AgentTool {
    id: string;
    tool_name: string;
    tool_description?: string;
    is_enabled: boolean;
}

interface FewShotExample {
    id: string;
    example_type: string;
    user_query: string;
    expected_output: any;
    description?: string;
    is_active: boolean;
}

interface Agent {
    id: string;
    name: string;
    display_name: string;
    description: string;
    system_prompt: string;
    question_processing_prompt?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    agent_tools?: AgentTool[];
    few_shot_examples?: FewShotExample[];
}

export default function AgentsPage() {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [updatingAgent, setUpdatingAgent] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        const fetchAgents = async () => {
            setLoading(true);
            try {
                const response = await fetch('/api/agents');
                const result = await response.json();

                console.log("Fetched agents data:", result);

                if (!response.ok) {
                    throw new Error(result.error || 'Failed to fetch agents');
                }

                setAgents(result || []);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchAgents();
    }, []);

    const handleSuspendAgent = async (agentId: string, currentStatus: boolean) => {
        setUpdatingAgent(agentId);
        try {
            const response = await fetch(`/api/agents/${agentId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ is_active: !currentStatus }),
            });

            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.error || 'Failed to update agent');
            }

            // Update local state
            setAgents(prev => prev.map(agent => 
                agent.id === agentId 
                    ? { ...agent, is_active: !currentStatus }
                    : agent
            ));

            toast.success(`Agent ${!currentStatus ? 'activated' : 'suspended'} successfully`);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setUpdatingAgent(null);
        }
    };

    const handleEditAgent = (agentId: string) => {
        router.push(`/dashboard/agents/${agentId}/edit`);
    };

    if (loading) {
        return (
            <ProtectedRoute>
                <div className="min-h-screen flex items-center justify-center">Loading...</div>
            </ProtectedRoute>
        );
    }

    if (error) {
        return (
            <ProtectedRoute>
                <div className="min-h-screen flex items-center justify-center text-red-500">Error: {error}</div>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-background">
                <FrostedHeader
                    title="Course Based Agents"
                    subtitle="Manage active & inactive agents"
                />

                {/* Breadcrumb */}
                <div className="p-6 pb-0">
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Agents</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>

                    <div className="mt-5">
                        {agents.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                No agents found.
                            </div>
                        ) : (
                            <div className="border rounded-lg">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Description</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Tools</TableHead>
                                            <TableHead>Examples</TableHead>
                                            <TableHead>Created</TableHead>
                                            <TableHead className="w-12">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {agents.map((agent: Agent) => (
                                            <TableRow key={agent.id}>
                                                <TableCell>
                                                    <div>
                                                        <div className="font-medium">{agent.display_name}</div>
                                                        <div className="text-sm text-muted-foreground">{agent.name}</div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="max-w-md">
                                                        <p className="text-sm line-clamp-2">
                                                            {agent.description || "No description"}
                                                        </p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span
                                                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                            agent.is_active 
                                                                ? "bg-green-100 text-green-800" 
                                                                : "bg-red-100 text-red-800"
                                                        }`}
                                                    >
                                                        {agent.is_active ? "Active" : "Inactive"}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-sm">
                                                        {agent.agent_tools?.length || 0}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-sm">
                                                        {agent.few_shot_examples?.length || 0}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-sm text-muted-foreground">
                                                        {new Date(agent.created_at).toLocaleDateString()}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button 
                                                                variant="ghost" 
                                                                size="sm" 
                                                                className="h-8 w-8 p-0"
                                                                disabled={updatingAgent === agent.id}
                                                            >
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem 
                                                                onClick={() => handleEditAgent(agent.id)}
                                                                className="cursor-pointer"
                                                            >
                                                                <Edit className="mr-2 h-4 w-4" />
                                                                Edit
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem 
                                                                onClick={() => handleSuspendAgent(agent.id, agent.is_active)}
                                                                className="cursor-pointer"
                                                                disabled={updatingAgent === agent.id}
                                                            >
                                                                {agent.is_active ? (
                                                                    <>
                                                                        <Pause className="mr-2 h-4 w-4" />
                                                                        Suspend
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Play className="mr-2 h-4 w-4" />
                                                                        Activate
                                                                    </>
                                                                )}
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
        </ProtectedRoute>
    );
}
