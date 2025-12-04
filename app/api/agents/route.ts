import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware';
import { getCollection } from '@/lib/mongodb';
import { Agent, AgentTool, AgentConfiguration, FewShotExample, AgentWithRelations, CreateAgentRequest } from '@/lib/agent-types';
import { v4 as uuidv4 } from 'uuid';

// GET /api/agents - Fetch all agents with their related data
async function getHandler(req: AuthenticatedRequest) {
  try {
    const agentsCollection = await getCollection<Agent>('agents');
    const agentToolsCollection = await getCollection<AgentTool>('agent_tools');
    const agentConfigurationsCollection = await getCollection<AgentConfiguration>('agent_configurations');
    const fewShotExamplesCollection = await getCollection<FewShotExample>('few_shot_examples');

    // Fetch all agents
    const agents = await agentsCollection.find({}).toArray();

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

    console.log('Fetched agents from MongoDB:', agentsWithRelations.length);
    return NextResponse.json(agentsWithRelations);

  } catch (error: any) {
    console.error('Error fetching agents:', error);
    return NextResponse.json({ error: 'Failed to fetch agents: ' + error.message }, { status: 500 });
  }
}

// POST /api/agents - Create a new agent
async function postHandler(req: AuthenticatedRequest) {
  try {
    const body: CreateAgentRequest = await req.json();
    
    // Validate required fields
    if (!body.name || !body.display_name || !body.description || !body.system_prompt) {
      return NextResponse.json({ 
        error: 'Missing required fields: name, display_name, description, system_prompt' 
      }, { status: 400 });
    }

    const agentsCollection = await getCollection<Agent>('agents');
    
    // Check if agent name already exists
    const existingAgent = await agentsCollection.findOne({ name: body.name });
    if (existingAgent) {
      return NextResponse.json({ error: 'Agent with this name already exists' }, { status: 409 });
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
      return NextResponse.json({ error: 'Failed to create agent' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Agent created successfully',
      agent: newAgent 
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating agent:', error);
    return NextResponse.json({ error: 'Failed to create agent: ' + error.message }, { status: 500 });
  }
}

export const GET = withAuth(getHandler);
export const POST = withAuth(postHandler);
