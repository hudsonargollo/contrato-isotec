/**
 * WhatsApp Template Preview Component
 * Requirements: 5.4 - Template message management with preview functionality
 */

'use client';

import React, { useState } from 'react';
import { Smartphone, Copy, Check, ExternalLink, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { WhatsAppTemplate, WhatsAppTemplateComponent } from '@/lib/types/whatsapp';

interface TemplatePreviewProps {
  template: WhatsAppTemplate;
  showParameterInputs?: boolean;
  onParametersChange?: (parameters: Record<string, string>) => void;
}

export function TemplatePreview({ 
  template, 
  showParameterInputs = false,
  onParametersChange 
}: TemplatePreviewProps) {
  const [parameters, setParameters] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);

  // Extract parameter placeholders from template text
  const extractParameters = (text: string): string[] => {
    const matches = text.match(/\{\{\d+\}\}/g);
    return matches ? matches.map(match => match.replace(/[{}]/g, '')) : [];
  };

  // Get all parameters from template components
  const getAllParameters = (): string[] => {
    const allParams: string[] = [];
    
    if (template.header?.text) {
      allParams.push(...extractParameters(template.header.text));
    }
    
    if (template.body.text) {
      allParams.push(...extractParameters(template.body.text));
    }
    
    if (template.footer?.text) {
      allParams.push(...extractParameters(template.footer.text));
    }
    
    // Remove duplicates and sort
    return [...new Set(allParams)].sort((a, b) => parseInt(a) - parseInt(b));
  };

  // Replace parameters in text with actual values
  const replaceParameters = (text: string): string => {
    let result = text;
    Object.entries(parameters).forEach(([key, value]) => {
      result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value || `{{${key}}}`);
    });
    return result;
  };

  const handleParameterChange = (paramKey: string, value: string) => {
    const newParameters = { ...parameters, [paramKey]: value };
    setParameters(newParameters);
    onParametersChange?.(newParameters);
  };

  const handleCopyTemplate = async () => {
    const templateText = generateTemplateText();
    try {
      await navigator.clipboard.writeText(templateText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy template:', error);
    }
  };

  const generateTemplateText = (): string => {
    let text = '';
    
    if (template.header?.text) {
      text += replaceParameters(template.header.text) + '\n\n';
    }
    
    if (template.body.text) {
      text += replaceParameters(template.body.text);
    }
    
    if (template.footer?.text) {
      text += '\n\n' + replaceParameters(template.footer.text);
    }
    
    return text;
  };

  const renderTemplateComponent = (component: WhatsAppTemplateComponent, type: string) => {
    if (!component) return null;

    const getComponentStyles = () => {
      switch (type) {
        case 'header':
          return 'font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-3';
        case 'body':
          return 'text-gray-800 leading-relaxed';
        case 'footer':
          return 'text-sm text-gray-600 border-t border-gray-200 pt-2 mt-3';
        default:
          return '';
      }
    };

    if (component.format && component.format !== 'TEXT') {
      return (
        <div className={`${getComponentStyles()} flex items-center gap-2`}>
          <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
            {component.format === 'IMAGE' && '🖼️'}
            {component.format === 'VIDEO' && '🎥'}
            {component.format === 'DOCUMENT' && '📄'}
          </div>
          <span className="text-sm text-gray-600">
            {component.format} attachment
          </span>
        </div>
      );
    }

    if (!component.text) return null;

    return (
      <div className={getComponentStyles()}>
        {replaceParameters(component.text)}
      </div>
    );
  };

  const renderButtons = () => {
    if (!template.buttons || template.buttons.length === 0) return null;

    return (
      <div className="mt-4 space-y-2">
        {template.buttons.map((button, index) => {
          const getButtonIcon = () => {
            switch (button.type) {
              case 'URL':
                return <ExternalLink className="w-4 h-4" />;
              case 'PHONE_NUMBER':
                return <MessageCircle className="w-4 h-4" />;
              default:
                return null;
            }
          };

          const getButtonColor = () => {
            switch (button.type) {
              case 'URL':
                return 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100';
              case 'PHONE_NUMBER':
                return 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100';
              default:
                return 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100';
            }
          };

          return (
            <Button
              key={index}
              variant="outline"
              className={`w-full justify-center gap-2 ${getButtonColor()}`}
              disabled
            >
              {getButtonIcon()}
              {button.text}
            </Button>
          );
        })}
      </div>
    );
  };

  const allParameters = getAllParameters();

  return (
    <div className="space-y-6">
      {/* Template Info */}
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline">{template.category}</Badge>
            <Badge variant="outline">{template.language}</Badge>
            <Badge 
              variant={template.status === 'APPROVED' ? 'default' : 'secondary'}
            >
              {template.status}
            </Badge>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyTemplate}
          className="flex items-center gap-2"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copy
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Parameter Inputs */}
        {showParameterInputs && allParameters.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Template Parameters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {allParameters.map((param) => (
                <div key={param}>
                  <Label htmlFor={`param-${param}`}>
                    Parameter {param}
                  </Label>
                  <Input
                    id={`param-${param}`}
                    value={parameters[param] || ''}
                    onChange={(e) => handleParameterChange(param, e.target.value)}
                    placeholder={`Value for {{${param}}}`}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Mobile Preview */}
        <Card className={showParameterInputs && allParameters.length > 0 ? '' : 'lg:col-span-2'}>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Smartphone className="w-4 h-4" />
              WhatsApp Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Phone Frame */}
            <div className="mx-auto max-w-sm">
              <div className="bg-gray-900 rounded-3xl p-2">
                <div className="bg-white rounded-2xl overflow-hidden">
                  {/* WhatsApp Header */}
                  <div className="bg-green-600 text-white p-3 flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <MessageCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">Business Name</div>
                      <div className="text-xs opacity-90">WhatsApp Business</div>
                    </div>
                  </div>

                  {/* Message Bubble */}
                  <div className="p-4 bg-gray-50">
                    <div className="bg-white rounded-lg p-3 shadow-sm max-w-xs ml-auto">
                      {/* Header */}
                      {template.header && renderTemplateComponent(template.header, 'header')}
                      
                      {/* Body */}
                      {renderTemplateComponent(template.body, 'body')}
                      
                      {/* Footer */}
                      {template.footer && renderTemplateComponent(template.footer, 'footer')}
                      
                      {/* Buttons */}
                      {renderButtons()}
                      
                      {/* Message Time */}
                      <div className="text-xs text-gray-500 text-right mt-2">
                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Template Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Template Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <Label className="text-gray-600">Template Name</Label>
              <p className="font-mono bg-gray-50 p-2 rounded">{template.name}</p>
            </div>
            <div>
              <Label className="text-gray-600">Category</Label>
              <p>{template.category}</p>
            </div>
            <div>
              <Label className="text-gray-600">Language</Label>
              <p>{template.language}</p>
            </div>
            <div>
              <Label className="text-gray-600">Status</Label>
              <p>{template.status}</p>
            </div>
            <div>
              <Label className="text-gray-600">Approval Status</Label>
              <p>{template.approval_status}</p>
            </div>
            <div>
              <Label className="text-gray-600">Parameters</Label>
              <p>{allParameters.length > 0 ? allParameters.join(', ') : 'None'}</p>
            </div>
          </div>

          {template.rejection_reason && (
            <div>
              <Label className="text-gray-600">Rejection Reason</Label>
              <p className="text-red-600 bg-red-50 p-2 rounded">{template.rejection_reason}</p>
            </div>
          )}

          <Separator />

          <div className="text-xs text-gray-500">
            <p>Created: {new Date(template.created_at).toLocaleString()}</p>
            <p>Updated: {new Date(template.updated_at).toLocaleString()}</p>
            {template.approved_at && (
              <p>Approved: {new Date(template.approved_at).toLocaleString()}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}