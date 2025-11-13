'use client';

import { useState, useCallback, useRef } from 'react';
import { FrostedHeader } from "@/components/custom/frosted-header";
import { useMobileMenu } from "@/components/mobile-menu-context";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { makeAuthenticatedRequest } from "@/lib/api-helpers";
import { generateAgentName, validateAgentName, formatJsonForDisplay, validateJsonString } from "@/lib/agent-utils";
import { ExistingAgentsList } from "@/components/agents/existing-agents-list";
import { AgentTemplates, type AgentTemplate } from "@/components/agents/agent-templates";
import { Plus, Minus, Save, Eye, EyeOff, CheckCircle, AlertCircle, Loader2, ArrowDown, Wand2 } from "lucide-react";
import { toast } from "sonner";

interface Tool {
  tool_name: string;
  tool_description: string;
  is_enabled: boolean;
}

interface Configuration {
  config_key: string;
  config_value: any;
  description: string;
}

interface FewShotExample {
  example_type: string;
  user_query: string;
  expected_output: any;
  description: string;
  is_active: boolean;
}

interface AgentFormData {
  name: string;
  display_name: string;
  description: string;
  system_prompt: string;
  question_processing_prompt: string;
  is_active: boolean;
  tools: Tool[];
  configurations: Configuration[];
  few_shot_examples: FewShotExample[];
}

export default function CreateAgentPage() {
  const { toggleMobileMenu } = useMobileMenu();
  const [isLoading, setIsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const createFormRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState<AgentFormData>({
    name: '',
    display_name: '',
    description: '',
    system_prompt: '',
    question_processing_prompt: '',
    is_active: true,
    tools: [],
    configurations: [],
    few_shot_examples: []
  });

  const updateFormData = useCallback((field: keyof AgentFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const addTool = useCallback(() => {
    const newTool: Tool = {
      tool_name: '',
      tool_description: '',
      is_enabled: true
    };
    setFormData(prev => ({
      ...prev,
      tools: [...prev.tools, newTool]
    }));
  }, []);

  const updateTool = useCallback((index: number, field: keyof Tool, value: any) => {
    setFormData(prev => ({
      ...prev,
      tools: prev.tools.map((tool, i) => 
        i === index ? { ...tool, [field]: value } : tool
      )
    }));
  }, []);

  const removeTool = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      tools: prev.tools.filter((_, i) => i !== index)
    }));
  }, []);

  const addConfiguration = useCallback(() => {
    const newConfig: Configuration = {
      config_key: '',
      config_value: {},
      description: ''
    };
    setFormData(prev => ({
      ...prev,
      configurations: [...prev.configurations, newConfig]
    }));
  }, []);

  const updateConfiguration = useCallback((index: number, field: keyof Configuration, value: any) => {
    setFormData(prev => ({
      ...prev,
      configurations: prev.configurations.map((config, i) => 
        i === index ? { ...config, [field]: value } : config
      )
    }));
  }, []);

  const removeConfiguration = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      configurations: prev.configurations.filter((_, i) => i !== index)
    }));
  }, []);

  const addFewShotExample = useCallback(() => {
    const newExample: FewShotExample = {
      example_type: '',
      user_query: '',
      expected_output: {},
      description: '',
      is_active: true
    };
    setFormData(prev => ({
      ...prev,
      few_shot_examples: [...prev.few_shot_examples, newExample]
    }));
  }, []);

  const updateFewShotExample = useCallback((index: number, field: keyof FewShotExample, value: any) => {
    setFormData(prev => ({
      ...prev,
      few_shot_examples: prev.few_shot_examples.map((example, i) => 
        i === index ? { ...example, [field]: value } : example
      )
    }));
  }, []);

  const removeFewShotExample = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      few_shot_examples: prev.few_shot_examples.filter((_, i) => i !== index)
    }));
  }, []);

  const validateForm = (): boolean => {
    // Validate agent name
    const nameValidation = validateAgentName(formData.name);
    if (!nameValidation.isValid) {
      toast.error(nameValidation.error || 'Invalid agent name');
      return false;
    }
    
    if (!formData.display_name.trim()) {
      toast.error('Display name is required');
      return false;
    }
    if (!formData.description.trim()) {
      toast.error('Description is required');
      return false;
    }
    if (!formData.system_prompt.trim()) {
      toast.error('System prompt is required');
      return false;
    }
    
    // Validate tools
    for (const tool of formData.tools) {
      if (!tool.tool_name.trim() || !tool.tool_description.trim()) {
        toast.error('All tools must have name and description');
        return false;
      }
    }
    
    // Validate configurations
    for (const config of formData.configurations) {
      if (!config.config_key.trim() || !config.description.trim()) {
        toast.error('All configurations must have key and description');
        return false;
      }
      
      if (typeof config.config_value === 'string' && config.config_value) {
        const jsonValidation = validateJsonString(config.config_value);
        if (!jsonValidation.isValid) {
          toast.error(`Invalid JSON in configuration "${config.config_key}": ${jsonValidation.error}`);
          return false;
        }
      }
    }
    
    // Validate few-shot examples
    for (const example of formData.few_shot_examples) {
      if (!example.example_type.trim() || !example.user_query.trim() || !example.description.trim()) {
        toast.error('All few-shot examples must have type, query, and description');
        return false;
      }
      
      if (typeof example.expected_output === 'string' && example.expected_output) {
        const jsonValidation = validateJsonString(example.expected_output);
        if (!jsonValidation.isValid) {
          toast.error(`Invalid JSON in few-shot example "${example.example_type}": ${jsonValidation.error}`);
          return false;
        }
      }
    }
    
    return true;
  };

  const handleCreateNewAgent = () => {
    setShowCreateForm(true);
    setTimeout(() => {
      createFormRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSelectTemplate = (template: AgentTemplate) => {
    setFormData({
      name: template.name,
      display_name: template.display_name,
      description: template.description,
      system_prompt: template.system_prompt,
      question_processing_prompt: template.question_processing_prompt || '',
      is_active: true,
      tools: template.tools,
      configurations: template.configurations,
      few_shot_examples: template.few_shot_examples
    });
    setShowCreateForm(true);
    setTimeout(() => {
      createFormRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
    toast.success(`Template "${template.display_name}" loaded!`);
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    try {
      // Process configurations and few-shot examples to ensure proper JSON
      const processedData = {
        ...formData,
        configurations: formData.configurations.map(config => ({
          ...config,
          config_value: typeof config.config_value === 'string' 
            ? JSON.parse(config.config_value) 
            : config.config_value
        })),
        few_shot_examples: formData.few_shot_examples.map(example => ({
          ...example,
          expected_output: typeof example.expected_output === 'string' 
            ? JSON.parse(example.expected_output) 
            : example.expected_output
        }))
      };

      const response = await makeAuthenticatedRequest('/api/agents/comprehensive/create', {
        method: 'POST',
        body: JSON.stringify(processedData)
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`Agent "${formData.display_name}" created successfully!`);
        // Reset form
        setFormData({
          name: '',
          display_name: '',
          description: '',
          system_prompt: '',
          question_processing_prompt: '',
          is_active: true,
          tools: [],
          configurations: [],
          few_shot_examples: []
        });
        // Hide the form and show the updated list
        setShowCreateForm(false);
        window.scrollTo(0, 0);
      } else {
        toast.error(result.message || 'Failed to create agent');
      }
    } catch (error) {
      console.error('Error creating agent:', error);
      toast.error('Failed to create agent. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background flex flex-col">
        <FrostedHeader 
          title="Create New Agent" 
          subtitle="Set up a comprehensive agent with all its components" 
          onMobileMenuToggle={toggleMobileMenu}
        />

        <div className="flex-1 p-4 sm:p-6 w-full">
          <div className="space-y-6 sm:space-y-8">
            {/* Existing Agents List */}
            <ExistingAgentsList onCreateNewAgent={handleCreateNewAgent} />

            {/* Agent Templates */}
            {!showCreateForm && (
              <AgentTemplates onSelectTemplate={handleSelectTemplate} />
            )}

            {/* Create New Agent Form */}
            {showCreateForm && (
              <div ref={createFormRef} className="space-y-6 lg:space-y-8">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ArrowDown className="h-4 w-4" />
                  <span>Create New Agent</span>
                </div>
                
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
                  <div className="space-y-6 lg:space-y-8">
                    {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Basic Information
                </CardTitle>
                <CardDescription>
                  Define the core properties of your agent
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="display_name">Display Name *</Label>
                    <Input
                      id="display_name"
                      placeholder="e.g., Professor Mathematics"
                      value={formData.display_name}
                      onChange={(e) => {
                        updateFormData('display_name', e.target.value);
                        // Auto-generate agent name if it's empty
                        if (!formData.name) {
                          const generatedName = generateAgentName(e.target.value);
                          updateFormData('name', generatedName);
                        }
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="name">Agent Name *</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const generatedName = generateAgentName(formData.display_name);
                          updateFormData('name', generatedName);
                          toast.success('Agent name generated from display name');
                        }}
                        className="h-6 px-2 text-xs"
                        disabled={!formData.display_name}
                      >
                        <Wand2 className="h-3 w-3 mr-1" />
                        Generate
                      </Button>
                    </div>
                    <Input
                      id="name"
                      placeholder="e.g., math_agent"
                      value={formData.name}
                      onChange={(e) => updateFormData('name', e.target.value)}
                      className={validateAgentName(formData.name).isValid ? '' : 'border-destructive'}
                    />
                    {formData.name && !validateAgentName(formData.name).isValid && (
                      <p className="text-xs text-destructive">
                        {validateAgentName(formData.name).error}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Lowercase with underscores (used internally)
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what this agent specializes in..."
                    value={formData.description}
                    onChange={(e) => updateFormData('description', e.target.value)}
                    rows={3}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="system_prompt">System Prompt *</Label>
                  <Textarea
                    id="system_prompt"
                    placeholder="You are a specialized expert in..."
                    value={formData.system_prompt}
                    onChange={(e) => updateFormData('system_prompt', e.target.value)}
                    rows={6}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="question_processing_prompt">Question Processing Prompt</Label>
                  <Textarea
                    id="question_processing_prompt"
                    placeholder="Instructions for processing user questions..."
                    value={formData.question_processing_prompt}
                    onChange={(e) => updateFormData('question_processing_prompt', e.target.value)}
                    rows={4}
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => updateFormData('is_active', checked)}
                  />
                  <Label htmlFor="is_active">Agent is active</Label>
                </div>
              </CardContent>
            </Card>

            {/* Tools Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-blue-500" />
                  Tools
                  <Badge variant="secondary">{formData.tools.length}</Badge>
                </CardTitle>
                <CardDescription>
                  Define the tools this agent can use
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.tools.map((tool, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="font-medium">Tool {index + 1}</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeTool(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
                      <div className="space-y-2">
                        <Label>Tool Name</Label>
                        <Input
                          placeholder="e.g., retrieve_academic_questions"
                          value={tool.tool_name}
                          onChange={(e) => updateTool(index, 'tool_name', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2 flex items-end">
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={tool.is_enabled}
                            onCheckedChange={(checked) => updateTool(index, 'is_enabled', checked)}
                          />
                          <Label>Enabled</Label>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Tool Description</Label>
                      <Textarea
                        placeholder="Describe what this tool does..."
                        value={tool.tool_description}
                        onChange={(e) => updateTool(index, 'tool_description', e.target.value)}
                        rows={2}
                      />
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={addTool}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Tool
                </Button>
              </CardContent>
            </Card>
                  </div>
                  
                  <div className="space-y-6 lg:space-y-8">
                    {/* Configurations Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-purple-500" />
                  Configurations
                  <Badge variant="secondary">{formData.configurations.length}</Badge>
                </CardTitle>
                <CardDescription>
                  Set configuration parameters for your agent
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.configurations.map((config, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="font-medium">Configuration {index + 1}</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeConfiguration(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
                      <div className="space-y-2">
                        <Label>Configuration Key</Label>
                        <Input
                          placeholder="e.g., max_questions_per_response"
                          value={config.config_key}
                          onChange={(e) => updateConfiguration(index, 'config_key', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Input
                          placeholder="What this configuration controls..."
                          value={config.description}
                          onChange={(e) => updateConfiguration(index, 'description', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Configuration Value (JSON)</Label>
                      <Textarea
                        placeholder='{"value": 5, "type": "integer"}'
                        value={formatJsonForDisplay(config.config_value)}
                        onChange={(e) => updateConfiguration(index, 'config_value', e.target.value)}
                        rows={3}
                        className={typeof config.config_value === 'string' && config.config_value && !validateJsonString(config.config_value).isValid ? 'border-destructive' : ''}
                      />
                      {typeof config.config_value === 'string' && config.config_value && !validateJsonString(config.config_value).isValid && (
                        <p className="text-xs text-destructive">
                          {validateJsonString(config.config_value).error}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={addConfiguration}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Configuration
                </Button>
              </CardContent>
            </Card>

            {/* Few-Shot Examples Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                  Few-Shot Examples
                  <Badge variant="secondary">{formData.few_shot_examples.length}</Badge>
                </CardTitle>
                <CardDescription>
                  Provide training examples for your agent's behavior
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.few_shot_examples.map((example, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="font-medium">Example {index + 1}</Label>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={example.is_active}
                            onCheckedChange={(checked) => updateFewShotExample(index, 'is_active', checked)}
                          />
                          <Label className="text-sm">Active</Label>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeFewShotExample(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
                      <div className="space-y-2">
                        <Label>Example Type</Label>
                        <Input
                          placeholder="e.g., question_request or routing"
                          value={example.example_type}
                          onChange={(e) => updateFewShotExample(index, 'example_type', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Input
                          placeholder="What this example demonstrates..."
                          value={example.description}
                          onChange={(e) => updateFewShotExample(index, 'description', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>User Query</Label>
                      <Input
                        placeholder="Sample user question or request..."
                        value={example.user_query}
                        onChange={(e) => updateFewShotExample(index, 'user_query', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Expected Output (JSON)</Label>
                      <Textarea
                        placeholder='{"course_title": "mathematics", "question": "..."}'
                        value={formatJsonForDisplay(example.expected_output)}
                        onChange={(e) => updateFewShotExample(index, 'expected_output', e.target.value)}
                        rows={4}
                        className={typeof example.expected_output === 'string' && example.expected_output && !validateJsonString(example.expected_output).isValid ? 'border-destructive' : ''}
                      />
                      {typeof example.expected_output === 'string' && example.expected_output && !validateJsonString(example.expected_output).isValid && (
                        <p className="text-xs text-destructive">
                          {validateJsonString(example.expected_output).error}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={addFewShotExample}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Few-Shot Example
                </Button>
              </CardContent>
            </Card>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col lg:flex-row gap-4 justify-between">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setFormData({
                          name: '',
                          display_name: '',
                          description: '',
                          system_prompt: '',
                          question_processing_prompt: '',
                          is_active: true,
                          tools: [],
                          configurations: [],
                          few_shot_examples: []
                        });
                        toast.success('Form cleared');
                      }}
                      className="text-red-600 hover:text-red-700"
                    >
                      Clear Form
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowCreateForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowPreview(!showPreview)}
                      className="flex items-center gap-2"
                    >
                      {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      {showPreview ? 'Hide Preview' : 'Show Preview'}
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={isLoading}
                      className="flex items-center gap-2"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      {isLoading ? 'Creating Agent...' : 'Create Agent'}
                    </Button>
                  </div>
                </div>

                {/* Preview Section */}
                {showPreview && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Preview</CardTitle>
                      <CardDescription>
                        Review your agent configuration before creating
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <pre className="bg-muted p-4 rounded-lg overflow-auto text-sm">
                        {JSON.stringify(formData, null, 2)}
                      </pre>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
