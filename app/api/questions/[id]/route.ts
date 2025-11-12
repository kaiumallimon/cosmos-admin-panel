import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const formData = await req.json();

        // Remove id from formData to avoid conflicts
        const { id: _, ...updateData } = formData;

        // Update the question in Supabase
        const { data, error } = await supabase
            .from('question_parts')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        if (!data) {
            return NextResponse.json({ error: 'Question not found' }, { status: 404 });
        }

        return NextResponse.json({ 
            message: 'Question updated successfully', 
            data 
        }, { status: 200 });

    } catch (error: any) {
        console.error('Edit question error:', error);
        return NextResponse.json({ 
            error: error.message || 'Internal server error' 
        }, { status: 500 });
    }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        // Fetch the specific question
        const { data, error } = await supabase
            .from('question_parts')
            .select('*')
            .eq('id', id)
            .single();

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