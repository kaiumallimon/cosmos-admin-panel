import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// GET - Fetch all courses with stats
export async function GET() {
    try {
        // Get all courses
        const { data: courses, error: coursesError } = await supabase
            .from('courses')
            .select('*')
            .order('created_at', { ascending: false });

        if (coursesError) {
            console.error('Error fetching courses:', coursesError);
            return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
        }

        // Calculate stats
        const totalCourses = courses?.length || 0;
        const departments = new Set(courses?.map(course => course.department).filter(Boolean));
        const totalDepartments = departments.size;

        return NextResponse.json({
            courses: courses || [],
            totalCourses,
            totalDepartments,
        });
    } catch (error) {
        console.error('Error in GET /api/course-management/courses:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST - Create a new course
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { title, code, credit, department } = body;

        // Validate required fields
        if (!title || !code || !credit) {
            return NextResponse.json(
                { error: 'Title, code, and credit are required' },
                { status: 400 }
            );
        }

        // Validate credit is a positive number
        if (typeof credit !== 'number' || credit <= 0) {
            return NextResponse.json(
                { error: 'Credit must be a positive number' },
                { status: 400 }
            );
        }

        // Insert the new course
        const { data: course, error } = await supabase
            .from('courses')
            .insert([
                {
                    title: title.trim(),
                    code: code.trim().toUpperCase(),
                    credit,
                    department: department?.trim() || null,
                },
            ])
            .select()
            .single();

        if (error) {
            // Handle unique constraint violation for course code
            if (error.code === '23505' && error.message.includes('courses_code_key')) {
                return NextResponse.json(
                    { error: 'Course code already exists' },
                    { status: 409 }
                );
            }
            
            console.error('Error creating course:', error);
            return NextResponse.json({ error: 'Failed to create course' }, { status: 500 });
        }

        return NextResponse.json(course, { status: 201 });
    } catch (error) {
        console.error('Error in POST /api/course-management/courses:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
