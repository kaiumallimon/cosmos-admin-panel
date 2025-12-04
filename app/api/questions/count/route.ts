import { NextResponse } from "next/server";
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

export async function GET() {
  try {
    const questionPartsCollection = await getCollection<QuestionPart>('question_parts');
    const count = await questionPartsCollection.countDocuments();

    return NextResponse.json({ count });
  } catch (err: any) {
    console.error('Questions count error:', err);
    return NextResponse.json(
      { error: err.message || "Something went wrong" },
      { status: 500 }
    );
  }
}
