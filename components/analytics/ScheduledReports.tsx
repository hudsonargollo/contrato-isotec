/**
 * Scheduled Reports Component
 * Requirements: 6.3 - Automated report generation
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Clock,
  Play,
  Pause,
  Settings,
  Mail,
  Download,
  CheckCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

interface ScheduledReportsProps {
  tenantId: string;
}

interface ScheduledReport {
  id: string;
  name: string;
  description: string;
  report_type: string;
  status: 'active' | 'paused' | 'error';
  schedule_config: {
    frequency: 'daily' | 'weekly' | 'monthly';
    time: string;
    timezone: string;
    recipients: string[];
    delivery_method: 'email' | 'webhook';
  };
  last_generated_at?: string;
  next_generation_at: string;
  created_at: string;
}

interface ReportExecution {
  id: string;
  execution_status: 'pending' | 'running' | 'completed' | 'failed';
  started_at?: string;
  completed_at?: string;
  error_message?: string;
  execution_time_ms?: number;
}

export function ScheduledReports({ tenantId }: ScheduledReportsProps) {
  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>([]);
  const [executions, setExecutions] = useState<Record<string, ReportExecution[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadScheduledReports();
  }, []);

  const loadScheduledReports = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/analytics/reports?type=scheduled');
      if (response.ok) {
        const data = await response.json();
        setScheduledReports(data.reports || []);

        // Load execution history for each report
        const executionPromises = (data.reports || []).map(async (report: ScheduledReport) => {
          const execResponse = await fetch(`/api/analytics/reports/${report.id}/executions`);
          if (execResponse.ok) {
            const execData = await execResponse.json();
            return { reportId: report.id, executions: execData.executions || [] };
          }
          return { reportId: report.id, executions: [] };
        });

        const executionResults = await Promise.all(executionPromises);
        const executionsMap = executionResults.reduce((acc, { reportId, executions }) => {
          acc[reportId] = executions;
          return acc;
        }, {} as Record<string, ReportExecution[]>);

        setExecutions(executionsMap);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load scheduled reports');
    } finally {
      setLoading(false);
    }
  };

  const toggleReportStatus = async (reportId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'paused' : 'active';
      
      const response = await fetch(`/api/analytics/reports/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        setScheduledReports(reports =>
          reports.map(report =>
            report.id === reportId ? { ...report, status: newStatus as any } : report
          )
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update report status');
    }
  };

  const runReportNow = async (reportId: string) => {
    try {
      const response = await fetch(`/api/analytics/reports/${reportId}/execute`, {
        method: 'POST'
      });

      if (response.ok) {
        // Refresh the executions for this report
        const execResponse = await fetch(`/api/analytics/reports/${reportId}/executions`);
        if (execResponse.ok) {
          const execData = await execResponse.json();
          setExecutions(prev => ({
            ...prev,
            [reportId]: execData.executions || []
          }));
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to execute report');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'paused':
        return <Pause className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getExecutionStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'running':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatFrequency = (frequency: string) => {
    return frequency.charAt(0).toUpperCase() + frequency.slice(1);
  };

  const formatNextRun = (nextRun: string) => {
    const date = new Date(nextRun);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `in ${diffDays} day${diffDays > 1 ? 's' : ''}`;
    } else if (diffHours > 0) {
      return `in ${diffHours} hour${diffHours > 1 ? 's' : ''}`;
    } else {
      return 'soon';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-800">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Scheduled Reports List */}
      <div className="space-y-4">
        {scheduledReports.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No scheduled reports configured</p>
                <p className="text-sm">Create a report template with scheduling to get started</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          scheduledReports.map((report) => (
            <Card key={report.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(report.status)}
                    <div>
                      <CardTitle className="text-lg">{report.name}</CardTitle>
                      <CardDescription>{report.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(report.status)}>
                      {report.status}
                    </Badge>
                    <Badge variant="outline">
                      {formatFrequency(report.schedule_config.frequency)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Schedule</p>
                    <p className="text-sm">
                      {formatFrequency(report.schedule_config.frequency)} at {report.schedule_config.time}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Next Run</p>
                    <p className="text-sm">
                      {formatNextRun(report.next_generation_at)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Delivery</p>
                    <div className="flex items-center space-x-1">
                      <Mail className="h-3 w-3" />
                      <p className="text-sm">
                        {report.schedule_config.recipients.length} recipient{report.schedule_config.recipients.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Recent Executions */}
                {executions[report.id] && executions[report.id].length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Recent Executions</p>
                    <div className="space-y-2">
                      {executions[report.id].slice(0, 3).map((execution) => (
                        <div key={execution.id} className="flex items-center justify-between text-sm">
                          <div className="flex items-center space-x-2">
                            {getExecutionStatusIcon(execution.execution_status)}
                            <span>
                              {execution.started_at ? 
                                new Date(execution.started_at).toLocaleDateString() : 
                                'Pending'
                              }
                            </span>
                            {execution.execution_time_ms && (
                              <span className="text-muted-foreground">
                                ({execution.execution_time_ms}ms)
                              </span>
                            )}
                          </div>
                          {execution.execution_status === 'completed' && (
                            <Button size="sm" variant="ghost">
                              <Download className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleReportStatus(report.id, report.status)}
                    >
                      {report.status === 'active' ? (
                        <>
                          <Pause className="h-4 w-4 mr-2" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Resume
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => runReportNow(report.id)}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Run Now
                    </Button>
                  </div>
                  <Button size="sm" variant="ghost">
                    <Settings className="h-4 w-4 mr-2" />
                    Configure
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}