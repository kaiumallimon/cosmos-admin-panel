import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET() {
  try {
    // Fetch agents from Supabase with their tools and few-shot examples
    const { data: agents, error: agentsError } = await supabase
      .from('agents')
      .select(`
        *,
        agent_tools (*),
        few_shot_examples (*)
      `);

    if (agentsError) {
      console.error('Error fetching agents:', agentsError);
      return NextResponse.json({ error: 'Failed to fetch agents' }, { status: 500 });
    }

    console.log('Fetched agents from Supabase:', agents?.length || 0);

    return NextResponse.json(agents || []);

  } catch (error: any) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error.message }, { status: 500 });
  }
}
