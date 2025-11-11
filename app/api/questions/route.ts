import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const course_code = searchParams.get('course_code');
        const exam_type = searchParams.get('exam_type');
        const semester_term = searchParams.get('semester_term');

        if (!course_code || !exam_type || !semester_term) {
            return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('question_parts')
            .select('*')
            .eq('course_code', course_code)
            .eq('exam_type', exam_type)
            .eq('semester_term', semester_term);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ data }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}