import { NextResponse } from "next/server";

// https://cdn.bcrypt.website/api/cdn/stats

export async function GET() {
    try {
        const res = await fetch('https://cdn.bcrypt.website/api/cdn/stats', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!res.ok) {
            return NextResponse.json({ error: 'Failed to fetch CDN stats' }, { status: res.status });
        }
        const data = await res.json();
        return NextResponse.json(data, { status: 200 });

    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch CDN stats' }, { status: 500 });
    }
}