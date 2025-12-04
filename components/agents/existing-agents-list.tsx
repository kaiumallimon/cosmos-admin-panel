'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { makeAuthenticatedJsonRequest } from "@/lib/api-helpers";
import { handleApiError, retryOperation } from "@/lib/error-handling";
import { Loader2, Users, Plus, RefreshCw, Eye, Edit, Trash2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface Agent {
  id: string;
  name: string;
  display_name: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  tools_count?: number;
  configurations_count?: number;
  few_shot_examples_count?: number;
}

interface AgentListProps {
  onCreateNewAgent: () => void;
}

export function ExistingAgentsList({ onCreateNewAgent }: AgentListProps) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [includeInactive, setIncludeInactive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAgents = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await retryOperation(
        () => makeAuthenticatedJsonRequest('/api/agents', { method: 'GET' }),
        3,
        1000,
        'Loading agents'
      );
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch agents');
      }

      const agentsData = result.data;
      console.log('API Response:', agentsData); // Debug log
      
      // Filter agents based on includeInactive setting
      const filteredAgents = includeInactive 
        ? agentsData 
        : agentsData.filter((agent: Agent) => agent.is_active);

      // Add counts from related data
      const processedAgents = filteredAgents.map((agent: any) => ({
        id: agent.id,
        name: agent.name,
        display_name: agent.display_name,
        description: agent.description,
        is_active: agent.is_active,
        created_at: agent.created_at,
        updated_at: agent.updated_at,
        tools_count: agent.agent_tools?.length || 0,
        configurations_count: agent.agent_configurations?.length || 0,
        few_shot_examples_count: agent.few_shot_examples?.length || 0
      }));
      
      console.log('Processed agents data:', processedAgents); // Debug log
      setAgents(processedAgents);
      setError(null);
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to load agents';
      setError(errorMessage);
      handleApiError(errorMessage, 'Loading agents');
      setAgents([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, [includeInactive]);

  const handleDeleteAgent = async (agentName: string, displayName: string) => {
    if (!confirm(`Are you sure you want to delete "${displayName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      // Find the agent by name to get the ID
      const agent = agents.find(a => a.name === agentName);
      if (!agent) {
        handleApiError('Agent not found', 'Delete agent');
        return;
      }

      const loadingToast = toast.loading(`Deleting agent "${displayName}"...`);

      const result = await retryOperation(
        () => makeAuthenticatedJsonRequest(`/api/agents/${agent.id}`, { method: 'DELETE' }),
        2,
        1000,
        'Deleting agent'
      );

      toast.dismiss(loadingToast);

      if (!result.success) {
        handleApiError(result.error || 'Failed to delete agent', 'Delete agent');
        return;
      }

      toast.success(`Agent "${displayName}" deleted successfully`, {
        duration: 4000
      });
      fetchAgents(); // Refresh the list
    } catch (error: any) {
      handleApiError(error.message || 'Failed to delete agent', 'Delete agent');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              Existing Agents
              <Badge variant="secondary">{agents.length}</Badge>
            </CardTitle>
            <CardDescription>
              Manage your existing agents or create a new one
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIncludeInactive(!includeInactive)}
            >
              {includeInactive ? 'Hide Inactive' : 'Show Inactive'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchAgents}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
            <Button
              onClick={onCreateNewAgent}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Agent
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Loading agents...</span>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive opacity-50" />
            <p className="text-lg font-medium mb-2 text-destructive">Error Loading Agents</p>
            <p className="text-sm mb-4">{error}</p>
            <Button variant="outline" onClick={fetchAgents}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        ) : !Array.isArray(agents) || agents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No agents found</p>
            <p className="text-sm">
              {includeInactive 
                ? "No agents exist in the system yet." 
                : "No active agents found. Try showing inactive agents or create a new one."
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {Array.isArray(agents) && agents.map((agent, index) => (
              <div 
                key={agent.id || `agent-${index}`} 
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm truncate" title={agent.display_name}>
                      {agent.display_name}
                    </h3>
                    <p className="text-xs text-muted-foreground truncate" title={agent.name}>
                      {agent.name}
                    </p>
                  </div>
                  <Badge 
                    variant={agent.is_active ? "default" : "secondary"}
                    className="ml-2 shrink-0 text-xs"
                  >
                    {agent.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                
                <p className="text-xs text-muted-foreground mb-3 line-clamp-2" title={agent.description}>
                  {agent.description}
                </p>
                
                {(agent.tools_count !== undefined || agent.configurations_count !== undefined || agent.few_shot_examples_count !== undefined) && (
                  <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
                    {agent.tools_count !== undefined && (
                      <span>{agent.tools_count} tools</span>
                    )}
                    {agent.configurations_count !== undefined && (
                      <span>• {agent.configurations_count} configs</span>
                    )}
                    {agent.few_shot_examples_count !== undefined && (
                      <span>• {agent.few_shot_examples_count} examples</span>
                    )}
                  </div>
                )}
                
                <div className="text-xs text-muted-foreground mb-3">
                  <p>Created: {formatDate(agent.created_at)}</p>
                  {agent.updated_at !== agent.created_at && (
                    <p>Updated: {formatDate(agent.updated_at)}</p>
                  )}
                </div>
                
                
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}