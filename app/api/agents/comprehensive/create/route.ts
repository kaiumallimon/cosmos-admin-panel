import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware';
import { getCollection } from '@/lib/mongodb';
import { Agent, CreateAgentRequest } from '@/lib/agent-types';
import { v4 as uuidv4 } from 'uuid';

// POST /api/agents/comprehensive/create - Create a new agent (legacy endpoint)
async function postHandler(req: AuthenticatedRequest) {
  try {
    const body: CreateAgentRequest = await req.json();
    
    // Validate required fields
    if (!body.name || !body.display_name || !body.description || !body.system_prompt) {
      return NextResponse.json({
        success: false,
        message: 'Missing required fields: name, display_name, description, system_prompt are required',
        errors: ['Missing required fields']
      }, { status: 400 });
    }

    const agentsCollection = await getCollection<Agent>('agents');
    
    // Check if agent name already exists
    const existingAgent = await agentsCollection.findOne({ name: body.name });
    if (existingAgent) {
      return NextResponse.json({
        success: false,
        message: 'Agent with this name already exists',
        errors: ['Agent name must be unique']
      }, { status: 409 });
    }

    // Create new agent
    const newAgent: Agent = {
      id: uuidv4(),
      name: body.name,
      display_name: body.display_name,
      description: body.description,
      system_prompt: body.system_prompt,
      question_processing_prompt: body.question_processing_prompt || null,
      is_active: body.is_active ?? true,
      created_at: new Date(),
      updated_at: new Date()
    };

    const result = await agentsCollection.insertOne(newAgent);
    
    if (!result.insertedId) {
      return NextResponse.json({
        success: false,
        message: 'Failed to create agent'
      }, { status: 500 });
    }

    // Return in legacy format for compatibility
    return NextResponse.json({
      success: true,
      data: newAgent,
      message: 'Agent created successfully'
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating agent:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to create agent: ' + error.message
    }, { status: 500 });
  }
}

export const POST = withAuth(postHandler);