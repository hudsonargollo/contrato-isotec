/**
 * WhatsApp Campaign Manager Component
 * Requirements: 5.3 - Automated lead nurturing campaigns
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Play, 
  Pause, 
  Square, 
  BarChart3, 
  Plus, 
  Edit, 
  Trash2,
  MessageSquare,
  Users,
  Clock,
  TrendingUp
} from 'lucide-react';
import { WhatsAppCampaign, WhatsAppTemplate } from '@/lib/types/whatsapp';
import { LeadStatus, PipelineStage, LeadSource } from '@/lib/types/crm';

interface CampaignManagerProps {
  tenantId: string;
}

interface CampaignFormData {
  name: string;
  description: string;
  template_id: string;
  audience: {
    lead_filters: {
      status?: LeadStatus[];
      stage_ids?: string[];
      source_ids?: string[];
      score_min?: number;
      score_max?: number;
      tags?: string[];
    };
    exclude_recent_contacts?: boolean;
    max_recipients?: number;
  };
  schedule?: {
    type: 'immediate' | 'scheduled';
    scheduled_at?: Date;
  };
  is_automated?: boolean;
}

export default function CampaignManager({ tenantId }: CampaignManagerProps) {
  const [campaigns, setCampaigns] = useState<WhatsAppCampaign[]>([]);
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [sources, setSources] = useState<LeadSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<WhatsAppCampaign | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showMetricsDialog, setShowMetricsDialog] = useState(false);
  const [campaignMetrics, setCampaignMetrics] = useState<any>(null);

  const [formData, setFormData] = useState<CampaignFormData>({
    name: '',
    description: '',
    template_id: '',
    audience: {
      lead_filters: {},
      exclude_recent_contacts: true,
      max_recipients: 100
    },
    schedule: {
      type: 'immediate'
    },
    is_automated: false
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load campaigns
      const campaignsResponse = await fetch('/api/whatsapp/campaigns');
      if (campaignsResponse.ok) {
        const campaignsData = await campaignsResponse.json();
        setCampaigns(campaignsData.campaigns || []);
      }

      // Load templates
      const templatesResponse = await fetch('/api/whatsapp/templates?status=APPROVED');
      if (templatesResponse.ok) {
        const templatesData = await templatesResponse.json();
        setTemplates(templatesData.templates || []);
      }

      // Load pipeline stages
      const stagesResponse = await fetch('/api/crm/pipeline-stages');
      if (stagesResponse.ok) {
        const stagesData = await stagesResponse.json();
        setStages(stagesData.stages || []);
      }

      // Load lead sources
      const sourcesResponse = await fetch('/api/crm/lead-sources');
      if (sourcesResponse.ok) {
        const sourcesData = await sourcesResponse.json();
        setSources(sourcesData.sources || []);
      }

    } catch (error) {
      console.error('Failed to load data:', error);
      setError('Failed to load campaign data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampaign = async () => {
    try {
      const response = await fetch('/api/whatsapp/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        setCampaigns([data.campaign, ...campaigns]);
        setShowCreateDialog(false);
        resetForm();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create campaign');
      }
    } catch (error) {
      console.error('Failed to create campaign:', error);
      setError('Failed to create campaign');
    }
  };

  const handleStartCampaign = async (campaignId: string) => {
    try {
      const response = await fetch(`/api/whatsapp/campaigns/${campaignId}/start`, {
        method: 'POST',
      });

      if (response.ok) {
        await loadData(); // Refresh campaigns
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to start campaign');
      }
    } catch (error) {
      console.error('Failed to start campaign:', error);
      setError('Failed to start campaign');
    }
  };

  const handlePauseCampaign = async (campaignId: string) => {
    try {
      const response = await fetch(`/api/whatsapp/campaigns/${campaignId}/pause`, {
        method: 'POST',
      });

      if (response.ok) {
        await loadData(); // Refresh campaigns
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to pause campaign');
      }
    } catch (error) {
      console.error('Failed to pause campaign:', error);
      setError('Failed to pause campaign');
    }
  };

  const handleResumeCampaign = async (campaignId: string) => {
    try {
      const response = await fetch(`/api/whatsapp/campaigns/${campaignId}/resume`, {
        method: 'POST',
      });

      if (response.ok) {
        await loadData(); // Refresh campaigns
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to resume campaign');
      }
    } catch (error) {
      console.error('Failed to resume campaign:', error);
      setError('Failed to resume campaign');
    }
  };

  const handleViewMetrics = async (campaign: WhatsAppCampaign) => {
    try {
      const response = await fetch(`/api/whatsapp/campaigns/${campaign.id}/metrics`);
      if (response.ok) {
        const data = await response.json();
        setCampaignMetrics(data.metrics);
        setSelectedCampaign(campaign);
        setShowMetricsDialog(true);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to load metrics');
      }
    } catch (error) {
      console.error('Failed to load metrics:', error);
      setError('Failed to load metrics');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      template_id: '',
      audience: {
        lead_filters: {},
        exclude_recent_contacts: true,
        max_recipients: 100
      },
      schedule: {
        type: 'immediate'
      },
      is_automated: false
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Campaign Manager</h2>
          <p className="text-gray-600">Create and manage automated lead nurturing campaigns</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Campaign</DialogTitle>
              <DialogDescription>
                Set up an automated lead nurturing campaign
              </DialogDescription>
            </DialogHeader>
            
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="audience">Audience</TabsTrigger>
                <TabsTrigger value="schedule">Schedule</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Campaign Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter campaign name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the campaign purpose"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="template">WhatsApp Template</Label>
                  <Select
                    value={formData.template_id}
                    onValueChange={(value) => setFormData({ ...formData, template_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name} ({template.category})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>
              
              <TabsContent value="audience" className="space-y-4">
                <div className="space-y-2">
                  <Label>Lead Status</Label>
                  <Select
                    value={formData.audience.lead_filters.status?.[0] || ''}
                    onValueChange={(value) => setFormData({
                      ...formData,
                      audience: {
                        ...formData.audience,
                        lead_filters: {
                          ...formData.audience.lead_filters,
                          status: value ? [value as LeadStatus] : undefined
                        }
                      }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select lead status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="qualified">Qualified</SelectItem>
                      <SelectItem value="proposal">Proposal</SelectItem>
                      <SelectItem value="negotiation">Negotiation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Pipeline Stage</Label>
                  <Select
                    value={formData.audience.lead_filters.stage_ids?.[0] || ''}
                    onValueChange={(value) => setFormData({
                      ...formData,
                      audience: {
                        ...formData.audience,
                        lead_filters: {
                          ...formData.audience.lead_filters,
                          stage_ids: value ? [value] : undefined
                        }
                      }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select pipeline stage" />
                    </SelectTrigger>
                    <SelectContent>
                      {stages.map((stage) => (
                        <SelectItem key={stage.id} value={stage.id}>
                          {stage.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="maxRecipients">Max Recipients</Label>
                  <Input
                    id="maxRecipients"
                    type="number"
                    value={formData.audience.max_recipients}
                    onChange={(e) => setFormData({
                      ...formData,
                      audience: {
                        ...formData.audience,
                        max_recipients: parseInt(e.target.value) || 100
                      }
                    })}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="schedule" className="space-y-4">
                <div className="space-y-2">
                  <Label>Schedule Type</Label>
                  <Select
                    value={formData.schedule?.type || 'immediate'}
                    onValueChange={(value) => setFormData({
                      ...formData,
                      schedule: {
                        ...formData.schedule,
                        type: value as 'immediate' | 'scheduled'
                      }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Send Immediately</SelectItem>
                      <SelectItem value="scheduled">Schedule for Later</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {formData.schedule?.type === 'scheduled' && (
                  <div className="space-y-2">
                    <Label htmlFor="scheduledAt">Scheduled Date & Time</Label>
                    <Input
                      id="scheduledAt"
                      type="datetime-local"
                      onChange={(e) => setFormData({
                        ...formData,
                        schedule: {
                          ...formData.schedule,
                          scheduled_at: new Date(e.target.value)
                        }
                      })}
                    />
                  </div>
                )}
              </TabsContent>
            </Tabs>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateCampaign} disabled={!formData.name || !formData.template_id}>
                Create Campaign
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Campaigns List */}
      <div className="grid gap-4">
        {campaigns.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MessageSquare className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns yet</h3>
              <p className="text-gray-600 text-center mb-4">
                Create your first automated lead nurturing campaign to start engaging with your leads.
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Campaign
              </Button>
            </CardContent>
          </Card>
        ) : (
          campaigns.map((campaign) => (
            <Card key={campaign.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {campaign.name}
                      <Badge className={getStatusColor(campaign.status)}>
                        {campaign.status}
                      </Badge>
                    </CardTitle>
                    <CardDescription>{campaign.description}</CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    {campaign.status === 'draft' && (
                      <Button
                        size="sm"
                        onClick={() => handleStartCampaign(campaign.id)}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Start
                      </Button>
                    )}
                    {campaign.status === 'active' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePauseCampaign(campaign.id)}
                      >
                        <Pause className="h-4 w-4 mr-1" />
                        Pause
                      </Button>
                    )}
                    {campaign.status === 'paused' && (
                      <Button
                        size="sm"
                        onClick={() => handleResumeCampaign(campaign.id)}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Resume
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewMetrics(campaign)}
                    >
                      <BarChart3 className="h-4 w-4 mr-1" />
                      Metrics
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{campaign.total_recipients} recipients</span>
                  </div>
                  <div className="flex items-center">
                    <MessageSquare className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{campaign.messages_sent} sent</span>
                  </div>
                  <div className="flex items-center">
                    <TrendingUp className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{campaign.messages_delivered} delivered</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-gray-400" />
                    <span>
                      {campaign.created_at ? new Date(campaign.created_at).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Metrics Dialog */}
      <Dialog open={showMetricsDialog} onOpenChange={setShowMetricsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Campaign Metrics</DialogTitle>
            <DialogDescription>
              Performance metrics for {selectedCampaign?.name}
            </DialogDescription>
          </DialogHeader>
          
          {campaignMetrics && (
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Recipients</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{campaignMetrics.total_recipients}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Messages Sent</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{campaignMetrics.messages_sent}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{campaignMetrics.delivery_rate}%</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Read Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{campaignMetrics.read_rate}%</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{campaignMetrics.engagement_rate}%</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Cost per Message</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${campaignMetrics.cost_per_message}</div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}