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

export const PUT = withAuth(async (req, { params }: { params: Promise<{ id: string }> }) => {
    try {
        const { id } = await params;
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
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const questionId = parseInt(id);
        
        const questionPartsCollection = await getCollection<QuestionPart>('question_parts');
        
        // Fetch the specific question
        const data = await questionPartsCollection.findOne({ id: questionId });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

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

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        // Delete the question from Supabase
        const { error } = await supabase
            .from('question_parts')
            .delete()
            .eq('id', id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
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