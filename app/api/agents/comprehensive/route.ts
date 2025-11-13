import { NextRequest, NextResponse } from 'next/server';

const EXTERNAL_API_BASE_URL = 'https://cosmos-its-production-v1.onrender.com';

export async function GET(request: NextRequest) {
  try {
    // Get the authorization token from the request headers
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { success: false, message: 'Authorization header is required' },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('include_inactive') || 'false';

    // Build the query string
    const queryString = new URLSearchParams({
      include_inactive: includeInactive
    }).toString();

    // Forward the request to the external API
    const externalResponse = await fetch(
      `${EXTERNAL_API_BASE_URL}/api/v1/agents/comprehensive/?${queryString}`,
      {
        method: 'GET',
        headers: {
          'Authorization': authHeader,
        },
      }
    );

    const responseData = await externalResponse.json();
    
    // Log the external API response for debugging
    console.log('External API Response:', responseData);
    console.log('External API Status:', externalResponse.status);

    // Return the response with the same status code
    return NextResponse.json(responseData, { status: externalResponse.status });

  } catch (error) {
    console.error('Error fetching comprehensive agents:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error while fetching agents',
        errors: ['Failed to process request']
      },
      { status: 500 }
    );
  }
}