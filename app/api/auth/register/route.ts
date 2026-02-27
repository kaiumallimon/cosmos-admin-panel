import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Account, Profile } from '@/lib/user-types';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

/**
 * Public self-registration endpoint — no admin auth required.
 * Always creates role='user' (student) accounts with a full profile.
 */
export async function POST(request: NextRequest) {
  try {
    const {
      email: rawEmail,
      password,
      full_name = '',
      student_id = null,
      department = null,
      batch = null,
      program = null,
    } = await request.json();

    const email = rawEmail?.toLowerCase().trim();

    // ── Validation ──────────────────────────────────────────────────────────
    if (!email || !password || !full_name) {
      return NextResponse.json(
        { error: 'Email, password, and full name are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    // ── Duplicate checks ─────────────────────────────────────────────────────
    const { db } = await connectToDatabase();
    const accountsCollection = db.collection<Account>('accounts');
    const profileCollection = db.collection<Profile>('profile');

    const existingAccount = await accountsCollection.findOne({ email });
    if (existingAccount) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    if (student_id) {
      const existingStudent = await profileCollection.findOne({ student_id });
      if (existingStudent) {
        return NextResponse.json(
          { error: 'A student with this ID already exists' },
          { status: 409 }
        );
      }
    }

    // ── Create account + profile in a transaction ────────────────────────────
    const hashedPassword = await bcrypt.hash(password, 12);
    const userId = uuidv4();
    const now = new Date();

    const newAccount: Account = {
      id: userId,
      email,
      password: hashedPassword,
      role: 'user',
      created_at: now,
      updated_at: now,
    };

    const newProfile: Profile = {
      id: userId,
      email,
      full_name,
      phone: '',
      gender: '',
      role: 'student',
      student_id: student_id || null,
      department: department || null,
      batch: batch || null,
      program: program || null,
      current_trimester: null,
      completed_credits: 0,
      cgpa: null,
      trimester_credits: 0,
      avatar_url: '',
      created_at: now,
    };

    const session = db.client.startSession();
    try {
      await session.withTransaction(async () => {
        await accountsCollection.insertOne(newAccount, { session });
        await profileCollection.insertOne(newProfile, { session });
      });
    } finally {
      await session.endSession();
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Account created successfully. You can now sign in.',
        user: { id: userId, email, full_name, role: 'user' },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Registration error:', error);

    if (error?.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0];
      const fieldMessages: Record<string, string> = {
        email: 'An account with this email already exists',
        student_id: 'A student with this ID already exists',
      };
      return NextResponse.json(
        { error: fieldMessages[field] || 'Duplicate data detected' },
        { status: 409 }
      );
    }

    if (error instanceof Error && error.message.includes('already exists')) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
  }
}