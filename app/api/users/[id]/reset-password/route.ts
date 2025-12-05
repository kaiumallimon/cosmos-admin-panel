import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Account, ResetPasswordRequest } from "@/lib/user-types";
import { withAuth, AuthenticatedRequest } from "@/lib/api-middleware-with-logging";
import bcrypt from 'bcryptjs';

async function resetPassword(
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: ResetPasswordRequest = await req.json();
    const { newPassword } = body;

    // Validate password
    if (!newPassword || typeof newPassword !== 'string' || newPassword.trim().length < 6) {
      return NextResponse.json({
        error: 'Password must be at least 6 characters long'
      }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const accountsCollection = db.collection<Account>('accounts');

    // Verify the user exists
    const user = await accountsCollection.findOne({ id });
    if (!user) {
      return NextResponse.json({
        error: 'User not found'
      }, { status: 404 });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword.trim(), saltRounds);

    // Update password in database
    const result = await accountsCollection.updateOne(
      { id },
      { 
        $set: { 
          password: hashedPassword,
          updated_at: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({
        error: 'User not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Password reset successfully',
      data: {
        id: user.id,
        email: user.email
      }
    });

  } catch (error: any) {
    console.error('Error resetting password:', error);
    return NextResponse.json({
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}

export const POST = withAuth(resetPassword);