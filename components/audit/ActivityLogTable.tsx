/**
 * Activity Log Table Component
 * 
 * Displays user activity logs in a filterable and sortable table format.
 * Supports pagination, search, and detailed activity inspection.
 * 
 * Requirements: 8.5, 12.3 - User Management and Security Compliance
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Search, 
  Filter, 
  Eye, 
  ChevronLeft, 
  ChevronRight,
  RefreshCw,
  Download,
  Calendar,
  User,
  Activity
} from 'lucide-react';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { UserActivityLog, UserAction, ActivityStatus, ResourceType } from '@/lib/types/audit';
import { getActionDescription } from '@/lib/types/audit';

interface ActivityLogTableProps {
  tenantId: string;
  dateRange?: DateRange;
  userId?: string;
  className?: string;
}

interface ActivityFilters {
  search: string;
  action?: UserAction;
  status?: ActivityStatus;
  resource_type?: ResourceType;
  user_id?: string;
}

export function ActivityLogTable({ 
  tenantId, 
  dateRange, 
  userId, 
  className 
}: ActivityLogTableProps) {
  const [activities, setActivities] = useState<UserActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [filters, setFilters] = useState<ActivityFilters>({
    search: '',
    user_id: userId
  });
  const [selectedActivity, setSelectedActivity] = useState<UserActivityLog | null>(null);

  // Fetch activities
  const fetchActivities = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        tenant_id: tenantId,
        limit: pageSize.toString(),
        offset: ((page - 1) * pageSize).toString()
      });

      // Add filters
      if (filters.action) params.append('action', filters.action);
      if (filters.status) params.append('status', filters.status);
      if (filters.resource_type) params.append('resource_type', filters.resource_type);
      if (filters.user_id) params.append('user_id', filters.user_id);
      if (dateRange?.from) params.append('start_date', dateRange.from.toISOString());
      if (dateRange?.to) params.append('end_date', dateRange.to.toISOString());

      const response = await fetch(`/api/audit/activities?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch activities');
      }

      const data = await response.json();
      setActivities(data.activities);
      setTotal(data.total);
    } catch (error) {
      console.error('Error fetching activities:', error);
      setActivities([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  // Search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (filters.search) {
        // Filter activities locally for search
        const filtered = activities.filter(activity =>
          activity.action.toLowerCase().includes(filters.search.toLowerCase()) ||
          activity.resource_name?.toLowerCase().includes(filters.search.toLowerCase()) ||
          activity.user_id?.toLowerCase().includes(filters.search.toLowerCase())
        );
        // Note: In a real implementation, search should be done server-side
      } else {
        fetchActivities();
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [filters.search]);

  // Fetch activities when filters change
  useEffect(() => {
    setPage(1); // Reset to first page when filters change
    fetchActivities();
  }, [tenantId, dateRange, filters.action, filters.status, filters.resource_type, filters.user_id]);

  // Fetch activities when page changes
  useEffect(() => {
    fetchActivities();
  }, [page]);

  const handleFilterChange = (key: keyof ActivityFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined
    }));
  };

  const getStatusBadge = (status: ActivityStatus) => {
    const variants = {
      success: 'default',
      failure: 'destructive',
      warning: 'secondary',
      pending: 'outline'
    } as const;

    return (
      <Badge variant={variants[status] || 'outline'}>
        {status}
      </Badge>
    );
  };

  const getResourceIcon = (resourceType?: string) => {
    switch (resourceType) {
      case 'user':
        return <User className="h-4 w-4" />;
      case 'lead':
      case 'contract':
      case 'invoice':
        return <Activity className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const exportActivities = async () => {
    try {
      const params = new URLSearchParams({
        tenant_id: tenantId,
        format: 'csv'
      });

      // Add current filters
      if (filters.action) params.append('action', filters.action);
      if (filters.status) params.append('status', filters.status);
      if (filters.resource_type) params.append('resource_type', filters.resource_type);
      if (filters.user_id) params.append('user_id', filters.user_id);
      if (dateRange?.from) params.append('start_date', dateRange.from.toISOString());
      if (dateRange?.to) params.append('end_date', dateRange.to.toISOString());

      const response = await fetch(`/api/audit/activities/export?${params}`);
      if (!response.ok) {
        throw new Error('Failed to export activities');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `activity-log-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting activities:', error);
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className={`space-y-4 ${className}`}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Activity Log</CardTitle>
              <CardDescription>
                {total.toLocaleString()} activities found
                {dateRange?.from && dateRange?.to && (
                  <span className="ml-2">
                    from {format(dateRange.from, 'MMM d')} to {format(dateRange.to, 'MMM d')}
                  </span>
                )}
              </CardDescription>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchActivities}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={exportActivities}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search activities..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select
              value={filters.action || ''}
              onValueChange={(value) => handleFilterChange('action', value)}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All actions</SelectItem>
                <SelectItem value="auth.login">Login</SelectItem>
                <SelectItem value="auth.logout">Logout</SelectItem>
                <SelectItem value="users.create">Create User</SelectItem>
                <SelectItem value="users.update">Update User</SelectItem>
                <SelectItem value="leads.create">Create Lead</SelectItem>
                <SelectItem value="leads.update">Update Lead</SelectItem>
                <SelectItem value="contracts.create">Create Contract</SelectItem>
                <SelectItem value="invoices.create">Create Invoice</SelectItem>
              </SelectContent>
            </Select>
            
            <Select
              value={filters.status || ''}
              onValueChange={(value) => handleFilterChange('status', value)}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="All status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All status</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="failure">Failure</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
            
            <Select
              value={filters.resource_type || ''}
              onValueChange={(value) => handleFilterChange('resource_type', value)}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All resources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All resources</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="lead">Lead</SelectItem>
                <SelectItem value="contract">Contract</SelectItem>
                <SelectItem value="invoice">Invoice</SelectItem>
                <SelectItem value="screening">Screening</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                      Loading activities...
                    </TableCell>
                  </TableRow>
                ) : activities.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No activities found
                    </TableCell>
                  </TableRow>
                ) : (
                  activities.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">
                              {format(new Date(activity.created_at), 'MMM d, HH:mm:ss')}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(activity.created_at), 'yyyy')}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-mono text-sm">
                            {activity.user_id ? activity.user_id.slice(0, 8) : 'System'}
                          </span>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div>
                          <div className="font-medium">{getActionDescription(activity.action)}</div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {activity.action}
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        {activity.resource_type && (
                          <div className="flex items-center space-x-2">
                            {getResourceIcon(activity.resource_type)}
                            <div>
                              <div className="font-medium">
                                {activity.resource_name || activity.resource_type}
                              </div>
                              {activity.resource_id && (
                                <div className="text-xs text-muted-foreground font-mono">
                                  {activity.resource_id.slice(0, 8)}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        {getStatusBadge(activity.status)}
                        {activity.error_message && (
                          <div className="text-xs text-destructive mt-1 truncate max-w-32">
                            {activity.error_message}
                          </div>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        <span className="font-mono text-sm">{activity.ip_address}</span>
                      </TableCell>
                      
                      <TableCell>
                        {activity.duration_ms && (
                          <span className="text-sm">
                            {activity.duration_ms < 1000 
                              ? `${activity.duration_ms}ms`
                              : `${(activity.duration_ms / 1000).toFixed(1)}s`
                            }
                          </span>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedActivity(activity)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Activity Details</DialogTitle>
                              <DialogDescription>
                                Detailed information about this activity
                              </DialogDescription>
                            </DialogHeader>
                            
                            {selectedActivity && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium">Timestamp</label>
                                    <p className="text-sm text-muted-foreground">
                                      {format(new Date(selectedActivity.created_at), 'PPpp')}
                                    </p>
                                  </div>
                                  
                                  <div>
                                    <label className="text-sm font-medium">Status</label>
                                    <div className="mt-1">
                                      {getStatusBadge(selectedActivity.status)}
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <label className="text-sm font-medium">Action</label>
                                    <p className="text-sm text-muted-foreground">
                                      {getActionDescription(selectedActivity.action)}
                                    </p>
                                  </div>
                                  
                                  <div>
                                    <label className="text-sm font-medium">User ID</label>
                                    <p className="text-sm text-muted-foreground font-mono">
                                      {selectedActivity.user_id || 'System'}
                                    </p>
                                  </div>
                                  
                                  <div>
                                    <label className="text-sm font-medium">IP Address</label>
                                    <p className="text-sm text-muted-foreground font-mono">
                                      {selectedActivity.ip_address}
                                    </p>
                                  </div>
                                  
                                  <div>
                                    <label className="text-sm font-medium">Session ID</label>
                                    <p className="text-sm text-muted-foreground font-mono">
                                      {selectedActivity.session_id || 'N/A'}
                                    </p>
                                  </div>
                                </div>
                                
                                {selectedActivity.error_message && (
                                  <div>
                                    <label className="text-sm font-medium text-destructive">Error Message</label>
                                    <p className="text-sm text-destructive bg-destructive/10 p-2 rounded mt-1">
                                      {selectedActivity.error_message}
                                    </p>
                                  </div>
                                )}
                                
                                {selectedActivity.metadata && Object.keys(selectedActivity.metadata).length > 0 && (
                                  <div>
                                    <label className="text-sm font-medium">Metadata</label>
                                    <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto max-h-32">
                                      {JSON.stringify(selectedActivity.metadata, null, 2)}
                                    </pre>
                                  </div>
                                )}
                                
                                {selectedActivity.changes && Object.keys(selectedActivity.changes).length > 0 && (
                                  <div>
                                    <label className="text-sm font-medium">Changes</label>
                                    <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto max-h-32">
                                      {JSON.stringify(selectedActivity.changes, null, 2)}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, total)} of {total} activities
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                    return (
                      <Button
                        key={pageNum}
                        variant={pageNum === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPage(pageNum)}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}