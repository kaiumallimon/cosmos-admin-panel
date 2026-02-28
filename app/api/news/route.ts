import { NextRequest, NextResponse } from "next/server";

// GET /api/news?page=1
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = searchParams.get("page") ?? "1";

  const base = process.env.NOTICE_SERVER_URL!.replace(/\/$/, "");

  try {
    const res = await fetch(`${base}/news?page=${page}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      next: { revalidate: 60 },
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data?.detail ?? "Failed to fetch news" },
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
