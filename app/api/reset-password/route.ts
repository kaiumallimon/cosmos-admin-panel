import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Account } from "@/lib/user-types";
import { verifyPasswordResetToken } from "@/lib/token-utils";
import bcrypt from 'bcryptjs';

interface PublicPasswordResetRequest {
  token: string;
  newPassword: string;
}

export async function POST(req: NextRequest) {
  try {
    const { token, newPassword }: PublicPasswordResetRequest = await req.json();

    // Validate inputs
    if (!token || !newPassword) {
      return NextResponse.json({ 
        error: 'Token and new password are required' 
      }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ 
        error: 'Password must be at least 6 characters long' 
      }, { status: 400 });
    }

    // Verify the reset token
    const tokenPayload = verifyPasswordResetToken(token);
    if (!tokenPayload) {
      return NextResponse.json({ 
        error: 'Invalid or expired reset token' 
      }, { status: 401 });
    }

    const { db } = await connectToDatabase();
    const accountsCollection = db.collection<Account>('accounts');

    // Verify user still exists
    const user = await accountsCollection.findOne({ 
      id: tokenPayload.userId,
      email: tokenPayload.email 
    });

    if (!user) {
      return NextResponse.json({ 
        error: 'User not found' 
      }, { status: 404 });
    }

    // Hash the new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update the password
    const updateResult = await accountsCollection.updateOne(
      { id: tokenPayload.userId },
      { 
        $set: { 
          password: hashedPassword,
          updated_at: new Date()
        }
      }
    );

    if (updateResult.matchedCount === 0) {
      return NextResponse.json({ 
        error: 'Failed to update password' 
      }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Password has been reset successfully. You can now login with your new password.',
      success: true
    });

  } catch (error: any) {
    console.error('Error resetting password:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to reset password' 
    }, { status: 500 });
  }
}

// GET endpoint to verify token validity
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ 
        error: 'Token is required' 
      }, { status: 400 });
    }

    // Verify the reset token
    const tokenPayload = verifyPasswordResetToken(token);
    if (!tokenPayload) {
      return NextResponse.json({ 
        error: 'Invalid or expired reset token',
        valid: false
      }, { status: 401 });
    }

    const { db } = await connectToDatabase();
    const accountsCollection = db.collection<Account>('accounts');

    // Verify user still exists
    const user = await accountsCollection.findOne({ 
      id: tokenPayload.userId,
      email: tokenPayload.email 
    });

    if (!user) {
      return NextResponse.json({ 
        error: 'User not found',
        valid: false
      }, { status: 404 });
    }

    return NextResponse.json({
      valid: true,
      email: tokenPayload.email,
      expiresAt: tokenPayload.exp
    });

  } catch (error: any) {
    console.error('Error verifying token:', error);
    return NextResponse.json({ 
      error: 'Failed to verify token',
      valid: false 
    }, { status: 500 });
  }
}