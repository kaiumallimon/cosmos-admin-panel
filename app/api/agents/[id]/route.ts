import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Helper to create Supabase client
async function getSupabaseClient() {
  const cookieStore = await cookies(); // ✅ await here

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
      },
    }
  );
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await getSupabaseClient();

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = params;

    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select(`
        *,
        agent_tools (*),
        few_shot_examples (*)
      `)
      .eq('id', id)
      .single();

    if (agentError || !agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    return NextResponse.json(agent);
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await getSupabaseClient();

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();

    const { data: agent, error: updateError } = await supabase
      .from('agents')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (updateError || !agent) {
      return NextResponse.json({ error: 'Failed to update agent' }, { status: 500 });
    }

    return NextResponse.json(agent);
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await getSupabaseClient();

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();

    // Update agent
    const { data: agent, error: agentError } = await supabase
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
      await supabase.from('agent_tools').delete().eq('agent_id', id);
      if (body.agent_tools.length > 0) {
        const toolsToInsert = body.agent_tools.map((tool: any) => ({
          agent_id: id,
          tool_name: tool.tool_name,
          tool_description: tool.tool_description,
          is_enabled: tool.is_enabled,
        }));
        const { error: toolsError } = await supabase.from('agent_tools').insert(toolsToInsert);
        if (toolsError) throw toolsError;
      }
    }

    // Update few_shot_examples
    if (body.few_shot_examples) {
      await supabase.from('few_shot_examples').delete().eq('agent_id', id);
      if (body.few_shot_examples.length > 0) {
        const examplesToInsert = body.few_shot_examples.map((ex: any) => ({
          agent_id: id,
          example_type: ex.example_type,
          user_query: ex.user_query,
          expected_output: ex.expected_output,
          description: ex.description,
          is_active: ex.is_active,
        }));
        const { error: examplesError } = await supabase.from('few_shot_examples').insert(examplesToInsert);
        if (examplesError) throw examplesError;
      }
    }

    // Fetch updated agent with related data
    const { data: updatedAgent, error: fetchError } = await supabase
      .from('agents')
      .select(`
        *,
        agent_tools (*),
        few_shot_examples (*)
      `)
      .eq('id', id)
      .single();

    if (fetchError || !updatedAgent) {
      return NextResponse.json({ error: 'Failed to fetch updated agent' }, { status: 500 });
    }

    return NextResponse.json(updatedAgent);
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
