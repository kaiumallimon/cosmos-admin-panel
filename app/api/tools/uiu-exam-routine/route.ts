import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const serverURL = process.env.EXAM_ROUTINE_URL;
    if (!serverURL) {
      return NextResponse.json({ error: "Server URL not configured" }, { status: 500 });
    }

    const { student_id, password } = await req.json();

    if (!student_id || !password) {
      return NextResponse.json({ error: "Student ID and Password are required" }, { status: 400 });
    }

    const response = await fetch(`${serverURL}login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ student_id, password }),
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch exam routine" }, { status: response.status });
    }

    const data = await response.json();
    console.log("Exam Routine Data:", data);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}