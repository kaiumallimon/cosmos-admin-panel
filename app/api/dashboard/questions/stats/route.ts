import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-middleware";
import { getCollection } from '@/lib/mongodb';

interface QuestionPart {
  _id?: any;
  id: number;
  course_title: string;
  short: string;
  course_code: string;
  semester_term: string;
  exam_type: string;
  question_number: string;
  sub_question: string;
  marks: number;
  total_question_mark: number;
  contribution_percentage: number;
  has_image: boolean;
  image_type: string | null;
  image_url: string | null;
  has_description: boolean;
  description_content: string | null;
  question: string;
  created_at: Date;
  vector_id: string;
  pdf_url: string | null;
}

export const GET = withAuth(async (req) => {
  try {
    const collection = await getCollection<QuestionPart>('question_parts');
    
    // Get total questions count
    const totalQuestions = await collection.countDocuments({});

    // Get unique courses with aggregation
    const courseStats = await collection.aggregate([
      {
        $group: {
          _id: "$course_code",
          course_title: { $first: "$course_title" },
          course_code: { $first: "$course_code" },
          short: { $first: "$short" }
        }
      },
      {
        $project: {
          _id: 0,
          course_code: 1,
          course_title: 1,
          short: 1
        }
      },
      { $sort: { course_code: 1 } }
    ]).toArray();

    const totalUniqueCourses = courseStats.length;

    return NextResponse.json({
      success: true,
      data: {
        totalQuestions,
        totalUniqueCourses,
        courses: courseStats
      }
    });

  } catch (error: any) {
    console.error('Dashboard stats error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Internal server error',
        type: error.constructor?.name || 'Unknown'
      }, 
      { status: 500 }
    );
  }
});