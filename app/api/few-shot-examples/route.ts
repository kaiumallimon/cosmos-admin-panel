import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware';
import { getCollection } from '@/lib/mongodb';
import { FewShotExample, CreateFewShotExampleRequest } from '@/lib/agent-types';
import { v4 as uuidv4 } from 'uuid';

// GET /api/few-shot-examples - Fetch all few-shot examples (optionally filtered by agent_name)
async function getHandler(req: AuthenticatedRequest) {
  try {
    const url = new URL(req.url);
    const agentName = url.searchParams.get('agent_name');

    const fewShotExamplesCollection = await getCollection<FewShotExample>('few_shot_examples');
    
    const query = agentName ? { agent_name: agentName } : {};
    const fewShotExamples = await fewShotExamplesCollection.find(query).toArray();

    return NextResponse.json(fewShotExamples);

  } catch (error: any) {
    console.error('Error fetching few-shot examples:', error);
    return NextResponse.json({ error: 'Failed to fetch few-shot examples: ' + error.message }, { status: 500 });
  }
}

// POST /api/few-shot-examples - Create a new few-shot example
async function postHandler(req: AuthenticatedRequest) {
  try {
    const body: CreateFewShotExampleRequest = await req.json();
    
    // Validate required fields
    if (!body.agent_name || !body.description || !body.example_type || !body.user_query || !body.expected_output) {
      return NextResponse.json({ 
        error: 'Missing required fields: agent_name, description, example_type, user_query, expected_output' 
      }, { status: 400 });
    }

    // Validate expected_output is an object
    if (typeof body.expected_output !== 'object' || body.expected_output === null) {
      return NextResponse.json({ 
        error: 'expected_output must be a valid object' 
      }, { status: 400 });
    }

    const fewShotExamplesCollection = await getCollection<FewShotExample>('few_shot_examples');

    // Create new few-shot example
    const newFewShotExample: FewShotExample = {
      id: uuidv4(),
      agent_name: body.agent_name,
      description: body.description,
      example_type: body.example_type,
      user_query: body.user_query,
      expected_output: body.expected_output,
      is_active: body.is_active ?? true,
      created_at: new Date(),
      updated_at: new Date()
    };

    const result = await fewShotExamplesCollection.insertOne(newFewShotExample);
    
    if (!result.insertedId) {
      return NextResponse.json({ error: 'Failed to create few-shot example' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Few-shot example created successfully',
      fewShotExample: newFewShotExample 
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating few-shot example:', error);
    return NextResponse.json({ error: 'Failed to create few-shot example: ' + error.message }, { status: 500 });
  }
}

export const GET = withAuth(getHandler);
export const POST = withAuth(postHandler);