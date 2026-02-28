import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Account } from "@/lib/user-types";
import { generatePasswordResetToken, createPasswordResetUrl } from "@/lib/token-utils";
import { sendEmail, generatePasswordResetEmailHTML } from "@/lib/email-service";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const accountsCollection = db.collection<Account>("accounts");

    const userPipeline = [
      { $match: { email: email.toLowerCase().trim() } },
      {
        $lookup: {
          from: "profile",
          localField: "id",
          foreignField: "id",
          as: "profile",
        },
      },
      {
        $unwind: {
          path: "$profile",
          preserveNullAndEmptyArrays: true,
        },
      },
    ];

    const [user] = await accountsCollection.aggregate(userPipeline).toArray();

    // Always respond with the same message to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        message:
          "If an account with that email exists, a password reset link has been sent.",
      });
    }

    const resetToken = generatePasswordResetToken(user.id, user.email);
    const resetUrl = createPasswordResetUrl(resetToken);

    const userName = user.profile?.full_name || user.email;
    const emailHTML = generatePasswordResetEmailHTML(
      userName,
      resetUrl,
      "3 minutes"
    );

    const emailSent = await sendEmail({
      to: user.email,
      subject: "Password Reset Request - COSMOS-ITS",
      htmlContent: emailHTML,
    });

    if (!emailSent) {
      return NextResponse.json(
        { error: "Failed to send reset email. Please try again later." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message:
        "If an account with that email exists, a password reset link has been sent.",
    });
  } catch (error: unknown) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
