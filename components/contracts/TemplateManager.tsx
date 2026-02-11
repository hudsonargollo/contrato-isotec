'use client';

/**
 * Contract Template Manager Component
 * 
 * Main interface for managing contract templates with CRUD operations,
 * version control, and tenant-specific customizations.
 * 
 * Requirements: 7.2 - Contract template management
 */

import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Edit, Copy, Trash2, Eye, Settings, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  ContractTemplate, 
  TemplateWithVersions, 
  TemplateFilters, 
  TEMPLATE_CATEGORIES,
  TemplateCategory 
} from '@/lib/types/contract-templates';
import { TemplateEditor } from './TemplateEditor';
import { TemplatePreview } from './TemplatePreview';
import { TemplateVersionHistory } from './TemplateVersionHistory';
import { TemplateCustomization } from './TemplateCustomization';

interface TemplateManagerProps {
  tenantId: string;
  onTemplateSelect?: (template: ContractTemplate) => void;
}

export const TemplateManager: React.FC<TemplateManagerProps> = ({
  tenantId,
  onTemplateSelect
}) => {
  const [templates, setTemplates] = useState<TemplateWithVersions[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateWithVersions | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showCustomization, setShowCustomization] = useState(false);
  const [filters, setFilters] = useState<TemplateFilters>({
    page: 1,
    limit: 20,
    is_active: true
  });

  // Load templates
  useEffect(() => {
    loadTemplates();
  }, [filters]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      const mockTemplates: TemplateWithVersions[] = [
        {
          id: '1',
          tenant_id: tenantId,
          name: 'Contrato Residencial Padrão',
          description: 'Template padrão para instalações residenciais',
          version: '2.1.0',
          template_content: '<h1>Contrato de Instalação Solar</h1><p>Contratante: {{contractor_name}}</p>',
          template_variables: [
            {
              name: 'contractor_name',
              label: 'Nome do Contratante',
              type: 'text',
              required: true
            }
          ],
          category: 'residential',
          is_default: true,
          is_active: true,
          signature_fields: [],
          approval_workflow: [],
          tags: ['residencial', 'padrão'],
          metadata: {},
          created_by: 'user-1',
          created_at: new Date('2024-01-15'),
          updated_at: new Date('2024-03-10'),
          versions: [
            {
              id: 'v1',
              template_id: '1',
              version: '2.1.0',
              version_notes: 'Atualização de layout',
              template_content: '<h1>Contrato de Instalação Solar</h1>',
              template_variables: [],
              signature_fields: [],
              approval_workflow: [],
              is_published: true,
              published_at: new Date('2024-03-10'),
              created_by: 'user-1',
              created_at: new Date('2024-03-10')
            }
          ]
        },
        {
          id: '2',
          tenant_id: tenantId,
          name: 'Contrato Comercial',
          description: 'Template para instalações comerciais',
          version: '1.5.0',
          template_content: '<h1>Contrato Comercial Solar</h1>',
          template_variables: [],
          category: 'commercial',
          is_default: false,
          is_active: true,
          signature_fields: [],
          approval_workflow: [],
          tags: ['comercial'],
          metadata: {},
          created_by: 'user-1',
          created_at: new Date('2024-02-01'),
          updated_at: new Date('2024-02-15'),
          versions: []
        }
      ];

      setTemplates(mockTemplates);
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = () => {
    setSelectedTemplate(null);
    setShowEditor(true);
  };

  const handleEditTemplate = (template: TemplateWithVersions) => {
    setSelectedTemplate(template);
    setShowEditor(true);
  };

  const handleCloneTemplate = async (template: TemplateWithVersions) => {
    try {
      // TODO: Implement clone API call
      console.log('Cloning template:', template.id);
      await loadTemplates();
    } catch (error) {
      console.error('Failed to clone template:', error);
    }
  };

  const handleDeleteTemplate = async (template: TemplateWithVersions) => {
    if (!confirm('Tem certeza que deseja excluir este template?')) {
      return;
    }

    try {
      // TODO: Implement delete API call
      console.log('Deleting template:', template.id);
      await loadTemplates();
    } catch (error) {
      console.error('Failed to delete template:', error);
    }
  };

  const handleSetAsDefault = async (template: TemplateWithVersions) => {
    try {
      // TODO: Implement set as default API call
      console.log('Setting as default:', template.id);
      await loadTemplates();
    } catch (error) {
      console.error('Failed to set as default:', error);
    }
  };

  const handlePreviewTemplate = (template: TemplateWithVersions) => {
    setSelectedTemplate(template);
    setShowPreview(true);
  };

  const handleViewVersionHistory = (template: TemplateWithVersions) => {
    setSelectedTemplate(template);
    setShowVersionHistory(true);
  };

  const handleCustomizeTemplate = (template: TemplateWithVersions) => {
    setSelectedTemplate(template);
    setShowCustomization(true);
  };

  const getCategoryBadgeColor = (category: TemplateCategory) => {
    const colors = {
      standard: 'bg-blue-100 text-blue-800',
      residential: 'bg-green-100 text-green-800',
      commercial: 'bg-purple-100 text-purple-800',
      industrial: 'bg-orange-100 text-orange-800',
      custom: 'bg-gray-100 text-gray-800'
    };
    return colors[category] || colors.standard;
  };

  const getCategoryLabel = (category: TemplateCategory) => {
    const labels = {
      standard: 'Padrão',
      residential: 'Residencial',
      commercial: 'Comercial',
      industrial: 'Industrial',
      custom: 'Personalizado'
    };
    return labels[category] || category;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Templates de Contrato</h2>
          <p className="text-gray-600">Gerencie templates de contrato com controle de versão</p>
        </div>
        <Button onClick={handleCreateTemplate} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Novo Template
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar templates..."
                  value={filters.search_query || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, search_query: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              value={filters.category || 'all'}
              onValueChange={(value) => setFilters(prev => ({ 
                ...prev, 
                category: value === 'all' ? undefined : value as TemplateCategory 
              }))}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {TEMPLATE_CATEGORIES.map(category => (
                  <SelectItem key={category} value={category}>
                    {getCategoryLabel(category)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.is_active === undefined ? 'all' : filters.is_active.toString()}
              onValueChange={(value) => setFilters(prev => ({ 
                ...prev, 
                is_active: value === 'all' ? undefined : value === 'true' 
              }))}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="true">Ativo</SelectItem>
                <SelectItem value="false">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <Card key={template.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {template.name}
                      {template.is_default && (
                        <Badge variant="secondary" className="text-xs">
                          Padrão
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {template.description}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Ações</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleEditTemplate(template)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handlePreviewTemplate(template)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Visualizar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleViewVersionHistory(template)}>
                        <History className="h-4 w-4 mr-2" />
                        Histórico
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleCustomizeTemplate(template)}>
                        <Settings className="h-4 w-4 mr-2" />
                        Personalizar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleCloneTemplate(template)}>
                        <Copy className="h-4 w-4 mr-2" />
                        Duplicar
                      </DropdownMenuItem>
                      {!template.is_default && (
                        <DropdownMenuItem onClick={() => handleSetAsDefault(template)}>
                          Definir como padrão
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleDeleteTemplate(template)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge className={getCategoryBadgeColor(template.category)}>
                      {getCategoryLabel(template.category)}
                    </Badge>
                    <span className="text-sm text-gray-500">v{template.version}</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-1">
                    {template.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <div className="text-sm text-gray-500">
                    <div>Variáveis: {template.template_variables.length}</div>
                    <div>Versões: {template.versions.length}</div>
                    <div>Atualizado: {template.updated_at.toLocaleDateString('pt-BR')}</div>
                  </div>

                  {onTemplateSelect && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => onTemplateSelect(template)}
                    >
                      Selecionar Template
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {templates.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-gray-500">
              <h3 className="text-lg font-medium mb-2">Nenhum template encontrado</h3>
              <p className="mb-4">Crie seu primeiro template de contrato para começar.</p>
              <Button onClick={handleCreateTemplate}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Template
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <Dialog open={showEditor} onOpenChange={setShowEditor}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedTemplate ? 'Editar Template' : 'Novo Template'}
            </DialogTitle>
            <DialogDescription>
              {selectedTemplate 
                ? 'Edite o template de contrato e suas configurações'
                : 'Crie um novo template de contrato com variáveis e campos de assinatura'
              }
            </DialogDescription>
          </DialogHeader>
          <TemplateEditor
            template={selectedTemplate}
            onSave={(template) => {
              setShowEditor(false);
              loadTemplates();
            }}
            onCancel={() => setShowEditor(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Visualizar Template</DialogTitle>
            <DialogDescription>
              Pré-visualização do template com dados de exemplo
            </DialogDescription>
          </DialogHeader>
          {selectedTemplate && (
            <TemplatePreview
              template={selectedTemplate}
              onClose={() => setShowPreview(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showVersionHistory} onOpenChange={setShowVersionHistory}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Histórico de Versões</DialogTitle>
            <DialogDescription>
              Visualize e gerencie as versões do template
            </DialogDescription>
          </DialogHeader>
          {selectedTemplate && (
            <TemplateVersionHistory
              template={selectedTemplate}
              onClose={() => setShowVersionHistory(false)}
              onVersionRestore={() => {
                setShowVersionHistory(false);
                loadTemplates();
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showCustomization} onOpenChange={setShowCustomization}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Personalizar Template</DialogTitle>
            <DialogDescription>
              Configure personalizações específicas para seu tenant
            </DialogDescription>
          </DialogHeader>
          {selectedTemplate && (
            <TemplateCustomization
              template={selectedTemplate}
              onSave={() => {
                setShowCustomization(false);
                loadTemplates();
              }}
              onCancel={() => setShowCustomization(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};