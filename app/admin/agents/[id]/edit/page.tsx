"use client";

import { FrostedHeader } from "@/components/custom/frosted-header";
import ProtectedRoute from "@/components/ProtectedRoute";
import {
    Breadcrumb,
    BreadcrumbList,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbSeparator,
    BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Save, ArrowLeft, Lock } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
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

export default function EditAgentPage() {
    const router = useRouter();
    const params = useParams();
    const agentId = params.id as string;

    const [agent, setAgent] = useState<Agent | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const [formData, setFormData] = useState({
        display_name: "",
        description: "",
        system_prompt: "",
        question_processing_prompt: "",
        is_active: true,
    });

    useEffect(() => {
        const fetchAgent = async () => {
            setLoading(true);
            try {
                const response = await fetch(`/api/agents/${agentId}`);
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to fetch agent');
                }
                const agentData: Agent = await response.json();
                setAgent(agentData);
                setFormData({
                    display_name: agentData.display_name || "",
                    description: agentData.description || "",
                    system_prompt: agentData.system_prompt || "",
                    question_processing_prompt: agentData.question_processing_prompt || "",
                    is_active: agentData.is_active ?? true,
                });
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        if (agentId) fetchAgent();
    }, [agentId]);

    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        if (!formData.display_name.trim()) { toast.error('Display name is required'); return; }
        if (formData.description.trim().length < 10) { toast.error('Description must be at least 10 characters'); return; }
        if (formData.system_prompt.trim().length < 20) { toast.error('System prompt must be at least 20 characters'); return; }

        setSaving(true);
        try {
            const payload: Record<string, any> = {
                display_name: formData.display_name,
                description: formData.description,
                system_prompt: formData.system_prompt,
                is_active: formData.is_active,
            };
            if (formData.question_processing_prompt.trim()) {
                payload.question_processing_prompt = formData.question_processing_prompt;
            } else {
                payload.question_processing_prompt = null;
            }

            const response = await fetch(`/api/agents/${agentId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update agent');
            }

            toast.success("Agent updated successfully");
            router.push("/admin/agents");
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading)
        return (
            <ProtectedRoute>
                <div className="min-h-screen flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-orange-500"></div>
                </div>
            </ProtectedRoute>
        );
    if (error)
        return (
            <ProtectedRoute>
                <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>
            </ProtectedRoute>
        );

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-background">
                <FrostedHeader
                    title={`Edit Agent: ${agent?.display_name}`}
                    subtitle="Modify agent configuration"
                />

                <div className="p-6">
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/admin">Dashboard</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/admin/agents">Agents</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Edit</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>

                    <div className="mt-6 max-w-3xl space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Basic Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Agent name — immutable */}
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Label>Agent Name (ID)</Label>
                                        <Badge variant="secondary" className="text-xs gap-1">
                                            <Lock className="h-3 w-3" /> Immutable
                                        </Badge>
                                    </div>
                                    <Input value={agent?.name ?? ""} disabled className="font-mono bg-muted" />
                                    <p className="text-xs text-muted-foreground">The agent name is set at creation and cannot be changed.</p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="display_name">Display Name *</Label>
                                    <Input
                                        id="display_name"
                                        value={formData.display_name}
                                        onChange={e => handleInputChange("display_name", e.target.value)}
                                        placeholder="e.g., Professor DBMS"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Description *</Label>
                                    <Textarea
                                        id="description"
                                        value={formData.description}
                                        onChange={e => handleInputChange("description", e.target.value)}
                                        placeholder="Brief description of the agent's purpose (min 10 chars)"
                                        rows={3}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="system_prompt">System Prompt *</Label>
                                    <Textarea
                                        id="system_prompt"
                                        value={formData.system_prompt}
                                        onChange={e => handleInputChange("system_prompt", e.target.value)}
                                        placeholder="System prompt that defines the agent's behavior (min 20 chars)"
                                        rows={6}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="question_processing_prompt">
                                        Question Processing Prompt
                                        <span className="ml-1 text-xs text-muted-foreground">(optional)</span>
                                    </Label>
                                    <Textarea
                                        id="question_processing_prompt"
                                        value={formData.question_processing_prompt}
                                        onChange={e => handleInputChange("question_processing_prompt", e.target.value)}
                                        placeholder="Optional prompt for question processing"
                                        rows={4}
                                    />
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="is_active"
                                        checked={formData.is_active}
                                        onCheckedChange={checked => handleInputChange("is_active", checked)}
                                    />
                                    <Label htmlFor="is_active">Active</Label>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="flex justify-between">
                            <Button variant="outline" onClick={() => router.push("/admin/agents")}>
                                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Agents
                            </Button>
                            <Button onClick={handleSave} disabled={saving} loading={saving}>
                                <Save className="h-4 w-4 mr-2" />
                                {saving ? "Saving..." : "Save Changes"}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}
