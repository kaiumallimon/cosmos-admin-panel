import { NextRequest, NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware-with-logging';
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

// GET route without auth protection for public access
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const course_code = searchParams.get('course_code');
        const exam_type = searchParams.get('exam_type');
        const semester_term = searchParams.get('semester_term');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');

        const questionPartsCollection = await getCollection<QuestionPart>('question_parts');
        
        // Build filter query - make parameters optional
        const filter: any = {};
        if (course_code) filter.course_code = course_code;
        if (exam_type) filter.exam_type = exam_type;
        if (semester_term) filter.semester_term = semester_term;

        // Calculate skip for pagination
        const skip = (page - 1) * limit;

        // Get total count for pagination metadata
        const total = await questionPartsCollection.countDocuments(filter);

        // Get paginated data
        const data = await questionPartsCollection
            .find(filter)
            .sort({ created_at: -1 }) // descending order
            .skip(skip)
            .limit(limit)
            .toArray();

        const totalPages = Math.ceil(total / limit);
        const hasMore = page < totalPages;

        return NextResponse.json({ 
            data, 
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasMore
            }
        }, { status: 200 });

    } catch (error) {
        console.error('Get questions error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}