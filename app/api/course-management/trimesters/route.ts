import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Trimester, TrimesterCreateRequest, TrimesterResponse } from "@/lib/course-types";
import { v4 as uuidv4 } from "uuid";
import { withAuth, AuthenticatedRequest } from "@/lib/api-middleware-with-logging";

// GET - Fetch all trimesters (accessible to all users)
export async function GET() {
    try {
        const { db } = await connectToDatabase();
        const collection = db.collection<Trimester>("trimesters");

        const trimesters = await collection
            .find({})
            .sort({ trimester: -1 })
            .toArray();

        const response: TrimesterResponse = {
            trimesters: trimesters.map((t) => ({
                ...t,
                _id: t._id?.toString(),
                id: t.id || t._id?.toString() || "",
            })),
            total: trimesters.length,
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error("Error in GET /api/course-management/trimesters:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST - Create a new trimester
async function createTrimester(request: AuthenticatedRequest) {
    try {
        const body: TrimesterCreateRequest = await request.json();
        const { trimester } = body;

        if (!trimester || !trimester.trim()) {
            return NextResponse.json(
                { error: "Trimester code is required" },
                { status: 400 }
            );
        }

        const trimmedCode = trimester.trim();

        // Validate format: 3 digits - year digits + 1/2/3
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

        // Duplicate check
        const existing = await collection.findOne({ trimester: trimmedCode });
        if (existing) {
            return NextResponse.json(
                { error: `Trimester "${trimmedCode}" already exists` },
                { status: 409 }
            );
        }

        const now = new Date();
        const newTrimester: Trimester = {
            id: uuidv4(),
            trimester: trimmedCode,
            created_at: now,
            updated_at: now,
        };

        const result = await collection.insertOne(newTrimester);

        return NextResponse.json(
            { ...newTrimester, _id: result.insertedId.toString() },
            { status: 201 }
        );
    } catch (error) {
        console.error("Error in POST /api/course-management/trimesters:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export const POST = withAuth(createTrimester);
