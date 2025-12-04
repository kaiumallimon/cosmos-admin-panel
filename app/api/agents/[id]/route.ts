import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware';
import { getCollection } from '@/lib/mongodb';
import { Agent, AgentTool, AgentConfiguration, FewShotExample, AgentWithRelations, UpdateAgentRequest } from '@/lib/agent-types';

// GET /api/agents/[id] - Fetch a single agent with related data
async function getHandler(req: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const agentsCollection = await getCollection<Agent>('agents');
    const agentToolsCollection = await getCollection<AgentTool>('agent_tools');
    const agentConfigurationsCollection = await getCollection<AgentConfiguration>('agent_configurations');
    const fewShotExamplesCollection = await getCollection<FewShotExample>('few_shot_examples');

    // Fetch the agent
    const agent = await agentsCollection.findOne({ id });
    
    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
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

    return NextResponse.json(agentWithRelations);
  } catch (error: any) {
    console.error('Error fetching agent:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error.message }, { status: 500 });
  }
}

// PUT /api/agents/[id] - Update an agent
async function putHandler(req: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body: UpdateAgentRequest = await req.json();

    const agentsCollection = await getCollection<Agent>('agents');
    
    // Check if agent exists
    const existingAgent = await agentsCollection.findOne({ id });
    if (!existingAgent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // Check if name is being changed and if it conflicts
    if (body.name && body.name !== existingAgent.name) {
      const nameConflict = await agentsCollection.findOne({ name: body.name, id: { $ne: id } });
      if (nameConflict) {
        return NextResponse.json({ error: 'Agent with this name already exists' }, { status: 409 });
      }
    }

    // Update agent
    const updateData = {
      ...body,
      updated_at: new Date()
    };

    const result = await agentsCollection.updateOne(
      { id },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // Fetch updated agent
    const updatedAgent = await agentsCollection.findOne({ id });
    
    return NextResponse.json({
      message: 'Agent updated successfully',
      agent: updatedAgent
    });

  } catch (error: any) {
    console.error('Error updating agent:', error);
    return NextResponse.json({ error: 'Failed to update agent: ' + error.message }, { status: 500 });
  }
}

// DELETE /api/agents/[id] - Delete an agent and all related data
async function deleteHandler(req: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const agentsCollection = await getCollection<Agent>('agents');
    const agentToolsCollection = await getCollection<AgentTool>('agent_tools');
    const agentConfigurationsCollection = await getCollection<AgentConfiguration>('agent_configurations');
    const fewShotExamplesCollection = await getCollection<FewShotExample>('few_shot_examples');

    // Check if agent exists
    const agent = await agentsCollection.findOne({ id });
    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // Delete in order: related data first, then the agent
    await agentToolsCollection.deleteMany({ agent_id: id });
    await agentConfigurationsCollection.deleteMany({ agent_id: id });
    await fewShotExamplesCollection.deleteMany({ agent_name: agent.name });
    
    const deleteResult = await agentsCollection.deleteOne({ id });
    
    if (deleteResult.deletedCount === 0) {
      return NextResponse.json({ error: 'Failed to delete agent' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Agent and all related data deleted successfully',
      deletedId: id
    });

  } catch (error: any) {
    console.error('Error deleting agent:', error);
    return NextResponse.json({ error: 'Failed to delete agent: ' + error.message }, { status: 500 });
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
    const body = await req.json();

    // Update agent
    const { data: agent, error: agentError } = await supabaseAdmin
      .from('agents')
      .update({
        name: body.name,
        display_name: body.display_name,
        description: body.description,
        system_prompt: body.system_prompt,
        question_processing_prompt: body.question_processing_prompt,
        is_active: body.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (agentError || !agent) {
      return NextResponse.json({ error: 'Failed to update agent' }, { status: 500 });
    }

    // Update agent_tools
    if (body.agent_tools) {
      await supabaseAdmin.from('agent_tools').delete().eq('agent_id', id);
      if (body.agent_tools.length > 0) {
        const toolsToInsert = body.agent_tools.map((tool: any) => ({
          agent_id: id,
          tool_name: tool.tool_name,
          tool_description: tool.tool_description,
          is_enabled: tool.is_enabled,
        }));
        const { error: toolsError } = await supabaseAdmin.from('agent_tools').insert(toolsToInsert);
        if (toolsError) throw toolsError;
      }
    }

    // Update few_shot_examples
    if (body.few_shot_examples) {
      await supabaseAdmin.from('few_shot_examples').delete().eq('agent_name', agent.name);
      if (body.few_shot_examples.length > 0) {
        const examplesToInsert = body.few_shot_examples.map((ex: any) => ({
          agent_name: agent.name,
          example_type: ex.example_type,
          user_query: ex.user_query,
          expected_output: ex.expected_output,
          description: ex.description,
          is_active: ex.is_active,
        }));
        const { error: examplesError } = await supabaseAdmin.from('few_shot_examples').insert(examplesToInsert);
        if (examplesError) throw examplesError;
      }
    }

    // Fetch updated agent with related data
    const { data: updatedAgent, error: fetchError } = await supabaseAdmin
      .from('agents')
      .select(`
        *,
        agent_tools (*)
      `)
      .eq('id', id)
      .single();

    // Fetch few_shot_examples separately using agent_name
    if (updatedAgent) {
      const { data: examplesData } = await supabaseAdmin
        .from('few_shot_examples')
        .select('*')
        .eq('agent_name', updatedAgent.name);
      updatedAgent.few_shot_examples = examplesData || [];
    }

    if (fetchError || !updatedAgent) {
      return NextResponse.json({ error: 'Failed to fetch updated agent' }, { status: 500 });
    }

    return NextResponse.json(updatedAgent);
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
