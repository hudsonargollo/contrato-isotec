/**
 * Security Events Table Component
 * 
 * Displays security events in a filterable table with incident management capabilities.
 * Supports event resolution, severity filtering, and detailed event inspection.
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
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  Shield, 
  AlertTriangle, 
  Eye, 
  CheckCircle, 
  XCircle,
  Clock,
  RefreshCw,
  Filter,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { 
  SecurityEvent, 
  SecurityEventType, 
  SecuritySeverity, 
  SecurityStatus,
  UpdateSecurityEvent 
} from '@/lib/types/audit';

interface SecurityEventsTableProps {
  tenantId: string;
  dateRange?: DateRange;
  className?: string;
}

interface SecurityFilters {
  search: string;
  event_type?: SecurityEventType;
  severity?: SecuritySeverity;
  status?: SecurityStatus;
}

export function SecurityEventsTable({ 
  tenantId, 
  dateRange, 
  className 
}: SecurityEventsTableProps) {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [filters, setFilters] = useState<SecurityFilters>({
    search: ''
  });
  const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  // Fetch security events
  const fetchEvents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        tenant_id: tenantId,
        limit: pageSize.toString(),
        offset: ((page - 1) * pageSize).toString()
      });

      // Add filters
      if (filters.event_type) params.append('event_type', filters.event_type);
      if (filters.severity) params.append('severity', filters.severity);
      if (filters.status) params.append('status', filters.status);
      if (dateRange?.from) params.append('start_date', dateRange.from.toISOString());
      if (dateRange?.to) params.append('end_date', dateRange.to.toISOString());

      const response = await fetch(`/api/audit/security-events?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch security events');
      }

      const data = await response.json();
      setEvents(data.events);
      setTotal(data.total);
    } catch (error) {
      console.error('Error fetching security events:', error);
      setEvents([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  // Update security event
  const updateEvent = async (eventId: string, updates: UpdateSecurityEvent) => {
    try {
      setUpdating(true);
      const response = await fetch('/api/audit/security-events', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId,
          ...updates
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update security event');
      }

      // Refresh events
      await fetchEvents();
      setSelectedEvent(null);
      setResolutionNotes('');
    } catch (error) {
      console.error('Error updating security event:', error);
    } finally {
      setUpdating(false);
    }
  };

  // Fetch events when filters change
  useEffect(() => {
    setPage(1);
    fetchEvents();
  }, [tenantId, dateRange, filters.event_type, filters.severity, filters.status]);

  // Fetch events when page changes
  useEffect(() => {
    fetchEvents();
  }, [page]);

  const handleFilterChange = (key: keyof SecurityFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined
    }));
  };

  const getSeverityBadge = (severity: SecuritySeverity) => {
    const variants = {
      low: 'secondary',
      medium: 'default',
      high: 'destructive',
      critical: 'destructive'
    } as const;

    const colors = {
      low: 'bg-blue-100 text-blue-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    };

    return (
      <Badge variant={variants[severity]} className={colors[severity]}>
        {severity.toUpperCase()}
      </Badge>
    );
  };

  const getStatusBadge = (status: SecurityStatus) => {
    const variants = {
      open: 'destructive',
      investigating: 'secondary',
      resolved: 'default',
      false_positive: 'outline'
    } as const;

    const icons = {
      open: <AlertTriangle className="h-3 w-3 mr-1" />,
      investigating: <Clock className="h-3 w-3 mr-1" />,
      resolved: <CheckCircle className="h-3 w-3 mr-1" />,
      false_positive: <XCircle className="h-3 w-3 mr-1" />
    };

    return (
      <Badge variant={variants[status]} className="flex items-center">
        {icons[status]}
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const getEventTypeIcon = (eventType: SecurityEventType) => {
    switch (eventType) {
      case 'failed_login':
      case 'brute_force_attack':
        return <Shield className="h-4 w-4 text-red-500" />;
      case 'suspicious_activity':
      case 'unusual_access_pattern':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'permission_violation':
      case 'unauthorized_access':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Shield className="h-4 w-4 text-gray-500" />;
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className={`space-y-4 ${className}`}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Security Events
              </CardTitle>
              <CardDescription>
                {total.toLocaleString()} security events found
                {dateRange?.from && dateRange?.to && (
                  <span className="ml-2">
                    from {format(dateRange.from, 'MMM d')} to {format(dateRange.to, 'MMM d')}
                  </span>
                )}
              </CardDescription>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={fetchEvents}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search events..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select
              value={filters.event_type || ''}
              onValueChange={(value) => handleFilterChange('event_type', value)}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All event types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All event types</SelectItem>
                <SelectItem value="failed_login">Failed Login</SelectItem>
                <SelectItem value="suspicious_activity">Suspicious Activity</SelectItem>
                <SelectItem value="permission_violation">Permission Violation</SelectItem>
                <SelectItem value="unauthorized_access">Unauthorized Access</SelectItem>
                <SelectItem value="brute_force_attack">Brute Force Attack</SelectItem>
                <SelectItem value="unusual_access_pattern">Unusual Access Pattern</SelectItem>
              </SelectContent>
            </Select>
            
            <Select
              value={filters.severity || ''}
              onValueChange={(value) => handleFilterChange('severity', value)}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="All severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All severity</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
            
            <Select
              value={filters.status || ''}
              onValueChange={(value) => handleFilterChange('status', value)}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="investigating">Investigating</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="false_positive">False Positive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Event Type</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                      Loading security events...
                    </TableCell>
                  </TableRow>
                ) : events.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No security events found
                    </TableCell>
                  </TableRow>
                ) : (
                  events.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell>
                        <div className="font-medium">
                          {format(new Date(event.created_at), 'MMM d, HH:mm:ss')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(event.created_at), 'yyyy')}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getEventTypeIcon(event.event_type)}
                          <span className="font-medium">
                            {event.event_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        {getSeverityBadge(event.severity)}
                      </TableCell>
                      
                      <TableCell>
                        <div className="max-w-md">
                          <p className="truncate">{event.description}</p>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <span className="font-mono text-sm">
                          {event.user_id ? event.user_id.slice(0, 8) : 'Unknown'}
                        </span>
                      </TableCell>
                      
                      <TableCell>
                        <span className="font-mono text-sm">
                          {event.ip_address || 'N/A'}
                        </span>
                      </TableCell>
                      
                      <TableCell>
                        {getStatusBadge(event.status)}
                        {event.resolved_at && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Resolved {format(new Date(event.resolved_at), 'MMM d')}
                          </div>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedEvent(event)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle className="flex items-center">
                                {getEventTypeIcon(event.event_type)}
                                <span className="ml-2">Security Event Details</span>
                              </DialogTitle>
                              <DialogDescription>
                                Event ID: {event.id}
                              </DialogDescription>
                            </DialogHeader>
                            
                            {selectedEvent && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium">Timestamp</label>
                                    <p className="text-sm text-muted-foreground">
                                      {format(new Date(selectedEvent.created_at), 'PPpp')}
                                    </p>
                                  </div>
                                  
                                  <div>
                                    <label className="text-sm font-medium">Severity</label>
                                    <div className="mt-1">
                                      {getSeverityBadge(selectedEvent.severity)}
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <label className="text-sm font-medium">Event Type</label>
                                    <p className="text-sm text-muted-foreground">
                                      {selectedEvent.event_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                    </p>
                                  </div>
                                  
                                  <div>
                                    <label className="text-sm font-medium">Status</label>
                                    <div className="mt-1">
                                      {getStatusBadge(selectedEvent.status)}
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <label className="text-sm font-medium">User ID</label>
                                    <p className="text-sm text-muted-foreground font-mono">
                                      {selectedEvent.user_id || 'Unknown'}
                                    </p>
                                  </div>
                                  
                                  <div>
                                    <label className="text-sm font-medium">IP Address</label>
                                    <p className="text-sm text-muted-foreground font-mono">
                                      {selectedEvent.ip_address || 'N/A'}
                                    </p>
                                  </div>
                                </div>
                                
                                <div>
                                  <label className="text-sm font-medium">Description</label>
                                  <p className="text-sm text-muted-foreground bg-muted p-2 rounded mt-1">
                                    {selectedEvent.description}
                                  </p>
                                </div>
                                
                                {selectedEvent.metadata && Object.keys(selectedEvent.metadata).length > 0 && (
                                  <div>
                                    <label className="text-sm font-medium">Metadata</label>
                                    <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto max-h-32">
                                      {JSON.stringify(selectedEvent.metadata, null, 2)}
                                    </pre>
                                  </div>
                                )}
                                
                                {selectedEvent.resolution_notes && (
                                  <div>
                                    <label className="text-sm font-medium">Resolution Notes</label>
                                    <p className="text-sm text-muted-foreground bg-muted p-2 rounded mt-1">
                                      {selectedEvent.resolution_notes}
                                    </p>
                                  </div>
                                )}
                                
                                {selectedEvent.status === 'open' && (
                                  <div className="space-y-3 pt-4 border-t">
                                    <div>
                                      <label className="text-sm font-medium">Resolution Notes</label>
                                      <Textarea
                                        placeholder="Add resolution notes..."
                                        value={resolutionNotes}
                                        onChange={(e) => setResolutionNotes(e.target.value)}
                                        className="mt-1"
                                      />
                                    </div>
                                    
                                    <div className="flex space-x-2">
                                      <Button
                                        size="sm"
                                        onClick={() => updateEvent(selectedEvent.id, {
                                          status: 'investigating'
                                        })}
                                        disabled={updating}
                                      >
                                        Mark as Investigating
                                      </Button>
                                      
                                      <Button
                                        size="sm"
                                        onClick={() => updateEvent(selectedEvent.id, {
                                          status: 'resolved',
                                          resolution_notes: resolutionNotes || 'Resolved'
                                        })}
                                        disabled={updating}
                                      >
                                        Mark as Resolved
                                      </Button>
                                      
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => updateEvent(selectedEvent.id, {
                                          status: 'false_positive',
                                          resolution_notes: resolutionNotes || 'False positive'
                                        })}
                                        disabled={updating}
                                      >
                                        Mark as False Positive
                                      </Button>
                                    </div>
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
                Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, total)} of {total} events
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