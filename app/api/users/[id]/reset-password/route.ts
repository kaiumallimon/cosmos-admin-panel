import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseClient";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { newPassword } = await req.json();

    if (!newPassword || typeof newPassword !== 'string' || newPassword.trim().length < 6) {
      return NextResponse.json({
        error: 'Password must be at least 6 characters long'
      }, { status: 400 });
    }

    // Verify the user exists in our accounts table
    const { data: user, error: userError } = await supabaseAdmin
      .from('accounts')
      .select('id, email')
      .eq('id', resolvedParams.id)
      .single();

    if (userError || !user) {
      return NextResponse.json({
        error: 'User not found'
      }, { status: 404 });
    }

    // Reset password using Supabase Admin API
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      resolvedParams.id,
      {
        password: newPassword.trim()
      }
    );

    if (error) {
      console.error('Password reset error:', error);
      return NextResponse.json({
        error: `Failed to reset password: ${error.message}`
      }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Password reset successfully',
      data: {
        id: data.user.id,
        email: data.user.email
      }
    });

  } catch (error) {
    console.error('Error resetting password:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}