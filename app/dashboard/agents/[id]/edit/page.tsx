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
import { Plus, Trash2, Save, ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";

interface AgentTool {
    id?: string;
    tool_name: string;
    tool_description?: string;
    is_enabled: boolean;
}

interface FewShotExample {
    id?: string;
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

export default function EditAgentPage() {
    const router = useRouter();
    const params = useParams();
    const agentId = params.id as string;

    const [agent, setAgent] = useState<Agent | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const [formData, setFormData] = useState({
        name: "",
        display_name: "",
        description: "",
        system_prompt: "",
        question_processing_prompt: "",
        is_active: true,
    });

    const [tools, setTools] = useState<AgentTool[]>([]);
    const [examples, setExamples] = useState<FewShotExample[]>([]);

    // Fetch agent directly via Supabase client
    useEffect(() => {
        const fetchAgent = async () => {
            setLoading(true);
            try {
                const { data: agentData, error } = await supabase
                    .from("agents")
                    .select(
                        `
            *,
            agent_tools (*),
            few_shot_examples (*)
          `
                    )
                    .eq("id", agentId)
                    .single();

                if (error || !agentData)
                    throw new Error(error?.message || "Agent not found");

                setAgent(agentData);
                setFormData({
                    name: agentData.name || "",
                    display_name: agentData.display_name || "",
                    description: agentData.description || "",
                    system_prompt: agentData.system_prompt || "",
                    question_processing_prompt:
                        agentData.question_processing_prompt || "",
                    is_active: agentData.is_active ?? true,
                });
                setTools(agentData.agent_tools || []);
                setExamples(agentData.few_shot_examples || []);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (agentId) fetchAgent();
    }, [agentId]);

    const handleInputChange = (field: string, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const addTool = () =>
        setTools((prev) => [
            ...prev,
            { tool_name: "", tool_description: "", is_enabled: true },
        ]);
    const updateTool = (index: number, field: string, value: any) =>
        setTools((prev) =>
            prev.map((tool, i) => (i === index ? { ...tool, [field]: value } : tool))
        );
    const removeTool = (index: number) =>
        setTools((prev) => prev.filter((_, i) => i !== index));

    const addExample = () =>
        setExamples((prev) => [
            ...prev,
            {
                example_type: "",
                user_query: "",
                expected_output: {},
                description: "",
                is_active: true,
            },
        ]);
    const updateExample = (index: number, field: string, value: any) =>
        setExamples((prev) =>
            prev.map((ex, i) => (i === index ? { ...ex, [field]: value } : ex))
        );
    const removeExample = (index: number) =>
        setExamples((prev) => prev.filter((_, i) => i !== index));

    const handleSave = async () => {
        setSaving(true);
        try {
            // Update agent
            const { data: updatedAgent, error: agentError } = await supabase
                .from("agents")
                .update({
                    ...formData,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", agentId)
                .select()
                .single();

            if (agentError || !updatedAgent)
                throw new Error(agentError?.message || "Failed to update agent");

            // Update tools
            await supabase.from("agent_tools").delete().eq("agent_id", agentId);
            if (tools.length > 0) {
                const toolsToInsert = tools.map((tool) => ({
                    ...tool,
                    agent_id: agentId,
                }));
                const { error: toolsError } = await supabase
                    .from("agent_tools")
                    .insert(toolsToInsert);
                if (toolsError) throw toolsError;
            }

            // Update few-shot examples
            await supabase.from("few_shot_examples").delete().eq("agent_id", agentId);
            if (examples.length > 0) {
                const examplesToInsert = examples.map((ex) => ({
                    ...ex,
                    agent_id: agentId,
                }));
                const { error: examplesError } = await supabase
                    .from("few_shot_examples")
                    .insert(examplesToInsert);
                if (examplesError) throw examplesError;
            }

            toast.success("Agent updated successfully");
            router.push("/dashboard/agents");
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
                    Loading...
                </div>
            </ProtectedRoute>
        );
    if (error)
        return (
            <ProtectedRoute>
                <div className="min-h-screen flex items-center justify-center text-red-500">
                    {error}
                </div>
            </ProtectedRoute>
        );

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-background">
                <FrostedHeader
                    title={`Edit Agent: ${agent?.display_name}`}
                    subtitle="Modify agent configuration, tools, and examples"
                />

                <div className="p-6">
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/dashboard/agents">Agents</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Edit</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>

                    <div className="mt-6 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Basic Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Name (ID)</Label>
                                        <Input
                                            id="name"
                                            value={formData.name}
                                            onChange={(e) =>
                                                handleInputChange("name", e.target.value)
                                            }
                                            placeholder="e.g., dbms_agent"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="display_name">Display Name</Label>
                                        <Input
                                            id="display_name"
                                            value={formData.display_name}
                                            onChange={(e) =>
                                                handleInputChange("display_name", e.target.value)
                                            }
                                            placeholder="e.g., Professor DBMS"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        value={formData.description}
                                        onChange={(e) =>
                                            handleInputChange("description", e.target.value)
                                        }
                                        placeholder="Brief description of the agent's purpose"
                                        rows={3}
                                    />
                                </div>
                                <div className="space-y-2">

                                    <Label htmlFor="system_prompt">System Prompt</Label>
                                    <Textarea
                                        id="system_prompt"
                                        value={formData.system_prompt}
                                        onChange={(e) =>
                                            handleInputChange("system_prompt", e.target.value)
                                        }
                                        placeholder="System prompt that defines the agent's behavior"
                                        rows={6}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="question_processing_prompt">
                                        Question Processing Prompt
                                    </Label>
                                    <Textarea
                                        id="question_processing_prompt"
                                        value={formData.question_processing_prompt}
                                        onChange={(e) =>
                                            handleInputChange(
                                                "question_processing_prompt",
                                                e.target.value
                                            )
                                        }
                                        placeholder="Optional prompt for question processing"
                                        rows={4}
                                    />
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="is_active"
                                        checked={formData.is_active}
                                        onCheckedChange={(checked) =>
                                            handleInputChange("is_active", checked)
                                        }
                                    />
                                    <Label htmlFor="is_active">Active</Label>
                                </div>
                            </CardContent>
                        </Card>
                        {/* Agent Tools */}
                        <Card>

                            <CardHeader className="flex flex-row items-center justify-between">

                                <CardTitle>Agent Tools</CardTitle>
                                <Button onClick={addTool} size="sm">

                                    <Plus className="h-4 w-4 mr-2" /> Add Tool
                                </Button>
                            </CardHeader>
                            <CardContent>

                                {tools.length === 0 ? (
                                    <p className="text-muted-foreground text-center py-4">
                                        No tools configured
                                    </p>
                                ) : (
                                    <div className="space-y-4">

                                        {tools.map((tool, index) => (
                                            <div key={index} className="border rounded-lg p-4">

                                                <div className="flex items-start justify-between mb-3">

                                                    <h4 className="font-medium">Tool {index + 1}</h4>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => removeTool(index)}
                                                    >

                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                                    <div>

                                                        <Label>Tool Name</Label>
                                                        <Input
                                                            value={tool.tool_name}
                                                            onChange={(e) =>
                                                                updateTool(index, "tool_name", e.target.value)
                                                            }
                                                            placeholder="e.g., database_query"
                                                        />
                                                    </div>
                                                    <div className="flex items-center space-x-2">

                                                        <Switch
                                                            checked={tool.is_enabled}
                                                            onCheckedChange={(checked) =>
                                                                updateTool(index, "is_enabled", checked)
                                                            }
                                                        />
                                                        <Label>Enabled</Label>
                                                    </div>
                                                </div>
                                                <div className="mt-3">

                                                    <Label>Tool Description</Label>
                                                    <Textarea
                                                        value={tool.tool_description || ""}
                                                        onChange={(e) =>
                                                            updateTool(
                                                                index,
                                                                "tool_description",
                                                                e.target.value
                                                            )
                                                        }
                                                        placeholder="Description of what this tool does"
                                                        rows={2}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                        {/* Few-Shot Examples */}
                        <Card>

                            <CardHeader className="flex flex-row items-center justify-between">

                                <CardTitle>Few-Shot Examples</CardTitle>
                                <Button onClick={addExample} size="sm">

                                    <Plus className="h-4 w-4 mr-2" /> Add Example
                                </Button>
                            </CardHeader>
                            <CardContent>

                                {examples.length === 0 ? (
                                    <p className="text-muted-foreground text-center py-4">
                                        No examples configured
                                    </p>
                                ) : (
                                    <div className="space-y-4">

                                        {examples.map((example, index) => (
                                            <div key={index} className="border rounded-lg p-4">

                                                <div className="flex items-start justify-between mb-3">

                                                    <h4 className="font-medium">
                                                        Example {index + 1}
                                                    </h4>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => removeExample(index)}
                                                    >

                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">

                                                    <div className="space-y-2">

                                                        <Label>Example Type</Label>
                                                        <Input
                                                            value={example.example_type}
                                                            onChange={(e) =>
                                                                updateExample(
                                                                    index,
                                                                    "example_type",
                                                                    e.target.value
                                                                )
                                                            }
                                                            placeholder="e.g., sql_query, concept_explanation"
                                                        />
                                                    </div>
                                                    <div className="flex items-center space-x-2">

                                                        <Switch
                                                            checked={example.is_active}
                                                            onCheckedChange={(checked) =>
                                                                updateExample(index, "is_active", checked)
                                                            }
                                                        />
                                                        <Label>Active</Label>
                                                    </div>
                                                </div>
                                                <div className="space-y-3">
                                                    <div className="space-y-2">
                                                        <Label>User Query</Label>
                                                        <Textarea
                                                            value={example.user_query}
                                                            onChange={(e) =>
                                                                updateExample(
                                                                    index,
                                                                    "user_query",
                                                                    e.target.value
                                                                )
                                                            }
                                                            placeholder="Example question from user"
                                                            rows={3}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">

                                                        <Label>Expected Output (JSON)</Label>
                                                        <Textarea
                                                            value={
                                                                typeof example.expected_output === "string"
                                                                    ? example.expected_output
                                                                    : JSON.stringify(
                                                                        example.expected_output,
                                                                        null,
                                                                        2
                                                                    )
                                                            }
                                                            onChange={(e) => {
                                                                try {
                                                                    const parsed = JSON.parse(e.target.value);
                                                                    updateExample(
                                                                        index,
                                                                        "expected_output",
                                                                        parsed
                                                                    );
                                                                } catch {
                                                                    updateExample(
                                                                        index,
                                                                        "expected_output",
                                                                        e.target.value
                                                                    );
                                                                }
                                                            }}
                                                            placeholder="Expected response in JSON format"
                                                            rows={4}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">

                                                        <Label>Description</Label>
                                                        <Input
                                                            value={example.description || ""}
                                                            onChange={(e) =>
                                                                updateExample(
                                                                    index,
                                                                    "description",
                                                                    e.target.value
                                                                )
                                                            }
                                                            placeholder="Brief description of this example"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                        {/* Action Buttons */}
                        <div className="flex justify-between">

                            <Button
                                variant="outline"
                                onClick={() => router.push("/dashboard/agents")}
                            >

                                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Agents
                            </Button>
                            <Button onClick={handleSave} disabled={saving}>

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
