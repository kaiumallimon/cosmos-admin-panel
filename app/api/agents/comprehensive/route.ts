import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware';
import { getCollection } from '@/lib/mongodb';
import { Agent, AgentTool, AgentConfiguration, FewShotExample, AgentWithRelations } from '@/lib/agent-types';

// GET /api/agents/comprehensive - Fetch all agents with related data (legacy endpoint)
async function getHandler(req: AuthenticatedRequest) {
  try {
    const url = new URL(req.url);
    const includeInactive = url.searchParams.get('include_inactive') === 'true';

    const agentsCollection = await getCollection<Agent>('agents');
    const agentToolsCollection = await getCollection<AgentTool>('agent_tools');
    const agentConfigurationsCollection = await getCollection<AgentConfiguration>('agent_configurations');
    const fewShotExamplesCollection = await getCollection<FewShotExample>('few_shot_examples');

    // Build query based on includeInactive parameter
    const query = includeInactive ? {} : { is_active: true };
    
    // Fetch agents with query
    const agents = await agentsCollection.find(query).toArray();

    // Enhance agents with related data
    const agentsWithRelations: AgentWithRelations[] = [];
    
    for (const agent of agents) {
      // Fetch agent tools
      const agentTools = await agentToolsCollection.find({ agent_id: agent.id }).toArray();
      
      // Fetch agent configurations
      const agentConfigurations = await agentConfigurationsCollection.find({ agent_id: agent.id }).toArray();
      
      // Fetch few shot examples using agent name
      const fewShotExamples = await fewShotExamplesCollection.find({ agent_name: agent.name }).toArray();
      
      agentsWithRelations.push({
        ...agent,
        agent_tools: agentTools,
        agent_configurations: agentConfigurations,
        few_shot_examples: fewShotExamples
      });
    }

    // Return in legacy format for compatibility
    return NextResponse.json({
      success: true,
      data: {
        agents: agentsWithRelations
      },
      message: 'Agents fetched successfully'
    });

  } catch (error: any) {
    console.error('Error fetching comprehensive agents:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch agents: ' + error.message
    }, { status: 500 });
  }
}

export const GET = withAuth(getHandler);