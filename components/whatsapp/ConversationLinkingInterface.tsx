/**
 * Conversation Linking Interface
 * Requirements: 5.5 - WhatsApp Business Integration with CRM
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  MessageCircle, 
  User, 
  Phone, 
  Link, 
  Search,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface WhatsAppConversation {
  id: string;
  conversation_id: string;
  customer_phone: string;
  status: string;
  last_message_at: string;
  message_count: number;
  lead_id?: string;
}

interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  company?: string;
  status: string;
}

interface ConversationLinkingInterfaceProps {
  onLinkSuccess?: () => void;
}

export function ConversationLinkingInterface({ onLinkSuccess }: ConversationLinkingInterfaceProps) {
  const [conversations, setConversations] = useState<WhatsAppConversation[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [linking, setLinking] = useState<string | null>(null);
  const [searchPhone, setSearchPhone] = useState('');
  const [selectedLead, setSelectedLead] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load unlinked conversations
      const conversationsResponse = await fetch('/api/whatsapp/conversations?unlinked=true');
      if (conversationsResponse.ok) {
        const conversationsData = await conversationsResponse.json();
        setConversations(conversationsData.data || []);
      }

      // Load leads
      const leadsResponse = await fetch('/api/crm/leads?limit=100');
      if (leadsResponse.ok) {
        const leadsData = await leadsResponse.json();
        setLeads(leadsData.data?.leads || []);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load conversations and leads');
    } finally {
      setLoading(false);
    }
  };

  const handleLinkConversation = async (conversationId: string, leadId: string) => {
    try {
      setLinking(conversationId);
      
      const response = await fetch('/api/whatsapp/crm-integration/link-conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          conversation_id: conversationId,
          lead_id: leadId
        })
      });

      if (response.ok) {
        toast.success('Conversation linked successfully');
        await loadData();
        onLinkSuccess?.();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to link conversation');
      }
    } catch (error) {
      console.error('Failed to link conversation:', error);
      toast.error('Failed to link conversation');
    } finally {
      setLinking(null);
    }
  };

  const filteredConversations = conversations.filter(conv => 
    !searchPhone || conv.customer_phone.includes(searchPhone)
  );

  const getLeadDisplay = (lead: Lead) => {
    return `${lead.first_name} ${lead.last_name}${lead.phone ? ` (${lead.phone})` : ''}${lead.company ? ` - ${lead.company}` : ''}`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            Link WhatsApp Conversations to CRM Leads
          </CardTitle>
          <CardDescription>
            Connect unlinked WhatsApp conversations to existing CRM leads to track customer interactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search Filter */}
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by phone number..."
                value={searchPhone}
                onChange={(e) => setSearchPhone(e.target.value)}
                className="max-w-sm"
              />
            </div>

            {/* Conversations List */}
            {filteredConversations.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">No unlinked conversations</h3>
                <p className="text-muted-foreground">
                  All WhatsApp conversations are already linked to CRM leads
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredConversations.map((conversation) => (
                  <Card key={conversation.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{conversation.customer_phone}</span>
                            <Badge variant="outline">{conversation.status}</Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {conversation.message_count} messages • Last activity: {new Date(conversation.last_message_at).toLocaleDateString()}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Select
                            value={selectedLead}
                            onValueChange={setSelectedLead}
                          >
                            <SelectTrigger className="w-64">
                              <SelectValue placeholder="Select a lead to link..." />
                            </SelectTrigger>
                            <SelectContent>
                              {leads.map((lead) => (
                                <SelectItem key={lead.id} value={lead.id}>
                                  {getLeadDisplay(lead)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          
                          <Button
                            onClick={() => handleLinkConversation(conversation.id, selectedLead)}
                            disabled={!selectedLead || linking === conversation.id}
                            size="sm"
                          >
                            {linking === conversation.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            ) : (
                              <>
                                <Link className="h-4 w-4 mr-2" />
                                Link
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              variant="outline"
              onClick={loadData}
              className="justify-start"
            >
              <Search className="h-4 w-4 mr-2" />
              Refresh Conversations
            </Button>
            
            <Button
              variant="outline"
              onClick={() => {
                // This would open a modal to create a new lead
                toast.info('Lead creation modal would open here');
              }}
              className="justify-start"
            >
              <User className="h-4 w-4 mr-2" />
              Create New Lead
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}