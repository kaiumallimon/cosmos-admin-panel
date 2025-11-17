import { NextRequest, NextResponse } from 'next/server';

// GET all chat threads
export async function GET(req: NextRequest) {
  try {
    // Get Authorization header from client
    const authHeader = req.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json(
        { error: "Authorization token missing" },
        { status: 401 }
      );
    }

    console.log('Making request to backend API with auth header:', authHeader?.substring(0, 20) + '...');
    console.log('Full request URL:', `http://127.0.0.1:8000/api/v1/chats`);

    // Forward request to backend API
    let res;
    try {
      res = await fetch(`http://127.0.0.1:8000/api/v1/chats/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": authHeader,  // Forward Bearer token
        },
      });
    } catch (fetchError: any) {
      console.error('Failed to connect to backend service:', fetchError);
      return NextResponse.json(
        { 
          error: "Chat service is currently unavailable. Please try again later.",
          details: "Backend service connection failed"
        },
        { status: 503 }
      );
    }

    // Handle non-successful responses
    if (!res.ok) {
      console.error(`Backend returned error: ${res.status} ${res.statusText}`);
      let errorMessage = "Chat threads could not be loaded";
      
      switch (res.status) {
        case 401:
          errorMessage = "Authentication failed";
          break;
        case 403:
          errorMessage = "Access denied";
          break;
        case 500:
          errorMessage = "Backend service error";
          break;
        default:
          errorMessage = `Backend service error (${res.status})`;
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: res.status }
      );
    }

    // Check if response is JSON
    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const textResponse = await res.text();
      console.error('Non-JSON response from backend:', textResponse);
      return NextResponse.json(
        { error: "Invalid response format from backend service" },
        { status: 502 }
      );
    }

    let data;
    try {
      data = await res.json();
    } catch (jsonError) {
      console.error('JSON parsing error:', jsonError);
      return NextResponse.json(
        { error: 'Invalid JSON response from backend' },
        { status: 502 }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err: any) {
    console.error('Chat threads API error:', err);
    
    // Check if it's a network error
    if (err.code === 'ECONNREFUSED' || err.message?.includes('fetch') || err.message?.includes('ECONNREFUSED')) {
      return NextResponse.json(
        { 
          error: "Chat service is currently unavailable",
          details: "Backend service connection failed. Please try again later."
        },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { 
        error: "An unexpected error occurred while loading chat threads",
        details: err.message || "Unknown error"
      },
      { status: 500 }
    );
  }
}
