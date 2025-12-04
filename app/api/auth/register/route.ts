import { NextRequest, NextResponse } from 'next/server';
import { createAccount } from '@/lib/auth-server-only';

export async function POST(request: NextRequest) {
  try {
    const { email, password, role = 'user' } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }
    
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }
    
    // Validate role
    if (role !== 'admin' && role !== 'user') {
      return NextResponse.json(
        { error: 'Invalid role. Must be "admin" or "user"' },
        { status: 400 }
      );
    }
    
    const account = await createAccount(email, password, role);
    
    // Return account without password
    const { password: _, ...accountWithoutPassword } = account;
    
    return NextResponse.json({
      success: true,
      account: accountWithoutPassword,
      message: 'Account created successfully',
    });
  } catch (error) {
    console.error('Register API error:', error);
    
    if (error instanceof Error && error.message.includes('already exists')) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}