'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { makeAuthenticatedRequest } from "@/lib/api-helpers";
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
      
      const response = await makeAuthenticatedRequest(
        `/api/agents/comprehensive/?include_inactive=${includeInactive}`, 
        { method: 'GET' }
      );
      
      const result = await response.json();
      console.log('API Response:', result); // Debug log
      
      if (result.success) {
        // Handle different possible response structures
        let agentsData: Agent[] = [];
        
        if (Array.isArray(result.data)) {
          agentsData = result.data;
        } else if (Array.isArray(result.data?.agents)) {
          agentsData = result.data.agents;
        } else if (Array.isArray(result.agents)) {
          agentsData = result.agents;
        } else if (result.data && typeof result.data === 'object') {
          // If data is an object but not an array, wrap it in an array
          agentsData = [result.data];
        }
        
        console.log('Processed agents data:', agentsData); // Debug log
        setAgents(agentsData);
        setError(null);
      } else {
        console.warn('API returned error or no data:', result);
        const errorMessage = result.message || 'Failed to load agents';
        setError(errorMessage);
        toast.error(errorMessage);
        setAgents([]);
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
      const errorMessage = 'Failed to load agents. Please check your connection.';
      setError(errorMessage);
      toast.error(errorMessage);
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
      const response = await makeAuthenticatedRequest(
        `/api/agents/comprehensive/${encodeURIComponent(agentName)}`,
        { method: 'DELETE' }
      );

      const result = await response.json();

      if (result.success) {
        toast.success(`Agent "${displayName}" deleted successfully`);
        fetchAgents(); // Refresh the list
      } else {
        toast.error(result.message || 'Failed to delete agent');
      }
    } catch (error) {
      console.error('Error deleting agent:', error);
      toast.error('Failed to delete agent');
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
            {Array.isArray(agents) && agents.map((agent) => (
              <div 
                key={agent.id} 
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
                
                <div className="grid grid-cols-3 gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs min-w-0 px-2"
                    onClick={() => {
                      // Navigate to agent details or edit
                      window.open(`/dashboard/agents/${agent.name}`, '_blank');
                    }}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs min-w-0 px-2"
                    onClick={() => {
                      // Navigate to edit agent
                      window.open(`/dashboard/agents/${agent.name}/edit`, '_blank');
                    }}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteAgent(agent.name, agent.display_name)}
                    className="text-red-600 hover:text-red-700 text-xs min-w-0 px-2"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}