import { NextRequest, NextResponse } from "next/server";
import { withAuth } from '@/lib/api-middleware';
import { getCollection } from '@/lib/mongodb';
import { v4 as uuidv4 } from 'uuid';
import { generateEmbedding } from '@/lib/embedding-service';
import { getCourseNameSpace, upsertVector, deleteVector } from '@/lib/pinecone-service';
import { cleanMetadataForPinecone } from '@/lib/metadata-helper';

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
  let mongoInserted = false;
  let pineconeUpserted = false;
  let questionPart: QuestionPart | null = null;
  let vectorId: string = '';
  let namespace: string = '';
  let index: any = null;

  try {
    const formData = await req.json();
    console.log('Received question upload request');

    // Validate required fields
    const requiredFields = [
      'course_title', 'short', 'course_code', 'semester_term', 'exam_type',
      'question_number', 'sub_question', 'marks', 'total_question_mark',
      'contribution_percentage', 'question', 'pdf_url'
    ];

    const missingFields = requiredFields.filter(
      field => formData[field] === undefined || formData[field] === null || 
      (typeof formData[field] === 'string' && formData[field].trim() === '')
    );

    if (missingFields.length > 0) {
      return NextResponse.json({
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`
      }, { status: 400 });
    }

    const questionPartsCollection = await getCollection<QuestionPart>('question_parts');
    
    // Get the next ID by counting existing documents
    const count = await questionPartsCollection.countDocuments();
    const nextId = count + 1;
    
    // Generate vector ID
    vectorId = uuidv4();
    
    // Create question part document
    questionPart = {
      id: nextId,
      course_title: formData.course_title,
      short: formData.short,
      course_code: formData.course_code,
      semester_term: formData.semester_term,
      exam_type: formData.exam_type,
      question_number: formData.question_number,
      sub_question: formData.sub_question,
      marks: parseInt(formData.marks) || 0,
      total_question_mark: parseInt(formData.total_question_mark) || 0,
      contribution_percentage: parseFloat(formData.contribution_percentage) || 0,
      has_image: Boolean(formData.has_image),
      image_type: formData.image_type || null,
      image_url: formData.image_url || null,
      has_description: Boolean(formData.has_description),
      description_content: formData.description_content || null,
      question: formData.question,
      created_at: new Date(),
      vector_id: vectorId,
      pdf_url: formData.pdf_url,
    };

    // Step 1: Generate Embedding
    console.log('Generating embedding for question...');
    const embedding = await generateEmbedding({
      question: questionPart.question,
      has_description: questionPart.has_description,
      description_content: questionPart.description_content
    });
    console.log(`Embedding generated successfully, dimensions: ${embedding.length}`);

    // Step 2: Get Pinecone namespace
    console.log(`Getting Pinecone namespace for course: ${questionPart.short}`);
    const namespaceObj = await getCourseNameSpace(questionPart.short);
    index = namespaceObj.index;
    namespace = namespaceObj.namespace;
    console.log(`Using namespace: ${namespace}`);

    // Step 3: Prepare metadata for Pinecone
    const metadata = cleanMetadataForPinecone({
      ...questionPart,
      vector_id_text: vectorId,
      created_at: questionPart.created_at.toISOString()
    });

    // Step 4: Upsert to Pinecone first
    console.log(`Upserting vector to Pinecone: ${vectorId}`);
    const upsertResult = await upsertVector(index, namespace, vectorId, embedding, metadata);
    
    if (!upsertResult.success) {
      throw new Error(`Failed to upsert vector to Pinecone: ${upsertResult.message}`);
    }
    
    pineconeUpserted = true;
    console.log('Vector upserted successfully to Pinecone');

    // Step 5: Insert into MongoDB
    console.log('Inserting question into MongoDB...');
    const mongoResult = await questionPartsCollection.insertOne(questionPart);
    mongoInserted = true;
    console.log('Question inserted into MongoDB successfully');
    
    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Question created and indexed successfully',
      data: {
        id: nextId,
        vector_id: vectorId,
        course_code: questionPart.course_code,
        course_title: questionPart.course_title,
        question_number: questionPart.question_number,
        exam_type: questionPart.exam_type,
        semester_term: questionPart.semester_term,
        namespace: namespace,
        vector_dimensions: embedding.length,
        created_at: questionPart.created_at.toISOString()
      },
      vector_status: upsertResult,
      mongo_status: 'inserted'
    });
    
  } catch (err: any) {
    console.error('Upload question error:', err);
    
    // Rollback logic - if MongoDB succeeded but we're in catch, try to clean up Pinecone
    if (mongoInserted && pineconeUpserted && index && namespace && vectorId) {
      try {
        console.log('Rolling back Pinecone upsert...');
        await deleteVector(index, namespace, vectorId);
        console.log('Pinecone rollback completed');
      } catch (rollbackErr) {
        console.error('Failed to rollback Pinecone:', rollbackErr);
      }
    }
    
    // If Pinecone succeeded but MongoDB failed, try to clean up Pinecone
    if (pineconeUpserted && !mongoInserted && index && namespace && vectorId) {
      try {
        console.log('Rolling back Pinecone upsert due to MongoDB failure...');
        await deleteVector(index, namespace, vectorId);
        console.log('Pinecone rollback completed');
      } catch (rollbackErr) {
        console.error('Failed to rollback Pinecone:', rollbackErr);
      }
    }
    
    return NextResponse.json({ 
      success: false,
      error: err.message || "Something went wrong",
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
});