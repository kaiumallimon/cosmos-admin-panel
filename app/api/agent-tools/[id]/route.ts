import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware';
import { getCollection } from '@/lib/mongodb';
import { AgentTool, UpdateAgentToolRequest } from '@/lib/agent-types';

// GET /api/agent-tools/[id] - Fetch a single agent tool
async function getHandler(req: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const agentToolsCollection = await getCollection<AgentTool>('agent_tools');
    const agentTool = await agentToolsCollection.findOne({ id });
    
    if (!agentTool) {
      return NextResponse.json({ error: 'Agent tool not found' }, { status: 404 });
    }

    return NextResponse.json(agentTool);
  } catch (error: any) {
    console.error('Error fetching agent tool:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error.message }, { status: 500 });
  }
}

// PUT /api/agent-tools/[id] - Update an agent tool
async function putHandler(req: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body: UpdateAgentToolRequest = await req.json();

    const agentToolsCollection = await getCollection<AgentTool>('agent_tools');
    
    // Check if agent tool exists
    const existingTool = await agentToolsCollection.findOne({ id });
    if (!existingTool) {
      return NextResponse.json({ error: 'Agent tool not found' }, { status: 404 });
    }

    // Check if tool name is being changed and if it conflicts
    if (body.tool_name && body.tool_name !== existingTool.tool_name) {
      const nameConflict = await agentToolsCollection.findOne({ 
        agent_id: existingTool.agent_id, 
        tool_name: body.tool_name,
        id: { $ne: id } 
      });
      if (nameConflict) {
        return NextResponse.json({ error: 'Tool with this name already exists for this agent' }, { status: 409 });
      }
    }

    // Update agent tool
    const updateData = {
      ...body,
      updated_at: new Date()
    };

    const result = await agentToolsCollection.updateOne(
      { id },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Agent tool not found' }, { status: 404 });
    }

    // Fetch updated agent tool
    const updatedTool = await agentToolsCollection.findOne({ id });
    
    return NextResponse.json({
      message: 'Agent tool updated successfully',
      agentTool: updatedTool
    });

  } catch (error: any) {
    console.error('Error updating agent tool:', error);
    return NextResponse.json({ error: 'Failed to update agent tool: ' + error.message }, { status: 500 });
  }
}

// DELETE /api/agent-tools/[id] - Delete an agent tool
async function deleteHandler(req: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const agentToolsCollection = await getCollection<AgentTool>('agent_tools');

    const deleteResult = await agentToolsCollection.deleteOne({ id });
    
    if (deleteResult.deletedCount === 0) {
      return NextResponse.json({ error: 'Agent tool not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Agent tool deleted successfully',
      deletedId: id
    });

  } catch (error: any) {
    console.error('Error deleting agent tool:', error);
    return NextResponse.json({ error: 'Failed to delete agent tool: ' + error.message }, { status: 500 });
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