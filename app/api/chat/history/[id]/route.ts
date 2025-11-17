import { NextRequest, NextResponse } from 'next/server';

// GET chat history for a specific thread
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Get Authorization header from client
    const authHeader = req.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json(
        { error: "Authorization token missing" },
        { status: 401 }
      );
    }

    const { id: threadId } = await params;
    console.log('Fetching chat history for thread:', threadId);
    console.log('Request URL:', `http://127.0.0.1:8000/api/v1/chats/${threadId}`);

    // Forward request to backend API
    let res;
    try {
      res = await fetch(`http://127.0.0.1:8000/api/v1/chats/${threadId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": authHeader,
        },
      });
    } catch (fetchError: any) {
      console.error('Failed to connect to backend service:', fetchError);
      return NextResponse.json(
        { 
          error: "Backend service is currently unavailable. Please try again later.",
          details: "Chat service connection failed"
        },
        { status: 503 }
      );
    }

    // Handle non-successful responses
    if (!res.ok) {
      console.error(`Backend returned error: ${res.status} ${res.statusText}`);
      let errorMessage = "Chat history could not be loaded";
      
      switch (res.status) {
        case 404:
          errorMessage = "Chat thread not found";
          break;
        case 401:
          errorMessage = "Authentication failed";
          break;
        case 403:
          errorMessage = "Access denied to this chat thread";
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
      console.log('Successfully received data from backend:', Object.keys(data));
    } catch (jsonError) {
      console.error('JSON parsing error:', jsonError);
      return NextResponse.json(
        { error: 'Invalid JSON response from backend' },
        { status: 502 }
      );
    }

    console.log('Returning successful response with status 200');
    return NextResponse.json(data, { status: 200 });
  } catch (err: any) {
    console.error('Chat history API error:', err);
    
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
        error: "An unexpected error occurred while loading chat history",
        details: err.message || "Unknown error"
      },
      { status: 500 }
    );
  }
}