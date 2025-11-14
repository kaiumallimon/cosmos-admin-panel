// app/api/update-embeddings/route.ts
// Update ALL course questions embeddings via external API

import { supabase } from "@/lib/supabaseClient";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        // Forward the request body as-is
        const incomingBody = await req.text();

        const res = await fetch('https://cdn.bcrypt.website/api/update-embeddings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: incomingBody,
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => null);

            return NextResponse.json(
                { error: errorData?.error || 'Failed to update embeddings' },
                { status: res.status }
            );
        }

        const data = await res.json();
        return NextResponse.json(data);

    } catch (err) {
        console.error("Update embeddings error:", err);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}


// GET request to get course total questions count, mid question count, final questions count
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const course_code = searchParams.get("course_code");

    if (!course_code) {
      return NextResponse.json(
        { error: "course_code query parameter is required" },
        { status: 400 }
      );
    }

    // Fetch all questions for this course
    const { data, error } = await supabase
      .from("question_parts")
      .select("id, exam_type, course_title")
      .eq("course_code", course_code);

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to fetch question data" },
        { status: 500 }
      );
    }

    // Compute counts
    const total = data.length;

    const mid = data.filter(q =>
      q.exam_type?.toLowerCase().includes("mid")
    ).length;

    const final = data.filter(q =>
      q.exam_type?.toLowerCase().includes("final")
      || q.exam_type?.toLowerCase().includes("end")
    ).length;

    const course_title = data.length > 0 ? data[0].course_title : null;

    return NextResponse.json({
      success: true,
      course_code,
      course_title,
      counts: {
        total,
        mid,
        final
      }
    });

  } catch (error: any) {
    console.error("Error fetching question counts:", error);
    return NextResponse.json(
      { error: "Internal server error: " + error.message },
      { status: 500 }
    );
  }
}