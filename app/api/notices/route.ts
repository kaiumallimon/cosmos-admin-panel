import { NextRequest, NextResponse } from "next/server";

// GET /api/notices?page=1
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = searchParams.get("page") ?? "1";

  const base = process.env.NOTICE_SERVER_URL!.replace(/\/$/, "");

  try {
    const res = await fetch(`${base}/notices?page=${page}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      next: { revalidate: 60 },
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data?.detail ?? "Failed to fetch notices" },
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
