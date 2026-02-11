/**
 * WhatsApp Template Management Dashboard
 * Requirements: 5.4 - Comprehensive template management with approval workflows and compliance tracking
 */

'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Bell, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  BarChart3,
  FileText,
  Users,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { WhatsAppTemplate } from '@/lib/types/whatsapp';
import { TemplateManager } from './TemplateManager';
import { TemplateEditor } from './TemplateEditor';
import { ApprovalWorkflow } from './ApprovalWorkflow';
import { ComplianceTracker } from './ComplianceTracker';

interface TemplateManagementDashboardProps {
  tenantId: string;
  userId: string;
  userRole: string;
}

interface DashboardStats {
  totalTemplates: number;
  approvedTemplates: number;
  pendingApproval: number;
  rejectedTemplates: number;
  complianceScore: number;
}

interface PendingApproval {
  template: WhatsAppTemplate;
  compliance: {
    overallScore: number;
    issues: Array<{
      type: 'error' | 'warning' | 'info';
      message: string;
    }>;
  };
}

export function TemplateManagementDashboard({ 
  tenantId, 
  userId, 
  userRole 
}: TemplateManagementDashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedTemplate, setSelectedTemplate] = useState<WhatsAppTemplate | null>(null);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showComplianceDialog, setShowComplianceDialog] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [tenantId]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load dashboard statistics
      await Promise.all([
        loadStats(),
        loadPendingApprovals()
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/whatsapp/templates', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load templates');
      }

      const data = await response.json();
      const templates = data.templates || [];

      const stats: DashboardStats = {
        totalTemplates: templates.length,
        approvedTemplates: templates.filter((t: WhatsAppTemplate) => t.status === 'APPROVED').length,
        pendingApproval: templates.filter((t: WhatsAppTemplate) => t.approval_status === 'PENDING').length,
        rejectedTemplates: templates.filter((t: WhatsAppTemplate) => t.status === 'REJECTED').length,
        complianceScore: templates.length > 0 
          ? Math.round((templates.filter((t: WhatsAppTemplate) => t.status === 'APPROVED').length / templates.length) * 100)
          : 100
      };

      setStats(stats);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const loadPendingApprovals = async () => {
    if (!['admin', 'manager'].includes(userRole)) {
      return;
    }

    try {
      const response = await fetch('/api/whatsapp/templates/pending-approval', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load pending approvals');
      }

      const data = await response.json();
      setPendingApprovals(data.templates || []);
    } catch (error) {
      console.error('Failed to load pending approvals:', error);
    }
  };

  const handleApproveTemplate = async (templateId: string, action: 'approve' | 'reject', reason?: string) => {
    try {
      const response = await fetch(`/api/whatsapp/templates/${templateId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, reason }),
      });

      if (!response.ok) {
        throw new Error('Failed to update approval status');
      }

      // Reload data
      await loadDashboardData();
      setShowApprovalDialog(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update approval status');
    }
  };

  const handleViewCompliance = (template: WhatsAppTemplate) => {
    setSelectedTemplate(template);
    setShowComplianceDialog(true);
  };

  const handleViewApproval = (template: WhatsAppTemplate) => {
    setSelectedTemplate(template);
    setShowApprovalDialog(true);
  };

  const getStatIcon = (type: string) => {
    switch (type) {
      case 'total':
        return <FileText className="w-5 h-5 text-blue-600" />;
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'compliance':
        return <BarChart3 className="w-5 h-5 text-purple-600" />;
      default:
        return <FileText className="w-5 h-5 text-gray-600" />;
    }
  };

  const getComplianceColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
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
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Template Management</h1>
          <p className="text-gray-600">Manage WhatsApp templates with approval workflows and compliance tracking</p>
        </div>
        {pendingApprovals.length > 0 && ['admin', 'manager'].includes(userRole) && (
          <Badge variant="outline" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            {pendingApprovals.length} Pending Approval
          </Badge>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* Dashboard Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Templates</p>
                  <p className="text-2xl font-bold">{stats.totalTemplates}</p>
                </div>
                {getStatIcon('total')}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Approved</p>
                  <p className="text-2xl font-bold text-green-600">{stats.approvedTemplates}</p>
                </div>
                {getStatIcon('approved')}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pendingApproval}</p>
                </div>
                {getStatIcon('pending')}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Rejected</p>
                  <p className="text-2xl font-bold text-red-600">{stats.rejectedTemplates}</p>
                </div>
                {getStatIcon('rejected')}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Compliance</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.complianceScore}%</p>
                </div>
                {getStatIcon('compliance')}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          {['admin', 'manager'].includes(userRole) && (
            <TabsTrigger value="approvals">
              Approvals
              {pendingApprovals.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {pendingApprovals.length}
                </Badge>
              )}
            </TabsTrigger>
          )}
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button className="flex items-center gap-2 h-auto p-4">
                  <Plus className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-medium">Create Template</div>
                    <div className="text-sm opacity-90">Start with a new template</div>
                  </div>
                </Button>
                
                {['admin', 'manager'].includes(userRole) && pendingApprovals.length > 0 && (
                  <Button variant="outline" className="flex items-center gap-2 h-auto p-4">
                    <Bell className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-medium">Review Approvals</div>
                      <div className="text-sm opacity-90">{pendingApprovals.length} templates pending</div>
                    </div>
                  </Button>
                )}
                
                <Button variant="outline" className="flex items-center gap-2 h-auto p-4">
                  <BarChart3 className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-medium">View Analytics</div>
                    <div className="text-sm opacity-90">Template performance</div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingApprovals.slice(0, 3).map((item) => (
                  <div key={item.template.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-yellow-600" />
                      <div>
                        <p className="font-medium">{item.template.name}</p>
                        <p className="text-sm text-gray-600">Submitted for approval</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getComplianceColor(item.compliance.overallScore)}>
                        {item.compliance.overallScore}%
                      </Badge>
                      {['admin', 'manager'].includes(userRole) && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleViewApproval(item.template)}
                        >
                          Review
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                
                {pendingApprovals.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No recent activity</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <TemplateManager
            tenantId={tenantId}
            userId={userId}
            userRole={userRole}
          />
        </TabsContent>

        {['admin', 'manager'].includes(userRole) && (
          <TabsContent value="approvals" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Pending Approvals ({pendingApprovals.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pendingApprovals.length > 0 ? (
                  <div className="space-y-4">
                    {pendingApprovals.map((item) => (
                      <div key={item.template.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-medium">{item.template.name}</h4>
                            <p className="text-sm text-gray-600">{item.template.category}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Created: {new Date(item.template.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge className={getComplianceColor(item.compliance.overallScore)}>
                            {item.compliance.overallScore}% Compliant
                          </Badge>
                        </div>

                        {item.compliance.issues.length > 0 && (
                          <div className="mb-3">
                            <p className="text-sm font-medium text-gray-700 mb-1">Issues:</p>
                            <div className="space-y-1">
                              {item.compliance.issues.slice(0, 2).map((issue, index) => (
                                <p key={index} className="text-xs text-red-600 flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3" />
                                  {issue.message}
                                </p>
                              ))}
                              {item.compliance.issues.length > 2 && (
                                <p className="text-xs text-gray-500">
                                  +{item.compliance.issues.length - 2} more issues
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            onClick={() => handleViewApproval(item.template)}
                          >
                            Review & Approve
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleViewCompliance(item.template)}
                          >
                            View Compliance
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <CheckCircle className="w-12 h-12 mx-auto text-green-600 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">All caught up!</h3>
                    <p className="text-gray-600">No templates pending approval.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="compliance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Compliance Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <BarChart3 className="w-12 h-12 mx-auto text-purple-600 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Compliance Dashboard</h3>
                <p className="text-gray-600 mb-4">
                  Overall compliance score: <span className="font-bold text-purple-600">{stats?.complianceScore}%</span>
                </p>
                <p className="text-sm text-gray-500">
                  Select a template from the Templates tab to view detailed compliance information.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Template Approval</DialogTitle>
          </DialogHeader>
          {selectedTemplate && (
            <ApprovalWorkflow
              template={selectedTemplate}
              onApprovalUpdated={() => {
                setShowApprovalDialog(false);
                loadDashboardData();
              }}
              onCancel={() => setShowApprovalDialog(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Compliance Dialog */}
      <Dialog open={showComplianceDialog} onOpenChange={setShowComplianceDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Compliance Tracking</DialogTitle>
          </DialogHeader>
          {selectedTemplate && (
            <ComplianceTracker template={selectedTemplate} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}