/**
 * WhatsApp Template Editor Component
 * Requirements: 5.4 - Template creation and management
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Save, X, Plus, Trash2, Eye, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  WhatsAppTemplate, 
  WhatsAppTemplateCategory,
  WhatsAppTemplateComponent,
  WhatsAppTemplateButton,
  WhatsAppButtonType
} from '@/lib/types/whatsapp';
import { TemplatePreview } from './TemplatePreview';

interface TemplateEditorProps {
  template?: WhatsAppTemplate | null;
  onSave: () => void;
  onCancel: () => void;
}

interface TemplateFormData {
  name: string;
  category: WhatsAppTemplateCategory;
  language: string;
  header?: WhatsAppTemplateComponent;
  body: WhatsAppTemplateComponent;
  footer?: WhatsAppTemplateComponent;
  buttons: WhatsAppTemplateButton[];
}

export function TemplateEditor({ template, onSave, onCancel }: TemplateEditorProps) {
  const [formData, setFormData] = useState<TemplateFormData>({
    name: '',
    category: 'UTILITY',
    language: 'en_US',
    body: {
      type: 'BODY',
      text: ''
    },
    buttons: []
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Initialize form data when template prop changes
  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name,
        category: template.category,
        language: template.language,
        header: template.header,
        body: template.body,
        footer: template.footer,
        buttons: template.buttons || []
      });
    } else {
      // Reset form for new template
      setFormData({
        name: '',
        category: 'UTILITY',
        language: 'en_US',
        body: {
          type: 'BODY',
          text: ''
        },
        buttons: []
      });
    }
    setErrors({});
  }, [template]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate template name
    if (!formData.name.trim()) {
      newErrors.name = 'Template name is required';
    } else if (!/^[a-z0-9_]+$/.test(formData.name)) {
      newErrors.name = 'Template name must contain only lowercase letters, numbers, and underscores';
    } else if (formData.name.length > 512) {
      newErrors.name = 'Template name must be 512 characters or less';
    }

    // Validate body text
    if (!formData.body.text?.trim()) {
      newErrors.bodyText = 'Body text is required';
    }

    // Validate header text if header exists
    if (formData.header && formData.header.format === 'TEXT' && !formData.header.text?.trim()) {
      newErrors.headerText = 'Header text is required when header format is TEXT';
    }

    // Validate buttons
    formData.buttons.forEach((button, index) => {
      if (!button.text.trim()) {
        newErrors[`button_${index}_text`] = 'Button text is required';
      }
      if (button.type === 'URL' && !button.url?.trim()) {
        newErrors[`button_${index}_url`] = 'URL is required for URL buttons';
      }
      if (button.type === 'PHONE_NUMBER' && !button.phone_number?.trim()) {
        newErrors[`button_${index}_phone`] = 'Phone number is required for phone buttons';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      const url = template 
        ? `/api/whatsapp/templates/${template.id}`
        : '/api/whatsapp/templates';
      
      const method = template ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save template');
      }

      onSave();
    } catch (error) {
      setErrors({
        submit: error instanceof Error ? error.message : 'Failed to save template'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddButton = () => {
    if (formData.buttons.length >= 3) {
      setErrors({ buttons: 'Maximum 3 buttons allowed' });
      return;
    }

    setFormData(prev => ({
      ...prev,
      buttons: [...prev.buttons, {
        type: 'QUICK_REPLY',
        text: ''
      }]
    }));
  };

  const handleRemoveButton = (index: number) => {
    setFormData(prev => ({
      ...prev,
      buttons: prev.buttons.filter((_, i) => i !== index)
    }));
  };

  const handleButtonChange = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      buttons: prev.buttons.map((button, i) => 
        i === index ? { ...button, [field]: value } : button
      )
    }));
  };

  const handleAddHeader = () => {
    setFormData(prev => ({
      ...prev,
      header: {
        type: 'HEADER',
        format: 'TEXT',
        text: ''
      }
    }));
  };

  const handleRemoveHeader = () => {
    setFormData(prev => ({
      ...prev,
      header: undefined
    }));
  };

  const handleAddFooter = () => {
    setFormData(prev => ({
      ...prev,
      footer: {
        type: 'FOOTER',
        text: ''
      }
    }));
  };

  const handleRemoveFooter = () => {
    setFormData(prev => ({
      ...prev,
      footer: undefined
    }));
  };

  const getParameterCount = (text: string): number => {
    const matches = text.match(/\{\{\d+\}\}/g);
    return matches ? matches.length : 0;
  };

  const getPreviewTemplate = (): WhatsAppTemplate => {
    return {
      id: template?.id || 'preview',
      tenant_id: 'preview',
      name: formData.name || 'preview_template',
      category: formData.category,
      language: formData.language,
      status: 'PENDING',
      header: formData.header,
      body: formData.body,
      footer: formData.footer,
      buttons: formData.buttons,
      approval_status: 'PENDING',
      created_by: 'preview',
      created_at: new Date(),
      updated_at: new Date()
    };
  };

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {errors.submit && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-800">{errors.submit}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="editor" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="editor">Editor</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="editor" className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Template Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="hello_world"
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-600 mt-1">{errors.name}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Only lowercase letters, numbers, and underscores allowed
                  </p>
                </div>

                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value: WhatsAppTemplateCategory) => 
                      setFormData(prev => ({ ...prev, category: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MARKETING">Marketing</SelectItem>
                      <SelectItem value="UTILITY">Utility</SelectItem>
                      <SelectItem value="AUTHENTICATION">Authentication</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="language">Language</Label>
                  <Select 
                    value={formData.language} 
                    onValueChange={(value) => 
                      setFormData(prev => ({ ...prev, language: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en_US">English (US)</SelectItem>
                      <SelectItem value="pt_BR">Portuguese (Brazil)</SelectItem>
                      <SelectItem value="es_ES">Spanish (Spain)</SelectItem>
                      <SelectItem value="fr_FR">French (France)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Header Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Header (Optional)</CardTitle>
              {!formData.header ? (
                <Button variant="outline" size="sm" onClick={handleAddHeader}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Header
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={handleRemoveHeader}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remove Header
                </Button>
              )}
            </CardHeader>
            {formData.header && (
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="headerFormat">Header Format</Label>
                  <Select 
                    value={formData.header.format || 'TEXT'} 
                    onValueChange={(value) => 
                      setFormData(prev => ({
                        ...prev,
                        header: prev.header ? { ...prev.header, format: value as any } : undefined
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TEXT">Text</SelectItem>
                      <SelectItem value="IMAGE">Image</SelectItem>
                      <SelectItem value="VIDEO">Video</SelectItem>
                      <SelectItem value="DOCUMENT">Document</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.header.format === 'TEXT' && (
                  <div>
                    <Label htmlFor="headerText">Header Text</Label>
                    <Input
                      id="headerText"
                      value={formData.header.text || ''}
                      onChange={(e) => 
                        setFormData(prev => ({
                          ...prev,
                          header: prev.header ? { ...prev.header, text: e.target.value } : undefined
                        }))
                      }
                      placeholder="Header text..."
                      className={errors.headerText ? 'border-red-500' : ''}
                    />
                    {errors.headerText && (
                      <p className="text-sm text-red-600 mt-1">{errors.headerText}</p>
                    )}
                  </div>
                )}
              </CardContent>
            )}
          </Card>

          {/* Body Section */}
          <Card>
            <CardHeader>
              <CardTitle>Body *</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="bodyText">Body Text</Label>
                <Textarea
                  id="bodyText"
                  value={formData.body.text || ''}
                  onChange={(e) => 
                    setFormData(prev => ({
                      ...prev,
                      body: { ...prev.body, text: e.target.value }
                    }))
                  }
                  placeholder="Hello {{1}}, your order {{2}} is ready for pickup!"
                  rows={4}
                  className={errors.bodyText ? 'border-red-500' : ''}
                />
                {errors.bodyText && (
                  <p className="text-sm text-red-600 mt-1">{errors.bodyText}</p>
                )}
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Use {{1}}, {{2}}, etc. for dynamic parameters</span>
                  <span>Parameters: {getParameterCount(formData.body.text || '')}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Footer (Optional)</CardTitle>
              {!formData.footer ? (
                <Button variant="outline" size="sm" onClick={handleAddFooter}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Footer
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={handleRemoveFooter}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remove Footer
                </Button>
              )}
            </CardHeader>
            {formData.footer && (
              <CardContent>
                <div>
                  <Label htmlFor="footerText">Footer Text</Label>
                  <Input
                    id="footerText"
                    value={formData.footer.text || ''}
                    onChange={(e) => 
                      setFormData(prev => ({
                        ...prev,
                        footer: prev.footer ? { ...prev.footer, text: e.target.value } : undefined
                      }))
                    }
                    placeholder="Footer text..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Footer text is optional and appears at the bottom of the message
                  </p>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Buttons Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Buttons (Optional)</CardTitle>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleAddButton}
                disabled={formData.buttons.length >= 3}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Button
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {errors.buttons && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-800">{errors.buttons}</AlertDescription>
                </Alert>
              )}

              {formData.buttons.map((button, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Button {index + 1}</h4>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleRemoveButton(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Button Type</Label>
                      <Select 
                        value={button.type} 
                        onValueChange={(value: WhatsAppButtonType) => 
                          handleButtonChange(index, 'type', value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="QUICK_REPLY">Quick Reply</SelectItem>
                          <SelectItem value="URL">URL</SelectItem>
                          <SelectItem value="PHONE_NUMBER">Phone Number</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Button Text</Label>
                      <Input
                        value={button.text}
                        onChange={(e) => handleButtonChange(index, 'text', e.target.value)}
                        placeholder="Button text..."
                        className={errors[`button_${index}_text`] ? 'border-red-500' : ''}
                      />
                      {errors[`button_${index}_text`] && (
                        <p className="text-sm text-red-600 mt-1">{errors[`button_${index}_text`]}</p>
                      )}
                    </div>

                    {button.type === 'URL' && (
                      <div className="md:col-span-2">
                        <Label>URL</Label>
                        <Input
                          value={button.url || ''}
                          onChange={(e) => handleButtonChange(index, 'url', e.target.value)}
                          placeholder="https://example.com"
                          className={errors[`button_${index}_url`] ? 'border-red-500' : ''}
                        />
                        {errors[`button_${index}_url`] && (
                          <p className="text-sm text-red-600 mt-1">{errors[`button_${index}_url`]}</p>
                        )}
                      </div>
                    )}

                    {button.type === 'PHONE_NUMBER' && (
                      <div className="md:col-span-2">
                        <Label>Phone Number</Label>
                        <Input
                          value={button.phone_number || ''}
                          onChange={(e) => handleButtonChange(index, 'phone_number', e.target.value)}
                          placeholder="+1234567890"
                          className={errors[`button_${index}_phone`] ? 'border-red-500' : ''}
                        />
                        {errors[`button_${index}_phone`] && (
                          <p className="text-sm text-red-600 mt-1">{errors[`button_${index}_phone`]}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {formData.buttons.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>No buttons added. Buttons are optional but can improve user engagement.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview">
          <TemplatePreview template={getPreviewTemplate()} />
        </TabsContent>
      </Tabs>

      {/* Actions */}
      <div className="flex justify-end gap-4 pt-6 border-t">
        <Button variant="outline" onClick={onCancel}>
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Template'}
        </Button>
      </div>
    </div>
  );
}