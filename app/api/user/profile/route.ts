import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Account, Profile } from "@/lib/user-types";
import { withAnyAuth, AuthenticatedRequest } from "@/lib/api-middleware";

// ─── GET /api/user/profile ────────────────────────────────────────────────────
// Returns the authenticated user's full profile

export const GET = withAnyAuth(async (req: AuthenticatedRequest) => {
  try {
    const userId = req.user!.id;
    const { db } = await connectToDatabase();

    const profile = await db
      .collection<Profile>("profile")
      .findOne({ id: userId }, { projection: { _id: 0 } });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json(profile);
  } catch (err) {
    console.error("[GET /api/user/profile]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});

// ─── PATCH /api/user/profile ──────────────────────────────────────────────────
// Allows the authenticated user to update their editable profile fields:
// full_name, phone, gender

interface SelfUpdateRequest {
  full_name?: string;
  phone?: string;
  gender?: string;
  student_id?: string;
  department?: string;
  batch?: string;
  program?: string;
}

export const PATCH = withAnyAuth(async (req: AuthenticatedRequest) => {
  try {
    const userId = req.user!.id;
    const body: SelfUpdateRequest = await req.json();

    // Only allow safe, self-editable fields
    const freeEditFields: (keyof SelfUpdateRequest)[] = ["full_name", "phone", "gender"];
    // Academic fields: only editable when currently empty/null
    const academicFields: (keyof SelfUpdateRequest)[] = ["student_id", "department", "batch", "program"];

    // Verify user exists first (needed for academic field guard)
    const { db } = await connectToDatabase();
    const profileCollection = db.collection<Profile>("profile");
    const accountsCollection = db.collection<Account>("accounts");

    const existing = await profileCollection.findOne({ id: userId });
    if (!existing) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const profileUpdate: Partial<Profile> = {};
    for (const field of freeEditFields) {
      if (body[field] !== undefined) {
        (profileUpdate as Record<string, unknown>)[field] = body[field];
      }
    }
    for (const field of academicFields) {
      if (body[field] !== undefined) {
        const current = (existing as Record<string, unknown>)[field];
        // Only allow setting if the field is currently empty
        if (!current) {
          (profileUpdate as Record<string, unknown>)[field] = body[field];
        }
      }
    }

    if (Object.keys(profileUpdate).length === 0) {
      return NextResponse.json(
        { error: "No valid fields provided for update" },
        { status: 400 }
      );
    }

    // Validate full_name
    if (profileUpdate.full_name !== undefined) {
      const name = profileUpdate.full_name as string;
      if (!name || name.trim().length < 2) {
        return NextResponse.json(
          { error: "Full name must be at least 2 characters" },
          { status: 400 }
        );
      }
      profileUpdate.full_name = name.trim();
    }

    // Validate gender
    if (profileUpdate.gender !== undefined) {
      const validGenders = ["Male", "Female", "Other", "Prefer not to say"];
      if (!validGenders.includes(profileUpdate.gender as string)) {
        return NextResponse.json(
          {
            error: `Gender must be one of: ${validGenders.join(", ")}`,
          },
          { status: 400 }
        );
      }
    }

    // Use a transaction to keep accounts.updated_at in sync
    const session = db.client.startSession();
    let updatedProfile: Profile | null = null;

    try {
      await session.withTransaction(async () => {
        await profileCollection.updateOne(
          { id: userId },
          { $set: profileUpdate },
          { session }
        );
        await accountsCollection.updateOne(
          { id: userId },
          { $set: { updated_at: new Date() } },
          { session }
        );
      });

      updatedProfile = await profileCollection.findOne(
        { id: userId },
        { projection: { _id: 0 } }
      );
    } finally {
      await session.endSession();
    }

    return NextResponse.json({
      message: "Profile updated successfully",
      profile: updatedProfile,
    });
  } catch (err) {
    console.error("[PATCH /api/user/profile]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});
