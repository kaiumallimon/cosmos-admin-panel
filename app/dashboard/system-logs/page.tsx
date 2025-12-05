'use client';

import { FrostedHeader } from "@/components/custom/frosted-header";
import { useMobileMenu } from "@/components/mobile-menu-context";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from "@/components/ui/pagination";
import { 
  Activity, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Filter, 
  RefreshCw, 
  Search,
  User,
  Calendar,
  BarChart3,
  TrendingUp,
  Shield
} from "lucide-react";
import { useState, useEffect } from "react";
import { SystemLog, SystemLogListResponse, SystemLogSummary } from "@/lib/system-log-types";
import { StatsCard } from "@/components/dashboard/stats-card";
import { DashboardAreaChart, DashboardPieChart, DashboardBarChart } from "@/components/dashboard/chart-components";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from "@/components/ui/breadcrumb";

export default function SystemLogsPage() {
  const { toggleMobileMenu } = useMobileMenu();
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [stats, setStats] = useState<SystemLogSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Pagination and filters
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [filters, setFilters] = useState({
    method: 'all',
    resource_type: '',
    action: '',
    success: 'all',
    admin_id: '',
    search: '',
    date_from: '',
    date_to: ''
  });

  const itemsPerPage = 10;

  useEffect(() => {
    fetchSystemLogs();
    fetchSystemStats();
  }, [currentPage, filters]);

  const fetchSystemLogs = async () => {
    try {
      setError(null);
      
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== '' && v !== 'all'))
      });

      const response = await fetch(`/api/system-logs?${queryParams}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch system logs');
      }

      const data: SystemLogListResponse = await response.json();

      if (data.success) {
        setLogs(data.data);
        setTotalPages(data.pagination.total_pages);
        setTotalItems(data.pagination.total_items);
      } else {
        throw new Error('Failed to fetch system logs');
      }
    } catch (err: any) {
      console.error('Failed to fetch system logs:', err);
      setError(err.message || 'Failed to load system logs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchSystemStats = async () => {
    try {
      const response = await fetch('/api/system-logs/stats?days=30');
      const data = await response.json();

      if (data.success) {
        setStats(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch system stats:', err);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setCurrentPage(1);
    fetchSystemLogs();
    fetchSystemStats();
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleSearch = (searchTerm: string) => {
    setFilters(prev => ({ ...prev, search: searchTerm }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      method: 'all',
      resource_type: '',
      action: '',
      success: 'all',
      admin_id: '',
      search: '',
      date_from: '',
      date_to: ''
    });
    setCurrentPage(1);
  };

  const formatTimestamp = (timestamp: string | Date) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'POST': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'PUT': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'DELETE': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  // Process data for charts
  const actionChartData = stats?.action_distribution ? 
    Object.entries(stats.action_distribution).map(([name, value]) => ({ name: name.replace('_', ' '), value })) : [];

  const resourceChartData = stats?.resource_distribution ? 
    Object.entries(stats.resource_distribution).map(([name, value]) => ({ name: name.replace('_', ' '), value })) : [];

  const hourlyChartData = stats?.hourly_activity ? 
    Object.entries(stats.hourly_activity)
      .map(([hour, count]) => ({ hour, count }))
      .sort((a, b) => parseInt(a.hour) - parseInt(b.hour)) : [];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <FrostedHeader 
          title="System Logs" 
          subtitle="Monitor admin activities and system operations" 
          onMobileMenuToggle={toggleMobileMenu}
        />



        <div className="p-6 space-y-6">
          {error && (
            <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
              <CardContent className="pt-6">
                <p className="text-red-600 dark:text-red-400">{error}</p>
              </CardContent>
            </Card>
          )}

          <div className="pb-0">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>System Logs</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

          {/* Statistics Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {loading && !stats ? (
              Array(4).fill(0).map((_, i) => (
                <Card key={i} className="p-6">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-16 mb-1" />
                  <Skeleton className="h-3 w-32" />
                </Card>
              ))
            ) : (
              <>
                <StatsCard
                  title="Total Logs (30d)"
                  value={stats?.total_logs || 0}
                  description="System activities logged"
                  icon={Activity}
                />
                <StatsCard
                  title="Today's Activity"
                  value={stats?.today_logs || 0}
                  description="Activities today"
                  icon={Clock}
                />
                <StatsCard
                  title="Success Rate"
                  value={`${stats?.success_rate || 0}%`}
                  description="Successful operations"
                  icon={CheckCircle}
                />
                <StatsCard
                  title="Most Active Admin"
                  value={stats?.most_active_admin?.admin_name || 'N/A'}
                  description={`${stats?.most_active_admin?.log_count || 0} activities`}
                  icon={User}
                />
              </>
            )}
          </div>


          {/* Filters and Controls */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Activity Logs
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={refreshing}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Search and Filters */}
              <div className="grid gap-4 mb-6 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
                <div className="relative lg:col-span-2">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search logs..."
                    value={filters.search}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={filters.method} onValueChange={(value) => handleFilterChange('method', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Methods</SelectItem>
                    <SelectItem value="POST">POST</SelectItem>
                    <SelectItem value="PUT">PUT</SelectItem>
                    <SelectItem value="DELETE">DELETE</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.success} onValueChange={(value) => handleFilterChange('success', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="true">Success</SelectItem>
                    <SelectItem value="false">Failed</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  type="date"
                  placeholder="From Date"
                  value={filters.date_from}
                  onChange={(e) => handleFilterChange('date_from', e.target.value)}
                />

                <Input
                  type="date"
                  placeholder="To Date"
                  value={filters.date_to}
                  onChange={(e) => handleFilterChange('date_to', e.target.value)}
                />

                <Button variant="outline" onClick={clearFilters} className="col-start-1">
                  <Filter className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              </div>

              {/* Logs Table */}
              <div className="space-y-4">
                {loading ? (
                  Array(10).fill(0).map((_, i) => (
                    <div key={i} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-48" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                        <Skeleton className="h-6 w-16" />
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                  ))
                ) : logs.length === 0 ? (
                  <div className="text-center py-12">
                    <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium text-muted-foreground mb-2">No logs found</h3>
                    <p className="text-sm text-muted-foreground">
                      {Object.values(filters).some(v => v !== '') ? 
                        'Try adjusting your filters to see more results.' : 
                        'System logs will appear here once admin actions are performed.'
                      }
                    </p>
                  </div>
                ) : (
                  logs.map((log) => (
                    <div key={log.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={getMethodColor(log.method)}>
                              {log.method}
                            </Badge>
                            <span className="font-medium">{log.description}</span>
                            {log.success ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            by {log.admin_name} ({log.admin_email})
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {log.endpoint} • {log.resource_type} • {log.action}
                          </p>
                          {log.error_message && (
                            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                              Error: {log.error_message}
                            </p>
                          )}
                        </div>
                        <div className="text-right text-xs text-muted-foreground shrink-0">
                          <p>{formatTimestamp(log.timestamp)}</p>
                          <p>{log.duration_ms}ms</p>
                          <p className="text-xs">{log.ip_address}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Pagination */}
              {totalPages >= 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} logs
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Page {currentPage} of {totalPages} • Items per page: {itemsPerPage}
                    </p>
                  </div>
                  
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          href="#" 
                          onClick={(e) => {
                            e.preventDefault();
                            if (currentPage > 1) setCurrentPage(prev => prev - 1);
                          }}
                          className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                        />
                      </PaginationItem>
                      
                      {/* First page */}
                      {currentPage > 3 && (
                        <>
                          <PaginationItem>
                            <PaginationLink 
                              href="#" 
                              onClick={(e) => {
                                e.preventDefault();
                                setCurrentPage(1);
                              }}
                            >
                              1
                            </PaginationLink>
                          </PaginationItem>
                          {currentPage > 4 && (
                            <PaginationItem>
                              <PaginationEllipsis />
                            </PaginationItem>
                          )}
                        </>
                      )}
                      
                      {/* Current page and adjacent pages */}
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const pageNumber = currentPage <= 3 
                          ? i + 1 
                          : currentPage >= totalPages - 2 
                          ? totalPages - 4 + i 
                          : currentPage - 2 + i;
                        
                        if (pageNumber < 1 || pageNumber > totalPages) return null;
                        
                        return (
                          <PaginationItem key={pageNumber}>
                            <PaginationLink
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                setCurrentPage(pageNumber);
                              }}
                              isActive={pageNumber === currentPage}
                            >
                              {pageNumber}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}
                      
                      {/* Last page */}
                      {currentPage < totalPages - 2 && (
                        <>
                          {currentPage < totalPages - 3 && (
                            <PaginationItem>
                              <PaginationEllipsis />
                            </PaginationItem>
                          )}
                          <PaginationItem>
                            <PaginationLink 
                              href="#" 
                              onClick={(e) => {
                                e.preventDefault();
                                setCurrentPage(totalPages);
                              }}
                            >
                              {totalPages}
                            </PaginationLink>
                          </PaginationItem>
                        </>
                      )}
                      
                      <PaginationItem>
                        <PaginationNext 
                          href="#" 
                          onClick={(e) => {
                            e.preventDefault();
                            if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
                          }}
                          className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}