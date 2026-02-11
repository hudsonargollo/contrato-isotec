/**
 * Lead Management Component
 * Main component for lead management with all CRM features
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5 - Enhanced CRM Pipeline Management
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Search, 
  Filter, 
  Users, 
  Phone, 
  Mail, 
  Building, 
  Calendar,
  Star,
  Edit,
  MoreHorizontal,
  ArrowUpDown
} from 'lucide-react';
import { InteractionTimeline } from './InteractionTimeline';
import { LeadQualification } from './LeadQualification';
import type { 
  Lead, 
  CreateLeadRequest, 
  LeadFilters, 
  LeadSortOptions, 
  PaginatedLeads,
  LeadSource,
  PipelineStage,
  LeadScoringRule
} from '@/lib/types/crm';

interface LeadManagementProps {
  tenantId: string;
}

interface LeadFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  company: string;
  source_id: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  notes: string;
}

export function LeadManagement({ tenantId }: LeadManagementProps) {
  const [leads, setLeads] = useState<PaginatedLeads | null>(null);
  const [leadSources, setLeadSources] = useState<LeadSource[]>([]);
  const [pipelineStages, setPipelineStages] = useState<PipelineStage[]>([]);
  const [scoringRules, setScoringRules] = useState<LeadScoringRule[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<LeadFilters>({});
  const [sort, setSort] = useState<LeadSortOptions>({ field: 'created_at', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState<LeadFormData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company: '',
    source_id: '',
    priority: 'medium',
    notes: ''
  });

  useEffect(() => {
    fetchLeads();
    fetchLeadSources();
    fetchPipelineStages();
    fetchScoringRules();
  }, [tenantId, filters, sort, currentPage]);

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchQuery !== (filters.search_query || '')) {
        setFilters(prev => ({ ...prev, search_query: searchQuery || undefined }));
        setCurrentPage(1);
      }
    }, 500);

    return () => clearTimeout(delayedSearch);
  }, [searchQuery]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      // Add filters
      if (filters.status?.length) params.set('status', filters.status.join(','));
      if (filters.stage_id?.length) params.set('stage_id', filters.stage_id.join(','));
      if (filters.source_id?.length) params.set('source_id', filters.source_id.join(','));
      if (filters.priority?.length) params.set('priority', filters.priority.join(','));
      if (filters.search_query) params.set('search_query', filters.search_query);
      
      // Add sorting
      params.set('sort_field', sort.field);
      params.set('sort_direction', sort.direction);
      
      // Add pagination
      params.set('page', currentPage.toString());
      params.set('limit', '20');

      const response = await fetch(`/api/crm/leads?${params.toString()}`, {
        headers: {
          'x-tenant-id': tenantId
        }
      });

      if (response.ok) {
        const data = await response.json();
        setLeads(data);
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeadSources = async () => {
    try {
      const response = await fetch('/api/crm/lead-sources', {
        headers: { 'x-tenant-id': tenantId }
      });
      if (response.ok) {
        const data = await response.json();
        setLeadSources(data);
      }
    } catch (error) {
      console.error('Error fetching lead sources:', error);
    }
  };

  const fetchPipelineStages = async () => {
    try {
      const response = await fetch('/api/crm/pipeline-stages', {
        headers: { 'x-tenant-id': tenantId }
      });
      if (response.ok) {
        const data = await response.json();
        setPipelineStages(data);
      }
    } catch (error) {
      console.error('Error fetching pipeline stages:', error);
    }
  };

  const fetchScoringRules = async () => {
    try {
      const response = await fetch('/api/crm/scoring-rules', {
        headers: { 'x-tenant-id': tenantId }
      });
      if (response.ok) {
        const data = await response.json();
        setScoringRules(data);
      }
    } catch (error) {
      console.error('Error fetching scoring rules:', error);
    }
  };

  const handleCreateLead = async () => {
    try {
      const leadData: CreateLeadRequest = formData;

      const response = await fetch('/api/crm/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenantId
        },
        body: JSON.stringify(leadData)
      });

      if (response.ok) {
        await fetchLeads();
        setShowAddForm(false);
        resetForm();
      }
    } catch (error) {
      console.error('Error creating lead:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      company: '',
      source_id: '',
      priority: 'medium',
      notes: ''
    });
  };

  const handleQualifyLead = async (leadId: string, notes?: string) => {
    try {
      const response = await fetch(`/api/crm/leads/${leadId}/qualify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenantId
        },
        body: JSON.stringify({ notes })
      });

      if (response.ok) {
        await fetchLeads();
        if (selectedLead?.id === leadId) {
          const updatedLead = await response.json();
          setSelectedLead(updatedLead);
        }
      }
    } catch (error) {
      console.error('Error qualifying lead:', error);
    }
  };

  const handleDisqualifyLead = async (leadId: string, reason?: string) => {
    try {
      const response = await fetch(`/api/crm/leads/${leadId}/disqualify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenantId
        },
        body: JSON.stringify({ reason })
      });

      if (response.ok) {
        await fetchLeads();
        if (selectedLead?.id === leadId) {
          const updatedLead = await response.json();
          setSelectedLead(updatedLead);
        }
      }
    } catch (error) {
      console.error('Error disqualifying lead:', error);
    }
  };

  const handleRecalculateScore = async (leadId: string) => {
    try {
      const response = await fetch(`/api/crm/leads/${leadId}/score`, {
        method: 'POST',
        headers: {
          'x-tenant-id': tenantId
        }
      });

      if (response.ok) {
        const { lead } = await response.json();
        await fetchLeads();
        if (selectedLead?.id === leadId) {
          setSelectedLead(lead);
        }
      }
    } catch (error) {
      console.error('Error recalculating score:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  if (loading && !leads) {
    return <div className="p-4">Loading leads...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Lead Management</h2>
          <p className="text-gray-600">
            {leads?.total || 0} total leads • {leads?.leads.filter(l => l.status === 'new').length || 0} new
          </p>
        </div>
        <Button onClick={() => setShowAddForm(true)} disabled={showAddForm}>
          <Plus className="h-4 w-4 mr-2" />
          Add Lead
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="p-4">
        <div className="flex gap-4 items-center">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search leads by name, email, or company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select
            value={filters.source_id?.[0] || 'all'}
            onValueChange={(value) => setFilters(prev => ({ 
              ...prev, 
              source_id: value === 'all' ? undefined : [value] 
            }))}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              {leadSources.map((source) => (
                <SelectItem key={source.id} value={source.id}>
                  {source.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.stage_id?.[0] || 'all'}
            onValueChange={(value) => setFilters(prev => ({ 
              ...prev, 
              stage_id: value === 'all' ? undefined : [value] 
            }))}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Stage" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stages</SelectItem>
              {pipelineStages.map((stage) => (
                <SelectItem key={stage.id} value={stage.id}>
                  {stage.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Add Lead Form */}
      {showAddForm && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Add New Lead</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first-name">First Name *</Label>
              <Input
                id="first-name"
                value={formData.first_name}
                onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                placeholder="Enter first name"
              />
            </div>
            <div>
              <Label htmlFor="last-name">Last Name *</Label>
              <Input
                id="last-name"
                value={formData.last_name}
                onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                placeholder="Enter last name"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter email address"
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Enter phone number"
              />
            </div>
            <div>
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                placeholder="Enter company name"
              />
            </div>
            <div>
              <Label htmlFor="source">Lead Source</Label>
              <Select
                value={formData.source_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, source_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  {leadSources.map((source) => (
                    <SelectItem key={source.id} value={source.id}>
                      {source.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button
              onClick={handleCreateLead}
              disabled={!formData.first_name.trim() || !formData.last_name.trim()}
            >
              Create Lead
            </Button>
            <Button variant="outline" onClick={() => { setShowAddForm(false); resetForm(); }}>
              Cancel
            </Button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leads List */}
        <div className="lg:col-span-2 space-y-4">
          {leads?.leads.map((lead) => (
            <Card 
              key={lead.id} 
              className={`p-4 cursor-pointer transition-colors ${
                selectedLead?.id === lead.id ? 'ring-2 ring-blue-500' : 'hover:bg-gray-50'
              }`}
              onClick={() => setSelectedLead(lead)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${getPriorityColor(lead.priority)}`} />
                  <div>
                    <h4 className="font-medium">
                      {lead.first_name} {lead.last_name}
                    </h4>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      {lead.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {lead.email}
                        </div>
                      )}
                      {lead.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {lead.phone}
                        </div>
                      )}
                      {lead.company && (
                        <div className="flex items-center gap-1">
                          <Building className="h-3 w-3" />
                          {lead.company}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={getScoreColor(lead.score)}>
                    <Star className="h-3 w-3 mr-1" />
                    {lead.score}
                  </Badge>
                  <Badge variant="secondary" className="capitalize">
                    {lead.status.replace('_', ' ')}
                  </Badge>
                  {lead.stage && (
                    <Badge variant="outline">
                      {lead.stage.name}
                    </Badge>
                  )}
                </div>
              </div>
            </Card>
          ))}

          {leads?.leads.length === 0 && (
            <Card className="p-8 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No leads found</p>
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Lead
              </Button>
            </Card>
          )}
        </div>

        {/* Lead Details */}
        <div className="space-y-4">
          {selectedLead ? (
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="qualification">Scoring</TabsTrigger>
                <TabsTrigger value="interactions">Timeline</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="space-y-4">
                <Card className="p-4">
                  <h3 className="font-semibold mb-3">Lead Information</h3>
                  <div className="space-y-2 text-sm">
                    <div><strong>Name:</strong> {selectedLead.first_name} {selectedLead.last_name}</div>
                    {selectedLead.email && <div><strong>Email:</strong> {selectedLead.email}</div>}
                    {selectedLead.phone && <div><strong>Phone:</strong> {selectedLead.phone}</div>}
                    {selectedLead.company && <div><strong>Company:</strong> {selectedLead.company}</div>}
                    <div><strong>Status:</strong> <Badge variant="secondary" className="capitalize">{selectedLead.status.replace('_', ' ')}</Badge></div>
                    <div><strong>Priority:</strong> <Badge className={getPriorityColor(selectedLead.priority) + ' text-white'}>{selectedLead.priority}</Badge></div>
                    {selectedLead.source && <div><strong>Source:</strong> {selectedLead.source.name}</div>}
                    {selectedLead.stage && <div><strong>Stage:</strong> {selectedLead.stage.name}</div>}
                    {selectedLead.notes && <div><strong>Notes:</strong> {selectedLead.notes}</div>}
                  </div>
                </Card>
              </TabsContent>
              
              <TabsContent value="qualification">
                <LeadQualification
                  lead={selectedLead}
                  scoringRules={scoringRules}
                  onQualify={handleQualifyLead}
                  onDisqualify={handleDisqualifyLead}
                  onRecalculateScore={handleRecalculateScore}
                />
              </TabsContent>
              
              <TabsContent value="interactions">
                <InteractionTimeline
                  leadId={selectedLead.id}
                  tenantId={tenantId}
                />
              </TabsContent>
            </Tabs>
          ) : (
            <Card className="p-8 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Select a lead to view details</p>
            </Card>
          )}
        </div>
      </div>

      {/* Pagination */}
      {leads && leads.total_pages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="flex items-center px-4">
            Page {currentPage} of {leads.total_pages}
          </span>
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.min(leads.total_pages, prev + 1))}
            disabled={currentPage === leads.total_pages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}