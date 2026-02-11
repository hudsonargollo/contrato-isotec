/**
 * Screening Integration Component
 * Displays screening results integrated with CRM lead management
 * Requirements: 3.4 - Integrate screening with CRM pipeline
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  TrendingUp, 
  Users, 
  Target,
  BarChart3,
  Filter,
  Download
} from 'lucide-react';
import type { LeadWithScreening, ScreeningAnalyticsReport } from '@/lib/services/crm-screening-integration';

interface ScreeningIntegrationProps {
  tenantId: string;
  leads: LeadWithScreening[];
  onLeadSelect?: (lead: LeadWithScreening) => void;
  onQualifyLead?: (leadId: string, qualification: string) => void;
}

export function ScreeningIntegration({ 
  tenantId, 
  leads, 
  onLeadSelect, 
  onQualifyLead 
}: ScreeningIntegrationProps) {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [analyticsReport, setAnalyticsReport] = useState<ScreeningAnalyticsReport | null>(null);
  const [loading, setLoading] = useState(false);

  // Calculate overview metrics
  const totalLeads = leads.length;
  const screenedLeads = leads.filter(lead => lead.screening_result_id).length;
  const qualifiedLeads = leads.filter(lead => lead.screening_qualification === 'qualified').length;
  const avgScreeningScore = screenedLeads > 0 
    ? leads.filter(lead => lead.screening_score)
        .reduce((sum, lead) => sum + (lead.screening_score || 0), 0) / screenedLeads
    : 0;

  const getQualificationBadge = (qualification?: string) => {
    switch (qualification) {
      case 'qualified':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Qualified</Badge>;
      case 'partially_qualified':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><AlertTriangle className="w-3 h-3 mr-1" />Partially Qualified</Badge>;
      case 'not_qualified':
        return <Badge variant="destructive" className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Not Qualified</Badge>;
      default:
        return <Badge variant="outline">Not Screened</Badge>;
    }
  };

  const getFeasibilityBadge = (feasibility?: string) => {
    switch (feasibility) {
      case 'high':
        return <Badge className="bg-green-500">High</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-500">Medium</Badge>;
      case 'low':
        return <Badge className="bg-orange-500">Low</Badge>;
      case 'not_feasible':
        return <Badge variant="destructive">Not Feasible</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getRiskBadge = (risk?: string) => {
    switch (risk) {
      case 'low':
        return <Badge className="bg-green-500">Low Risk</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-500">Medium Risk</Badge>;
      case 'high':
        return <Badge className="bg-orange-500">High Risk</Badge>;
      case 'critical':
        return <Badge variant="destructive">Critical Risk</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLeads}</div>
            <p className="text-xs text-muted-foreground">
              {screenedLeads} screened ({Math.round((screenedLeads / totalLeads) * 100)}%)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Qualified Leads</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{qualifiedLeads}</div>
            <p className="text-xs text-muted-foreground">
              {screenedLeads > 0 ? Math.round((qualifiedLeads / screenedLeads) * 100) : 0}% of screened
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Screening Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(avgScreeningScore)}%</div>
            <Progress value={avgScreeningScore} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((leads.filter(l => l.status === 'closed_won').length / totalLeads) * 100)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Closed won rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="leads">Screened Leads</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="qualification">Qualification Rules</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Qualification Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Qualification Distribution</CardTitle>
                <CardDescription>Breakdown of lead qualification levels</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {['qualified', 'partially_qualified', 'not_qualified'].map(level => {
                    const count = leads.filter(l => l.screening_qualification === level).length;
                    const percentage = screenedLeads > 0 ? (count / screenedLeads) * 100 : 0;
                    return (
                      <div key={level} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getQualificationBadge(level)}
                          <span className="text-sm">{count} leads</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {Math.round(percentage)}%
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Feasibility Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Feasibility Distribution</CardTitle>
                <CardDescription>Project feasibility ratings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {['high', 'medium', 'low', 'not_feasible'].map(level => {
                    const count = leads.filter(l => l.screening_feasibility === level).length;
                    const percentage = screenedLeads > 0 ? (count / screenedLeads) * 100 : 0;
                    return (
                      <div key={level} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getFeasibilityBadge(level)}
                          <span className="text-sm">{count} leads</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {Math.round(percentage)}%
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="leads" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Screened Leads</h3>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          <div className="grid gap-4">
            {leads.filter(lead => lead.screening_result_id).map(lead => (
              <Card key={lead.id} className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => onLeadSelect?.(lead)}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-semibold">{lead.first_name} {lead.last_name}</h4>
                        {getQualificationBadge(lead.screening_qualification)}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>{lead.email}</span>
                        <span>{lead.phone}</span>
                        {lead.company && <span>{lead.company}</span>}
                      </div>
                      <div className="flex items-center space-x-2">
                        {getFeasibilityBadge(lead.screening_feasibility)}
                        {getRiskBadge(lead.screening_risk_level)}
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      <div className="text-2xl font-bold text-primary">
                        {lead.screening_score}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Screening Score
                      </div>
                      {onQualifyLead && lead.screening_qualification !== 'qualified' && (
                        <Button 
                          size="sm" 
                          onClick={(e) => {
                            e.stopPropagation();
                            onQualifyLead(lead.id, 'qualified');
                          }}
                        >
                          Qualify
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Screening Analytics</CardTitle>
              <CardDescription>Detailed analytics on screening performance and CRM impact</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Analytics dashboard coming soon</p>
                <Button className="mt-4" onClick={() => setLoading(true)}>
                  Generate Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="qualification">
          <Card>
            <CardHeader>
              <CardTitle>Qualification Rules</CardTitle>
              <CardDescription>Automated rules for qualifying leads based on screening results</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Target className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Qualification rules management coming soon</p>
                <Button className="mt-4">
                  Create Rule
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}