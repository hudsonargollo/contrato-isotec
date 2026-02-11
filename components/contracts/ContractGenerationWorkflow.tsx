'use client';

/**
 * Contract Generation Workflow Component
 * 
 * Main interface for managing contract generation workflows with CRM integration,
 * validation, preview, and approval processes.
 * 
 * Requirements: 7.1 - Automated contract generation
 */

import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText, 
  User, 
  AlertTriangle,
  Download,
  Send,
  Eye,
  FileSignature
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  ContractGenerationRequest,
  GeneratedContract,
  GenerationRequestWithContract,
  ContractWithSignatures,
  ValidationResult,
  getStatusLabel,
  getStatusColor,
  calculateSignatureProgress
} from '@/lib/types/contract-generation';
import { Lead } from '@/lib/types/crm';
import { ContractTemplate } from '@/lib/types/contract-templates';
import { ESignatureManager } from './ESignatureManager';

interface ContractGenerationWorkflowProps {
  tenantId: string;
  onContractGenerated?: (contract: GeneratedContract) => void;
}

export const ContractGenerationWorkflow: React.FC<ContractGenerationWorkflowProps> = ({
  tenantId,
  onContractGenerated
}) => {
  const [requests, setRequests] = useState<GenerationRequestWithContract[]>([]);
  const [contracts, setContracts] = useState<ContractWithSignatures[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<GenerationRequestWithContract | null>(null);
  const [selectedContract, setSelectedContract] = useState<ContractWithSignatures | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showESignatureDialog, setShowESignatureDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<'requests' | 'contracts'>('requests');

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API calls
      const mockRequests: GenerationRequestWithContract[] = [
        {
          id: '1',
          tenant_id: tenantId,
          template_id: 'template-1',
          lead_id: 'lead-1',
          contract_data: {
            contractor_name: 'João Silva',
            contractor_email: 'joao@email.com',
            project_kwp: 5.5,
            contract_value: 35000
          },
          variable_values: {},
          generation_options: {
            output_format: 'pdf',
            include_attachments: false,
            custom_styling: {},
            page_settings: {
              size: 'A4',
              orientation: 'portrait',
              margins: { top: 20, right: 20, bottom: 20, left: 20 }
            },
            signature_settings: {
              require_all_signatures: true,
              signature_order: [],
              expiration_days: 30
            }
          },
          output_format: 'pdf',
          status: 'pending',
          validation_errors: [],
          workflow_step: 1,
          approval_status: 'pending',
          requested_by: 'user-1',
          created_at: new Date('2024-03-10T10:00:00Z'),
          updated_at: new Date('2024-03-10T10:00:00Z'),
          template: {
            id: 'template-1',
            name: 'Contrato Residencial Padrão',
            version: '2.1.0'
          },
          lead: {
            id: 'lead-1',
            name: 'João Silva',
            email: 'joao@email.com'
          }
        }
      ];

      const mockContracts: ContractWithSignatures[] = [
        {
          id: '1',
          tenant_id: tenantId,
          generation_request_id: '1',
          contract_number: 'CT240001',
          template_id: 'template-1',
          template_version: '2.1.0',
          customer_id: 'lead-1',
          customer_data: {
            contractor_name: 'João Silva',
            contractor_email: 'joao@email.com'
          },
          contract_content: '<h1>Contrato de Instalação Solar</h1>',
          contract_variables: {},
          file_format: 'pdf',
          status: 'sent',
          is_final: true,
          signature_status: 'partially_signed',
          signature_requests: [
            {
              id: 'sig-1',
              signer_name: 'João Silva',
              signer_email: 'joao@email.com',
              signer_role: 'contractor',
              status: 'fully_signed',
              sent_at: new Date('2024-03-10T11:00:00Z'),
              signed_at: new Date('2024-03-10T14:30:00Z')
            },
            {
              id: 'sig-2',
              signer_name: 'Empresa Solar',
              signer_email: 'contratos@empresa.com',
              signer_role: 'company',
              status: 'sent',
              sent_at: new Date('2024-03-10T11:00:00Z')
            }
          ],
          expires_at: new Date('2024-04-10T11:00:00Z'),
          created_by: 'user-1',
          created_at: new Date('2024-03-10T11:00:00Z'),
          updated_at: new Date('2024-03-10T14:30:00Z'),
          signature_progress: {
            total_signers: 2,
            signed_count: 1,
            pending_count: 1,
            declined_count: 0,
            completion_percentage: 50
          }
        }
      ];

      setRequests(mockRequests);
      setContracts(mockContracts);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessRequest = async (request: GenerationRequestWithContract) => {
    try {
      // TODO: Implement process request API call
      console.log('Processing request:', request.id);
      await loadData();
    } catch (error) {
      console.error('Failed to process request:', error);
    }
  };

  const handleApproveRequest = async (request: GenerationRequestWithContract) => {
    try {
      // TODO: Implement approve request API call
      console.log('Approving request:', request.id);
      setShowApprovalDialog(false);
      await loadData();
    } catch (error) {
      console.error('Failed to approve request:', error);
    }
  };

  const handleRejectRequest = async (request: GenerationRequestWithContract) => {
    try {
      // TODO: Implement reject request API call
      console.log('Rejecting request:', request.id);
      setShowApprovalDialog(false);
      await loadData();
    } catch (error) {
      console.error('Failed to reject request:', error);
    }
  };

  const handleSendContract = async (contract: ContractWithSignatures) => {
    try {
      // TODO: Implement send contract API call
      console.log('Sending contract:', contract.id);
      await loadData();
    } catch (error) {
      console.error('Failed to send contract:', error);
    }
  };

  const handleDownloadContract = async (contract: ContractWithSignatures) => {
    try {
      // TODO: Implement download contract
      console.log('Downloading contract:', contract.id);
    } catch (error) {
      console.error('Failed to download contract:', error);
    }
  };

  const handlePreviewContract = (contract: ContractWithSignatures) => {
    setSelectedContract(contract);
    setShowPreview(true);
  };

  const handleManageESignatures = (contract: ContractWithSignatures) => {
    setSelectedContract(contract);
    setShowESignatureDialog(true);
  };

  const getRequestStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'processing':
        return <Clock className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getWorkflowProgress = (request: GenerationRequestWithContract) => {
    const totalSteps = 4; // Validation, Approval, Generation, Delivery
    let completedSteps = 0;

    if (request.validation_errors.length === 0) completedSteps++;
    if (request.approval_status === 'approved') completedSteps++;
    if (request.status === 'completed') completedSteps++;
    if (request.generated_contract?.status === 'sent') completedSteps++;

    return Math.round((completedSteps / totalSteps) * 100);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Geração de Contratos</h2>
          <p className="text-gray-600">Gerencie o fluxo de geração e assinatura de contratos</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={activeTab === 'requests' ? 'default' : 'outline'}
            onClick={() => setActiveTab('requests')}
          >
            Solicitações ({requests.length})
          </Button>
          <Button
            variant={activeTab === 'contracts' ? 'default' : 'outline'}
            onClick={() => setActiveTab('contracts')}
          >
            Contratos ({contracts.length})
          </Button>
        </div>
      </div>

      {/* Content */}
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
        <>
          {/* Generation Requests Tab */}
          {activeTab === 'requests' && (
            <div className="space-y-4">
              {requests.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Nenhuma solicitação encontrada
                    </h3>
                    <p className="text-gray-600">
                      As solicitações de geração de contrato aparecerão aqui.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {requests.map((request) => (
                    <Card key={request.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                              {getRequestStatusIcon(request.status)}
                              {request.template?.name}
                            </CardTitle>
                            <CardDescription>
                              Cliente: {request.lead?.name} | {formatDate(request.created_at)}
                            </CardDescription>
                          </div>
                          <Badge className={getStatusColor(request.status)}>
                            {getStatusLabel(request.status)}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Progress */}
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span>Progresso do Workflow</span>
                            <span>{getWorkflowProgress(request)}%</span>
                          </div>
                          <Progress value={getWorkflowProgress(request)} className="h-2" />
                        </div>

                        {/* Request Details */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Formato:</span>
                            <span className="ml-2">{request.output_format.toUpperCase()}</span>
                          </div>
                          <div>
                            <span className="font-medium">Etapa:</span>
                            <span className="ml-2">{request.workflow_step}/4</span>
                          </div>
                          <div>
                            <span className="font-medium">Aprovação:</span>
                            <Badge size="sm" className={getStatusColor(request.approval_status)}>
                              {getStatusLabel(request.approval_status)}
                            </Badge>
                          </div>
                          <div>
                            <span className="font-medium">Valor:</span>
                            <span className="ml-2">
                              {new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL'
                              }).format(request.contract_data.contract_value || 0)}
                            </span>
                          </div>
                        </div>

                        {/* Validation Errors */}
                        {request.validation_errors.length > 0 && (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-red-800 text-sm font-medium mb-2">
                              <AlertTriangle className="h-4 w-4" />
                              Erros de Validação
                            </div>
                            <ul className="text-sm text-red-700 space-y-1">
                              {request.validation_errors.map((error, index) => (
                                <li key={index}>• {error}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2 pt-2">
                          {request.status === 'pending' && (
                            <Button
                              size="sm"
                              onClick={() => handleProcessRequest(request)}
                              className="flex-1"
                            >
                              <Play className="h-4 w-4 mr-1" />
                              Processar
                            </Button>
                          )}
                          
                          {request.approval_status === 'pending' && request.status === 'completed' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedRequest(request);
                                setShowApprovalDialog(true);
                              }}
                              className="flex-1"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Aprovar
                            </Button>
                          )}

                          {request.generated_contract && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePreviewContract(request.generated_contract as ContractWithSignatures)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Visualizar
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Generated Contracts Tab */}
          {activeTab === 'contracts' && (
            <div className="space-y-4">
              {contracts.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Nenhum contrato encontrado
                    </h3>
                    <p className="text-gray-600">
                      Os contratos gerados aparecerão aqui.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {contracts.map((contract) => (
                    <Card key={contract.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                              <FileText className="h-5 w-5" />
                              {contract.contract_number}
                            </CardTitle>
                            <CardDescription>
                              {contract.customer_data.contractor_name} | {formatDate(contract.created_at)}
                            </CardDescription>
                          </div>
                          <div className="flex flex-col gap-1">
                            <Badge className={getStatusColor(contract.status)}>
                              {getStatusLabel(contract.status)}
                            </Badge>
                            <Badge variant="outline" className={getStatusColor(contract.signature_status)}>
                              {getStatusLabel(contract.signature_status)}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Signature Progress */}
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span>Progresso das Assinaturas</span>
                            <span>
                              {contract.signature_progress.signed_count}/{contract.signature_progress.total_signers}
                            </span>
                          </div>
                          <Progress value={contract.signature_progress.completion_percentage} className="h-2" />
                        </div>

                        {/* Contract Details */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Template:</span>
                            <span className="ml-2">v{contract.template_version}</span>
                          </div>
                          <div>
                            <span className="font-medium">Formato:</span>
                            <span className="ml-2">{contract.file_format.toUpperCase()}</span>
                          </div>
                          {contract.expires_at && (
                            <div className="col-span-2">
                              <span className="font-medium">Expira em:</span>
                              <span className="ml-2">{formatDate(contract.expires_at)}</span>
                            </div>
                          )}
                        </div>

                        {/* Signature Requests */}
                        <div>
                          <h4 className="text-sm font-medium mb-2">Assinaturas</h4>
                          <div className="space-y-2">
                            {contract.signature_requests.map((request) => (
                              <div key={request.id} className="flex items-center justify-between p-2 border rounded">
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4 text-gray-400" />
                                  <div>
                                    <div className="text-sm font-medium">{request.signer_name}</div>
                                    <div className="text-xs text-gray-500">{request.signer_email}</div>
                                  </div>
                                </div>
                                <Badge size="sm" className={getStatusColor(request.status)}>
                                  {getStatusLabel(request.status)}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePreviewContract(contract)}
                            className="flex-1"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Visualizar
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadContract(contract)}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>

                          {contract.status === 'approved' && contract.signature_status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleSendContract(contract)}
                              >
                                <Send className="h-4 w-4 mr-1" />
                                Enviar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleManageESignatures(contract)}
                              >
                                <FileSignature className="h-4 w-4 mr-1" />
                                Assinaturas
                              </Button>
                            </>
                          )}

                          {(contract.signature_status === 'sent' || contract.signature_status === 'partially_signed') && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleManageESignatures(contract)}
                            >
                              <FileSignature className="h-4 w-4 mr-1" />
                              Gerenciar Assinaturas
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* E-Signature Management Dialog */}
      <Dialog open={showESignatureDialog} onOpenChange={setShowESignatureDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Gerenciar Assinaturas - {selectedContract?.contract_number}
            </DialogTitle>
            <DialogDescription>
              Gerencie as solicitações de assinatura eletrônica para este contrato
            </DialogDescription>
          </DialogHeader>
          
          {selectedContract && (
            <ESignatureManager
              contract={selectedContract}
              onSignatureRequestCreated={(request) => {
                console.log('Signature request created:', request);
                // Optionally refresh contract data
              }}
              onSignatureCompleted={(request) => {
                console.log('Signature completed:', request);
                // Refresh contract data and close dialog
                loadData();
                setShowESignatureDialog(false);
                onContractGenerated?.(selectedContract);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Approval Dialog */}
      <AlertDialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Aprovar Solicitação de Contrato</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja aprovar a geração do contrato para {selectedRequest?.lead?.name}?
              Esta ação permitirá que o contrato seja enviado para assinatura.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => selectedRequest && handleRejectRequest(selectedRequest)}>
              Rejeitar
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => selectedRequest && handleApproveRequest(selectedRequest)}>
              Aprovar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Visualizar Contrato {selectedContract?.contract_number}
            </DialogTitle>
            <DialogDescription>
              Pré-visualização do contrato gerado
            </DialogDescription>
          </DialogHeader>
          
          {selectedContract && (
            <div className="space-y-4">
              {/* Contract Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Informações do Contrato</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Número:</span>
                      <span className="ml-2">{selectedContract.contract_number}</span>
                    </div>
                    <div>
                      <span className="font-medium">Status:</span>
                      <Badge className={getStatusColor(selectedContract.status)}>
                        {getStatusLabel(selectedContract.status)}
                      </Badge>
                    </div>
                    <div>
                      <span className="font-medium">Cliente:</span>
                      <span className="ml-2">{selectedContract.customer_data.contractor_name}</span>
                    </div>
                    <div>
                      <span className="font-medium">Template:</span>
                      <span className="ml-2">v{selectedContract.template_version}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Contract Content */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Conteúdo do Contrato</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg p-4 bg-white max-h-96 overflow-y-auto">
                    <div 
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: selectedContract.contract_content }}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};