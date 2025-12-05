import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware-with-logging';
import { getCollection } from '@/lib/mongodb';
import { getCourseNameSpace, deleteVector } from '@/lib/pinecone-service';

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

async function putHandler(req: AuthenticatedRequest) {
    try {
        // Extract the id from the URL pathname
        const url = new URL(req.url);
        const pathSegments = url.pathname.split('/');
        const id = pathSegments[pathSegments.length - 1];
        
        if (!id) {
            return NextResponse.json(
                { error: "Question ID is required" },
                { status: 400 }
            );
        }
        
        const formData = await req.json();
        const questionId = parseInt(id);

        // Remove id from formData to avoid conflicts
        const { id: _, ...updateData } = formData;
        
        // Add updated_at timestamp
        const updateDocument = {
            ...updateData,
            updated_at: new Date()
        };

        const questionPartsCollection = await getCollection<QuestionPart>('question_parts');
        
        // Update the question in MongoDB
        const result = await questionPartsCollection.updateOne(
            { id: questionId },
            { $set: updateDocument }
        );

        if (result.matchedCount === 0) {
            return NextResponse.json({ error: 'Question not found' }, { status: 404 });
        }

        // Fetch the updated document
        const updatedQuestion = await questionPartsCollection.findOne({ id: questionId });

        return NextResponse.json({ 
            message: 'Question updated successfully', 
            data: updatedQuestion 
        }, { status: 200 });

    } catch (error: any) {
        console.error('Edit question error:', error);
        return NextResponse.json({ 
            error: error.message || 'Internal server error' 
        }, { status: 500 });
    }
}

export const PUT = withAuth(putHandler);

async function getHandler(req: AuthenticatedRequest) {
    try {
        // Extract the id from the URL pathname
        const url = new URL(req.url);
        const pathSegments = url.pathname.split('/');
        const id = pathSegments[pathSegments.length - 1];
        
        if (!id) {
            return NextResponse.json(
                { error: "Question ID is required" },
                { status: 400 }
            );
        }
        
        const questionId = parseInt(id);
        
        const questionPartsCollection = await getCollection<QuestionPart>('question_parts');
        
        // Fetch the specific question
        const data = await questionPartsCollection.findOne({ id: questionId });

        if (!data) {
            return NextResponse.json({ error: 'Question not found' }, { status: 404 });
        }

        return NextResponse.json(data, { status: 200 });

    } catch (error: any) {
        console.error('Get question error:', error);
        return NextResponse.json({ 
            error: error.message || 'Internal server error' 
        }, { status: 500 });
    }
}

export const GET = withAuth(getHandler);

async function deleteHandler(req: AuthenticatedRequest) {
    try {
        // Extract the id from the URL pathname
        const url = new URL(req.url);
        const pathSegments = url.pathname.split('/');
        const id = pathSegments[pathSegments.length - 1];
        
        if (!id) {
            return NextResponse.json(
                { error: "Question ID is required" },
                { status: 400 }
            );
        }
        
        const questionId = parseInt(id);

        const questionPartsCollection = await getCollection<QuestionPart>('question_parts');
        
        // First, get the question to retrieve vector_id and course info
        const questionToDelete = await questionPartsCollection.findOne({ id: questionId });

        if (!questionToDelete) {
            return NextResponse.json({ error: 'Question not found' }, { status: 404 });
        }

        // Transaction-style deletion: Ensure both operations can succeed before committing either
        // Step 1: Pre-validate both operations without committing
        let pineconeService = null;
        if (questionToDelete.vector_id) {
            try {
                const { index, namespace } = await getCourseNameSpace(questionToDelete.short);
                pineconeService = { index, namespace, vectorId: questionToDelete.vector_id };
            } catch (pineconeError: any) {
                return NextResponse.json({ 
                    error: 'Failed to connect to Pinecone: ' + pineconeError.message,
                    transaction: 'aborted'
                }, { status: 500 });
            }
        }

        // Step 2: Verify MongoDB connection is working
        try {
            await questionPartsCollection.findOne({ id: questionId });
        } catch (mongoError: any) {
            return NextResponse.json({ 
                error: 'MongoDB connection failed: ' + mongoError.message,
                transaction: 'aborted'
            }, { status: 500 });
        }

        // Step 3: Execute both deletions - if either fails, the whole operation fails
        try {
            let pineconeResult = { success: true, message: 'No vector to delete' };
            
            // Delete from Pinecone first (if vector exists)
            if (pineconeService) {
                pineconeResult = await deleteVector(
                    pineconeService.index, 
                    pineconeService.namespace, 
                    pineconeService.vectorId
                );
                
                if (!pineconeResult.success) {
                    throw new Error(`Pinecone deletion failed: ${pineconeResult.message}`);
                }
            }

            // Delete from MongoDB - if this fails after Pinecone succeeds, we have a problem
            const mongoResult = await questionPartsCollection.deleteOne({ id: questionId });
            
            if (mongoResult.deletedCount === 0) {
                // This is bad - Pinecone was deleted but MongoDB deletion failed
                if (pineconeService) {
                    console.error(`CRITICAL: Vector ${pineconeService.vectorId} deleted from Pinecone but MongoDB deletion failed for question ${questionId}`);
                    return NextResponse.json({ 
                        error: 'Transaction consistency error: Pinecone deletion succeeded but MongoDB failed',
                        criticalError: true,
                        message: 'Data inconsistency detected - manual intervention required',
                        questionId: questionId,
                        vectorId: pineconeService.vectorId
                    }, { status: 500 });
                } else {
                    return NextResponse.json({ error: 'Question not found in database' }, { status: 404 });
                }
            }

            // Success: Both operations completed
            return NextResponse.json({ 
                message: 'Question deleted successfully from both MongoDB and Pinecone',
                deletedId: questionId,
                vectorId: questionToDelete.vector_id || null,
                transaction: 'completed'
            }, { status: 200 });

        } catch (error: any) {
            console.error('Delete transaction error:', error);
            return NextResponse.json({ 
                error: 'Transaction failed: ' + error.message,
                transaction: 'failed',
                deletedId: null
            }, { status: 500 });
        }

    } catch (error: any) {
        console.error('Delete question error:', error);
        return NextResponse.json({ 
            error: error.message || 'Internal server error' 
        }, { status: 500 });
    }
}

export const DELETE = withAuth(deleteHandler);