import { NextRequest, NextResponse } from 'next/server';

const EXTERNAL_API_BASE_URL = 'https://cosmos-its-production-v1.onrender.com';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    // Get the authorization token from the request headers
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { success: false, message: 'Authorization header is required' },
        { status: 401 }
      );
    }

    const { name } = await params;

    if (!name) {
      return NextResponse.json(
        { success: false, message: 'Agent name is required' },
        { status: 400 }
      );
    }

    // Forward the request to the external API
    const externalResponse = await fetch(
      `${EXTERNAL_API_BASE_URL}/api/v1/agents/comprehensive/${encodeURIComponent(name)}/details`,
      {
        method: 'GET',
        headers: {
          'Authorization': authHeader,
        },
      }
    );

    const responseData = await externalResponse.json();

    // Return the response with the same status code
    return NextResponse.json(responseData, { status: externalResponse.status });

  } catch (error) {
    console.error('Error fetching agent details:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error while fetching agent details',
        errors: ['Failed to process request']
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    // Get the authorization token from the request headers
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { success: false, message: 'Authorization header is required' },
        { status: 401 }
      );
    }

    const { name } = await params;

    if (!name) {
      return NextResponse.json(
        { success: false, message: 'Agent name is required' },
        { status: 400 }
      );
    }

    // Get the request body
    const body = await request.json();

    // Forward the request to the external API
    const externalResponse = await fetch(
      `${EXTERNAL_API_BASE_URL}/api/v1/agents/comprehensive/${encodeURIComponent(name)}/update`,
      {
        method: 'PUT',
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
    console.error('Error updating agent:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error while updating agent',
        errors: ['Failed to process request']
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    // Get the authorization token from the request headers
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { success: false, message: 'Authorization header is required' },
        { status: 401 }
      );
    }

    const { name } = await params;

    if (!name) {
      return NextResponse.json(
        { success: false, message: 'Agent name is required' },
        { status: 400 }
      );
    }

    // Forward the request to the external API
    const externalResponse = await fetch(
      `${EXTERNAL_API_BASE_URL}/api/v1/agents/comprehensive/${encodeURIComponent(name)}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': authHeader,
        },
      }
    );

    const responseData = await externalResponse.json();

    // Return the response with the same status code
    return NextResponse.json(responseData, { status: externalResponse.status });

  } catch (error) {
    console.error('Error deleting agent:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error while deleting agent',
        errors: ['Failed to process request']
      },
      { status: 500 }
    );
  }
}