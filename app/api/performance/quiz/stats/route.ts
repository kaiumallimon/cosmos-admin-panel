import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get('student_id');
  if (!studentId) return NextResponse.json({ error: 'student_id required' }, { status: 400 });

  try {
    const { db } = await connectToDatabase();
    const col = db.collection('performance_records');
    const records = await col.find({ student_id: studentId }).toArray();

    if (records.length === 0) {
      return NextResponse.json({
        total_attempts: 0,
        avg_percentage: null,
        topics_covered: 0,
        avg_precision: null,
      });
    }

    // total attempts = sum of attempt_no across all records
    const totalAttempts = records.reduce((sum, r) => sum + (r.attempt_no ?? 0), 0);

    // avg percentage
    const avgPercentage =
      Math.round(
        (records.reduce((sum, r) => sum + (r.percentage ?? 0), 0) / records.length) * 10,
      ) / 10;

    // unique topics
    const topicSet = new Set<string>();
    records.forEach((r) => {
      const names: string[] = Array.isArray(r.topic_names) ? r.topic_names : [];
      names.forEach((t) => topicSet.add(t));
    });

    // avg precision
    const avgPrecision =
      Math.round(
        (records.reduce((sum, r) => sum + (r.precision ?? 0), 0) / records.length) * 10,
      ) / 10;

    return NextResponse.json({
      total_attempts: totalAttempts,
      avg_percentage: avgPercentage,
      topics_covered: topicSet.size,
      avg_precision: avgPrecision,
    });
  } catch (err) {
    console.error('Quiz stats error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
