import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Trimester, TrimesterUpdateRequest } from "@/lib/course-types";
import { withAuth, AuthenticatedRequest } from "@/lib/api-middleware-with-logging";

// PUT - Update a trimester
async function updateTrimester(
    request: AuthenticatedRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body: TrimesterUpdateRequest = await request.json();
        const { trimester } = body;

        if (!trimester || !trimester.trim()) {
            return NextResponse.json(
                { error: "Trimester code is required" },
                { status: 400 }
            );
        }

        const trimmedCode = trimester.trim();

        if (!/^\d{3}$/.test(trimmedCode)) {
            return NextResponse.json(
                { error: "Trimester code must be exactly 3 digits (e.g. 251, 252, 261)" },
                { status: 400 }
            );
        }

        const lastDigit = parseInt(trimmedCode[2], 10);
        if (lastDigit < 1 || lastDigit > 3) {
            return NextResponse.json(
                { error: "Last digit of trimester must be 1, 2, or 3" },
                { status: 400 }
            );
        }

        const { db } = await connectToDatabase();
        const collection = db.collection<Trimester>("trimesters");

        // Duplicate check (exclude self)
        const existing = await collection.findOne({ trimester: trimmedCode, id: { $ne: id } });
        if (existing) {
            return NextResponse.json(
                { error: `Trimester "${trimmedCode}" already exists` },
                { status: 409 }
            );
        }

        const result = await collection.findOneAndUpdate(
            { id },
            { $set: { trimester: trimmedCode, updated_at: new Date() } },
            { returnDocument: "after" }
        );

        if (!result) {
            return NextResponse.json({ error: "Trimester not found" }, { status: 404 });
        }

        return NextResponse.json({ ...result, _id: result._id?.toString() });
    } catch (error) {
        console.error("Error in PUT /api/course-management/trimesters/[id]:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export const PUT = withAuth(updateTrimester);

// DELETE - Delete a trimester
async function deleteTrimester(
    request: AuthenticatedRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { db } = await connectToDatabase();
        const collection = db.collection<Trimester>("trimesters");

        const result = await collection.deleteOne({ id });

        if (result.deletedCount === 0) {
            return NextResponse.json({ error: "Trimester not found" }, { status: 404 });
        }

        return NextResponse.json({ message: "Trimester deleted successfully" });
    } catch (error) {
        console.error("Error in DELETE /api/course-management/trimesters/[id]:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export const DELETE = withAuth(deleteTrimester);
