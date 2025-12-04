import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Course, CourseUpdateRequest } from '@/lib/course-types';
import { withAuth } from '@/lib/api-middleware';
import { ObjectId } from 'mongodb';

// GET - Fetch a single course by ID
async function getCourse(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { db } = await connectToDatabase();
    const collection = db.collection<Course>('courses');

    const course = await collection.findOne({ id });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    return NextResponse.json({
      ...course,
      _id: course._id?.toString(),
    });
  } catch (error) {
    console.error('Error in GET /api/course-management/courses/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const GET = withAuth(getCourse);

// PUT - Update a course
async function updateCourse(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: CourseUpdateRequest = await request.json();
    const { title, code, credit, department } = body;

    // Validate required fields
    if (!title || !code || credit === undefined) {
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

    const { db } = await connectToDatabase();
    const collection = db.collection<Course>('courses');

    const trimmedCode = code.trim().toUpperCase();
    
    // Check if course code already exists for a different course
    const existingCourse = await collection.findOne({ 
      code: trimmedCode,
      id: { $ne: id }
    });
    if (existingCourse) {
      return NextResponse.json(
        { error: 'Course code already exists' },
        { status: 409 }
      );
    }

    // Update the course
    const updateData = {
      title: title.trim(),
      code: trimmedCode,
      credit,
      department: department?.trim() || '',
      updated_at: new Date(),
    };

    const result = await collection.findOneAndUpdate(
      { id },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    if (!result) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    return NextResponse.json({
      ...result,
      _id: result._id?.toString(),
    });
  } catch (error) {
    console.error('Error in PUT /api/course-management/courses/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const PUT = withAuth(updateCourse);

// DELETE - Delete a course
async function deleteCourse(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { db } = await connectToDatabase();
    const collection = db.collection<Course>('courses');

    const result = await collection.deleteOne({ id });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/course-management/courses/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const DELETE = withAuth(deleteCourse);