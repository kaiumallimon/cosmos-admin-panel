import { supabase } from "@/lib/supabaseClient";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { count, error } = await supabase
      .from("question_parts")
      .select("*", { count: "exact", head: true });

    if (error) {
      return NextResponse.json(
        { error: error.message || "Failed to fetch question count" },
        { status: 500 }
      );
    }

    return NextResponse.json({ count: count || 0 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Something went wrong" },
      { status: 500 }
    );
  }
}
