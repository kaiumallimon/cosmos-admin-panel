import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// POST request to update embeddings for all questions in a specific course
export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const course_code = searchParams.get("course_code");

    if (!course_code) {
      return NextResponse.json(
        { error: "course_code query parameter is required" },
        { status: 400 }
      );
    }

    // Read JSON body (recommended)
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // If no JSON body provided, leave it as {}
    }

    const res = await fetch(
      `https://cdn.bcrypt.website/api/update-embeddings/course/${course_code}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.error || "Failed to update embeddings" },
        { status: res.status }
      );
    }

    const data = await res.json();

    if (!data.success) {
      return NextResponse.json(
        { error: "Failed to update embeddings" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


