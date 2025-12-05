import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Course, CourseCreateRequest, CourseResponse } from "@/lib/course-types";
import { v4 as uuidv4 } from 'uuid';
import { withAuth, AuthenticatedRequest } from "@/lib/api-middleware-with-logging";

// GET - Fetch all courses with stats
async function getCourses() {
    try {
        const { db } = await connectToDatabase();
        const collection = db.collection<Course>('courses');

        // Get all courses sorted by creation date (most recent first)
        const courses = await collection
            .find({})
            .sort({ created_at: -1 })
            .toArray();

        // Calculate stats efficiently
        const totalCourses = courses.length;
        const departments = new Set(courses.map(course => course.department).filter(Boolean));
        const totalDepartments = departments.size;

        const response: CourseResponse = {
            courses: courses.map(course => ({
                ...course,
                _id: course._id?.toString(),
            })),
            totalCourses,
            totalDepartments,
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error('Error in GET /api/course-management/courses:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export const GET = withAuth(getCourses);

// POST - Create a new course
async function createCourse(request: AuthenticatedRequest) {
    try {
        const body: CourseCreateRequest = await request.json();
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
        
        // Check if course code already exists
        const existingCourse = await collection.findOne({ code: trimmedCode });
        if (existingCourse) {
            return NextResponse.json(
                { error: 'Course code already exists' },
                { status: 409 }
            );
        }

        // Create new course
        const now = new Date();
        const newCourse: Course = {
            id: uuidv4(),
            title: title.trim(),
            code: trimmedCode,
            credit,
            department: department?.trim() || '',
            created_at: now,
            updated_at: now,
        };

        const result = await collection.insertOne(newCourse);

        const createdCourse = {
            ...newCourse,
            _id: result.insertedId.toString(),
        };

        return NextResponse.json(createdCourse, { status: 201 });
    } catch (error) {
        console.error('Error in POST /api/course-management/courses:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export const POST = withAuth(createCourse);
