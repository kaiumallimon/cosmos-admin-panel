import { NextRequest, NextResponse } from "next/server";

// GET /api/courses
export async function GET(req: NextRequest) {
  try {
    const res = await fetch(
      `https://cdn.bcrypt.website/api/courses`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      }
    );

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data.error || "Failed to fetch questions" },
        { status: res.status }
      );
    }

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Something went wrong" },
      { status: 500 }
    );
  }
}

