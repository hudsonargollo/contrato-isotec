'use client';

/**
 * Template Version History Component
 * 
 * Displays version history for contract templates with comparison,
 * restoration, and publishing capabilities.
 * 
 * Requirements: 7.2 - Contract template management
 */

import React, { useState } from 'react';
import { History, Eye, RotateCcw, GitBranch, Calendar, User, FileText, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  TemplateWithVersions,
  ContractTemplateVersion,
  compareVersions
} from '@/lib/types/contract-templates';

interface TemplateVersionHistoryProps {
  template: TemplateWithVersions;
  onClose: () => void;
  onVersionRestore: (version: ContractTemplateVersion) => void;
}

export const TemplateVersionHistory: React.FC<TemplateVersionHistoryProps> = ({
  template,
  onClose,
  onVersionRestore
}) => {
  const [selectedVersion, setSelectedVersion] = useState<ContractTemplateVersion | null>(null);
  const [showVersionPreview, setShowVersionPreview] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [versionToRestore, setVersionToRestore] = useState<ContractTemplateVersion | null>(null);

  // Sort versions by creation date (newest first)
  const sortedVersions = [...template.versions].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const handlePreviewVersion = (version: ContractTemplateVersion) => {
    setSelectedVersion(version);
    setShowVersionPreview(true);
  };

  const handleRestoreVersion = (version: ContractTemplateVersion) => {
    setVersionToRestore(version);
    setShowRestoreDialog(true);
  };

  const confirmRestore = () => {
    if (versionToRestore) {
      onVersionRestore(versionToRestore);
    }
    setShowRestoreDialog(false);
    setVersionToRestore(null);
  };

  const handlePublishVersion = async (version: ContractTemplateVersion) => {
    try {
      // TODO: Implement publish version API call
      console.log('Publishing version:', version.id);
    } catch (error) {
      console.error('Failed to publish version:', error);
    }
  };

  const getVersionBadgeColor = (version: ContractTemplateVersion) => {
    if (version.is_published) {
      return version.version === template.version 
        ? 'bg-green-100 text-green-800' 
        : 'bg-blue-100 text-blue-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  const getVersionStatus = (version: ContractTemplateVersion) => {
    if (version.version === template.version) {
      return 'Atual';
    }
    if (version.is_published) {
      return 'Publicada';
    }
    return 'Rascunho';
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  const getContentDiff = (version: ContractTemplateVersion) => {
    const currentContent = template.template_content;
    const versionContent = version.template_content;
    
    // Simple diff calculation (in a real app, you'd use a proper diff library)
    const currentLines = currentContent.split('\n').length;
    const versionLines = versionContent.split('\n').length;
    const lineDiff = currentLines - versionLines;
    
    if (lineDiff === 0) {
      return 'Sem alterações de conteúdo';
    } else if (lineDiff > 0) {
      return `+${lineDiff} linhas adicionadas`;
    } else {
      return `${Math.abs(lineDiff)} linhas removidas`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <History className="h-5 w-5" />
            Histórico de Versões
          </h3>
          <p className="text-sm text-gray-600">{template.name}</p>
        </div>
        <Button variant="outline" onClick={onClose}>
          Fechar
        </Button>
      </div>

      {/* Version Timeline */}
      <div className="space-y-4">
        {sortedVersions.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <History className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma versão encontrada
              </h3>
              <p className="text-gray-600">
                O histórico de versões será criado automaticamente quando o template for modificado.
              </p>
            </CardContent>
          </Card>
        ) : (
          sortedVersions.map((version, index) => (
            <Card key={version.id} className="relative">
              {/* Timeline connector */}
              {index < sortedVersions.length - 1 && (
                <div className="absolute left-6 top-16 w-0.5 h-full bg-gray-200 -z-10" />
              )}
              
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-sm" />
                    </div>
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        <GitBranch className="h-4 w-4" />
                        Versão {version.version}
                        <Badge className={getVersionBadgeColor(version)}>
                          {getVersionStatus(version)}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="flex items-center gap-4 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(version.created_at)}
                        </span>
                        {version.created_by && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            Usuário {version.created_by.slice(0, 8)}
                          </span>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePreviewVersion(version)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Visualizar
                    </Button>
                    
                    {version.version !== template.version && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRestoreVersion(version)}
                      >
                        <RotateCcw className="h-4 w-4 mr-1" />
                        Restaurar
                      </Button>
                    )}
                    
                    {!version.is_published && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePublishVersion(version)}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Publicar
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  {version.version_notes && (
                    <div>
                      <h4 className="text-sm font-medium mb-1">Notas da Versão</h4>
                      <p className="text-sm text-gray-600">{version.version_notes}</p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Variáveis:</span>
                      <span className="ml-2 text-gray-600">
                        {version.template_variables.length}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Campos de Assinatura:</span>
                      <span className="ml-2 text-gray-600">
                        {version.signature_fields.length}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Etapas de Aprovação:</span>
                      <span className="ml-2 text-gray-600">
                        {version.approval_workflow.length}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Alterações:</span>
                    <span className="ml-2">{getContentDiff(version)}</span>
                  </div>
                  
                  {version.published_at && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Publicado em:</span>
                      <span className="ml-2">{formatDate(version.published_at)}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Version Preview Dialog */}
      <Dialog open={showVersionPreview} onOpenChange={setShowVersionPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Visualizar Versão {selectedVersion?.version}
            </DialogTitle>
            <DialogDescription>
              Conteúdo da versão selecionada do template
            </DialogDescription>
          </DialogHeader>
          
          {selectedVersion && (
            <div className="space-y-4">
              {/* Version Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Informações da Versão</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Versão:</span>
                      <span className="ml-2">{selectedVersion.version}</span>
                    </div>
                    <div>
                      <span className="font-medium">Status:</span>
                      <Badge className={getVersionBadgeColor(selectedVersion)} size="sm">
                        {getVersionStatus(selectedVersion)}
                      </Badge>
                    </div>
                    <div>
                      <span className="font-medium">Criado em:</span>
                      <span className="ml-2">{formatDate(selectedVersion.created_at)}</span>
                    </div>
                    {selectedVersion.published_at && (
                      <div>
                        <span className="font-medium">Publicado em:</span>
                        <span className="ml-2">{formatDate(selectedVersion.published_at)}</span>
                      </div>
                    )}
                  </div>
                  
                  {selectedVersion.version_notes && (
                    <div className="mt-4">
                      <span className="font-medium text-sm">Notas:</span>
                      <p className="text-sm text-gray-600 mt-1">{selectedVersion.version_notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Template Content */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Conteúdo do Template
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg p-4 bg-gray-50 max-h-96 overflow-y-auto">
                    <pre className="text-sm whitespace-pre-wrap font-mono">
                      {selectedVersion.template_content}
                    </pre>
                  </div>
                </CardContent>
              </Card>
              
              {/* Variables */}
              {selectedVersion.template_variables.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Variáveis ({selectedVersion.template_variables.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {selectedVersion.template_variables.map((variable, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded">
                          <div>
                            <span className="font-medium text-sm">{variable.name}</span>
                            <span className="text-xs text-gray-500 ml-2">({variable.type})</span>
                          </div>
                          <div className="text-sm text-gray-600">
                            {variable.label}
                            {variable.required && <span className="text-red-500 ml-1">*</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Signature Fields */}
              {selectedVersion.signature_fields.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Campos de Assinatura ({selectedVersion.signature_fields.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {selectedVersion.signature_fields.map((field, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded">
                          <div>
                            <span className="font-medium text-sm">{field.name}</span>
                            <span className="text-xs text-gray-500 ml-2">({field.type})</span>
                          </div>
                          <div className="text-sm text-gray-600">
                            Página {field.position.page} - ({field.position.x}, {field.position.y})
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Restore Confirmation Dialog */}
      <AlertDialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restaurar Versão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja restaurar a versão {versionToRestore?.version}? 
              Esta ação criará uma nova versão baseada na versão selecionada e 
              substituirá o conteúdo atual do template.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRestore}>
              Restaurar Versão
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};