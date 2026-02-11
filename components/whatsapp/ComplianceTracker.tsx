/**
 * WhatsApp Template Compliance Tracker Component
 * Requirements: 5.4 - Template compliance tracking
 */

'use client';

import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  FileText, 
  Globe, 
  MessageSquare,
  Users,
  TrendingUp,
  Calendar,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { WhatsAppTemplate } from '@/lib/types/whatsapp';

interface ComplianceTrackerProps {
  template: WhatsAppTemplate;
}

interface ComplianceRule {
  id: string;
  name: string;
  description: string;
  category: 'technical' | 'content' | 'legal' | 'business';
  severity: 'error' | 'warning' | 'info';
  status: 'pass' | 'fail' | 'warning';
  details?: string;
  recommendation?: string;
}

interface ComplianceMetrics {
  overallScore: number;
  totalRules: number;
  passedRules: number;
  failedRules: number;
  warningRules: number;
  lastChecked: Date;
}

export function ComplianceTracker({ template }: ComplianceTrackerProps) {
  const [complianceRules, setComplianceRules] = useState<ComplianceRule[]>([]);
  const [metrics, setMetrics] = useState<ComplianceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    runComplianceCheck();
  }, [template]);

  const runComplianceCheck = async () => {
    setLoading(true);
    
    // Simulate compliance checking - in real implementation, this would call an API
    const rules = await performComplianceAnalysis(template);
    setComplianceRules(rules);
    
    const passedRules = rules.filter(rule => rule.status === 'pass').length;
    const failedRules = rules.filter(rule => rule.status === 'fail').length;
    const warningRules = rules.filter(rule => rule.status === 'warning').length;
    
    setMetrics({
      overallScore: Math.round((passedRules / rules.length) * 100),
      totalRules: rules.length,
      passedRules,
      failedRules,
      warningRules,
      lastChecked: new Date()
    });
    
    setLoading(false);
  };

  const performComplianceAnalysis = async (template: WhatsAppTemplate): Promise<ComplianceRule[]> => {
    const rules: ComplianceRule[] = [];

    // Technical Compliance Rules
    rules.push({
      id: 'naming_convention',
      name: 'Template Naming Convention',
      description: 'Template name follows WhatsApp naming requirements',
      category: 'technical',
      severity: 'error',
      status: /^[a-z0-9_]+$/.test(template.name) ? 'pass' : 'fail',
      details: template.name,
      recommendation: 'Use only lowercase letters, numbers, and underscores'
    });

    rules.push({
      id: 'name_length',
      name: 'Template Name Length',
      description: 'Template name is within allowed length limits',
      category: 'technical',
      severity: 'error',
      status: template.name.length <= 512 ? 'pass' : 'fail',
      details: `${template.name.length}/512 characters`,
      recommendation: 'Keep template name under 512 characters'
    });

    rules.push({
      id: 'body_required',
      name: 'Body Text Required',
      description: 'Template must have body text',
      category: 'technical',
      severity: 'error',
      status: template.body.text && template.body.text.trim() ? 'pass' : 'fail',
      recommendation: 'Add body text to the template'
    });

    rules.push({
      id: 'body_length',
      name: 'Body Text Length',
      description: 'Body text is within recommended length',
      category: 'technical',
      severity: 'warning',
      status: template.body.text && template.body.text.length <= 1024 ? 'pass' : 'warning',
      details: `${template.body.text?.length || 0}/1024 characters`,
      recommendation: 'Keep body text concise for better engagement'
    });

    rules.push({
      id: 'button_limit',
      name: 'Button Count Limit',
      description: 'Template has maximum 3 buttons',
      category: 'technical',
      severity: 'error',
      status: !template.buttons || template.buttons.length <= 3 ? 'pass' : 'fail',
      details: `${template.buttons?.length || 0}/3 buttons`,
      recommendation: 'Remove excess buttons to comply with WhatsApp limits'
    });

    // Content Compliance Rules
    rules.push({
      id: 'parameter_format',
      name: 'Parameter Formatting',
      description: 'Parameters are properly formatted',
      category: 'content',
      severity: 'error',
      status: validateParameterFormat(template.body.text || '') ? 'pass' : 'fail',
      recommendation: 'Use {{1}}, {{2}}, etc. for parameters'
    });

    rules.push({
      id: 'parameter_sequence',
      name: 'Parameter Sequence',
      description: 'Parameters are in sequential order',
      category: 'content',
      severity: 'warning',
      status: validateParameterSequence(template.body.text || '') ? 'pass' : 'warning',
      recommendation: 'Use parameters in sequential order starting from {{1}}'
    });

    rules.push({
      id: 'spam_indicators',
      name: 'Spam Content Check',
      description: 'Template content does not contain spam indicators',
      category: 'content',
      severity: 'warning',
      status: checkSpamIndicators(template.body.text || '') ? 'warning' : 'pass',
      recommendation: 'Avoid excessive capitalization, multiple exclamation marks, and promotional language'
    });

    // Business Compliance Rules
    rules.push({
      id: 'category_appropriate',
      name: 'Category Appropriateness',
      description: 'Template category matches content type',
      category: 'business',
      severity: 'warning',
      status: validateCategoryMatch(template) ? 'pass' : 'warning',
      recommendation: 'Ensure template category matches the content purpose'
    });

    rules.push({
      id: 'marketing_compliance',
      name: 'Marketing Template Compliance',
      description: 'Marketing templates follow promotional guidelines',
      category: 'business',
      severity: 'warning',
      status: template.category === 'MARKETING' ? validateMarketingCompliance(template) : 'pass',
      recommendation: 'Marketing templates should provide clear value and avoid aggressive sales language'
    });

    // Legal Compliance Rules
    rules.push({
      id: 'opt_out_mechanism',
      name: 'Opt-out Mechanism',
      description: 'Marketing templates include opt-out information',
      category: 'legal',
      severity: 'warning',
      status: template.category === 'MARKETING' ? checkOptOutMechanism(template) : 'pass',
      recommendation: 'Include opt-out instructions in marketing templates'
    });

    rules.push({
      id: 'data_privacy',
      name: 'Data Privacy Compliance',
      description: 'Template respects data privacy requirements',
      category: 'legal',
      severity: 'info',
      status: 'pass', // This would require more complex analysis
      recommendation: 'Ensure template complies with local data privacy laws'
    });

    return rules;
  };

  const validateParameterFormat = (text: string): boolean => {
    const parameterRegex = /\{\{\d+\}\}/g;
    const matches = text.match(parameterRegex);
    if (!matches) return true;
    
    return matches.every(match => /^\{\{\d+\}\}$/.test(match));
  };

  const validateParameterSequence = (text: string): boolean => {
    const parameterRegex = /\{\{(\d+)\}\}/g;
    const matches = [...text.matchAll(parameterRegex)];
    if (matches.length === 0) return true;
    
    const numbers = matches.map(match => parseInt(match[1])).sort((a, b) => a - b);
    return numbers[0] === 1 && numbers.every((num, index) => num === index + 1);
  };

  const checkSpamIndicators = (text: string): boolean => {
    const spamIndicators = [
      /[A-Z]{5,}/, // Excessive capitalization
      /!{3,}/, // Multiple exclamation marks
      /FREE|URGENT|LIMITED TIME/i, // Promotional language
      /\$\$+/, // Multiple dollar signs
    ];
    
    return spamIndicators.some(indicator => indicator.test(text));
  };

  const validateCategoryMatch = (template: WhatsAppTemplate): boolean => {
    const text = template.body.text?.toLowerCase() || '';
    
    switch (template.category) {
      case 'MARKETING':
        return /offer|sale|discount|promotion|deal/.test(text);
      case 'UTILITY':
        return /update|notification|reminder|confirmation|status/.test(text);
      case 'AUTHENTICATION':
        return /code|verify|otp|login|password/.test(text);
      default:
        return true;
    }
  };

  const validateMarketingCompliance = (template: WhatsAppTemplate): 'pass' | 'warning' => {
    const text = template.body.text?.toLowerCase() || '';
    const hasValue = /benefit|save|help|solution|service/.test(text);
    const isAggressive = /buy now|act fast|don't miss|hurry/.test(text);
    
    return hasValue && !isAggressive ? 'pass' : 'warning';
  };

  const checkOptOutMechanism = (template: WhatsAppTemplate): 'pass' | 'warning' => {
    const allText = [
      template.body.text,
      template.footer?.text,
      ...(template.buttons?.map(b => b.text) || [])
    ].join(' ').toLowerCase();
    
    return /stop|unsubscribe|opt.out|reply.stop/.test(allText) ? 'pass' : 'warning';
  };

  const getRuleIcon = (rule: ComplianceRule) => {
    switch (rule.status) {
      case 'pass':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'fail':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getRuleColor = (rule: ComplianceRule) => {
    switch (rule.status) {
      case 'pass':
        return 'text-green-800 bg-green-50 border-green-200';
      case 'fail':
        return 'text-red-800 bg-red-50 border-red-200';
      case 'warning':
        return 'text-yellow-800 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-800 bg-gray-50 border-gray-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'technical':
        return <FileText className="w-4 h-4" />;
      case 'content':
        return <MessageSquare className="w-4 h-4" />;
      case 'business':
        return <TrendingUp className="w-4 h-4" />;
      case 'legal':
        return <Shield className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const exportComplianceReport = () => {
    const report = {
      template: {
        name: template.name,
        category: template.category,
        status: template.status,
        approval_status: template.approval_status
      },
      metrics,
      rules: complianceRules,
      generated_at: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compliance-report-${template.name}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="text-red-800">
          Failed to load compliance data. Please try again.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Compliance Tracking
          </h3>
          <p className="text-gray-600">Template: {template.name}</p>
        </div>
        <Button variant="outline" size="sm" onClick={exportComplianceReport}>
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Compliance Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Compliance Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{metrics.overallScore}%</div>
              <div className="text-sm text-gray-600">Overall Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{metrics.passedRules}</div>
              <div className="text-sm text-gray-600">Passed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{metrics.warningRules}</div>
              <div className="text-sm text-gray-600">Warnings</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{metrics.failedRules}</div>
              <div className="text-sm text-gray-600">Failed</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Compliance Score</span>
              <span>{metrics.overallScore}%</span>
            </div>
            <Progress value={metrics.overallScore} className="h-2" />
          </div>

          <div className="text-xs text-gray-500 mt-4 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            Last checked: {metrics.lastChecked.toLocaleString()}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Rules */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="technical">Technical</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="business">Business</TabsTrigger>
          <TabsTrigger value="legal">Legal</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Compliance Rules</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {complianceRules.map((rule) => (
                  <div key={rule.id} className={`border rounded-lg p-4 ${getRuleColor(rule)}`}>
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {getRuleIcon(rule)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{rule.name}</h4>
                          <Badge variant="outline" className="text-xs">
                            {rule.category}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {rule.severity}
                          </Badge>
                        </div>
                        <p className="text-sm opacity-90 mb-2">{rule.description}</p>
                        {rule.details && (
                          <p className="text-xs font-mono bg-white bg-opacity-50 p-1 rounded">
                            {rule.details}
                          </p>
                        )}
                        {rule.recommendation && rule.status !== 'pass' && (
                          <p className="text-xs mt-2 font-medium">
                            💡 {rule.recommendation}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {['technical', 'content', 'business', 'legal'].map((category) => (
          <TabsContent key={category} value={category} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 capitalize">
                  {getCategoryIcon(category)}
                  {category} Compliance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {complianceRules
                    .filter(rule => rule.category === category)
                    .map((rule) => (
                      <div key={rule.id} className={`border rounded-lg p-4 ${getRuleColor(rule)}`}>
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5">
                            {getRuleIcon(rule)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium">{rule.name}</h4>
                              <Badge variant="outline" className="text-xs">
                                {rule.severity}
                              </Badge>
                            </div>
                            <p className="text-sm opacity-90 mb-2">{rule.description}</p>
                            {rule.details && (
                              <p className="text-xs font-mono bg-white bg-opacity-50 p-1 rounded mb-2">
                                {rule.details}
                              </p>
                            )}
                            {rule.recommendation && rule.status !== 'pass' && (
                              <p className="text-xs font-medium">
                                💡 {rule.recommendation}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Action Recommendations */}
      {metrics.failedRules > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-red-800">
            <strong>Action Required:</strong> This template has {metrics.failedRules} compliance failures that must be addressed before approval.
          </AlertDescription>
        </Alert>
      )}

      {metrics.warningRules > 0 && metrics.failedRules === 0 && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-yellow-800">
            <strong>Recommendations:</strong> This template has {metrics.warningRules} warnings that should be reviewed for optimal compliance.
          </AlertDescription>
        </Alert>
      )}

      {metrics.failedRules === 0 && metrics.warningRules === 0 && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription className="text-green-800">
            <strong>Excellent!</strong> This template passes all compliance checks and is ready for approval.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}