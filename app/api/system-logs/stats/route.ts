// API route for system logs statistics

import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware';
import { SystemLogService } from '@/lib/system-log-service';

// GET /api/system-logs/stats - Get system logs statistics
async function getSystemLogStats(req: AuthenticatedRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get('days') || '30');
    
    const stats = await SystemLogService.getSystemLogStats(days);
    
    return NextResponse.json({
      success: true,
      data: stats
    });
    
  } catch (error: any) {
    console.error('System logs stats API error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch system logs statistics'
    }, { status: 500 });
  }
}

export const GET = withAuth(getSystemLogStats);