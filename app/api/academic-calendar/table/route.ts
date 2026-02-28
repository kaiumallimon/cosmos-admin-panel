import { NextRequest, NextResponse } from "next/server";

// GET /api/academic-calendar/table?title=<title>
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title");

  if (!title) {
    return NextResponse.json(
      { error: "Query parameter 'title' is required" },
      { status: 400 }
    );
  }

  const base = process.env.NOTICE_SERVER_URL!.replace(/\/$/, "");

  try {
    const res = await fetch(
      `${base}/academic-calendar/table?title=${encodeURIComponent(title)}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        next: { revalidate: 3600 },
      }
    );

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data?.detail ?? "Failed to fetch calendar table" },
        { status: res.status }
      );
    }

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
