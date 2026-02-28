import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Account } from "@/lib/user-types";
import { withAnyAuth, AuthenticatedRequest } from "@/lib/api-middleware";
import bcrypt from "bcryptjs";

interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// ─── POST /api/user/profile/password ─────────────────────────────────────────
// Allows an authenticated user to change their own password by verifying
// their current password first.

export const POST = withAnyAuth(async (req: AuthenticatedRequest) => {
  try {
    const userId = req.user!.id;
    const body: ChangePasswordRequest = await req.json();
    const { currentPassword, newPassword } = body;

    // ── Input validation ──────────────────────────────────────────────────────
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Current password and new password are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "New password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    if (currentPassword === newPassword) {
      return NextResponse.json(
        { error: "New password must be different from the current password" },
        { status: 400 }
      );
    }

    // ── Fetch account and verify current password ─────────────────────────────
    const { db } = await connectToDatabase();
    const accountsCollection = db.collection<Account>("accounts");

    const account = await accountsCollection.findOne({ id: userId });
    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    const passwordValid = await bcrypt.compare(
      currentPassword,
      account.password
    );
    if (!passwordValid) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 401 }
      );
    }

    // ── Hash new password and update ──────────────────────────────────────────
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    await accountsCollection.updateOne(
      { id: userId },
      {
        $set: {
          password: hashedPassword,
          updated_at: new Date(),
        },
      }
    );

    return NextResponse.json({ message: "Password changed successfully" });
  } catch (err) {
    console.error("[POST /api/user/profile/password]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});
