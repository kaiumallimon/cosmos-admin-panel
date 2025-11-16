import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

// GET - Fetch a single course by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { data: course, error } = await supabase
      .from('courses')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Course not found' }, { status: 404 });
      }
      console.error('Error fetching course:', error);
      return NextResponse.json({ error: 'Failed to fetch course' }, { status: 500 });
    }

    return NextResponse.json(course);
  } catch (error) {
    console.error('Error in GET /api/course-management/courses/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update a course
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Update the course
    const { data: course, error } = await supabase
      .from('courses')
      .update({
        title: title.trim(),
        code: code.trim().toUpperCase(),
        credit,
        department: department?.trim() || null,
      })
      .eq('id', id)
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
      
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Course not found' }, { status: 404 });
      }
      
      console.error('Error updating course:', error);
      return NextResponse.json({ error: 'Failed to update course' }, { status: 500 });
    }

    return NextResponse.json(course);
  } catch (error) {
    console.error('Error in PUT /api/course-management/courses/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete a course
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting course:', error);
      return NextResponse.json({ error: 'Failed to delete course' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/course-management/courses/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}