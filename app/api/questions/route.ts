import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const course_code = searchParams.get('course_code');
        const exam_type = searchParams.get('exam_type');
        const semester_term = searchParams.get('semester_term');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');

        if (!course_code || !exam_type || !semester_term) {
            return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
        }

        // Calculate offset for pagination
        const offset = (page - 1) * limit;

        // Get total count for pagination metadata
        const { count, error: countError } = await supabase
            .from('question_parts')
            .select('*', { count: 'exact', head: true })
            .eq('course_code', course_code)
            .eq('exam_type', exam_type)
            .eq('semester_term', semester_term);

        if (countError) {
            return NextResponse.json({ error: countError.message }, { status: 500 });
        }

        // Get paginated data
        const { data, error } = await supabase
            .from('question_parts')
            .select('*')
            .eq('course_code', course_code)
            .eq('exam_type', exam_type)
            .eq('semester_term', semester_term)
            .order('created_at', { ascending: true })
            .range(offset, offset + limit - 1);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const totalPages = Math.ceil((count || 0) / limit);
        const hasMore = page < totalPages;

        return NextResponse.json({ 
            data, 
            pagination: {
                page,
                limit,
                total: count || 0,
                totalPages,
                hasMore
            }
        }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}