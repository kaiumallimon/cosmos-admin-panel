import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware';
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
        
        // Delete the question from MongoDB
        const result = await questionPartsCollection.deleteOne({ id: questionId });

        if (result.deletedCount === 0) {
            return NextResponse.json({ error: 'Question not found' }, { status: 404 });
        }

        return NextResponse.json({ 
            message: 'Question deleted successfully' 
        }, { status: 200 });

    } catch (error: any) {
        console.error('Delete question error:', error);
        return NextResponse.json({ 
            error: error.message || 'Internal server error' 
        }, { status: 500 });
    }
}

export const DELETE = withAuth(deleteHandler);