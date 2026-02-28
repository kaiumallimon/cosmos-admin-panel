import { NextResponse } from "next/server";

// GET /api/academic-calendar/titles
export async function GET() {
  const base = process.env.NOTICE_SERVER_URL!.replace(/\/$/, "");

  try {
    const res = await fetch(`${base}/academic-calendar/titles`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      next: { revalidate: 3600 },
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data?.detail ?? "Failed to fetch calendar titles" },
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
