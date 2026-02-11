'use client';

/**
 * Template Preview Component
 * 
 * Provides preview functionality for contract templates with sample data
 * and variable substitution to show how the final contract will look.
 * 
 * Requirements: 7.2 - Contract template management
 */

import React, { useState, useEffect } from 'react';
import { Eye, Download, Settings, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  TemplateWithVersions,
  TemplateVariable,
  populateTemplate,
  getTemplateVariableValue
} from '@/lib/types/contract-templates';

interface TemplatePreviewProps {
  template: TemplateWithVersions;
  onClose: () => void;
  contractData?: Record<string, any>;
  customVariables?: Record<string, any>;
}

export const TemplatePreview: React.FC<TemplatePreviewProps> = ({
  template,
  onClose,
  contractData = {},
  customVariables = {}
}) => {
  const [previewData, setPreviewData] = useState<Record<string, any>>({});
  const [previewFormat, setPreviewFormat] = useState<'html' | 'pdf'>('html');
  const [populatedContent, setPopulatedContent] = useState('');
  const [loading, setLoading] = useState(false);

  // Initialize preview data with sample values
  useEffect(() => {
    const sampleData: Record<string, any> = {
      contractor_name: 'João Silva Santos',
      contractor_cpf: '12345678901',
      contractor_email: 'joao.silva@email.com',
      contractor_phone: '(11) 99999-9999',
      address_cep: '01234567',
      address_street: 'Rua das Flores',
      address_number: '123',
      address_complement: 'Apto 45',
      address_neighborhood: 'Centro',
      address_city: 'São Paulo',
      address_state: 'SP',
      project_kwp: 5.5,
      contract_value: 35000.00,
      installation_date: '2024-06-15',
      payment_method: 'pix',
      ...contractData
    };

    // Merge with custom variables
    const initialData = { ...sampleData, ...customVariables };
    setPreviewData(initialData);
  }, [contractData, customVariables]);

  // Update populated content when data changes
  useEffect(() => {
    const content = populateTemplate(template.template_content, previewData, customVariables);
    setPopulatedContent(content);
  }, [template.template_content, previewData, customVariables]);

  const handleVariableChange = (variableName: string, value: any) => {
    setPreviewData(prev => ({
      ...prev,
      [variableName]: value
    }));
  };

  const handleGeneratePDF = async () => {
    setLoading(true);
    try {
      // TODO: Implement PDF generation
      console.log('Generating PDF preview...');
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
    } catch (error) {
      console.error('Failed to generate PDF:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPreview = async () => {
    if (previewFormat === 'pdf') {
      await handleGeneratePDF();
    } else {
      // Download HTML
      const blob = new Blob([populatedContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${template.name}_preview.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const getVariableInputType = (variable: TemplateVariable) => {
    switch (variable.type) {
      case 'number':
      case 'currency':
      case 'percentage':
        return 'number';
      case 'date':
        return 'date';
      case 'email':
        return 'email';
      case 'phone':
        return 'tel';
      default:
        return 'text';
    }
  };

  const formatVariableValue = (variable: TemplateVariable, value: any) => {
    if (!value) return '';

    switch (variable.type) {
      case 'currency':
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(Number(value));
      case 'percentage':
        return `${Number(value)}%`;
      case 'date':
        return new Date(value).toLocaleDateString('pt-BR');
      case 'boolean':
        return value ? 'Sim' : 'Não';
      default:
        return String(value);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">{template.name}</h3>
          <p className="text-sm text-gray-600">Versão {template.version}</p>
        </div>
        <div className="flex gap-2">
          <Select value={previewFormat} onValueChange={(value: 'html' | 'pdf') => setPreviewFormat(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="html">HTML</SelectItem>
              <SelectItem value="pdf">PDF</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            onClick={handleDownloadPreview}
            disabled={loading}
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Download
          </Button>
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>

      <Tabs defaultValue="preview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="preview">Visualização</TabsTrigger>
          <TabsTrigger value="variables">Variáveis</TabsTrigger>
        </TabsList>

        {/* Preview Tab */}
        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Pré-visualização do Contrato
              </CardTitle>
              <CardDescription className="text-xs">
                Visualização do template com os dados preenchidos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-6 bg-white min-h-[600px] max-h-[600px] overflow-y-auto">
                {previewFormat === 'html' ? (
                  <div 
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: populatedContent }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="text-gray-500 mb-4">
                        <Eye className="h-12 w-12 mx-auto mb-2" />
                        <p>Visualização em PDF</p>
                      </div>
                      <Button onClick={handleGeneratePDF} disabled={loading}>
                        {loading ? (
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Eye className="h-4 w-4 mr-2" />
                        )}
                        Gerar PDF
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Signature Fields Preview */}
          {template.signature_fields.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Campos de Assinatura</CardTitle>
                <CardDescription className="text-xs">
                  Posicionamento dos campos de assinatura no documento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {template.signature_fields.map((field, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium text-sm">{field.label}</div>
                        <div className="text-xs text-gray-500">
                          Tipo: {field.type} | Página: {field.position.page}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        Posição: ({field.position.x}, {field.position.y}) | 
                        Tamanho: {field.position.width}x{field.position.height}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Variables Tab */}
        <TabsContent value="variables" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Dados das Variáveis
              </CardTitle>
              <CardDescription className="text-xs">
                Edite os valores das variáveis para ver como afetam o template
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {template.template_variables.map((variable) => (
                  <div key={variable.name} className="space-y-2">
                    <Label htmlFor={`var-${variable.name}`} className="text-sm">
                      {variable.label}
                      {variable.required && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                    
                    {variable.type === 'select' && variable.options ? (
                      <Select
                        value={previewData[variable.name] || ''}
                        onValueChange={(value) => handleVariableChange(variable.name, value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma opção" />
                        </SelectTrigger>
                        <SelectContent>
                          {variable.options.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : variable.type === 'boolean' ? (
                      <Select
                        value={previewData[variable.name]?.toString() || 'false'}
                        onValueChange={(value) => handleVariableChange(variable.name, value === 'true')}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Sim</SelectItem>
                          <SelectItem value="false">Não</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        id={`var-${variable.name}`}
                        type={getVariableInputType(variable)}
                        value={previewData[variable.name] || ''}
                        onChange={(e) => handleVariableChange(variable.name, e.target.value)}
                        placeholder={variable.placeholder || variable.default_value}
                      />
                    )}
                    
                    {variable.description && (
                      <p className="text-xs text-gray-500">{variable.description}</p>
                    )}
                    
                    {/* Show formatted value for certain types */}
                    {(variable.type === 'currency' || variable.type === 'percentage' || variable.type === 'date') && 
                     previewData[variable.name] && (
                      <p className="text-xs text-blue-600">
                        Formato: {formatVariableValue(variable, previewData[variable.name])}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Variable Usage Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Resumo de Uso das Variáveis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {template.template_variables.map((variable) => {
                  const isUsed = template.template_content.includes(`{{${variable.name}}}`);
                  const currentValue = getTemplateVariableValue(variable.name, previewData, customVariables);
                  
                  return (
                    <div key={variable.name} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${isUsed ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <span className="text-sm font-medium">{variable.name}</span>
                        {variable.required && <span className="text-red-500 text-xs">*</span>}
                      </div>
                      <div className="text-sm text-gray-600 max-w-xs truncate">
                        {currentValue.startsWith('{{') ? (
                          <span className="text-red-500">Não definido</span>
                        ) : (
                          currentValue
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};