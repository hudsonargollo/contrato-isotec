/**
 * Campaign Automation Component
 * Requirements: 5.3 - Customer journey-based messaging automation
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Zap, 
  Clock, 
  TrendingUp, 
  Users, 
  MessageCircle,
  Plus,
  Settings,
  Play,
  Pause,
  BarChart3
} from 'lucide-react';
import { WhatsAppTemplate } from '@/lib/types/whatsapp';
import { PipelineStage, LeadStatus } from '@/lib/types/crm';

interface CampaignAutomationProps {
  tenantId: string;
}

interface AutomationRule {
  id: string;
  name: string;
  description: string;
  trigger_type: 'stage_change' | 'time_based' | 'score_change' | 'inactivity';
  trigger_conditions: any;
  template_id: string;
  is_active: boolean;
  delay_minutes?: number;
  created_at: string;
  stats?: {
    triggered_count: number;
    messages_sent: number;
    success_rate: number;
  };
}

interface TriggerFormData {
  name: string;
  description: string;
  trigger_type: 'stage_change' | 'time_based' | 'score_change' | 'inactivity';
  template_id: string;
  delay_minutes: number;
  conditions: {
    stage_id?: string;
    previous_stage_id?: string;
    score_threshold?: number;
    days_since_last_contact?: number;
    lead_status?: LeadStatus[];
  };
  is_active: boolean;
}

export default function CampaignAutomation({ tenantId }: CampaignAutomationProps) {
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([]);
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showStatsDialog, setShowStatsDialog] = useState(false);
  const [selectedRule, setSelectedRule] = useState<AutomationRule | null>(null);

  const [formData, setFormData] = useState<TriggerFormData>({
    name: '',
    description: '',
    trigger_type: 'stage_change',
    template_id: '',
    delay_minutes: 0,
    conditions: {},
    is_active: true
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
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

      // Load automation rules (mock data for now)
      setAutomationRules([
        {
          id: '1',
          name: 'Welcome New Leads',
          description: 'Send welcome message when lead enters "New" stage',
          trigger_type: 'stage_change',
          trigger_conditions: { stage_id: 'new-stage-id' },
          template_id: 'welcome-template',
          is_active: true,
          delay_minutes: 5,
          created_at: new Date().toISOString(),
          stats: {
            triggered_count: 45,
            messages_sent: 43,
            success_rate: 95.6
          }
        },
        {
          id: '2',
          name: 'Follow-up Inactive Leads',
          description: 'Follow up with leads not contacted in 7 days',
          trigger_type: 'inactivity',
          trigger_conditions: { days_since_last_contact: 7 },
          template_id: 'followup-template',
          is_active: true,
          delay_minutes: 0,
          created_at: new Date().toISOString(),
          stats: {
            triggered_count: 23,
            messages_sent: 21,
            success_rate: 91.3
          }
        }
      ]);

    } catch (error) {
      console.error('Failed to load data:', error);
      setError('Failed to load automation data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRule = async () => {
    try {
      // In a real implementation, this would call the API
      const newRule: AutomationRule = {
        id: Date.now().toString(),
        name: formData.name,
        description: formData.description,
        trigger_type: formData.trigger_type,
        trigger_conditions: formData.conditions,
        template_id: formData.template_id,
        is_active: formData.is_active,
        delay_minutes: formData.delay_minutes,
        created_at: new Date().toISOString(),
        stats: {
          triggered_count: 0,
          messages_sent: 0,
          success_rate: 0
        }
      };

      setAutomationRules([newRule, ...automationRules]);
      setShowCreateDialog(false);
      resetForm();
    } catch (error) {
      console.error('Failed to create automation rule:', error);
      setError('Failed to create automation rule');
    }
  };

  const handleToggleRule = async (ruleId: string, isActive: boolean) => {
    try {
      setAutomationRules(rules =>
        rules.map(rule =>
          rule.id === ruleId ? { ...rule, is_active: isActive } : rule
        )
      );
    } catch (error) {
      console.error('Failed to toggle rule:', error);
      setError('Failed to update rule');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      trigger_type: 'stage_change',
      template_id: '',
      delay_minutes: 0,
      conditions: {},
      is_active: true
    });
  };

  const getTriggerTypeLabel = (type: string) => {
    switch (type) {
      case 'stage_change': return 'Stage Change';
      case 'time_based': return 'Time Based';
      case 'score_change': return 'Score Change';
      case 'inactivity': return 'Inactivity';
      default: return type;
    }
  };

  const getTriggerIcon = (type: string) => {
    switch (type) {
      case 'stage_change': return <TrendingUp className="h-4 w-4" />;
      case 'time_based': return <Clock className="h-4 w-4" />;
      case 'score_change': return <BarChart3 className="h-4 w-4" />;
      case 'inactivity': return <Users className="h-4 w-4" />;
      default: return <Zap className="h-4 w-4" />;
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
          <h2 className="text-2xl font-bold text-gray-900">Campaign Automation</h2>
          <p className="text-gray-600">Set up automated triggers based on customer journey stages</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Automation Rule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Automation Rule</DialogTitle>
              <DialogDescription>
                Set up automated messaging based on customer journey triggers
              </DialogDescription>
            </DialogHeader>
            
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="trigger">Trigger</TabsTrigger>
                <TabsTrigger value="message">Message</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Rule Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter rule name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe when this rule should trigger"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="active">Active</Label>
                </div>
              </TabsContent>
              
              <TabsContent value="trigger" className="space-y-4">
                <div className="space-y-2">
                  <Label>Trigger Type</Label>
                  <Select
                    value={formData.trigger_type}
                    onValueChange={(value) => setFormData({ 
                      ...formData, 
                      trigger_type: value as any,
                      conditions: {} // Reset conditions when trigger type changes
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="stage_change">Stage Change</SelectItem>
                      <SelectItem value="inactivity">Inactivity</SelectItem>
                      <SelectItem value="score_change">Score Change</SelectItem>
                      <SelectItem value="time_based">Time Based</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.trigger_type === 'stage_change' && (
                  <div className="space-y-2">
                    <Label>Target Stage</Label>
                    <Select
                      value={formData.conditions.stage_id || ''}
                      onValueChange={(value) => setFormData({
                        ...formData,
                        conditions: { ...formData.conditions, stage_id: value }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select stage" />
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
                )}

                {formData.trigger_type === 'inactivity' && (
                  <div className="space-y-2">
                    <Label htmlFor="inactivityDays">Days Since Last Contact</Label>
                    <Input
                      id="inactivityDays"
                      type="number"
                      value={formData.conditions.days_since_last_contact || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        conditions: { 
                          ...formData.conditions, 
                          days_since_last_contact: parseInt(e.target.value) || 0 
                        }
                      })}
                      placeholder="Number of days"
                    />
                  </div>
                )}

                {formData.trigger_type === 'score_change' && (
                  <div className="space-y-2">
                    <Label htmlFor="scoreThreshold">Score Threshold</Label>
                    <Input
                      id="scoreThreshold"
                      type="number"
                      value={formData.conditions.score_threshold || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        conditions: { 
                          ...formData.conditions, 
                          score_threshold: parseInt(e.target.value) || 0 
                        }
                      })}
                      placeholder="Minimum score"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="delay">Delay (minutes)</Label>
                  <Input
                    id="delay"
                    type="number"
                    value={formData.delay_minutes}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      delay_minutes: parseInt(e.target.value) || 0 
                    })}
                    placeholder="Delay before sending message"
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="message" className="space-y-4">
                <div className="space-y-2">
                  <Label>WhatsApp Template</Label>
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
            </Tabs>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateRule} 
                disabled={!formData.name || !formData.template_id}
              >
                Create Rule
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Automation Rules */}
      <div className="grid gap-4">
        {automationRules.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Zap className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No automation rules yet</h3>
              <p className="text-gray-600 text-center mb-4">
                Create automated triggers to send messages based on customer journey stages.
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Rule
              </Button>
            </CardContent>
          </Card>
        ) : (
          automationRules.map((rule) => (
            <Card key={rule.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      {getTriggerIcon(rule.trigger_type)}
                    </div>
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {rule.name}
                        <Badge variant={rule.is_active ? 'default' : 'secondary'}>
                          {rule.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </CardTitle>
                      <CardDescription>{rule.description}</CardDescription>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span>Trigger: {getTriggerTypeLabel(rule.trigger_type)}</span>
                        {rule.delay_minutes > 0 && (
                          <span>Delay: {rule.delay_minutes}m</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={rule.is_active}
                      onCheckedChange={(checked) => handleToggleRule(rule.id, checked)}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedRule(rule);
                        setShowStatsDialog(true);
                      }}
                    >
                      <BarChart3 className="h-4 w-4 mr-1" />
                      Stats
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {rule.stats && (
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center">
                      <Zap className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{rule.stats.triggered_count} triggered</span>
                    </div>
                    <div className="flex items-center">
                      <MessageCircle className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{rule.stats.messages_sent} sent</span>
                    </div>
                    <div className="flex items-center">
                      <TrendingUp className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{rule.stats.success_rate}% success</span>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Stats Dialog */}
      <Dialog open={showStatsDialog} onOpenChange={setShowStatsDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Automation Rule Statistics</DialogTitle>
            <DialogDescription>
              Performance metrics for {selectedRule?.name}
            </DialogDescription>
          </DialogHeader>
          
          {selectedRule?.stats && (
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Times Triggered</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{selectedRule.stats.triggered_count}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Messages Sent</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{selectedRule.stats.messages_sent}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{selectedRule.stats.success_rate}%</div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}