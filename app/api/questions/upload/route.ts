import { NextRequest, NextResponse } from "next/server";
import { withAuth } from '@/lib/api-middleware';
import { getCollection } from '@/lib/mongodb';
import { v4 as uuidv4 } from 'uuid';

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

export const POST = withAuth(async (req) => {
  try {
    const formData = await req.json();
    const questionPartsCollection = await getCollection<QuestionPart>('question_parts');
    
    // Get the next ID by counting existing documents
    const count = await questionPartsCollection.countDocuments();
    const nextId = count + 1;
    
    // Create question part document
    const questionPart: QuestionPart = {
      id: nextId,
      course_title: formData.course_title || '',
      short: formData.short || '',
      course_code: formData.course_code || '',
      semester_term: formData.semester_term || '',
      exam_type: formData.exam_type || '',
      question_number: formData.question_number || '',
      sub_question: formData.sub_question || '',
      marks: parseInt(formData.marks) || 0,
      total_question_mark: parseInt(formData.total_question_mark) || 0,
      contribution_percentage: parseFloat(formData.contribution_percentage) || 0,
      has_image: formData.has_image || false,
      image_type: formData.image_type || null,
      image_url: formData.image_url || null,
      has_description: formData.has_description || false,
      description_content: formData.description_content || null,
      question: formData.question || '',
      created_at: new Date(),
      vector_id: uuidv4(),
      pdf_url: formData.pdf_url || null,
    };
    
    // Insert into MongoDB
    const result = await questionPartsCollection.insertOne(questionPart);
    
    // Return the created question part
    const createdQuestionPart = {
      ...questionPart,
      _id: result.insertedId,
    };
    
    return NextResponse.json({
      success: true,
      data: createdQuestionPart,
      message: 'Question uploaded successfully'
    });
    
  } catch (err: any) {
    console.error('Upload question error:', err);
    return NextResponse.json({ 
      success: false,
      error: err.message || "Something went wrong" 
    }, { status: 500 });
  }
});