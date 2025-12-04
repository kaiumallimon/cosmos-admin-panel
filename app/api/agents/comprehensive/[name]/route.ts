import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware';
import { getCollection } from '@/lib/mongodb';
import { Agent, AgentTool, AgentConfiguration, FewShotExample, AgentWithRelations } from '@/lib/agent-types';

// GET /api/agents/comprehensive/[name] - Get agent details by name (legacy endpoint)
async function getHandler(req: AuthenticatedRequest, { params }: { params: Promise<{ name: string }> }) {
  try {
    const { name } = await params;

    if (!name) {
      return NextResponse.json({
        success: false,
        message: 'Agent name is required'
      }, { status: 400 });
    }

    const agentsCollection = await getCollection<Agent>('agents');
    const agentToolsCollection = await getCollection<AgentTool>('agent_tools');
    const agentConfigurationsCollection = await getCollection<AgentConfiguration>('agent_configurations');
    const fewShotExamplesCollection = await getCollection<FewShotExample>('few_shot_examples');

    // Find agent by name
    const agent = await agentsCollection.findOne({ name: decodeURIComponent(name) });
    
    if (!agent) {
      return NextResponse.json({
        success: false,
        message: 'Agent not found'
      }, { status: 404 });
    }

    // Fetch related data
    const agentTools = await agentToolsCollection.find({ agent_id: agent.id }).toArray();
    const agentConfigurations = await agentConfigurationsCollection.find({ agent_id: agent.id }).toArray();
    const fewShotExamples = await fewShotExamplesCollection.find({ agent_name: agent.name }).toArray();

    const agentWithRelations: AgentWithRelations = {
      ...agent,
      agent_tools: agentTools,
      agent_configurations: agentConfigurations,
      few_shot_examples: fewShotExamples
    };

    // Return in legacy format for compatibility
    return NextResponse.json({
      success: true,
      data: agentWithRelations,
      message: 'Agent details fetched successfully'
    }, { status: 500 });
  }
}

// DELETE /api/agents/comprehensive/[name] - Delete agent by name (legacy endpoint)
async function deleteHandler(req: AuthenticatedRequest, { params }: { params: Promise<{ name: string }> }) {
  try {
    const { name } = await params;

    if (!name) {
      return NextResponse.json({
        success: false,
        message: 'Agent name is required'
      }, { status: 400 });
    }

    const agentsCollection = await getCollection<Agent>('agents');
    const agentToolsCollection = await getCollection<AgentTool>('agent_tools');
    const agentConfigurationsCollection = await getCollection<AgentConfiguration>('agent_configurations');
    const fewShotExamplesCollection = await getCollection<FewShotExample>('few_shot_examples');

    // Find agent by name
    const agent = await agentsCollection.findOne({ name: decodeURIComponent(name) });
    
    if (!agent) {
      return NextResponse.json({
        success: false,
        message: 'Agent not found'
      }, { status: 404 });
    }

    // Delete related data first, then the agent
    await agentToolsCollection.deleteMany({ agent_id: agent.id });
    await agentConfigurationsCollection.deleteMany({ agent_id: agent.id });
    await fewShotExamplesCollection.deleteMany({ agent_name: agent.name });
    
    const deleteResult = await agentsCollection.deleteOne({ name: decodeURIComponent(name) });
    
    if (deleteResult.deletedCount === 0) {
      return NextResponse.json({
        success: false,
        message: 'Failed to delete agent'
      }, { status: 500 });
    }

    // Return in legacy format for compatibility
    return NextResponse.json({
      success: true,
      message: 'Agent and all related data deleted successfully'
    });

  } catch (error: any) {
    console.error('Error deleting agent:', error);
    return NextResponse.json({
      success: false,
    }, { status: 500 });
  }
}

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  const url = new URL(req.url);
  const pathSegments = url.pathname.split('/');
  const name = pathSegments[pathSegments.length - 1];
  return getHandler(req, { params: Promise.resolve({ name }) });
});

export const DELETE = withAuth(async (req: AuthenticatedRequest) => {
  const url = new URL(req.url);
  const pathSegments = url.pathname.split('/');
  const name = pathSegments[pathSegments.length - 1];
  return deleteHandler(req, { params: Promise.resolve({ name }) });
});