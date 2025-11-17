import { NextRequest, NextResponse } from 'next/server';

// POST - Send a message to chat
export async function POST(req: NextRequest) {
  try {
    // Get Authorization header from client
    const authHeader = req.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json(
        { error: "Authorization token missing" },
        { status: 401 }
      );
    }

    // Get request body
    const body = await req.json();
    console.log('Sending message:', body);

    // Forward request to backend API
    let res;
    try {
      res = await fetch(`http://127.0.0.1:8000/api/v1/chats/structured`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": authHeader,
        },
        body: JSON.stringify(body)
      });
    } catch (fetchError: any) {
      console.error('Failed to connect to backend service:', fetchError);
      return NextResponse.json(
        { 
          error: "Chat service is currently unavailable. Your message could not be sent.",
          details: "Backend service connection failed"
        },
        { status: 503 }
      );
    }

    // Handle non-successful responses
    if (!res.ok) {
      console.error(`Backend returned error: ${res.status} ${res.statusText}`);
      let errorMessage = "Message could not be sent";
      
      switch (res.status) {
        case 401:
          errorMessage = "Authentication failed";
          break;
        case 403:
          errorMessage = "Access denied";
          break;
        case 429:
          errorMessage = "Rate limit exceeded. Please wait before sending another message.";
          break;
        case 500:
          errorMessage = "Backend service error";
          break;
        default:
          errorMessage = `Message sending failed (Error ${res.status})`;
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
    console.error('Send message API error:', err);
    
    // Check if it's a network error
    if (err.code === 'ECONNREFUSED' || err.message?.includes('fetch') || err.message?.includes('ECONNREFUSED')) {
      return NextResponse.json(
        { 
          error: "Chat service is currently unavailable",
          details: "Backend service connection failed. Your message could not be sent."
        },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { 
        error: "An unexpected error occurred while sending your message",
        details: err.message || "Unknown error"
      },
      { status: 500 }
    );
  }
}