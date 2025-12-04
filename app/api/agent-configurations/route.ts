import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware';
import { getCollection } from '@/lib/mongodb';
import { AgentConfiguration, CreateAgentConfigurationRequest } from '@/lib/agent-types';
import { v4 as uuidv4 } from 'uuid';

// GET /api/agent-configurations - Fetch all agent configurations (optionally filtered by agent_id)
async function getHandler(req: AuthenticatedRequest) {
  try {
    const url = new URL(req.url);
    const agentId = url.searchParams.get('agent_id');

    const agentConfigurationsCollection = await getCollection<AgentConfiguration>('agent_configurations');
    
    const query = agentId ? { agent_id: agentId } : {};
    const agentConfigurations = await agentConfigurationsCollection.find(query).toArray();

    return NextResponse.json(agentConfigurations);

  } catch (error: any) {
    console.error('Error fetching agent configurations:', error);
    return NextResponse.json({ error: 'Failed to fetch agent configurations: ' + error.message }, { status: 500 });
  }
}

// POST /api/agent-configurations - Create a new agent configuration
async function postHandler(req: AuthenticatedRequest) {
  try {
    const body: CreateAgentConfigurationRequest = await req.json();
    
    // Validate required fields
    if (!body.agent_id || !body.config_key || !body.config_value || !body.description) {
      return NextResponse.json({ 
        error: 'Missing required fields: agent_id, config_key, config_value, description' 
      }, { status: 400 });
    }

    // Validate config_value structure
    if (!body.config_value.type || body.config_value.value === undefined) {
      return NextResponse.json({ 
        error: 'config_value must have type and value properties' 
      }, { status: 400 });
    }

    const agentConfigurationsCollection = await getCollection<AgentConfiguration>('agent_configurations');
    
    // Check if configuration with same key exists for this agent
    const existingConfig = await agentConfigurationsCollection.findOne({ 
      agent_id: body.agent_id, 
      config_key: body.config_key 
    });
    
    if (existingConfig) {
      return NextResponse.json({ error: 'Configuration with this key already exists for this agent' }, { status: 409 });
    }

    // Create new agent configuration
    const newAgentConfiguration: AgentConfiguration = {
      id: uuidv4(),
      agent_id: body.agent_id,
      config_key: body.config_key,
      config_value: body.config_value,
      description: body.description,
      created_at: new Date(),
      updated_at: new Date()
    };

    const result = await agentConfigurationsCollection.insertOne(newAgentConfiguration);
    
    if (!result.insertedId) {
      return NextResponse.json({ error: 'Failed to create agent configuration' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Agent configuration created successfully',
      agentConfiguration: newAgentConfiguration 
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating agent configuration:', error);
    return NextResponse.json({ error: 'Failed to create agent configuration: ' + error.message }, { status: 500 });
  }
}

export const GET = withAuth(getHandler);
export const POST = withAuth(postHandler);