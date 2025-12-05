// app/api/update-embeddings/route.ts
// Update ALL course questions embeddings using MongoDB + Pinecone

import { NextRequest, NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware';
import { getCollection } from '@/lib/mongodb';
import { generateEmbedding } from '@/lib/embedding-service';
import { getCourseNameSpace, upsertVector } from '@/lib/pinecone-service';
import { cleanMetadataForPinecone } from '@/lib/metadata-helper';
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

// POST request to update embeddings for ALL questions
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  const results = { 
    total: 0, 
    updated: [] as any[], 
    failed: [] as any[],
    summary: {
      total_processed: 0,
      successful_upserts: 0,
      failed_upserts: 0,
      vector_errors: 0,
      database_errors: 0
    }
  };

  try {
    console.log('Starting Pinecone data update process for ALL questions...');
    
    const questionPartsCollection = await getCollection<QuestionPart>('question_parts');
    
    // Get all questions from MongoDB
    console.log('Fetching all questions from MongoDB...');
    const questions = await questionPartsCollection.find({}).toArray();
    results.total = questions.length;
    results.summary.total_processed = questions.length;
    
    console.log(`Found ${questions.length} questions to process`);

    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      console.log(`Processing question ${i + 1}/${questions.length}: ID ${question.id}, Course: ${question.course_code}`);
      
      try {
        // Generate embedding
        console.log(`Generating embedding for question ${question.id}...`);
        const embedding = await generateEmbedding({
          question: question.question,
          has_description: question.has_description,
          description_content: question.description_content
        });
        console.log(`Embedding generated successfully, dimensions: ${embedding.length}`);

        // Get Pinecone namespace
        console.log(`Getting Pinecone namespace for course: ${question.short}`);
        const namespaceObj = await getCourseNameSpace(question.short);
        const index = namespaceObj.index;
        const namespace = namespaceObj.namespace;
        console.log(`Using namespace: ${namespace}`);

        // Ensure stable vector_id
        let vectorId = question.vector_id;
        if (!vectorId) {
          vectorId = uuidv4();
          console.log(`Generated new vector_id: ${vectorId} for question ${question.id}`);

          // Update MongoDB with generated vector_id
          await questionPartsCollection.updateOne(
            { id: question.id },
            { $set: { vector_id: vectorId, updated_at: new Date() } }
          );
          console.log(`Updated MongoDB with vector_id: ${vectorId}`);
        } else {
          console.log(`Using existing vector_id: ${vectorId}`);
        }

        // Prepare metadata
        const metadata = cleanMetadataForPinecone({ 
          ...question, 
          vector_id_text: vectorId,
          updated_at: new Date().toISOString()
        });

        // Upsert into Pinecone
        console.log(`Upserting vector to Pinecone: ${vectorId}`);
        const upsertResult = await upsertVector(index, namespace, vectorId, embedding, metadata);
        
        if (!upsertResult.success) {
          throw new Error(`Failed to upsert vector: ${upsertResult.message}`);
        }
        
        console.log(`Vector upserted successfully: ${upsertResult.message}`);

        // Record success
        results.updated.push({
          id: question.id,
          vectorId,
          course_code: question.course_code,
          course_title: question.course_title,
          question_number: question.question_number,
          sub_question: question.sub_question,
          exam_type: question.exam_type,
          semester_term: question.semester_term,
          namespace: namespace,
          vector_dimensions: embedding.length,
          upsert_status: upsertResult
        });
        
        results.summary.successful_upserts++;

      } catch (err: any) {
        console.error(`Error processing question ${question.id}:`, err.message);
        
        results.failed.push({
          id: question.id,
          course_code: question.course_code,
          question_number: question.question_number,
          error: err.message || err.toString(),
          timestamp: new Date().toISOString()
        });
        
        results.summary.failed_upserts++;
        
        // Categorize errors
        if (err.message.includes('embedding') || err.message.includes('vector')) {
          results.summary.vector_errors++;
        } else if (err.message.includes('database') || err.message.includes('MongoDB')) {
          results.summary.database_errors++;
        }
      }
    }

    console.log('Pinecone data update process completed');
    console.log(`Total processed: ${results.summary.total_processed}`);
    console.log(`Successful upserts: ${results.summary.successful_upserts}`);
    console.log(`Failed upserts: ${results.summary.failed_upserts}`);

    return NextResponse.json({ 
      success: true, 
      message: 'Pinecone data update process completed',
      timestamp: new Date().toISOString(),
      ...results 
    });
    
  } catch (error: any) {
    console.error('Fatal error in update embeddings:', error);
    return NextResponse.json({ 
      success: false, 
      message: error.message || error.toString(),
      timestamp: new Date().toISOString(),
      ...results 
    }, { status: 500 });
  }
});

// GET request to get course total questions count, mid question count, final questions count
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const course_code = searchParams.get("course_code");

    if (!course_code) {
      return NextResponse.json(
        { error: "course_code query parameter is required" },
        { status: 400 }
      );
    }

    const questionPartsCollection = await getCollection<QuestionPart>('question_parts');
    
    // Fetch all questions for this course
    const questions = await questionPartsCollection.find(
      { course_code },
      { projection: { id: 1, exam_type: 1, course_title: 1 } }
    ).toArray();

    // Compute counts
    const total = questions.length;

    const mid = questions.filter(q =>
      q.exam_type?.toLowerCase().includes("mid")
    ).length;

    const final = questions.filter(q =>
      q.exam_type?.toLowerCase().includes("final")
      || q.exam_type?.toLowerCase().includes("end")
    ).length;

    const course_title = questions.length > 0 ? questions[0].course_title : null;

    return NextResponse.json({
      success: true,
      course_code,
      course_title,
      counts: {
        total,
        mid,
        final
      }
    });

  } catch (error: any) {
    console.error("Error fetching question counts:", error);
    return NextResponse.json(
      { error: "Internal server error: " + error.message },
      { status: 500 }
    );
  }
});