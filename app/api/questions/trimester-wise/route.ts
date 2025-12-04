import { NextRequest, NextResponse } from "next/server";
import { withAuth } from '@/lib/api-middleware';
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
    const term = req.nextUrl.searchParams.get('term'); // exam_type, e.g. "final"
    const course_code = req.nextUrl.searchParams.get('course_code'); // e.g. "CSE-1111"

    console.log("Received exam_type parameter:", term);
    console.log("Received course_code parameter:", course_code);

    const questionPartsCollection = await getCollection<QuestionPart>('question_parts');
    
    // Build filter query
    const filter: any = {};
    if (term) filter.exam_type = term;
    if (course_code) filter.course_code = course_code;

    // Get unique semester terms with the applied filters
    const data = await questionPartsCollection
      .find(filter, { projection: { semester_term: 1, short: 1, exam_type: 1, course_code: 1 } })
      .toArray();

    console.log("Fetched semester terms:", data);

    // Filter out nulls and extract unique semester terms
    const uniqueTerms = [...new Set(data.map(item => item.semester_term).filter(Boolean))];

    // Sort numerically descending (e.g., 20242 > 20241)
    const sortedTerms = uniqueTerms.sort((a, b) => Number(b) - Number(a));

    return NextResponse.json({
      semester_terms: sortedTerms,
      count: sortedTerms.length,
      debug: {
        question_parts_count: data?.length || 0,
        sample_data: data?.slice(0, 3)
      }
    });
  } catch (error) {
    console.error("Error fetching trimester terms:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});
