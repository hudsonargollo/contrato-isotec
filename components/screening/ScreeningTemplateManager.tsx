/**
 * Screening Template Manager Component
 * Manages screening templates with comprehensive version control
 * Requirements: 3.5 - Template version control and historical assessment consistency
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Plus, 
  Edit, 
  Copy, 
  FileText, 
  Settings, 
  Target, 
  History, 
  GitBranch, 
  Clock, 
  User, 
  AlertTriangle,
  CheckCircle,
  RotateCcw,
  Eye,
  Download
} from 'lucide-react';
import type { 
  ScreeningTemplate, 
  CreateScreeningTemplate,
  ScreeningRule,
  TemplateVersion,
  TemplateChange,
  ConsistencyCheck,
  VersionComparison
} from '@/lib/types/screening';

interface ScreeningTemplateManagerProps {
  tenantId: string;
  questionnaireTemplates?: Array<{ id: string; name: string; version: string }>;
  onTemplatesChange?: (templates: ScreeningTemplate[]) => void;
}

interface TemplateFormData {
  questionnaire_template_id: string;
  name: string;
  description: string;
  version: string;
  screening_rules: string[];
  scoring_config: {
    max_score: number;
    qualification_thresholds: {
      qualified: number;
      partially_qualified: number;
      not_qualified: number;
    };
    feasibility_thresholds: {
      high: number;
      medium: number;
      low: number;
      not_feasible: number;
    };
    risk_thresholds: {
      low: number;
      medium: number;
      high: number;
      critical: number;
    };
  };
  output_config: {
    include_recommendations: boolean;
    include_risk_factors: boolean;
    include_next_steps: boolean;
    include_estimates: boolean;
    custom_fields: Record<string, any>;
  };
  is_active: boolean;
}

export function ScreeningTemplateManager({ 
  tenantId, 
  questionnaireTemplates = [],
  onTemplatesChange 
}: ScreeningTemplateManagerProps) {
  const [templates, setTemplates] = useState<ScreeningTemplate[]>([]);
  const [availableRules, setAvailableRules] = useState<ScreeningRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ScreeningTemplate | null>(null);
  const [templateVersions, setTemplateVersions] = useState<TemplateVersion[]>([]);
  const [templateChanges, setTemplateChanges] = useState<TemplateChange[]>([]);
  const [consistencyChecks, setConsistencyChecks] = useState<ConsistencyCheck[]>([]);
  const [showVersionDialog, setShowVersionDialog] = useState(false);
  const [showConsistencyDialog, setShowConsistencyDialog] = useState(false);
  const [versionComparison, setVersionComparison] = useState<VersionComparison | null>(null);
  const [formData, setFormData] = useState<TemplateFormData>({
    questionnaire_template_id: '',
    name: '',
    description: '',
    version: '1.0',
    screening_rules: [],
    scoring_config: {
      max_score: 100,
      qualification_thresholds: {
        qualified: 80,
        partially_qualified: 60,
        not_qualified: 0
      },
      feasibility_thresholds: {
        high: 80,
        medium: 60,
        low: 40,
        not_feasible: 0
      },
      risk_thresholds: {
        low: 20,
        medium: 40,
        high: 60,
        critical: 80
      }
    },
    output_config: {
      include_recommendations: true,
      include_risk_factors: true,
      include_next_steps: true,
      include_estimates: true,
      custom_fields: {}
    },
    is_active: true
  });

  useEffect(() => {
    fetchTemplates();
    fetchAvailableRules();
  }, [tenantId]);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/screening/templates', {
        headers: {
          'x-tenant-id': tenantId
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
        onTemplatesChange?.(data);
      }
    } catch (error) {
      console.error('Error fetching screening templates:', error);
    }
  };

  const fetchAvailableRules = async () => {
    try {
      const response = await fetch('/api/screening/rules', {
        headers: {
          'x-tenant-id': tenantId
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAvailableRules(data);
      }
    } catch (error) {
      console.error('Error fetching screening rules:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplateVersions = async (templateId: string) => {
    try {
      const response = await fetch(`/api/screening/templates/${templateId}/versions`, {
        headers: {
          'x-tenant-id': tenantId
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTemplateVersions(data);
      }
    } catch (error) {
      console.error('Error fetching template versions:', error);
    }
  };

  const fetchTemplateChanges = async (templateId: string, versionId?: string) => {
    try {
      const url = `/api/screening/templates/${templateId}/changes${versionId ? `?version=${versionId}` : ''}`;
      const response = await fetch(url, {
        headers: {
          'x-tenant-id': tenantId
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTemplateChanges(data);
      }
    } catch (error) {
      console.error('Error fetching template changes:', error);
    }
  };

  const fetchConsistencyChecks = async (templateId: string) => {
    try {
      const response = await fetch(`/api/screening/templates/${templateId}/consistency`, {
        headers: {
          'x-tenant-id': tenantId
        }
      });

      if (response.ok) {
        const data = await response.json();
        setConsistencyChecks(data);
      }
    } catch (error) {
      console.error('Error fetching consistency checks:', error);
    }
  };

  const handleCreateVersion = async (templateId: string, versionNotes: string) => {
    try {
      const response = await fetch(`/api/screening/templates/${templateId}/versions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenantId
        },
        body: JSON.stringify({
          version_notes: versionNotes,
          auto_increment: true
        })
      });

      if (response.ok) {
        await fetchTemplates();
        await fetchTemplateVersions(templateId);
      }
    } catch (error) {
      console.error('Error creating template version:', error);
    }
  };

  const handleRevertToVersion = async (templateId: string, targetVersion: string, revertNotes: string) => {
    try {
      const response = await fetch(`/api/screening/templates/${templateId}/revert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenantId
        },
        body: JSON.stringify({
          target_version: targetVersion,
          revert_notes: revertNotes
        })
      });

      if (response.ok) {
        await fetchTemplates();
        await fetchTemplateVersions(templateId);
      }
    } catch (error) {
      console.error('Error reverting template version:', error);
    }
  };

  const handleCompareVersions = async (templateId: string, fromVersion: string, toVersion: string) => {
    try {
      const response = await fetch(`/api/screening/templates/${templateId}/compare?from=${fromVersion}&to=${toVersion}`, {
        headers: {
          'x-tenant-id': tenantId
        }
      });

      if (response.ok) {
        const data = await response.json();
        setVersionComparison(data);
      }
    } catch (error) {
      console.error('Error comparing template versions:', error);
    }
  };

  const handleCheckConsistency = async (templateId: string, startDate: Date, endDate: Date) => {
    try {
      const response = await fetch(`/api/screening/templates/${templateId}/consistency/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenantId
        },
        body: JSON.stringify({
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString()
        })
      });

      if (response.ok) {
        await fetchConsistencyChecks(templateId);
      }
    } catch (error) {
      console.error('Error checking consistency:', error);
    }
  };

  const handleCreateTemplate = async () => {
    try {
      const templateData: CreateScreeningTemplate = formData;

      const response = await fetch('/api/screening/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenantId
        },
        body: JSON.stringify(templateData)
      });

      if (response.ok) {
        await fetchTemplates();
        setShowAddForm(false);
        resetForm();
      }
    } catch (error) {
      console.error('Error creating screening template:', error);
    }
  };

  const handleCloneTemplate = (template: ScreeningTemplate) => {
    setFormData({
      questionnaire_template_id: template.questionnaire_template_id,
      name: `${template.name} (Copy)`,
      description: template.description || '',
      version: incrementVersion(template.version),
      screening_rules: [...template.screening_rules],
      scoring_config: { ...template.scoring_config },
      output_config: { ...template.output_config },
      is_active: false
    });
    setShowAddForm(true);
  };

  const incrementVersion = (version: string): string => {
    const parts = version.split('.');
    const minor = parseInt(parts[1] || '0') + 1;
    return `${parts[0]}.${minor}`;
  };

  const resetForm = () => {
    setFormData({
      questionnaire_template_id: '',
      name: '',
      description: '',
      version: '1.0',
      screening_rules: [],
      scoring_config: {
        max_score: 100,
        qualification_thresholds: {
          qualified: 80,
          partially_qualified: 60,
          not_qualified: 0
        },
        feasibility_thresholds: {
          high: 80,
          medium: 60,
          low: 40,
          not_feasible: 0
        },
        risk_thresholds: {
          low: 20,
          medium: 40,
          high: 60,
          critical: 80
        }
      },
      output_config: {
        include_recommendations: true,
        include_risk_factors: true,
        include_next_steps: true,
        include_estimates: true,
        custom_fields: {}
      },
      is_active: true
    });
  };

  const toggleRuleSelection = (ruleId: string) => {
    setFormData(prev => ({
      ...prev,
      screening_rules: prev.screening_rules.includes(ruleId)
        ? prev.screening_rules.filter(id => id !== ruleId)
        : [...prev.screening_rules, ruleId]
    }));
  };

  const renderVersionHistoryDialog = () => (
    <Dialog open={showVersionDialog} onOpenChange={setShowVersionDialog}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Version History - {selectedTemplate?.name}
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="versions" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="versions">Versions</TabsTrigger>
            <TabsTrigger value="changes">Changes</TabsTrigger>
            <TabsTrigger value="consistency">Consistency</TabsTrigger>
          </TabsList>
          
          <TabsContent value="versions" className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium">Template Versions</h4>
              <Button
                size="sm"
                onClick={() => {
                  const versionNotes = prompt('Enter version notes (optional):');
                  if (selectedTemplate) {
                    handleCreateVersion(selectedTemplate.id, versionNotes || '');
                  }
                }}
              >
                <GitBranch className="h-4 w-4 mr-2" />
                Create Version
              </Button>
            </div>
            
            <div className="space-y-3">
              {templateVersions.map((version) => (
                <Card key={version.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={version.is_current ? "default" : "outline"}>
                          v{version.version}
                        </Badge>
                        {version.is_current && (
                          <Badge variant="secondary">Current</Badge>
                        )}
                        {!version.backward_compatible && (
                          <Badge variant="destructive">Breaking Changes</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{version.version_notes}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {version.created_by_user?.full_name || version.created_by_user?.email || 'System'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {version.created_at.toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const revertNotes = prompt('Enter revert notes (optional):');
                          if (selectedTemplate) {
                            handleRevertToVersion(selectedTemplate.id, version.version, revertNotes || '');
                          }
                        }}
                        disabled={version.is_current}
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const compareVersion = prompt('Compare with version:');
                          if (compareVersion && selectedTemplate) {
                            handleCompareVersions(selectedTemplate.id, version.version, compareVersion);
                          }
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {version.breaking_changes.length > 0 && (
                    <div className="mt-3 p-2 bg-red-50 rounded border border-red-200">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        <span className="text-sm font-medium text-red-700">Breaking Changes</span>
                      </div>
                      <ul className="text-xs text-red-600 list-disc list-inside">
                        {version.breaking_changes.map((change, index) => (
                          <li key={index}>{change}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="changes" className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium">Change History</h4>
              <Select onValueChange={(versionId) => {
                if (selectedTemplate) {
                  fetchTemplateChanges(selectedTemplate.id, versionId);
                }
              }}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by version" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All versions</SelectItem>
                  {templateVersions.map((version) => (
                    <SelectItem key={version.id} value={version.id}>
                      v{version.version}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-3">
              {templateChanges.map((change) => (
                <Card key={change.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      change.change_type === 'create' ? 'bg-green-500' :
                      change.change_type === 'update' || change.change_type === 'config_change' ? 'bg-blue-500' :
                      change.change_type === 'delete' ? 'bg-red-500' :
                      'bg-gray-500'
                    }`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {change.change_type.replace('_', ' ')}
                        </Badge>
                        {change.field_path && (
                          <Badge variant="secondary" className="text-xs">
                            {change.field_path}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm">{change.change_description}</p>
                      {change.change_reason && (
                        <p className="text-xs text-gray-500 mt-1">Reason: {change.change_reason}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {change.changed_by_user?.full_name || change.changed_by_user?.email || 'System'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {change.created_at.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="consistency" className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium">Assessment Consistency</h4>
              <Button
                size="sm"
                onClick={() => {
                  const startDate = new Date();
                  startDate.setMonth(startDate.getMonth() - 1);
                  const endDate = new Date();
                  
                  if (selectedTemplate) {
                    handleCheckConsistency(selectedTemplate.id, startDate, endDate);
                  }
                }}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Check Consistency
              </Button>
            </div>
            
            <div className="space-y-3">
              {consistencyChecks.map((check) => (
                <Card key={check.id} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${
                        check.consistency_percentage >= 95 ? 'bg-green-500' :
                        check.consistency_percentage >= 80 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`} />
                      <span className="font-medium">
                        {check.consistency_percentage.toFixed(1)}% Consistent
                      </span>
                    </div>
                    <Badge variant={
                      check.resolution_status === 'resolved' ? 'default' :
                      check.resolution_status === 'accepted' ? 'secondary' :
                      'destructive'
                    }>
                      {check.resolution_status}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Total Assessments</span>
                      <div className="font-medium">{check.total_assessments}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Consistent</span>
                      <div className="font-medium text-green-600">{check.consistent_assessments}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Inconsistent</span>
                      <div className="font-medium text-red-600">{check.inconsistent_assessments}</div>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500 mt-2">
                    Period: {check.assessment_period_start.toLocaleDateString()} - {check.assessment_period_end.toLocaleDateString()}
                  </div>
                  
                  {check.inconsistency_reasons.length > 0 && (
                    <div className="mt-3 p-2 bg-yellow-50 rounded border border-yellow-200">
                      <div className="text-sm font-medium text-yellow-700 mb-1">Inconsistency Reasons</div>
                      <ul className="text-xs text-yellow-600 list-disc list-inside">
                        {check.inconsistency_reasons.map((reason, index) => (
                          <li key={index}>{reason}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );

  const renderVersionComparisonDialog = () => (
    versionComparison && (
      <Dialog open={!!versionComparison} onOpenChange={() => setVersionComparison(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Version Comparison: v{versionComparison.fromVersion} → v{versionComparison.toVersion}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{versionComparison.summary.totalChanges}</div>
                <div className="text-sm text-gray-500">Total Changes</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{versionComparison.summary.addedItems}</div>
                <div className="text-sm text-gray-500">Added</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">{versionComparison.summary.removedItems}</div>
                <div className="text-sm text-gray-500">Removed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">{versionComparison.summary.modifiedItems}</div>
                <div className="text-sm text-gray-500">Modified</div>
              </div>
            </div>
            
            <div className="space-y-3">
              {versionComparison.changes.map((change, index) => (
                <Card key={index} className="p-3">
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      change.type === 'added' ? 'bg-green-500' :
                      change.type === 'removed' ? 'bg-red-500' :
                      'bg-orange-500'
                    }`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={
                          change.type === 'added' ? 'default' :
                          change.type === 'removed' ? 'destructive' :
                          'secondary'
                        } className="text-xs">
                          {change.type}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {change.field}
                        </Badge>
                      </div>
                      <p className="text-sm">{change.description}</p>
                      {change.oldValue && change.newValue && (
                        <div className="mt-2 text-xs">
                          <div className="text-red-600">- {JSON.stringify(change.oldValue)}</div>
                          <div className="text-green-600">+ {JSON.stringify(change.newValue)}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  );

  const getSelectedRulesScore = () => {
    return availableRules
      .filter(rule => formData.screening_rules.includes(rule.id))
      .reduce((sum, rule) => sum + rule.scoring.points, 0);
  };

  const renderTemplateForm = () => (
    <Card className="p-6 mb-4">
      <div className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="template-name">Template Name</Label>
            <Input
              id="template-name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter template name"
            />
          </div>
          <div>
            <Label htmlFor="template-version">Version</Label>
            <Input
              id="template-version"
              value={formData.version}
              onChange={(e) => setFormData(prev => ({ ...prev, version: e.target.value }))}
              placeholder="1.0"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="questionnaire-template">Questionnaire Template</Label>
          <Select
            value={formData.questionnaire_template_id}
            onValueChange={(value) => setFormData(prev => ({ ...prev, questionnaire_template_id: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select questionnaire template" />
            </SelectTrigger>
            <SelectContent>
              {questionnaireTemplates.map((template) => (
                <SelectItem key={template.id} value={template.id}>
                  {template.name} (v{template.version})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="template-description">Description</Label>
          <Textarea
            id="template-description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Describe this screening template"
            rows={2}
          />
        </div>

        {/* Screening Rules Selection */}
        <div>
          <Label>Screening Rules ({formData.screening_rules.length} selected)</Label>
          <div className="text-sm text-gray-500 mb-3">
            Total possible score: {getSelectedRulesScore()} points
          </div>
          <div className="max-h-60 overflow-y-auto border rounded-lg p-3 space-y-2">
            {availableRules.map((rule) => (
              <div key={rule.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
                <Checkbox
                  id={`rule-${rule.id}`}
                  checked={formData.screening_rules.includes(rule.id)}
                  onCheckedChange={() => toggleRuleSelection(rule.id)}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{rule.name}</span>
                    <Badge variant="outline">{rule.category}</Badge>
                    <Badge variant="secondary">{rule.scoring.points} pts</Badge>
                  </div>
                  {rule.description && (
                    <p className="text-sm text-gray-600">{rule.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scoring Configuration */}
        <div>
          <Label>Scoring Configuration</Label>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div>
              <Label className="text-sm">Max Score</Label>
              <Input
                type="number"
                value={formData.scoring_config.max_score}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  scoring_config: {
                    ...prev.scoring_config,
                    max_score: parseInt(e.target.value) || 100
                  }
                }))}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div>
              <Label className="text-sm">Qualification Thresholds (%)</Label>
              <div className="space-y-2 mt-1">
                <Input
                  type="number"
                  placeholder="Qualified"
                  value={formData.scoring_config.qualification_thresholds.qualified}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    scoring_config: {
                      ...prev.scoring_config,
                      qualification_thresholds: {
                        ...prev.scoring_config.qualification_thresholds,
                        qualified: parseInt(e.target.value) || 80
                      }
                    }
                  }))}
                />
                <Input
                  type="number"
                  placeholder="Partially Qualified"
                  value={formData.scoring_config.qualification_thresholds.partially_qualified}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    scoring_config: {
                      ...prev.scoring_config,
                      qualification_thresholds: {
                        ...prev.scoring_config.qualification_thresholds,
                        partially_qualified: parseInt(e.target.value) || 60
                      }
                    }
                  }))}
                />
              </div>
            </div>
            
            <div>
              <Label className="text-sm">Feasibility Thresholds (%)</Label>
              <div className="space-y-2 mt-1">
                <Input
                  type="number"
                  placeholder="High"
                  value={formData.scoring_config.feasibility_thresholds.high}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    scoring_config: {
                      ...prev.scoring_config,
                      feasibility_thresholds: {
                        ...prev.scoring_config.feasibility_thresholds,
                        high: parseInt(e.target.value) || 80
                      }
                    }
                  }))}
                />
                <Input
                  type="number"
                  placeholder="Medium"
                  value={formData.scoring_config.feasibility_thresholds.medium}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    scoring_config: {
                      ...prev.scoring_config,
                      feasibility_thresholds: {
                        ...prev.scoring_config.feasibility_thresholds,
                        medium: parseInt(e.target.value) || 60
                      }
                    }
                  }))}
                />
              </div>
            </div>
            
            <div>
              <Label className="text-sm">Risk Thresholds (%)</Label>
              <div className="space-y-2 mt-1">
                <Input
                  type="number"
                  placeholder="High Risk"
                  value={formData.scoring_config.risk_thresholds.high}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    scoring_config: {
                      ...prev.scoring_config,
                      risk_thresholds: {
                        ...prev.scoring_config.risk_thresholds,
                        high: parseInt(e.target.value) || 60
                      }
                    }
                  }))}
                />
                <Input
                  type="number"
                  placeholder="Critical Risk"
                  value={formData.scoring_config.risk_thresholds.critical}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    scoring_config: {
                      ...prev.scoring_config,
                      risk_thresholds: {
                        ...prev.scoring_config.risk_thresholds,
                        critical: parseInt(e.target.value) || 80
                      }
                    }
                  }))}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Output Configuration */}
        <div>
          <Label>Output Configuration</Label>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Switch
                  id="include-recommendations"
                  checked={formData.output_config.include_recommendations}
                  onCheckedChange={(checked: boolean) => setFormData(prev => ({
                    ...prev,
                    output_config: { ...prev.output_config, include_recommendations: checked }
                  }))}
                />
                <Label htmlFor="include-recommendations">Include Recommendations</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="include-risk-factors"
                  checked={formData.output_config.include_risk_factors}
                  onCheckedChange={(checked: boolean) => setFormData(prev => ({
                    ...prev,
                    output_config: { ...prev.output_config, include_risk_factors: checked }
                  }))}
                />
                <Label htmlFor="include-risk-factors">Include Risk Factors</Label>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Switch
                  id="include-next-steps"
                  checked={formData.output_config.include_next_steps}
                  onCheckedChange={(checked: boolean) => setFormData(prev => ({
                    ...prev,
                    output_config: { ...prev.output_config, include_next_steps: checked }
                  }))}
                />
                <Label htmlFor="include-next-steps">Include Next Steps</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="include-estimates"
                  checked={formData.output_config.include_estimates}
                  onCheckedChange={(checked: boolean) => setFormData(prev => ({
                    ...prev,
                    output_config: { ...prev.output_config, include_estimates: checked }
                  }))}
                />
                <Label htmlFor="include-estimates">Include Project Estimates</Label>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="is-active"
            checked={formData.is_active}
            onCheckedChange={(checked: boolean) => setFormData(prev => ({ ...prev, is_active: checked }))}
          />
          <Label htmlFor="is-active">Active Template</Label>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={handleCreateTemplate}
            disabled={!formData.name.trim() || !formData.questionnaire_template_id || formData.screening_rules.length === 0}
          >
            Create Template
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
  );

  if (loading) {
    return <div className="p-4">Loading screening templates...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Screening Templates</h3>
          <p className="text-sm text-gray-600">
            {templates.length} templates • {templates.filter(t => t.is_active).length} active
          </p>
        </div>
        <Button onClick={() => setShowAddForm(true)} disabled={showAddForm}>
          <Plus className="h-4 w-4 mr-2" />
          Add Template
        </Button>
      </div>

      {showAddForm && renderTemplateForm()}

      <div className="space-y-2">
        {templates.map((template) => (
          <Card key={template.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="h-4 w-4 text-blue-500" />
                  <span className="font-medium">{template.name}</span>
                  <Badge variant="outline">v{template.version}</Badge>
                  <Badge variant={template.is_active ? "default" : "secondary"}>
                    {template.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                {template.description && (
                  <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                )}
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>{template.screening_rules.length} rules</span>
                  <span>Max score: {template.scoring_config.max_score}</span>
                  <span>Created: {new Date(template.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedTemplate(template);
                    fetchTemplateVersions(template.id);
                    fetchTemplateChanges(template.id);
                    fetchConsistencyChecks(template.id);
                    setShowVersionDialog(true);
                  }}
                >
                  <History className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCloneTemplate(template)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingTemplate(template.id)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {templates.length === 0 && (
        <Card className="p-8 text-center">
          <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">No screening templates configured</p>
          <p className="text-sm text-gray-400 mb-4">
            Create templates to define how projects are assessed and scored
          </p>
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Template
          </Button>
        </Card>
      )}

      {renderVersionHistoryDialog()}
      {renderVersionComparisonDialog()}
    </div>
  );
}