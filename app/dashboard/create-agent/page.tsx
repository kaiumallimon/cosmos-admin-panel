'use client';

import { useState, useCallback } from 'react';
import { FrostedHeader } from "@/components/custom/frosted-header";
import { useMobileMenu } from "@/components/mobile-menu-context";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { generateAgentName, validateAgentName } from "@/lib/agent-utils";
import { Save, CheckCircle, Loader2, Wand2, Lock, Info } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from 'next/navigation';

interface AgentFormData {
  name: string;
  display_name: string;
  description: string;
  system_prompt: string;
  question_processing_prompt: string;
  is_active: boolean;
}

const defaultForm: AgentFormData = {
  name: '',
  display_name: '',
  description: '',
  system_prompt: '',
  question_processing_prompt: '',
  is_active: true,
};

export default function CreateAgentPage() {
  const { toggleMobileMenu } = useMobileMenu();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<AgentFormData>(defaultForm);

  const updateFormData = useCallback((field: keyof AgentFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const validateForm = (): boolean => {
    const nameValidation = validateAgentName(formData.name);
    if (!nameValidation.isValid) {
      toast.error(nameValidation.error || 'Invalid agent name');
      return false;
    }
    if (!formData.display_name.trim()) {
      toast.error('Display name is required');
      return false;
    }
    if (formData.description.trim().length < 10) {
      toast.error('Description must be at least 10 characters');
      return false;
    }
    if (formData.system_prompt.trim().length < 20) {
      toast.error('System prompt must be at least 20 characters');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    const loadingToast = toast.loading(`Creating agent "${formData.display_name}"...`);
    try {
      const payload: Record<string, any> = {
        name: formData.name,
        display_name: formData.display_name,
        description: formData.description,
        system_prompt: formData.system_prompt,
        is_active: formData.is_active,
      };
      if (formData.question_processing_prompt.trim()) {
        payload.question_processing_prompt = formData.question_processing_prompt;
      }

      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      toast.dismiss(loadingToast);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create agent');
      }

      toast.success(`Agent "${formData.display_name}" created successfully!`, { duration: 4000 });
      setFormData(defaultForm);
      router.push('/dashboard/agents');
    } catch (error: any) {
      toast.dismiss(loadingToast);
      toast.error(error.message || 'Failed to create agent. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background flex flex-col">
        <FrostedHeader
          title="Create New Agent"
          subtitle="Add a new agent to the multi-agent system"
          onMobileMenuToggle={toggleMobileMenu}
        />

        <div className="p-6">
          {/* Breadcrumb */}
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
                <BreadcrumbPage>Create Agent</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Info banner */}
          <Card className="mt-6  border-orange-200 border-dashed bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800">
            <CardContent className="p-4">
              <div className="flex gap-3">
                <Info className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
                <div className="text-orange-800 dark:text-orange-300 space-y-1">
                  <p className="font-bold text-sm md:text-base">Note: Server restart required</p>
                  <p className='text-xs md:text-sm'>After creating an agent, a server restart is required for the orchestrator to pick it up. The agent name is immutable after creation.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form card — full width, matching add-question style */}
          <Card className="p-6 mt-6 border md:border-none shadow-sm md:shadow-none hover:shadow-sm hover:md:shadow-none transition-all duration-300">
            <p className="text-sm text-muted-foreground mb-6">Fill up the following fields</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">

              {/* Display Name */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="display_name">Display Name *</Label>
                <Input
                  id="display_name"
                  placeholder="e.g., Professor Mathematics"
                  value={formData.display_name}
                  onChange={(e) => {
                    updateFormData('display_name', e.target.value);
                    if (!formData.name) {
                      updateFormData('name', generateAgentName(e.target.value));
                    }
                  }}
                />
              </div>

              {/* Agent Name */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="name">Agent Name (ID) *</Label>
                  <Badge variant="secondary" className="text-xs gap-1">
                    <Lock className="h-3 w-3" /> Immutable
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Input
                    id="name"
                    placeholder="e.g., math_agent"
                    value={formData.name}
                    onChange={(e) => updateFormData('name', e.target.value)}
                    className={formData.name && !validateAgentName(formData.name).isValid ? 'border-destructive' : ''}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      updateFormData('name', generateAgentName(formData.display_name));
                      toast.success('Name generated');
                    }}
                    disabled={!formData.display_name}
                    title="Generate from display name"
                  >
                    <Wand2 className="h-4 w-4" />
                  </Button>
                </div>
                {formData.name && !validateAgentName(formData.name).isValid && (
                  <p className="text-xs text-destructive">{validateAgentName(formData.name).error}</p>
                )}
                <p className="text-xs text-muted-foreground">Lowercase, alphanumeric + underscores, starts with a letter.</p>
              </div>

              {/* Description — full width */}
              <div className="flex flex-col gap-2 md:col-span-2">
                <Label htmlFor="description">
                  Description * <span className="text-xs text-muted-foreground">(min 10 chars)</span>
                </Label>
                <Textarea
                  id="description"
                  placeholder="Describe what this agent specializes in and which topics it covers..."
                  value={formData.description}
                  onChange={(e) => updateFormData('description', e.target.value)}
                  rows={3}
                />
              </div>

              {/* System Prompt — full width */}
              <div className="flex flex-col gap-2 md:col-span-2">
                <Label htmlFor="system_prompt">
                  System Prompt * <span className="text-xs text-muted-foreground">(min 20 chars)</span>
                </Label>
                <Textarea
                  id="system_prompt"
                  placeholder="You are a specialized expert in... Injected at the start of every conversation."
                  value={formData.system_prompt}
                  onChange={(e) => updateFormData('system_prompt', e.target.value)}
                  rows={7}
                />
              </div>

              {/* Question Processing Prompt — full width */}
              <div className="flex flex-col gap-2 md:col-span-2">
                <Label htmlFor="question_processing_prompt">
                  Question Processing Prompt{' '}
                  <span className="text-xs text-muted-foreground">(optional)</span>
                </Label>
                <Textarea
                  id="question_processing_prompt"
                  placeholder="Secondary prompt used when processing exam questions..."
                  value={formData.question_processing_prompt}
                  onChange={(e) => updateFormData('question_processing_prompt', e.target.value)}
                  rows={4}
                />
              </div>

              {/* Active switch — full width */}
              <div className="flex items-center gap-3 md:col-span-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => updateFormData('is_active', checked)}
                />
                <Label htmlFor="is_active">Agent is active (loaded by orchestrator on startup)</Label>
              </div>

              {/* Actions — full width */}
              <div className="flex gap-3 justify-between md:col-span-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => { setFormData(defaultForm); toast.success('Form cleared'); }}
                  className="text-destructive hover:text-destructive"
                >
                  Clear Form
                </Button>
                <Button onClick={handleSubmit} disabled={isLoading} loading={isLoading}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  {isLoading ? 'Creating Agent...' : 'Create Agent'}
                </Button>
              </div>

            </div>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
