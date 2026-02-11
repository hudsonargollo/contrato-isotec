/**
 * Interaction Timeline Component
 * Displays chronological history of customer interactions
 * Requirements: 2.4 - Customer interaction tracking system
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, 
  Phone, 
  Mail, 
  MessageCircle, 
  Users, 
  MapPin, 
  FileText, 
  Clock,
  Send,
  ArrowUp,
  ArrowDown,
  Filter
} from 'lucide-react';
import type { 
  LeadInteraction, 
  CreateInteractionRequest, 
  InteractionType, 
  InteractionChannel,
  InteractionDirection 
} from '@/lib/types/crm';

interface InteractionTimelineProps {
  leadId: string;
  tenantId: string;
  interactions?: LeadInteraction[];
  onInteractionAdded?: (interaction: LeadInteraction) => void;
}

interface InteractionFormData {
  type_id: string;
  channel: InteractionChannel;
  subject: string;
  content: string;
  direction: InteractionDirection;
}

const CHANNEL_ICONS = {
  email: Mail,
  phone: Phone,
  whatsapp: MessageCircle,
  sms: MessageCircle,
  meeting: Users,
  manual: FileText,
  web: FileText,
  social: MessageCircle
};

const CHANNEL_COLORS = {
  email: 'bg-blue-500',
  phone: 'bg-green-500',
  whatsapp: 'bg-green-600',
  sms: 'bg-purple-500',
  meeting: 'bg-orange-500',
  manual: 'bg-gray-500',
  web: 'bg-indigo-500',
  social: 'bg-pink-500'
};

export function InteractionTimeline({ 
  leadId, 
  tenantId, 
  interactions: initialInteractions = [],
  onInteractionAdded 
}: InteractionTimelineProps) {
  const [interactions, setInteractions] = useState<LeadInteraction[]>(initialInteractions);
  const [interactionTypes, setInteractionTypes] = useState<InteractionType[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<InteractionFormData>({
    type_id: '',
    channel: 'manual',
    subject: '',
    content: '',
    direction: 'outbound'
  });
  const [filterChannel, setFilterChannel] = useState<InteractionChannel | 'all'>('all');
  const [filterDirection, setFilterDirection] = useState<InteractionDirection | 'all'>('all');

  useEffect(() => {
    if (initialInteractions.length === 0) {
      fetchInteractions();
    }
    fetchInteractionTypes();
  }, [leadId, tenantId]);

  const fetchInteractions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/crm/leads/${leadId}/interactions`, {
        headers: {
          'x-tenant-id': tenantId
        }
      });

      if (response.ok) {
        const data = await response.json();
        setInteractions(data);
      }
    } catch (error) {
      console.error('Error fetching interactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInteractionTypes = async () => {
    try {
      const response = await fetch('/api/crm/interaction-types', {
        headers: {
          'x-tenant-id': tenantId
        }
      });

      if (response.ok) {
        const data = await response.json();
        setInteractionTypes(data);
      }
    } catch (error) {
      console.error('Error fetching interaction types:', error);
    }
  };

  const handleAddInteraction = async () => {
    try {
      const interactionData: CreateInteractionRequest = {
        lead_id: leadId,
        ...formData
      };

      const response = await fetch(`/api/crm/leads/${leadId}/interactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenantId
        },
        body: JSON.stringify(interactionData)
      });

      if (response.ok) {
        const newInteraction = await response.json();
        setInteractions(prev => [newInteraction, ...prev]);
        onInteractionAdded?.(newInteraction);
        setShowAddForm(false);
        resetForm();
      }
    } catch (error) {
      console.error('Error creating interaction:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      type_id: '',
      channel: 'manual',
      subject: '',
      content: '',
      direction: 'outbound'
    });
  };

  const filteredInteractions = interactions.filter(interaction => {
    if (filterChannel !== 'all' && interaction.channel !== filterChannel) return false;
    if (filterDirection !== 'all' && interaction.direction !== filterDirection) return false;
    return true;
  });

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  const getChannelIcon = (channel: InteractionChannel) => {
    const Icon = CHANNEL_ICONS[channel] || FileText;
    return Icon;
  };

  const getChannelColor = (channel: InteractionChannel) => {
    return CHANNEL_COLORS[channel] || 'bg-gray-500';
  };

  if (loading && interactions.length === 0) {
    return <div className="p-4">Loading interactions...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Interaction Timeline</h3>
          <p className="text-sm text-gray-600">
            {filteredInteractions.length} interaction{filteredInteractions.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={() => setShowAddForm(true)} disabled={showAddForm}>
          <Plus className="h-4 w-4 mr-2" />
          Add Interaction
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <Filter className="h-4 w-4 text-gray-500" />
          <div className="flex gap-4">
            <div>
              <Label htmlFor="filter-channel" className="text-xs">Channel</Label>
              <Select
                value={filterChannel}
                onValueChange={(value: InteractionChannel | 'all') => setFilterChannel(value)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Channels</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="phone">Phone</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="filter-direction" className="text-xs">Direction</Label>
              <Select
                value={filterDirection}
                onValueChange={(value: InteractionDirection | 'all') => setFilterDirection(value)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="inbound">Inbound</SelectItem>
                  <SelectItem value="outbound">Outbound</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </Card>

      {/* Add Interaction Form */}
      {showAddForm && (
        <Card className="p-4">
          <h4 className="font-semibold mb-3">Add New Interaction</h4>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="interaction-type">Type</Label>
                <Select
                  value={formData.type_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, type_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {interactionTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="interaction-channel">Channel</Label>
                <Select
                  value={formData.channel}
                  onValueChange={(value: InteractionChannel) => setFormData(prev => ({ ...prev, channel: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="phone">Phone</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="web">Web</SelectItem>
                    <SelectItem value="social">Social</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="interaction-subject">Subject</Label>
                <Input
                  id="interaction-subject"
                  value={formData.subject}
                  onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Interaction subject"
                />
              </div>

              <div>
                <Label htmlFor="interaction-direction">Direction</Label>
                <Select
                  value={formData.direction}
                  onValueChange={(value: InteractionDirection) => setFormData(prev => ({ ...prev, direction: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="outbound">
                      <div className="flex items-center gap-2">
                        <ArrowUp className="h-4 w-4" />
                        Outbound
                      </div>
                    </SelectItem>
                    <SelectItem value="inbound">
                      <div className="flex items-center gap-2">
                        <ArrowDown className="h-4 w-4" />
                        Inbound
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="interaction-content">Content</Label>
              <Textarea
                id="interaction-content"
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Describe the interaction..."
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleAddInteraction}
                disabled={!formData.content.trim()}
              >
                <Send className="h-4 w-4 mr-2" />
                Add Interaction
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddForm(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Timeline */}
      <div className="space-y-4">
        {filteredInteractions.map((interaction, index) => {
          const ChannelIcon = getChannelIcon(interaction.channel);
          const channelColor = getChannelColor(interaction.channel);
          
          return (
            <div key={interaction.id} className="flex gap-4">
              {/* Timeline connector */}
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full ${channelColor} flex items-center justify-center text-white`}>
                  <ChannelIcon className="h-5 w-5" />
                </div>
                {index < filteredInteractions.length - 1 && (
                  <div className="w-0.5 h-8 bg-gray-200 mt-2" />
                )}
              </div>

              {/* Interaction content */}
              <Card className="flex-1 p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {interaction.subject && (
                      <h4 className="font-medium">{interaction.subject}</h4>
                    )}
                    <Badge variant="outline" className="capitalize">
                      {interaction.channel}
                    </Badge>
                    <Badge variant={interaction.direction === 'inbound' ? 'default' : 'secondary'}>
                      <div className="flex items-center gap-1">
                        {interaction.direction === 'inbound' ? (
                          <ArrowDown className="h-3 w-3" />
                        ) : (
                          <ArrowUp className="h-3 w-3" />
                        )}
                        {interaction.direction}
                      </div>
                    </Badge>
                    {interaction.type && (
                      <Badge variant="outline" style={{ backgroundColor: interaction.type.color + '20' }}>
                        {interaction.type.name}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="h-4 w-4" />
                    {formatDate(interaction.interaction_date)}
                  </div>
                </div>

                <p className="text-gray-700 mb-2">{interaction.content}</p>

                {interaction.created_by_user && (
                  <div className="text-xs text-gray-500">
                    by {interaction.created_by_user.full_name || interaction.created_by_user.email}
                  </div>
                )}

                {interaction.attachments && interaction.attachments.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {interaction.attachments.map((attachment, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        📎 {attachment.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          );
        })}
      </div>

      {filteredInteractions.length === 0 && (
        <Card className="p-8 text-center">
          <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">No interactions found</p>
          <p className="text-sm text-gray-400 mb-4">
            Start tracking customer interactions to build a complete communication history
          </p>
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add First Interaction
          </Button>
        </Card>
      )}
    </div>
  );
}