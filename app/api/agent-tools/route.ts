import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware';
import { getCollection } from '@/lib/mongodb';
import { AgentTool, CreateAgentToolRequest } from '@/lib/agent-types';
import { v4 as uuidv4 } from 'uuid';

// GET /api/agent-tools - Fetch all agent tools (optionally filtered by agent_id)
async function getHandler(req: AuthenticatedRequest) {
  try {
    const url = new URL(req.url);
    const agentId = url.searchParams.get('agent_id');

    const agentToolsCollection = await getCollection<AgentTool>('agent_tools');
    
    const query = agentId ? { agent_id: agentId } : {};
    const agentTools = await agentToolsCollection.find(query).toArray();

    return NextResponse.json(agentTools);

  } catch (error: any) {
    console.error('Error fetching agent tools:', error);
    return NextResponse.json({ error: 'Failed to fetch agent tools: ' + error.message }, { status: 500 });
  }
}

// POST /api/agent-tools - Create a new agent tool
async function postHandler(req: AuthenticatedRequest) {
  try {
    const body: CreateAgentToolRequest = await req.json();
    
    // Validate required fields
    if (!body.agent_id || !body.tool_name || !body.tool_description) {
      return NextResponse.json({ 
        error: 'Missing required fields: agent_id, tool_name, tool_description' 
      }, { status: 400 });
    }

    const agentToolsCollection = await getCollection<AgentTool>('agent_tools');
    
    // Check if tool with same name exists for this agent
    const existingTool = await agentToolsCollection.findOne({ 
      agent_id: body.agent_id, 
      tool_name: body.tool_name 
    });
    
    if (existingTool) {
      return NextResponse.json({ error: 'Tool with this name already exists for this agent' }, { status: 409 });
    }

    // Create new agent tool
    const newAgentTool: AgentTool = {
      id: uuidv4(),
      agent_id: body.agent_id,
      tool_name: body.tool_name,
      tool_description: body.tool_description,
      is_enabled: body.is_enabled ?? true,
      created_at: new Date()
    };

    const result = await agentToolsCollection.insertOne(newAgentTool);
    
    if (!result.insertedId) {
      return NextResponse.json({ error: 'Failed to create agent tool' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Agent tool created successfully',
      agentTool: newAgentTool 
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating agent tool:', error);
    return NextResponse.json({ error: 'Failed to create agent tool: ' + error.message }, { status: 500 });
  }
}

export const GET = withAuth(getHandler);
export const POST = withAuth(postHandler);