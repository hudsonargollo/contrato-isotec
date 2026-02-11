'use client';

/**
 * Contract Preview and Validation Component
 * 
 * Provides contract preview functionality with real-time validation,
 * data population from CRM, and generation options configuration.
 * 
 * Requirements: 7.1 - Automated contract generation
 */

import React, { useState, useEffect } from 'react';
import { 
  Eye, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Download, 
  Settings,
  FileText,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ContractPreview,
  ValidationResult,
  GenerationOptions,
  DEFAULT_GENERATION_OPTIONS
} from '@/lib/types/contract-generation';
import { ContractTemplate, populateTemplate } from '@/lib/types/contract-templates';
import { Lead } from '@/lib/types/crm';

interface ContractPreviewValidationProps {
  template: ContractTemplate;
  lead?: Lead;
  initialData?: Record<string, any>;
  onGenerate?: (data: ContractPreview) => void;
  onValidationChange?: (validation: ValidationResult) => void;
}

export const ContractPreviewValidation: React.FC<ContractPreviewValidationProps> = ({
  template,
  lead,
  initialData = {},
  onGenerate,
  onValidationChange
}) => {
  const [contractData, setContractData] = useState<Record<string, any>>({});
  const [variableValues, setVariableValues] = useState<Record<string, any>>({});
  const [generationOptions, setGenerationOptions] = useState<GenerationOptions>(DEFAULT_GENERATION_OPTIONS);
  const [validation, setValidation] = useState<ValidationResult>({
    valid: true,
    errors: [],
    warnings: [],
    rule_results: []
  });
  const [previewContent, setPreviewContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('preview');

  // Initialize data from lead and initial data
  useEffect(() => {
    const leadData = lead ? mapLeadToContractData(lead) : {};
    const mergedData = { ...leadData, ...initialData };
    
    setContractData(mergedData);
    
    // Initialize variable values
    const initialVariables: Record<string, any> = {};
    template.template_variables.forEach(variable => {
      if (mergedData[variable.name] !== undefined) {
        initialVariables[variable.name] = mergedData[variable.name];
      } else if (variable.default_value) {
        initialVariables[variable.name] = variable.default_value;
      }
    });
    
    setVariableValues(initialVariables);
  }, [template, lead, initialData]);

  // Update preview when data changes
  useEffect(() => {
    updatePreview();
    validateData();
  }, [contractData, variableValues, template]);

  // Notify parent of validation changes
  useEffect(() => {
    if (onValidationChange) {
      onValidationChange(validation);
    }
  }, [validation, onValidationChange]);

  const mapLeadToContractData = (lead: Lead): Record<string, any> => {
    const contactInfo = lead.contact_info as any;
    
    return {
      contractor_name: contactInfo?.name || '',
      contractor_email: contactInfo?.email || '',
      contractor_phone: contactInfo?.phone || '',
      contractor_cpf: contactInfo?.cpf || '',
      address_cep: contactInfo?.address?.cep || '',
      address_street: contactInfo?.address?.street || '',
      address_number: contactInfo?.address?.number || '',
      address_complement: contactInfo?.address?.complement || '',
      address_neighborhood: contactInfo?.address?.neighborhood || '',
      address_city: contactInfo?.address?.city || '',
      address_state: contactInfo?.address?.state || '',
      project_kwp: lead.project_details?.kwp || 0,
      contract_value: lead.project_details?.estimated_value || 0,
      installation_date: lead.project_details?.installation_date || null,
      payment_method: 'pix'
    };
  };

  const updatePreview = () => {
    const content = populateTemplate(template.template_content, contractData, variableValues);
    setPreviewContent(content);
  };

  const validateData = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual validation API call
      const mockValidation: ValidationResult = {
        valid: true,
        errors: [],
        warnings: [],
        rule_results: []
      };

      // Simple validation logic
      const errors: string[] = [];
      const warnings: string[] = [];

      // Check required variables
      template.template_variables.forEach(variable => {
        if (variable.required) {
          const value = variableValues[variable.name] || contractData[variable.name];
          if (!value || (typeof value === 'string' && value.trim() === '')) {
            errors.push(`Campo obrigatório não preenchido: ${variable.label}`);
          }
        }
      });

      // Check CPF format
      if (contractData.contractor_cpf && !/^\d{11}$/.test(contractData.contractor_cpf)) {
        errors.push('CPF deve conter exatamente 11 dígitos');
      }

      // Check email format
      if (contractData.contractor_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contractData.contractor_email)) {
        errors.push('Email deve ter um formato válido');
      }

      // Check contract value
      if (contractData.contract_value && contractData.contract_value < 1000) {
        warnings.push('Valor do contrato está abaixo do recomendado (R$ 1.000,00)');
      }

      mockValidation.errors = errors;
      mockValidation.warnings = warnings;
      mockValidation.valid = errors.length === 0;

      setValidation(mockValidation);
    } catch (error) {
      console.error('Validation failed:', error);
      setValidation({
        valid: false,
        errors: ['Erro ao validar dados'],
        warnings: [],
        rule_results: []
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVariableChange = (variableName: string, value: any) => {
    setVariableValues(prev => ({
      ...prev,
      [variableName]: value
    }));
    
    // Also update contract data for consistency
    setContractData(prev => ({
      ...prev,
      [variableName]: value
    }));
  };

  const handleGenerationOptionChange = (key: string, value: any) => {
    setGenerationOptions(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleGenerate = () => {
    if (onGenerate) {
      const previewData: ContractPreview = {
        template_id: template.id,
        contract_data: contractData,
        variable_values: variableValues,
        generation_options: generationOptions,
        preview_format: 'html'
      };
      
      onGenerate(previewData);
    }
  };

  const getVariableInputType = (variable: any) => {
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

  const formatVariableValue = (variable: any, value: any) => {
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
          <h3 className="text-lg font-semibold">Pré-visualização do Contrato</h3>
          <p className="text-sm text-gray-600">{template.name} - v{template.version}</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={validateData}
            disabled={loading}
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            Validar
          </Button>
          <Button 
            onClick={handleGenerate}
            disabled={!validation.valid}
          >
            <FileText className="h-4 w-4 mr-2" />
            Gerar Contrato
          </Button>
        </div>
      </div>

      {/* Validation Status */}
      {(validation.errors.length > 0 || validation.warnings.length > 0) && (
        <div className="space-y-2">
          {validation.errors.length > 0 && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-medium mb-1">Erros de Validação:</div>
                <ul className="list-disc list-inside space-y-1">
                  {validation.errors.map((error, index) => (
                    <li key={index} className="text-sm">{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
          
          {validation.warnings.length > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-medium mb-1">Avisos:</div>
                <ul className="list-disc list-inside space-y-1">
                  {validation.warnings.map((warning, index) => (
                    <li key={index} className="text-sm">{warning}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="preview">Visualização</TabsTrigger>
          <TabsTrigger value="data">Dados</TabsTrigger>
          <TabsTrigger value="options">Opções</TabsTrigger>
        </TabsList>

        {/* Preview Tab */}
        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Pré-visualização do Contrato
                {validation.valid ? (
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Válido
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <XCircle className="h-3 w-3 mr-1" />
                    Inválido
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-6 bg-white min-h-[600px] max-h-[600px] overflow-y-auto">
                <div 
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: previewContent }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Tab */}
        <TabsContent value="data" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Informações do Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label htmlFor="contractor_name">Nome Completo</Label>
                    <Input
                      id="contractor_name"
                      value={variableValues.contractor_name || ''}
                      onChange={(e) => handleVariableChange('contractor_name', e.target.value)}
                      placeholder="Nome completo do contratante"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contractor_cpf">CPF</Label>
                    <Input
                      id="contractor_cpf"
                      value={variableValues.contractor_cpf || ''}
                      onChange={(e) => handleVariableChange('contractor_cpf', e.target.value)}
                      placeholder="00000000000"
                      maxLength={11}
                    />
                  </div>
                  <div>
                    <Label htmlFor="contractor_email">Email</Label>
                    <Input
                      id="contractor_email"
                      type="email"
                      value={variableValues.contractor_email || ''}
                      onChange={(e) => handleVariableChange('contractor_email', e.target.value)}
                      placeholder="email@exemplo.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contractor_phone">Telefone</Label>
                    <Input
                      id="contractor_phone"
                      type="tel"
                      value={variableValues.contractor_phone || ''}
                      onChange={(e) => handleVariableChange('contractor_phone', e.target.value)}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Project Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Informações do Projeto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="project_kwp">Potência (kWp)</Label>
                  <Input
                    id="project_kwp"
                    type="number"
                    step="0.1"
                    value={variableValues.project_kwp || ''}
                    onChange={(e) => handleVariableChange('project_kwp', parseFloat(e.target.value) || 0)}
                    placeholder="5.5"
                  />
                </div>
                <div>
                  <Label htmlFor="contract_value">Valor do Contrato (R$)</Label>
                  <Input
                    id="contract_value"
                    type="number"
                    step="0.01"
                    value={variableValues.contract_value || ''}
                    onChange={(e) => handleVariableChange('contract_value', parseFloat(e.target.value) || 0)}
                    placeholder="35000.00"
                  />
                </div>
                <div>
                  <Label htmlFor="installation_date">Data de Instalação</Label>
                  <Input
                    id="installation_date"
                    type="date"
                    value={variableValues.installation_date || ''}
                    onChange={(e) => handleVariableChange('installation_date', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="payment_method">Forma de Pagamento</Label>
                  <Select
                    value={variableValues.payment_method || 'pix'}
                    onValueChange={(value) => handleVariableChange('payment_method', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="cash">Dinheiro</SelectItem>
                      <SelectItem value="credit">Cartão de Crédito</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Template Variables */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Variáveis do Template</CardTitle>
              <CardDescription className="text-xs">
                Configure os valores das variáveis específicas do template
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
                        value={variableValues[variable.name] || ''}
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
                        value={variableValues[variable.name]?.toString() || 'false'}
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
                        value={variableValues[variable.name] || ''}
                        onChange={(e) => handleVariableChange(variable.name, e.target.value)}
                        placeholder={variable.placeholder || variable.default_value}
                      />
                    )}
                    
                    {variable.description && (
                      <p className="text-xs text-gray-500">{variable.description}</p>
                    )}
                    
                    {/* Show formatted value for certain types */}
                    {(variable.type === 'currency' || variable.type === 'percentage' || variable.type === 'date') && 
                     variableValues[variable.name] && (
                      <p className="text-xs text-blue-600">
                        Formato: {formatVariableValue(variable, variableValues[variable.name])}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Options Tab */}
        <TabsContent value="options" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Output Options */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Opções de Saída
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="output_format">Formato de Saída</Label>
                  <Select
                    value={generationOptions.output_format}
                    onValueChange={(value) => handleGenerationOptionChange('output_format', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="html">HTML</SelectItem>
                      <SelectItem value="docx">Word (DOCX)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="include_attachments"
                    checked={generationOptions.include_attachments}
                    onCheckedChange={(checked) => handleGenerationOptionChange('include_attachments', checked)}
                  />
                  <Label htmlFor="include_attachments" className="text-sm">
                    Incluir anexos
                  </Label>
                </div>

                <div>
                  <Label htmlFor="watermark">Marca d'água</Label>
                  <Input
                    id="watermark"
                    value={generationOptions.watermark || ''}
                    onChange={(e) => handleGenerationOptionChange('watermark', e.target.value)}
                    placeholder="Texto da marca d'água (opcional)"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Page Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Configurações da Página</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="page_size">Tamanho da Página</Label>
                  <Select
                    value={generationOptions.page_settings.size}
                    onValueChange={(value) => handleGenerationOptionChange('page_settings', {
                      ...generationOptions.page_settings,
                      size: value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A4">A4</SelectItem>
                      <SelectItem value="Letter">Letter</SelectItem>
                      <SelectItem value="Legal">Legal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="orientation">Orientação</Label>
                  <Select
                    value={generationOptions.page_settings.orientation}
                    onValueChange={(value) => handleGenerationOptionChange('page_settings', {
                      ...generationOptions.page_settings,
                      orientation: value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="portrait">Retrato</SelectItem>
                      <SelectItem value="landscape">Paisagem</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="margin_top">Margem Superior (mm)</Label>
                    <Input
                      id="margin_top"
                      type="number"
                      value={generationOptions.page_settings.margins.top}
                      onChange={(e) => handleGenerationOptionChange('page_settings', {
                        ...generationOptions.page_settings,
                        margins: {
                          ...generationOptions.page_settings.margins,
                          top: parseInt(e.target.value) || 20
                        }
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="margin_bottom">Margem Inferior (mm)</Label>
                    <Input
                      id="margin_bottom"
                      type="number"
                      value={generationOptions.page_settings.margins.bottom}
                      onChange={(e) => handleGenerationOptionChange('page_settings', {
                        ...generationOptions.page_settings,
                        margins: {
                          ...generationOptions.page_settings.margins,
                          bottom: parseInt(e.target.value) || 20
                        }
                      })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Signature Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Configurações de Assinatura</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="require_all_signatures"
                  checked={generationOptions.signature_settings.require_all_signatures}
                  onCheckedChange={(checked) => handleGenerationOptionChange('signature_settings', {
                    ...generationOptions.signature_settings,
                    require_all_signatures: checked
                  })}
                />
                <Label htmlFor="require_all_signatures" className="text-sm">
                  Exigir todas as assinaturas
                </Label>
              </div>

              <div>
                <Label htmlFor="expiration_days">Prazo para Assinatura (dias)</Label>
                <Input
                  id="expiration_days"
                  type="number"
                  min="1"
                  max="365"
                  value={generationOptions.signature_settings.expiration_days}
                  onChange={(e) => handleGenerationOptionChange('signature_settings', {
                    ...generationOptions.signature_settings,
                    expiration_days: parseInt(e.target.value) || 30
                  })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};