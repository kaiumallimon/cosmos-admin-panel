import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET() {
  try {
    // Fetch agents from Supabase with their tools
    const { data: agents, error: agentsError } = await supabase
      .from('agents')
      .select(`
        *,
        agent_tools (*)
      `);

    if (agentsError) {
      console.error('Error fetching agents:', agentsError);
      return NextResponse.json({ error: 'Failed to fetch agents' }, { status: 500 });
    }

    // Fetch few_shot_examples separately for each agent using agent_name
    if (agents) {
      for (const agent of agents) {
        const { data: examplesData } = await supabase
          .from('few_shot_examples')
          .select('*')
          .eq('agent_name', agent.name);
        agent.few_shot_examples = examplesData || [];
      }
    }

    console.log('Fetched agents from Supabase:', agents?.length || 0);

    return NextResponse.json(agents || []);

  } catch (error: any) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error.message }, { status: 500 });
  }
}
