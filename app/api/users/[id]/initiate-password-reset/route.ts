import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Account } from "@/lib/user-types";
import { withAuth, AuthenticatedRequest } from "@/lib/api-middleware-with-logging";
import { generatePasswordResetToken, createPasswordResetUrl } from "@/lib/token-utils";
import { sendEmail, generatePasswordResetEmailHTML } from "@/lib/email-service";

interface PasswordResetInitiateRequest {
  userId: string;
}

async function initiatePasswordReset(req: AuthenticatedRequest) {
  try {
    const { userId }: PasswordResetInitiateRequest = await req.json();

    if (!userId) {
      return NextResponse.json({ 
        error: 'User ID is required' 
      }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const accountsCollection = db.collection<Account>('accounts');

    // Find the user and their profile
    const userPipeline = [
      { $match: { id: userId } },
      {
        $lookup: {
          from: 'profile',
          localField: 'id',
          foreignField: 'id',
          as: 'profile'
        }
      },
      {
        $unwind: {
          path: '$profile',
          preserveNullAndEmptyArrays: true
        }
      }
    ];

    const [user] = await accountsCollection.aggregate(userPipeline).toArray();
    if (!user) {
      return NextResponse.json({ 
        error: 'User not found' 
      }, { status: 404 });
    }

    // Generate reset token (expires in 3 minutes)
    const resetToken = generatePasswordResetToken(user.id, user.email);
    const resetUrl = createPasswordResetUrl(resetToken);

    // Send reset email
    try {
      const userName = user.profile?.full_name || user.email;
      const emailHTML = generatePasswordResetEmailHTML(
        userName, 
        resetUrl,
        '3 minutes'
      );
      
      const emailSent = await sendEmail({
        to: user.email,
        subject: 'Password Reset Request - COSMOS-ITS Admin Panel',
        htmlContent: emailHTML
      });

      if (!emailSent) {
        return NextResponse.json({ 
          error: 'Failed to send reset email. Please try again later.' 
        }, { status: 500 });
      }

      return NextResponse.json({
        message: 'Password reset link has been sent to the user\'s email address. The link will expire in 3 minutes.',
        data: {
          email: user.email,
          expiresIn: '3 minutes'
        }
      });

    } catch (emailError) {
      console.error('Error sending reset email:', emailError);
      return NextResponse.json({ 
        error: 'Failed to send reset email. Please check your email configuration.' 
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Error initiating password reset:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to initiate password reset' 
    }, { status: 500 });
  }
}

export const POST = withAuth(initiatePasswordReset);