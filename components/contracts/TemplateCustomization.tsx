'use client';

/**
 * Template Customization Component
 * 
 * Allows tenants to customize contract templates with their own styling,
 * variables, and content overrides while maintaining the base template structure.
 * 
 * Requirements: 7.2 - Contract template management
 */

import React, { useState, useEffect } from 'react';
import { Save, X, Palette, Type, Settings, Eye, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { 
  TemplateWithVersions,
  ContractTemplateCustomization,
  CreateTemplateCustomization,
  UpdateTemplateCustomization
} from '@/lib/types/contract-templates';

interface TemplateCustomizationProps {
  template: TemplateWithVersions;
  onSave: (customization: CreateTemplateCustomization | UpdateTemplateCustomization) => void;
  onCancel: () => void;
}

export const TemplateCustomization: React.FC<TemplateCustomizationProps> = ({
  template,
  onSave,
  onCancel
}) => {
  const [customization, setCustomization] = useState<CreateTemplateCustomization>({
    tenant_id: template.tenant_id,
    template_id: template.id,
    custom_variables: {},
    custom_styling: {
      colors: {},
      fonts: {},
      layout: {},
      custom_css: ''
    },
    custom_content_overrides: {},
    is_active: true
  });

  const [showPreview, setShowPreview] = useState(false);
  const [activeTab, setActiveTab] = useState('styling');

  // Initialize customization data if it exists
  useEffect(() => {
    if (template.customization) {
      setCustomization({
        tenant_id: template.customization.tenant_id,
        template_id: template.customization.template_id,
        custom_variables: template.customization.custom_variables,
        custom_styling: template.customization.custom_styling,
        custom_content_overrides: template.customization.custom_content_overrides,
        is_active: template.customization.is_active
      });
    }
  }, [template.customization]);

  const handleSave = () => {
    if (template.customization) {
      // Update existing customization
      const updateData: UpdateTemplateCustomization = { ...customization };
      delete (updateData as any).tenant_id;
      delete (updateData as any).template_id;
      onSave(updateData);
    } else {
      // Create new customization
      onSave(customization);
    }
  };

  const handleColorChange = (colorKey: string, value: string) => {
    setCustomization(prev => ({
      ...prev,
      custom_styling: {
        ...prev.custom_styling,
        colors: {
          ...prev.custom_styling.colors,
          [colorKey]: value
        }
      }
    }));
  };

  const handleFontChange = (fontKey: string, value: string) => {
    setCustomization(prev => ({
      ...prev,
      custom_styling: {
        ...prev.custom_styling,
        fonts: {
          ...prev.custom_styling.fonts,
          [fontKey]: value
        }
      }
    }));
  };

  const handleLayoutChange = (layoutKey: string, value: string) => {
    setCustomization(prev => ({
      ...prev,
      custom_styling: {
        ...prev.custom_styling,
        layout: {
          ...prev.custom_styling.layout,
          [layoutKey]: value
        }
      }
    }));
  };

  const handleCustomCSSChange = (value: string) => {
    setCustomization(prev => ({
      ...prev,
      custom_styling: {
        ...prev.custom_styling,
        custom_css: value
      }
    }));
  };

  const handleVariableOverride = (variableName: string, value: any) => {
    setCustomization(prev => ({
      ...prev,
      custom_variables: {
        ...prev.custom_variables,
        [variableName]: value
      }
    }));
  };

  const handleContentOverride = (sectionKey: string, value: string) => {
    setCustomization(prev => ({
      ...prev,
      custom_content_overrides: {
        ...prev.custom_content_overrides,
        [sectionKey]: value
      }
    }));
  };

  const resetCustomization = () => {
    setCustomization({
      tenant_id: template.tenant_id,
      template_id: template.id,
      custom_variables: {},
      custom_styling: {
        colors: {},
        fonts: {},
        layout: {},
        custom_css: ''
      },
      custom_content_overrides: {},
      is_active: true
    });
  };

  const getPreviewStyles = () => {
    const colors = customization.custom_styling.colors || {};
    const fonts = customization.custom_styling.fonts || {};
    const layout = customization.custom_styling.layout || {};
    
    return {
      color: colors.text || '#1f2937',
      backgroundColor: colors.background || '#ffffff',
      fontFamily: fonts.primary || 'system-ui',
      fontSize: fonts.size_base || '14px',
      lineHeight: layout.line_height || '1.5',
      padding: layout.padding || '1rem',
      margin: layout.margin || '0'
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Personalizar Template</h3>
          <p className="text-sm text-gray-600">{template.name} - v{template.version}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowPreview(!showPreview)}>
            <Eye className="h-4 w-4 mr-2" />
            {showPreview ? 'Ocultar' : 'Visualizar'}
          </Button>
          <Button variant="outline" onClick={resetCustomization}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Resetar
          </Button>
          <Button variant="outline" onClick={onCancel}>
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Salvar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customization Panel */}
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="styling">Estilo</TabsTrigger>
              <TabsTrigger value="variables">Variáveis</TabsTrigger>
              <TabsTrigger value="content">Conteúdo</TabsTrigger>
            </TabsList>

            {/* Styling Tab */}
            <TabsContent value="styling" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    Cores
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Personalize as cores do template
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="primary-color">Cor Primária</Label>
                      <div className="flex gap-2">
                        <Input
                          id="primary-color"
                          type="color"
                          value={customization.custom_styling.colors?.primary || '#2563eb'}
                          onChange={(e) => handleColorChange('primary', e.target.value)}
                          className="w-16 h-10 p-1"
                        />
                        <Input
                          value={customization.custom_styling.colors?.primary || '#2563eb'}
                          onChange={(e) => handleColorChange('primary', e.target.value)}
                          placeholder="#2563eb"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="secondary-color">Cor Secundária</Label>
                      <div className="flex gap-2">
                        <Input
                          id="secondary-color"
                          type="color"
                          value={customization.custom_styling.colors?.secondary || '#64748b'}
                          onChange={(e) => handleColorChange('secondary', e.target.value)}
                          className="w-16 h-10 p-1"
                        />
                        <Input
                          value={customization.custom_styling.colors?.secondary || '#64748b'}
                          onChange={(e) => handleColorChange('secondary', e.target.value)}
                          placeholder="#64748b"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="accent-color">Cor de Destaque</Label>
                      <div className="flex gap-2">
                        <Input
                          id="accent-color"
                          type="color"
                          value={customization.custom_styling.colors?.accent || '#10b981'}
                          onChange={(e) => handleColorChange('accent', e.target.value)}
                          className="w-16 h-10 p-1"
                        />
                        <Input
                          value={customization.custom_styling.colors?.accent || '#10b981'}
                          onChange={(e) => handleColorChange('accent', e.target.value)}
                          placeholder="#10b981"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="text-color">Cor do Texto</Label>
                      <div className="flex gap-2">
                        <Input
                          id="text-color"
                          type="color"
                          value={customization.custom_styling.colors?.text || '#1f2937'}
                          onChange={(e) => handleColorChange('text', e.target.value)}
                          className="w-16 h-10 p-1"
                        />
                        <Input
                          value={customization.custom_styling.colors?.text || '#1f2937'}
                          onChange={(e) => handleColorChange('text', e.target.value)}
                          placeholder="#1f2937"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="background-color">Cor de Fundo</Label>
                      <div className="flex gap-2">
                        <Input
                          id="background-color"
                          type="color"
                          value={customization.custom_styling.colors?.background || '#ffffff'}
                          onChange={(e) => handleColorChange('background', e.target.value)}
                          className="w-16 h-10 p-1"
                        />
                        <Input
                          value={customization.custom_styling.colors?.background || '#ffffff'}
                          onChange={(e) => handleColorChange('background', e.target.value)}
                          placeholder="#ffffff"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Type className="h-4 w-4" />
                    Tipografia
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Configure fontes e tamanhos
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="primary-font">Fonte Primária</Label>
                      <Select
                        value={customization.custom_styling.fonts?.primary || 'system-ui'}
                        onValueChange={(value) => handleFontChange('primary', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="system-ui">System UI</SelectItem>
                          <SelectItem value="Arial">Arial</SelectItem>
                          <SelectItem value="Helvetica">Helvetica</SelectItem>
                          <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                          <SelectItem value="Georgia">Georgia</SelectItem>
                          <SelectItem value="Courier New">Courier New</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="secondary-font">Fonte Secundária</Label>
                      <Select
                        value={customization.custom_styling.fonts?.secondary || 'system-ui'}
                        onValueChange={(value) => handleFontChange('secondary', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="system-ui">System UI</SelectItem>
                          <SelectItem value="Arial">Arial</SelectItem>
                          <SelectItem value="Helvetica">Helvetica</SelectItem>
                          <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                          <SelectItem value="Georgia">Georgia</SelectItem>
                          <SelectItem value="Courier New">Courier New</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="base-size">Tamanho Base</Label>
                      <Select
                        value={customization.custom_styling.fonts?.size_base || '14px'}
                        onValueChange={(value) => handleFontChange('size_base', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="12px">12px</SelectItem>
                          <SelectItem value="14px">14px</SelectItem>
                          <SelectItem value="16px">16px</SelectItem>
                          <SelectItem value="18px">18px</SelectItem>
                          <SelectItem value="20px">20px</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="heading-size">Tamanho dos Títulos</Label>
                      <Select
                        value={customization.custom_styling.fonts?.size_heading || '24px'}
                        onValueChange={(value) => handleFontChange('size_heading', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="18px">18px</SelectItem>
                          <SelectItem value="20px">20px</SelectItem>
                          <SelectItem value="24px">24px</SelectItem>
                          <SelectItem value="28px">28px</SelectItem>
                          <SelectItem value="32px">32px</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Layout
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Configure espaçamento e layout
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="margin">Margem</Label>
                      <Input
                        id="margin"
                        value={customization.custom_styling.layout?.margin || '1rem'}
                        onChange={(e) => handleLayoutChange('margin', e.target.value)}
                        placeholder="1rem"
                      />
                    </div>
                    <div>
                      <Label htmlFor="padding">Padding</Label>
                      <Input
                        id="padding"
                        value={customization.custom_styling.layout?.padding || '1rem'}
                        onChange={(e) => handleLayoutChange('padding', e.target.value)}
                        placeholder="1rem"
                      />
                    </div>
                    <div>
                      <Label htmlFor="line-height">Altura da Linha</Label>
                      <Input
                        id="line-height"
                        value={customization.custom_styling.layout?.line_height || '1.5'}
                        onChange={(e) => handleLayoutChange('line_height', e.target.value)}
                        placeholder="1.5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="page-size">Tamanho da Página</Label>
                      <Select
                        value={customization.custom_styling.layout?.page_size || 'A4'}
                        onValueChange={(value) => handleLayoutChange('page_size', value)}
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
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">CSS Personalizado</CardTitle>
                  <CardDescription className="text-xs">
                    Adicione CSS personalizado para controle total do estilo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={customization.custom_styling.custom_css || ''}
                    onChange={(e) => handleCustomCSSChange(e.target.value)}
                    placeholder="/* CSS personalizado */&#10;.contract-header {&#10;  font-weight: bold;&#10;  text-align: center;&#10;}"
                    rows={8}
                    className="font-mono text-sm"
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Variables Tab */}
            <TabsContent value="variables" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Valores Padrão das Variáveis</CardTitle>
                  <CardDescription className="text-xs">
                    Configure valores padrão específicos para seu tenant
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {template.template_variables.map((variable) => (
                    <div key={variable.name}>
                      <Label htmlFor={`var-${variable.name}`}>
                        {variable.label}
                        <span className="text-xs text-gray-500 ml-2">({variable.name})</span>
                      </Label>
                      <Input
                        id={`var-${variable.name}`}
                        value={customization.custom_variables[variable.name] || ''}
                        onChange={(e) => handleVariableOverride(variable.name, e.target.value)}
                        placeholder={variable.default_value || `Valor padrão para ${variable.label}`}
                      />
                      {variable.description && (
                        <p className="text-xs text-gray-500 mt-1">{variable.description}</p>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Content Tab */}
            <TabsContent value="content" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Substituições de Conteúdo</CardTitle>
                  <CardDescription className="text-xs">
                    Substitua seções específicas do template com conteúdo personalizado
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="header-override">Cabeçalho Personalizado</Label>
                    <Textarea
                      id="header-override"
                      value={customization.custom_content_overrides.header || ''}
                      onChange={(e) => handleContentOverride('header', e.target.value)}
                      placeholder="HTML personalizado para o cabeçalho"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="footer-override">Rodapé Personalizado</Label>
                    <Textarea
                      id="footer-override"
                      value={customization.custom_content_overrides.footer || ''}
                      onChange={(e) => handleContentOverride('footer', e.target.value)}
                      placeholder="HTML personalizado para o rodapé"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="terms-override">Termos e Condições</Label>
                    <Textarea
                      id="terms-override"
                      value={customization.custom_content_overrides.terms || ''}
                      onChange={(e) => handleContentOverride('terms', e.target.value)}
                      placeholder="Termos e condições específicos do tenant"
                      rows={5}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Preview Panel */}
        {showPreview && (
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="text-sm">Pré-visualização</CardTitle>
                <CardDescription className="text-xs">
                  Como o template ficará com suas personalizações
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div 
                  className="border rounded-lg p-4 min-h-96 max-h-96 overflow-y-auto text-sm"
                  style={getPreviewStyles()}
                >
                  <div className="space-y-4">
                    {customization.custom_content_overrides.header && (
                      <div 
                        dangerouslySetInnerHTML={{ 
                          __html: customization.custom_content_overrides.header 
                        }} 
                      />
                    )}
                    
                    <div>
                      <h1 style={{ 
                        fontSize: customization.custom_styling.fonts?.size_heading || '24px',
                        color: customization.custom_styling.colors?.primary || '#2563eb'
                      }}>
                        Contrato de Instalação Solar
                      </h1>
                      
                      <p style={{ marginTop: '1rem' }}>
                        Contratante: {customization.custom_variables.contractor_name || '{{contractor_name}}'}
                      </p>
                      
                      <p>
                        Valor do Contrato: {customization.custom_variables.contract_value || '{{contract_value}}'}
                      </p>
                      
                      <div style={{ 
                        marginTop: '2rem',
                        padding: '1rem',
                        backgroundColor: customization.custom_styling.colors?.background || '#f9fafb',
                        border: `1px solid ${customization.custom_styling.colors?.secondary || '#e5e7eb'}`
                      }}>
                        <h3 style={{ 
                          color: customization.custom_styling.colors?.accent || '#10b981',
                          marginBottom: '0.5rem'
                        }}>
                          Especificações do Projeto
                        </h3>
                        <p>Potência: {customization.custom_variables.project_kwp || '{{project_kwp}}'} kWp</p>
                      </div>
                    </div>
                    
                    {customization.custom_content_overrides.terms && (
                      <div>
                        <h3>Termos e Condições</h3>
                        <div 
                          dangerouslySetInnerHTML={{ 
                            __html: customization.custom_content_overrides.terms 
                          }} 
                        />
                      </div>
                    )}
                    
                    {customization.custom_content_overrides.footer && (
                      <div 
                        dangerouslySetInnerHTML={{ 
                          __html: customization.custom_content_overrides.footer 
                        }} 
                      />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Configurações da Personalização</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Switch
              id="customization-active"
              checked={customization.is_active}
              onCheckedChange={(checked) => setCustomization(prev => ({ ...prev, is_active: checked }))}
            />
            <Label htmlFor="customization-active">
              Personalização ativa
            </Label>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Quando desativada, o template usará as configurações padrão
          </p>
        </CardContent>
      </Card>
    </div>
  );
};