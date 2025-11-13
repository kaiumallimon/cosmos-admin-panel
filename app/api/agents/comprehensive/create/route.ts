import { NextRequest, NextResponse } from 'next/server';

const EXTERNAL_API_BASE_URL = 'https://cosmos-its-production-v1.onrender.com';

export async function POST(request: NextRequest) {
  try {
    // Get the authorization token from the request headers
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { success: false, message: 'Authorization header is required' },
        { status: 401 }
      );
    }

    // Get the request body
    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.display_name || !body.description || !body.system_prompt) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Missing required fields: name, display_name, description, system_prompt are required',
          errors: ['Missing required fields']
        },
        { status: 400 }
      );
    }

    // Forward the request to the external API
    const externalResponse = await fetch(
      `${EXTERNAL_API_BASE_URL}/api/v1/agents/comprehensive/create`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
        },
        body: JSON.stringify(body),
      }
    );

    const responseData = await externalResponse.json();

    // Return the response with the same status code
    return NextResponse.json(responseData, { status: externalResponse.status });

  } catch (error) {
    console.error('Error creating comprehensive agent:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error while creating agent',
        errors: ['Failed to process request']
      },
      { status: 500 }
    );
  }
}