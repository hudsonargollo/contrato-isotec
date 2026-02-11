/**
 * Report Builder Component
 * Requirements: 6.3 - Automated report generation
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Trash2, 
  Save,
  Eye,
  Settings,
  BarChart3,
  Table,
  FileText,
  Target
} from 'lucide-react';

interface ReportBuilderProps {
  tenantId: string;
  onReportCreated: () => void;
}

interface ReportSection {
  id: string;
  type: 'summary' | 'chart' | 'table' | 'forecast' | 'kpi' | 'text';
  title: string;
  config: any;
  order: number;
}

export function ReportBuilder({ tenantId, onReportCreated }: ReportBuilderProps) {
  const [reportName, setReportName] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [reportType, setReportType] = useState<'financial' | 'performance' | 'user_engagement' | 'operational' | 'custom'>('custom');
  const [sections, setSections] = useState<ReportSection[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sectionTypes = [
    { value: 'summary', label: 'Summary', icon: FileText, description: 'Executive summary with key insights' },
    { value: 'chart', label: 'Chart', icon: BarChart3, description: 'Visual data representation' },
    { value: 'table', label: 'Table', icon: Table, description: 'Tabular data display' },
    { value: 'forecast', label: 'Forecast', icon: Target, description: 'Predictive analytics' },
    { value: 'kpi', label: 'KPI', icon: Settings, description: 'Key performance indicators' }
  ];

  const addSection = (type: ReportSection['type']) => {
    const newSection: ReportSection = {
      id: `section_${Date.now()}`,
      type,
      title: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      config: getDefaultConfig(type),
      order: sections.length + 1
    };
    setSections([...sections, newSection]);
  };

  const removeSection = (sectionId: string) => {
    setSections(sections.filter(s => s.id !== sectionId));
  };

  const updateSection = (sectionId: string, updates: Partial<ReportSection>) => {
    setSections(sections.map(s => 
      s.id === sectionId ? { ...s, ...updates } : s
    ));
  };

  const getDefaultConfig = (type: ReportSection['type']) => {
    switch (type) {
      case 'chart':
        return {
          chart_type: 'line',
          metric: 'revenue',
          time_range: { type: 'relative', relative: { amount: 30, unit: 'days' } }
        };
      case 'table':
        return {
          columns: ['name', 'value', 'change'],
          limit: 10,
          sort_by: 'value',
          sort_order: 'desc'
        };
      case 'kpi':
        return {
          metrics: ['revenue', 'users', 'conversion_rate'],
          comparison_period: 'previous_month'
        };
      case 'forecast':
        return {
          metric: 'revenue',
          forecast_period: 30,
          confidence_level: 0.95
        };
      default:
        return {};
    }
  };

  const saveReport = async () => {
    if (!reportName.trim()) {
      setError('Report name is required');
      return;
    }

    if (sections.length === 0) {
      setError('At least one section is required');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const templateData = {
        sections: sections.sort((a, b) => a.order - b.order),
        styling: {
          theme: 'corporate',
          colors: {
            primary: '#3b82f6',
            secondary: '#64748b',
            accent: '#10b981'
          },
          fonts: {
            heading: 'Inter',
            body: 'Inter'
          }
        },
        export_formats: ['pdf', 'csv', 'json']
      };

      const config = {
        metrics: sections
          .filter(s => s.config.metric)
          .map(s => s.config.metric),
        time_range: {
          type: 'relative',
          relative: { amount: 30, unit: 'days' }
        },
        format: 'json'
      };

      const response = await fetch('/api/analytics/reports/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: reportName,
          description: reportDescription,
          report_type: reportType,
          config,
          template_data: templateData,
          is_active: true
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save report template');
      }

      // Reset form
      setReportName('');
      setReportDescription('');
      setSections([]);
      onReportCreated();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save report');
    } finally {
      setSaving(false);
    }
  };

  const renderSectionConfig = (section: ReportSection) => {
    switch (section.type) {
      case 'chart':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Chart Type</label>
              <Select 
                value={section.config.chart_type} 
                onValueChange={(value) => updateSection(section.id, {
                  config: { ...section.config, chart_type: value }
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="line">Line Chart</SelectItem>
                  <SelectItem value="bar">Bar Chart</SelectItem>
                  <SelectItem value="area">Area Chart</SelectItem>
                  <SelectItem value="pie">Pie Chart</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Metric</label>
              <Select 
                value={section.config.metric} 
                onValueChange={(value) => updateSection(section.id, {
                  config: { ...section.config, metric: value }
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="revenue">Revenue</SelectItem>
                  <SelectItem value="users">Users</SelectItem>
                  <SelectItem value="api_requests">API Requests</SelectItem>
                  <SelectItem value="conversion_rate">Conversion Rate</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'kpi':
        return (
          <div>
            <label className="text-sm font-medium mb-1 block">KPI Metrics</label>
            <div className="flex flex-wrap gap-2">
              {['revenue', 'users', 'conversion_rate', 'churn_rate'].map(metric => (
                <Badge
                  key={metric}
                  variant={section.config.metrics?.includes(metric) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => {
                    const currentMetrics = section.config.metrics || [];
                    const newMetrics = currentMetrics.includes(metric)
                      ? currentMetrics.filter((m: string) => m !== metric)
                      : [...currentMetrics, metric];
                    updateSection(section.id, {
                      config: { ...section.config, metrics: newMetrics }
                    });
                  }}
                >
                  {metric.replace('_', ' ')}
                </Badge>
              ))}
            </div>
          </div>
        );

      case 'forecast':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Forecast Metric</label>
              <Select 
                value={section.config.metric} 
                onValueChange={(value) => updateSection(section.id, {
                  config: { ...section.config, metric: value }
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="revenue">Revenue</SelectItem>
                  <SelectItem value="users">Users</SelectItem>
                  <SelectItem value="churn_rate">Churn Rate</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Forecast Period (days)</label>
              <Input
                type="number"
                value={section.config.forecast_period}
                onChange={(e) => updateSection(section.id, {
                  config: { ...section.config, forecast_period: parseInt(e.target.value) }
                })}
                min="7"
                max="365"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Report Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Report Configuration</CardTitle>
          <CardDescription>
            Configure basic report settings and metadata
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Report Name</label>
              <Input
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
                placeholder="Enter report name"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Report Type</label>
              <Select value={reportType} onValueChange={(value: any) => setReportType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="financial">Financial</SelectItem>
                  <SelectItem value="performance">Performance</SelectItem>
                  <SelectItem value="user_engagement">User Engagement</SelectItem>
                  <SelectItem value="operational">Operational</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Description</label>
            <Textarea
              value={reportDescription}
              onChange={(e) => setReportDescription(e.target.value)}
              placeholder="Describe what this report covers"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Section Builder */}
      <Card>
        <CardHeader>
          <CardTitle>Report Sections</CardTitle>
          <CardDescription>
            Add and configure sections for your report
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Add Section Buttons */}
          <div className="flex flex-wrap gap-2 mb-6">
            {sectionTypes.map(({ value, label, icon: Icon, description }) => (
              <Button
                key={value}
                variant="outline"
                size="sm"
                onClick={() => addSection(value as ReportSection['type'])}
              >
                <Icon className="h-4 w-4 mr-2" />
                Add {label}
              </Button>
            ))}
          </div>

          {/* Sections List */}
          <div className="space-y-4">
            {sections.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No sections added yet</p>
                <p className="text-sm">Add sections to build your report</p>
              </div>
            ) : (
              sections.map((section) => (
                <Card key={section.id} className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary">{section.type}</Badge>
                        <Input
                          value={section.title}
                          onChange={(e) => updateSection(section.id, { title: e.target.value })}
                          className="font-medium border-none p-0 h-auto bg-transparent"
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSection(section.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {renderSectionConfig(section)}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-800">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-end space-x-2">
        <Button variant="outline">
          <Eye className="h-4 w-4 mr-2" />
          Preview
        </Button>
        <Button onClick={saveReport} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Template'}
        </Button>
      </div>
    </div>
  );
}