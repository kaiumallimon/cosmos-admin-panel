import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware';
import { getCollection } from '@/lib/mongodb';
import { AgentConfiguration, UpdateAgentConfigurationRequest } from '@/lib/agent-types';

// GET /api/agent-configurations/[id] - Fetch a single agent configuration
async function getHandler(req: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const agentConfigurationsCollection = await getCollection<AgentConfiguration>('agent_configurations');
    const agentConfiguration = await agentConfigurationsCollection.findOne({ id });
    
    if (!agentConfiguration) {
      return NextResponse.json({ error: 'Agent configuration not found' }, { status: 404 });
    }

    return NextResponse.json(agentConfiguration);
  } catch (error: any) {
    console.error('Error fetching agent configuration:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error.message }, { status: 500 });
  }
}

// PUT /api/agent-configurations/[id] - Update an agent configuration
async function putHandler(req: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body: UpdateAgentConfigurationRequest = await req.json();

    const agentConfigurationsCollection = await getCollection<AgentConfiguration>('agent_configurations');
    
    // Check if agent configuration exists
    const existingConfig = await agentConfigurationsCollection.findOne({ id });
    if (!existingConfig) {
      return NextResponse.json({ error: 'Agent configuration not found' }, { status: 404 });
    }

    // Validate config_value structure if provided
    if (body.config_value) {
      if (!body.config_value.type || body.config_value.value === undefined) {
        return NextResponse.json({ 
          error: 'config_value must have type and value properties' 
        }, { status: 400 });
      }
    }

    // Check if config key is being changed and if it conflicts
    if (body.config_key && body.config_key !== existingConfig.config_key) {
      const keyConflict = await agentConfigurationsCollection.findOne({ 
        agent_id: existingConfig.agent_id, 
        config_key: body.config_key,
        id: { $ne: id } 
      });
      if (keyConflict) {
        return NextResponse.json({ error: 'Configuration with this key already exists for this agent' }, { status: 409 });
      }
    }

    // Update agent configuration
    const updateData = {
      ...body,
      updated_at: new Date()
    };

    const result = await agentConfigurationsCollection.updateOne(
      { id },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Agent configuration not found' }, { status: 404 });
    }

    // Fetch updated agent configuration
    const updatedConfig = await agentConfigurationsCollection.findOne({ id });
    
    return NextResponse.json({
      message: 'Agent configuration updated successfully',
      agentConfiguration: updatedConfig
    });

  } catch (error: any) {
    console.error('Error updating agent configuration:', error);
    return NextResponse.json({ error: 'Failed to update agent configuration: ' + error.message }, { status: 500 });
  }
}

// DELETE /api/agent-configurations/[id] - Delete an agent configuration
async function deleteHandler(req: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const agentConfigurationsCollection = await getCollection<AgentConfiguration>('agent_configurations');

    const deleteResult = await agentConfigurationsCollection.deleteOne({ id });
    
    if (deleteResult.deletedCount === 0) {
      return NextResponse.json({ error: 'Agent configuration not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Agent configuration deleted successfully',
      deletedId: id
    });

  } catch (error: any) {
    console.error('Error deleting agent configuration:', error);
    return NextResponse.json({ error: 'Failed to delete agent configuration: ' + error.message }, { status: 500 });
  }
}

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  const url = new URL(req.url);
  const pathSegments = url.pathname.split('/');
  const id = pathSegments[pathSegments.length - 1];
  return getHandler(req, { params: Promise.resolve({ id }) });
});

export const PUT = withAuth(async (req: AuthenticatedRequest) => {
  const url = new URL(req.url);
  const pathSegments = url.pathname.split('/');
  const id = pathSegments[pathSegments.length - 1];
  return putHandler(req, { params: Promise.resolve({ id }) });
});

export const DELETE = withAuth(async (req: AuthenticatedRequest) => {
  const url = new URL(req.url);
  const pathSegments = url.pathname.split('/');
  const id = pathSegments[pathSegments.length - 1];
  return deleteHandler(req, { params: Promise.resolve({ id }) });
});