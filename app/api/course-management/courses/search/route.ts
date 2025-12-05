import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Course } from "@/lib/course-types";
import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware-with-logging';

// GET - Search courses with pagination and filters
async function searchCourses(request: AuthenticatedRequest) {
  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    
    // Get query parameters
    const query = searchParams.get('q') || '';
    const department = searchParams.get('department') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const collection = db.collection<Course>('courses');

    // Build aggregation pipeline for efficient search
    const pipeline: any[] = [];

    // Match stage - build search filter
    const matchFilter: any = {};

    if (query.trim()) {
      // Use text search if query provided
      matchFilter.$text = { $search: query.trim() };
    }

    if (department && department !== 'all') {
      matchFilter.department = department;
    }

    if (Object.keys(matchFilter).length > 0) {
      pipeline.push({ $match: matchFilter });
    }

    // Add score for text search sorting
    if (query.trim()) {
      pipeline.push({
        $addFields: {
          score: { $meta: 'textScore' }
        }
      });
    }

    // Sort stage
    const sortStage: any = {};
    if (query.trim()) {
      sortStage.score = { $meta: 'textScore' };
    }
    
    sortStage[sortBy] = sortOrder === 'desc' ? -1 : 1;
    pipeline.push({ $sort: sortStage });

    // Facet stage for pagination and total count
    pipeline.push({
      $facet: {
        courses: [
          { $skip: (page - 1) * limit },
          { $limit: limit }
        ],
        totalCount: [
          { $count: 'count' }
        ]
      }
    });

    const [result] = await collection.aggregate(pipeline).toArray();
    
    const courses = result.courses || [];
    const totalCount = result.totalCount[0]?.count || 0;
    const totalPages = Math.ceil(totalCount / limit);

    // Get department statistics
    const departmentStats = await collection.aggregate([
      {
        $group: {
          _id: '$department',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]).toArray();

    return NextResponse.json({
      courses: courses.map((course: any) => ({
        ...course,
        _id: course._id?.toString(),
      })),
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      departmentStats: departmentStats.reduce((acc: any, stat: any) => {
        acc[stat._id || 'Unknown'] = stat.count;
        return acc;
      }, {}),
      query: {
        q: query,
        department,
        sortBy,
        sortOrder
      }
    });

  } catch (error) {
    console.error('Error in course search:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const GET = withAuth(searchCourses);