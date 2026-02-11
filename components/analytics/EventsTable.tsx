/**
 * Events Table Component
 * Requirements: 6.1 - Analytics data collection system
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Search, 
  Filter, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight,
  Eye,
  Calendar
} from 'lucide-react';
import type { AnalyticsEvent } from '@/lib/types/analytics';

interface EventsTableProps {
  tenantId?: string;
}

export function EventsTable({ tenantId }: EventsTableProps) {
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedEvent, setSelectedEvent] = useState<AnalyticsEvent | null>(null);

  const pageSize = 50;

  useEffect(() => {
    loadEvents();
  }, [currentPage, categoryFilter, actionFilter, searchTerm]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
      });

      if (categoryFilter !== 'all') {
        params.append('category', categoryFilter);
      }

      if (actionFilter !== 'all') {
        params.append('action', actionFilter);
      }

      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const response = await fetch(`/api/analytics/events?${params}`);
      if (!response.ok) {
        throw new Error('Failed to load events');
      }

      const data = await response.json();
      setEvents(data.events || []);
      setTotalPages(Math.ceil((data.total || 0) / pageSize));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadEvents();
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleCategoryFilter = (value: string) => {
    setCategoryFilter(value);
    setCurrentPage(1);
  };

  const handleActionFilter = (value: string) => {
    setActionFilter(value);
    setCurrentPage(1);
  };

  const formatTimestamp = (timestamp: Date) => {
    return new Date(timestamp).toLocaleString();
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      crm: 'bg-blue-100 text-blue-800',
      whatsapp: 'bg-green-100 text-green-800',
      invoice: 'bg-purple-100 text-purple-800',
      contract: 'bg-orange-100 text-orange-800',
      user: 'bg-gray-100 text-gray-800',
      system: 'bg-red-100 text-red-800',
      screening: 'bg-yellow-100 text-yellow-800',
      campaign: 'bg-pink-100 text-pink-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      create: 'bg-green-100 text-green-800',
      update: 'bg-blue-100 text-blue-800',
      delete: 'bg-red-100 text-red-800',
      view: 'bg-gray-100 text-gray-800',
      send: 'bg-purple-100 text-purple-800',
      receive: 'bg-orange-100 text-orange-800',
      approve: 'bg-green-100 text-green-800',
      reject: 'bg-red-100 text-red-800',
      complete: 'bg-blue-100 text-blue-800',
    };
    return colors[action] || 'bg-gray-100 text-gray-800';
  };

  if (loading && events.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Analytics Events</CardTitle>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={categoryFilter} onValueChange={handleCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="crm">CRM</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="invoice">Invoice</SelectItem>
                <SelectItem value="contract">Contract</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="screening">Screening</SelectItem>
                <SelectItem value="campaign">Campaign</SelectItem>
              </SelectContent>
            </Select>

            <Select value={actionFilter} onValueChange={handleActionFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="create">Create</SelectItem>
                <SelectItem value="update">Update</SelectItem>
                <SelectItem value="delete">Delete</SelectItem>
                <SelectItem value="view">View</SelectItem>
                <SelectItem value="send">Send</SelectItem>
                <SelectItem value="receive">Receive</SelectItem>
                <SelectItem value="approve">Approve</SelectItem>
                <SelectItem value="reject">Reject</SelectItem>
                <SelectItem value="complete">Complete</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      No events found
                    </TableCell>
                  </TableRow>
                ) : (
                  events.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell className="font-mono text-sm">
                        {formatTimestamp(event.created_at)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {event.event_name}
                      </TableCell>
                      <TableCell>
                        <Badge className={getCategoryColor(event.event_category)}>
                          {event.event_category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getActionColor(event.event_action)}>
                          {event.event_action}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {event.entity_type && (
                          <div className="text-sm">
                            <div className="font-medium">{event.entity_type}</div>
                            {event.entity_id && (
                              <div className="text-muted-foreground font-mono text-xs">
                                {event.entity_id.slice(0, 8)}...
                              </div>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {event.user_id && (
                          <div className="font-mono text-xs">
                            {event.user_id.slice(0, 8)}...
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedEvent(event)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
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
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Event Details Modal */}
      {selectedEvent && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Event Details
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedEvent(null)}
              >
                ×
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Basic Information</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Event:</span> {selectedEvent.event_name}
                  </div>
                  <div>
                    <span className="font-medium">Category:</span>{' '}
                    <Badge className={getCategoryColor(selectedEvent.event_category)}>
                      {selectedEvent.event_category}
                    </Badge>
                  </div>
                  <div>
                    <span className="font-medium">Action:</span>{' '}
                    <Badge className={getActionColor(selectedEvent.event_action)}>
                      {selectedEvent.event_action}
                    </Badge>
                  </div>
                  <div>
                    <span className="font-medium">Timestamp:</span>{' '}
                    {formatTimestamp(selectedEvent.created_at)}
                  </div>
                  {selectedEvent.entity_type && (
                    <div>
                      <span className="font-medium">Entity:</span>{' '}
                      {selectedEvent.entity_type}
                      {selectedEvent.entity_id && (
                        <div className="font-mono text-xs text-muted-foreground">
                          {selectedEvent.entity_id}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Session Information</h4>
                <div className="space-y-2 text-sm">
                  {selectedEvent.user_id && (
                    <div>
                      <span className="font-medium">User ID:</span>{' '}
                      <span className="font-mono">{selectedEvent.user_id}</span>
                    </div>
                  )}
                  {selectedEvent.session_id && (
                    <div>
                      <span className="font-medium">Session:</span>{' '}
                      <span className="font-mono">{selectedEvent.session_id}</span>
                    </div>
                  )}
                  {selectedEvent.ip_address && (
                    <div>
                      <span className="font-medium">IP Address:</span>{' '}
                      <span className="font-mono">{selectedEvent.ip_address}</span>
                    </div>
                  )}
                  {selectedEvent.user_agent && (
                    <div>
                      <span className="font-medium">User Agent:</span>{' '}
                      <span className="text-xs">{selectedEvent.user_agent}</span>
                    </div>
                  )}
                </div>
              </div>

              {Object.keys(selectedEvent.properties || {}).length > 0 && (
                <div className="md:col-span-2">
                  <h4 className="font-semibold mb-2">Properties</h4>
                  <pre className="bg-gray-50 p-3 rounded text-xs overflow-auto">
                    {JSON.stringify(selectedEvent.properties, null, 2)}
                  </pre>
                </div>
              )}

              {Object.keys(selectedEvent.metadata || {}).length > 0 && (
                <div className="md:col-span-2">
                  <h4 className="font-semibold mb-2">Metadata</h4>
                  <pre className="bg-gray-50 p-3 rounded text-xs overflow-auto">
                    {JSON.stringify(selectedEvent.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}