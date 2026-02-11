/**
 * Custom Dashboard Component
 * Requirements: 6.1 - Analytics data collection system
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Plus, 
  Settings, 
  Trash2, 
  Edit, 
  Save,
  RefreshCw,
  BarChart3,
  PieChart,
  TrendingUp,
  Activity
} from 'lucide-react';
import { MetricsChart } from './MetricsChart';
import type { AnalyticsDashboard, DashboardWidget, TimeRange } from '@/lib/types/analytics';

interface CustomDashboardProps {
  tenantId: string;
}

interface DashboardFormData {
  name: string;
  description: string;
  is_public: boolean;
}

interface WidgetFormData {
  type: 'metric' | 'chart' | 'table' | 'funnel' | 'cohort';
  title: string;
  metric_name: string;
  chart_type: 'line' | 'bar' | 'pie' | 'area' | 'scatter';
  time_range: TimeRange;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export function CustomDashboard({ tenantId }: CustomDashboardProps) {
  const [dashboards, setDashboards] = useState<AnalyticsDashboard[]>([]);
  const [selectedDashboard, setSelectedDashboard] = useState<AnalyticsDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showWidgetDialog, setShowWidgetDialog] = useState(false);
  const [editingWidget, setEditingWidget] = useState<DashboardWidget | null>(null);

  const [dashboardForm, setDashboardForm] = useState<DashboardFormData>({
    name: '',
    description: '',
    is_public: false
  });

  const [widgetForm, setWidgetForm] = useState<WidgetFormData>({
    type: 'chart',
    title: '',
    metric_name: '',
    chart_type: 'line',
    time_range: { type: 'relative', relative: { amount: 24, unit: 'hours' } },
    position: { x: 0, y: 0, width: 6, height: 4 }
  });

  useEffect(() => {
    loadDashboards();
  }, []);

  const loadDashboards = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/analytics/dashboards');
      if (!response.ok) {
        throw new Error('Failed to load dashboards');
      }

      const data = await response.json();
      setDashboards(data.dashboards || []);
      
      if (data.dashboards?.length > 0 && !selectedDashboard) {
        setSelectedDashboard(data.dashboards[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboards');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDashboard = async () => {
    try {
      const response = await fetch('/api/analytics/dashboards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...dashboardForm,
          config: {
            layout: { columns: 12, rows: 8, grid_size: 20 },
            widgets: [],
            filters: [],
            refresh_interval: 30000
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create dashboard');
      }

      const newDashboard = await response.json();
      setDashboards([...dashboards, newDashboard]);
      setSelectedDashboard(newDashboard);
      setShowCreateDialog(false);
      setDashboardForm({ name: '', description: '', is_public: false });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create dashboard');
    }
  };

  const handleAddWidget = async () => {
    if (!selectedDashboard) return;

    try {
      const newWidget: DashboardWidget = {
        id: crypto.randomUUID(),
        type: widgetForm.type,
        title: widgetForm.title,
        position: widgetForm.position,
        config: {
          metric_name: widgetForm.metric_name,
          chart_type: widgetForm.chart_type,
          time_range: widgetForm.time_range
        }
      };

      const updatedConfig = {
        ...selectedDashboard.config,
        widgets: [...selectedDashboard.config.widgets, newWidget]
      };

      const response = await fetch(`/api/analytics/dashboards/${selectedDashboard.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: updatedConfig })
      });

      if (!response.ok) {
        throw new Error('Failed to add widget');
      }

      const updatedDashboard = await response.json();
      setSelectedDashboard(updatedDashboard);
      setDashboards(dashboards.map(d => d.id === updatedDashboard.id ? updatedDashboard : d));
      setShowWidgetDialog(false);
      resetWidgetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add widget');
    }
  };

  const handleDeleteWidget = async (widgetId: string) => {
    if (!selectedDashboard) return;

    try {
      const updatedConfig = {
        ...selectedDashboard.config,
        widgets: selectedDashboard.config.widgets.filter(w => w.id !== widgetId)
      };

      const response = await fetch(`/api/analytics/dashboards/${selectedDashboard.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: updatedConfig })
      });

      if (!response.ok) {
        throw new Error('Failed to delete widget');
      }

      const updatedDashboard = await response.json();
      setSelectedDashboard(updatedDashboard);
      setDashboards(dashboards.map(d => d.id === updatedDashboard.id ? updatedDashboard : d));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete widget');
    }
  };

  const resetWidgetForm = () => {
    setWidgetForm({
      type: 'chart',
      title: '',
      metric_name: '',
      chart_type: 'line',
      time_range: { type: 'relative', relative: { amount: 24, unit: 'hours' } },
      position: { x: 0, y: 0, width: 6, height: 4 }
    });
    setEditingWidget(null);
  };

  const getWidgetIcon = (type: string) => {
    switch (type) {
      case 'chart':
        return <BarChart3 className="h-4 w-4" />;
      case 'metric':
        return <Activity className="h-4 w-4" />;
      case 'table':
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <PieChart className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Select
            value={selectedDashboard?.id || ''}
            onValueChange={(value) => {
              const dashboard = dashboards.find(d => d.id === value);
              setSelectedDashboard(dashboard || null);
            }}
          >
            <SelectTrigger className="w-[300px]">
              <SelectValue placeholder="Select a dashboard" />
            </SelectTrigger>
            <SelectContent>
              {dashboards.map((dashboard) => (
                <SelectItem key={dashboard.id} value={dashboard.id}>
                  {dashboard.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {selectedDashboard && (
            <div className="text-sm text-muted-foreground">
              {selectedDashboard.description}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                New Dashboard
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Dashboard</DialogTitle>
                <DialogDescription>
                  Create a new custom analytics dashboard
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={dashboardForm.name}
                    onChange={(e) => setDashboardForm({ ...dashboardForm, name: e.target.value })}
                    placeholder="Dashboard name"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={dashboardForm.description}
                    onChange={(e) => setDashboardForm({ ...dashboardForm, description: e.target.value })}
                    placeholder="Dashboard description"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreateDashboard}>Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {selectedDashboard && (
            <Dialog open={showWidgetDialog} onOpenChange={setShowWidgetDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Widget
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add Widget</DialogTitle>
                  <DialogDescription>
                    Add a new widget to your dashboard
                  </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="widget-title">Title</Label>
                    <Input
                      id="widget-title"
                      value={widgetForm.title}
                      onChange={(e) => setWidgetForm({ ...widgetForm, title: e.target.value })}
                      placeholder="Widget title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="widget-type">Type</Label>
                    <Select
                      value={widgetForm.type}
                      onValueChange={(value: any) => setWidgetForm({ ...widgetForm, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="chart">Chart</SelectItem>
                        <SelectItem value="metric">Metric</SelectItem>
                        <SelectItem value="table">Table</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="metric-name">Metric</Label>
                    <Select
                      value={widgetForm.metric_name}
                      onValueChange={(value) => setWidgetForm({ ...widgetForm, metric_name: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select metric" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="event_count">Event Count</SelectItem>
                        <SelectItem value="api_request_count">API Requests</SelectItem>
                        <SelectItem value="api_response_time">Response Time</SelectItem>
                        <SelectItem value="daily_active_users">Active Users</SelectItem>
                        <SelectItem value="api_error_count">Error Count</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="chart-type">Chart Type</Label>
                    <Select
                      value={widgetForm.chart_type}
                      onValueChange={(value: any) => setWidgetForm({ ...widgetForm, chart_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="line">Line</SelectItem>
                        <SelectItem value="bar">Bar</SelectItem>
                        <SelectItem value="pie">Pie</SelectItem>
                        <SelectItem value="area">Area</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleAddWidget}>Add Widget</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-800">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Dashboard Content */}
      {selectedDashboard ? (
        <div className="space-y-6">
          {selectedDashboard.config.widgets.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-64">
                <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No widgets yet</h3>
                <p className="text-muted-foreground mb-4">
                  Add your first widget to start building your dashboard
                </p>
                <Button onClick={() => setShowWidgetDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Widget
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {selectedDashboard.config.widgets.map((widget) => (
                <Card key={widget.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-base">
                        {getWidgetIcon(widget.type)}
                        {widget.title}
                      </CardTitle>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingWidget(widget);
                            setShowWidgetDialog(true);
                          }}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteWidget(widget.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {widget.type === 'chart' && widget.config.metric_name && (
                      <MetricsChart
                        type={widget.config.chart_type || 'line'}
                        metric={widget.config.metric_name}
                        timeRange={widget.config.time_range || { type: 'relative', relative: { amount: 24, unit: 'hours' } }}
                        height={200}
                      />
                    )}
                    {widget.type === 'metric' && (
                      <div className="text-center">
                        <div className="text-3xl font-bold">--</div>
                        <div className="text-sm text-muted-foreground">
                          {widget.config.metric_name}
                        </div>
                      </div>
                    )}
                    {widget.type === 'table' && (
                      <div className="text-center text-muted-foreground">
                        Table widget coming soon
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <Settings className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No dashboards</h3>
            <p className="text-muted-foreground mb-4">
              Create your first custom dashboard to get started
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Dashboard
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}