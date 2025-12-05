// API route for system logs management

import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware';
import { SystemLogService } from '@/lib/system-log-service';
import { SystemLogFilters } from '@/lib/system-log-types';

// GET /api/system-logs - Get system logs with filters and pagination
async function getSystemLogs(req: AuthenticatedRequest) {
  try {
    const { searchParams } = new URL(req.url);
    
    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    const filters: SystemLogFilters = {};
    
    if (searchParams.get('admin_id')) filters.admin_id = searchParams.get('admin_id')!;
    if (searchParams.get('method')) filters.method = searchParams.get('method') as 'POST' | 'PUT' | 'DELETE';
    if (searchParams.get('resource_type')) filters.resource_type = searchParams.get('resource_type')!;
    if (searchParams.get('action')) filters.action = searchParams.get('action')!;
    if (searchParams.get('success')) filters.success = searchParams.get('success') === 'true';
    if (searchParams.get('search')) filters.search = searchParams.get('search')!;
    
    if (searchParams.get('date_from')) {
      filters.date_from = searchParams.get('date_from')!;
    }
    if (searchParams.get('date_to')) {
      filters.date_to = searchParams.get('date_to')!;
    }
    
    // Convert date strings to Date objects for the service
    const serviceFilters = {
      ...filters,
      date_from: filters.date_from ? new Date(filters.date_from) : undefined,
      date_to: filters.date_to ? new Date(filters.date_to) : undefined
    };
    
    const result = await SystemLogService.getSystemLogs(page, limit, serviceFilters);
    
    return NextResponse.json({
      success: true,
      data: result.logs,
      pagination: {
        current_page: result.page,
        total_pages: result.totalPages,
        total_items: result.total,
        items_per_page: limit
      },
      filters
    });
    
  } catch (error: any) {
    console.error('System logs API error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch system logs'
    }, { status: 500 });
  }
}

export const GET = withAuth(getSystemLogs);