import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseClient";

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;

        const { data, error } = await supabaseAdmin
            .from('accounts')
            .select(`
                *,
                profile:profile(*)
            `)
            .eq('id', id)
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        if (!data) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ data });

    } catch (error) {
        console.error('Error fetching user:', error);
        return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;
        const body = await req.json();
        const { 
            email,
            role,
            full_name,
            phone,
            gender,
            student_id,
            department,
            batch,
            program,
            current_trimester,
            completed_credits,
            cgpa,
            trimester_credits
        } = body;

        // Update account record
        const { data: accountData, error: accountError } = await supabaseAdmin
            .from('accounts')
            .update({
                email,
                role,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (accountError) {
            return NextResponse.json({ error: accountError.message }, { status: 500 });
        }

        // Update profile record
        const { data: profileData, error: profileError } = await supabaseAdmin
            .from('profile')
            .update({
                email,
                full_name,
                phone,
                gender,
                role,
                student_id,
                department,
                batch,
                program,
                current_trimester,
                completed_credits,
                cgpa,
                trimester_credits
            })
            .eq('id', id)
            .select()
            .single();

        if (profileError) {
            return NextResponse.json({ error: profileError.message }, { status: 500 });
        }

        return NextResponse.json({
            message: 'User updated successfully',
            data: {
                ...accountData,
                profile: profileData
            }
        });

    } catch (error) {
        console.error('Error updating user:', error);
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;

        // Delete from Supabase Auth (this will cascade delete from accounts and profile tables)
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);

        if (authError) {
            return NextResponse.json({ error: authError.message }, { status: 500 });
        }

        return NextResponse.json({
            message: 'User deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting user:', error);
        return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
    }
}