'use client';

/**
 * Template Editor Component
 * 
 * Rich editor for creating and editing contract templates with variable management,
 * signature field configuration, and approval workflow setup.
 * 
 * Requirements: 7.2 - Contract template management
 */

import React, { useState, useEffect } from 'react';
import { Save, X, Plus, Trash2, Eye, Code, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  TemplateWithVersions,
  CreateContractTemplate,
  UpdateContractTemplate,
  TemplateVariable,
  SignatureField,
  ApprovalStep,
  TEMPLATE_CATEGORIES,
  VARIABLE_TYPES,
  SIGNATURE_FIELD_TYPES,
  DEFAULT_TEMPLATE_VARIABLES,
  DEFAULT_SIGNATURE_FIELDS,
  validateTemplateContent
} from '@/lib/types/contract-templates';

interface TemplateEditorProps {
  template?: TemplateWithVersions | null;
  onSave: (template: CreateContractTemplate | UpdateContractTemplate) => void;
  onCancel: () => void;
}

export const TemplateEditor: React.FC<TemplateEditorProps> = ({
  template,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState<CreateContractTemplate>({
    tenant_id: '',
    name: '',
    description: '',
    version: '1.0.0',
    template_content: '',
    template_variables: [...DEFAULT_TEMPLATE_VARIABLES],
    category: 'standard',
    is_default: false,
    is_active: true,
    signature_fields: [...DEFAULT_SIGNATURE_FIELDS],
    approval_workflow: [],
    tags: [],
    metadata: {}
  });

  const [activeTab, setActiveTab] = useState('content');
  const [showPreview, setShowPreview] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');

  // Initialize form data when template changes
  useEffect(() => {
    if (template) {
      setFormData({
        tenant_id: template.tenant_id,
        name: template.name,
        description: template.description || '',
        version: template.version,
        template_content: template.template_content,
        template_variables: template.template_variables,
        category: template.category,
        is_default: template.is_default,
        is_active: template.is_active,
        signature_fields: template.signature_fields,
        approval_workflow: template.approval_workflow,
        tags: template.tags,
        metadata: template.metadata
      });
    }
  }, [template]);

  // Validate template content when variables or content change
  useEffect(() => {
    const errors = validateTemplateContent(formData.template_content, formData.template_variables);
    setValidationErrors(errors);
  }, [formData.template_content, formData.template_variables]);

  const handleSave = () => {
    if (validationErrors.length > 0) {
      alert('Por favor, corrija os erros de validação antes de salvar.');
      return;
    }

    if (template) {
      // Update existing template
      const updateData: UpdateContractTemplate = { ...formData };
      delete (updateData as any).tenant_id; // Remove tenant_id for updates
      onSave(updateData);
    } else {
      // Create new template
      onSave(formData);
    }
  };

  const handleAddVariable = () => {
    const newVariable: TemplateVariable = {
      name: `variable_${formData.template_variables.length + 1}`,
      label: 'Nova Variável',
      type: 'text',
      required: false
    };

    setFormData(prev => ({
      ...prev,
      template_variables: [...prev.template_variables, newVariable]
    }));
  };

  const handleUpdateVariable = (index: number, variable: TemplateVariable) => {
    setFormData(prev => ({
      ...prev,
      template_variables: prev.template_variables.map((v, i) => i === index ? variable : v)
    }));
  };

  const handleRemoveVariable = (index: number) => {
    setFormData(prev => ({
      ...prev,
      template_variables: prev.template_variables.filter((_, i) => i !== index)
    }));
  };

  const handleAddSignatureField = () => {
    const newField: SignatureField = {
      name: `signature_${formData.signature_fields.length + 1}`,
      label: 'Nova Assinatura',
      type: 'signature',
      required: true,
      position: {
        page: 1,
        x: 50,
        y: 700,
        width: 200,
        height: 50
      }
    };

    setFormData(prev => ({
      ...prev,
      signature_fields: [...prev.signature_fields, newField]
    }));
  };

  const handleUpdateSignatureField = (index: number, field: SignatureField) => {
    setFormData(prev => ({
      ...prev,
      signature_fields: prev.signature_fields.map((f, i) => i === index ? field : f)
    }));
  };

  const handleRemoveSignatureField = (index: number) => {
    setFormData(prev => ({
      ...prev,
      signature_fields: prev.signature_fields.filter((_, i) => i !== index)
    }));
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const insertVariable = (variableName: string) => {
    const textarea = document.getElementById('template-content') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;
      const before = text.substring(0, start);
      const after = text.substring(end, text.length);
      const newText = before + `{{${variableName}}}` + after;
      
      setFormData(prev => ({
        ...prev,
        template_content: newText
      }));

      // Restore cursor position
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variableName.length + 4, start + variableName.length + 4);
      }, 0);
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      standard: 'Padrão',
      residential: 'Residencial',
      commercial: 'Comercial',
      industrial: 'Industrial',
      custom: 'Personalizado'
    };
    return labels[category] || category;
  };

  const getVariableTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      text: 'Texto',
      number: 'Número',
      date: 'Data',
      boolean: 'Sim/Não',
      email: 'Email',
      phone: 'Telefone',
      currency: 'Moeda',
      percentage: 'Porcentagem',
      address: 'Endereço',
      select: 'Seleção',
      multiselect: 'Múltipla Seleção'
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">
            {template ? 'Editar Template' : 'Novo Template'}
          </h3>
          {validationErrors.length > 0 && (
            <div className="mt-2">
              <Badge variant="destructive" className="text-xs">
                {validationErrors.length} erro(s) de validação
              </Badge>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowPreview(true)}>
            <Eye className="h-4 w-4 mr-2" />
            Visualizar
          </Button>
          <Button variant="outline" onClick={onCancel}>
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={validationErrors.length > 0}>
            <Save className="h-4 w-4 mr-2" />
            Salvar
          </Button>
        </div>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800 text-sm">Erros de Validação</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-red-700 space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="content">Conteúdo</TabsTrigger>
          <TabsTrigger value="variables">Variáveis</TabsTrigger>
          <TabsTrigger value="signatures">Assinaturas</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        {/* Content Tab */}
        <TabsContent value="content" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div>
                <Label htmlFor="template-content">Conteúdo do Template</Label>
                <Textarea
                  id="template-content"
                  value={formData.template_content}
                  onChange={(e) => setFormData(prev => ({ ...prev, template_content: e.target.value }))}
                  placeholder="Digite o conteúdo do template aqui. Use {{nome_variavel}} para inserir variáveis."
                  className="min-h-[400px] font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use {{nome_variavel}} para inserir variáveis no template
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Variáveis Disponíveis</CardTitle>
                  <CardDescription className="text-xs">
                    Clique para inserir no template
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {formData.template_variables.map((variable) => (
                    <Button
                      key={variable.name}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start text-xs"
                      onClick={() => insertVariable(variable.name)}
                    >
                      <Code className="h-3 w-3 mr-2" />
                      {variable.name}
                    </Button>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Variables Tab */}
        <TabsContent value="variables" className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-md font-medium">Variáveis do Template</h4>
            <Button onClick={handleAddVariable} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Variável
            </Button>
          </div>

          <div className="space-y-4">
            {formData.template_variables.map((variable, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor={`var-name-${index}`}>Nome</Label>
                      <Input
                        id={`var-name-${index}`}
                        value={variable.name}
                        onChange={(e) => handleUpdateVariable(index, { ...variable, name: e.target.value })}
                        placeholder="nome_variavel"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`var-label-${index}`}>Rótulo</Label>
                      <Input
                        id={`var-label-${index}`}
                        value={variable.label}
                        onChange={(e) => handleUpdateVariable(index, { ...variable, label: e.target.value })}
                        placeholder="Rótulo da variável"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`var-type-${index}`}>Tipo</Label>
                      <Select
                        value={variable.type}
                        onValueChange={(value) => handleUpdateVariable(index, { ...variable, type: value as any })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {VARIABLE_TYPES.map(type => (
                            <SelectItem key={type} value={type}>
                              {getVariableTypeLabel(type)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end gap-2">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id={`var-required-${index}`}
                          checked={variable.required}
                          onCheckedChange={(checked) => handleUpdateVariable(index, { ...variable, required: checked })}
                        />
                        <Label htmlFor={`var-required-${index}`} className="text-sm">
                          Obrigatório
                        </Label>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveVariable(index)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {variable.description && (
                    <div className="mt-4">
                      <Label htmlFor={`var-desc-${index}`}>Descrição</Label>
                      <Textarea
                        id={`var-desc-${index}`}
                        value={variable.description}
                        onChange={(e) => handleUpdateVariable(index, { ...variable, description: e.target.value })}
                        placeholder="Descrição da variável"
                        rows={2}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Signatures Tab */}
        <TabsContent value="signatures" className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-md font-medium">Campos de Assinatura</h4>
            <Button onClick={handleAddSignatureField} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Campo
            </Button>
          </div>

          <div className="space-y-4">
            {formData.signature_fields.map((field, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor={`sig-name-${index}`}>Nome</Label>
                      <Input
                        id={`sig-name-${index}`}
                        value={field.name}
                        onChange={(e) => handleUpdateSignatureField(index, { ...field, name: e.target.value })}
                        placeholder="nome_campo"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`sig-label-${index}`}>Rótulo</Label>
                      <Input
                        id={`sig-label-${index}`}
                        value={field.label}
                        onChange={(e) => handleUpdateSignatureField(index, { ...field, label: e.target.value })}
                        placeholder="Rótulo do campo"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`sig-type-${index}`}>Tipo</Label>
                      <Select
                        value={field.type}
                        onValueChange={(value) => handleUpdateSignatureField(index, { ...field, type: value as any })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SIGNATURE_FIELD_TYPES.map(type => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div>
                      <Label htmlFor={`sig-page-${index}`}>Página</Label>
                      <Input
                        id={`sig-page-${index}`}
                        type="number"
                        min="1"
                        value={field.position.page}
                        onChange={(e) => handleUpdateSignatureField(index, {
                          ...field,
                          position: { ...field.position, page: parseInt(e.target.value) || 1 }
                        })}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`sig-x-${index}`}>X</Label>
                      <Input
                        id={`sig-x-${index}`}
                        type="number"
                        min="0"
                        value={field.position.x}
                        onChange={(e) => handleUpdateSignatureField(index, {
                          ...field,
                          position: { ...field.position, x: parseInt(e.target.value) || 0 }
                        })}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`sig-y-${index}`}>Y</Label>
                      <Input
                        id={`sig-y-${index}`}
                        type="number"
                        min="0"
                        value={field.position.y}
                        onChange={(e) => handleUpdateSignatureField(index, {
                          ...field,
                          position: { ...field.position, y: parseInt(e.target.value) || 0 }
                        })}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`sig-width-${index}`}>Largura</Label>
                      <Input
                        id={`sig-width-${index}`}
                        type="number"
                        min="1"
                        value={field.position.width}
                        onChange={(e) => handleUpdateSignatureField(index, {
                          ...field,
                          position: { ...field.position, width: parseInt(e.target.value) || 1 }
                        })}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`sig-height-${index}`}>Altura</Label>
                      <Input
                        id={`sig-height-${index}`}
                        type="number"
                        min="1"
                        value={field.position.height}
                        onChange={(e) => handleUpdateSignatureField(index, {
                          ...field,
                          position: { ...field.position, height: parseInt(e.target.value) || 1 }
                        })}
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id={`sig-required-${index}`}
                        checked={field.required}
                        onCheckedChange={(checked) => handleUpdateSignatureField(index, { ...field, required: checked })}
                      />
                      <Label htmlFor={`sig-required-${index}`} className="text-sm">
                        Obrigatório
                      </Label>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveSignatureField(index)}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Informações Básicas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="template-name">Nome do Template</Label>
                  <Input
                    id="template-name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Nome do template"
                  />
                </div>
                <div>
                  <Label htmlFor="template-description">Descrição</Label>
                  <Textarea
                    id="template-description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descrição do template"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="template-category">Categoria</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TEMPLATE_CATEGORIES.map(category => (
                        <SelectItem key={category} value={category}>
                          {getCategoryLabel(category)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="template-version">Versão</Label>
                  <Input
                    id="template-version"
                    value={formData.version}
                    onChange={(e) => setFormData(prev => ({ ...prev, version: e.target.value }))}
                    placeholder="1.0.0"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Configurações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="template-active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                  />
                  <Label htmlFor="template-active">Template ativo</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="template-default"
                    checked={formData.is_default}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_default: checked }))}
                  />
                  <Label htmlFor="template-default">Template padrão</Label>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Tags</CardTitle>
              <CardDescription className="text-xs">
                Adicione tags para organizar e filtrar templates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Nova tag"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                />
                <Button onClick={handleAddTag} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:text-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};