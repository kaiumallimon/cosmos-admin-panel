// https://cdn.bcrypt.website/api/cdn/files?page=1&limit=5

import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page = searchParams.get('page') || '1';
        const limit = searchParams.get('limit') || '10';
        const res = await fetch(`https://cdn.bcrypt.website/api/cdn/files?page=${page}&limit=${limit}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        const data = await res.json();
        return NextResponse.json(data);


    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch CDN files' }, { status: 500 });
    }
}