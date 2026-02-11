'use client';

/**
 * E-Signature Manager Component
 * 
 * Interface for managing e-signature requests, tracking signature status,
 * and handling signature workflows.
 * 
 * Requirements: 7.3 - E-signature integration
 */

import React, { useState, useEffect } from 'react';
import { 
  FileSignature, 
  Send, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  RefreshCw,
  Mail,
  Eye,
  Users,
  Calendar
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
  DialogTrigger,
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  SignatureRequestWithSigners,
  SignerWithFields,
  ESignatureProvider,
  getStatusLabel,
  getStatusColor,
  calculateSignatureProgress,
  isSignatureRequestExpired
} from '@/lib/types/e-signature';
import { GeneratedContract } from '@/lib/types/contract-generation';

interface ESignatureManagerProps {
  contract: GeneratedContract;
  onSignatureRequestCreated?: (request: SignatureRequestWithSigners) => void;
  onSignatureCompleted?: (request: SignatureRequestWithSigners) => void;
}

export const ESignatureManager: React.FC<ESignatureManagerProps> = ({
  contract,
  onSignatureRequestCreated,
  onSignatureCompleted
}) => {
  const [signatureRequests, setSignatureRequests] = useState<SignatureRequestWithSigners[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showReminderDialog, setShowReminderDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<SignatureRequestWithSigners | null>(null);
  const [selectedSigner, setSelectedSigner] = useState<SignerWithFields | null>(null);

  // Form state for creating signature requests
  const [formData, setFormData] = useState({
    provider: 'docusign' as ESignatureProvider,
    subject: `Assinatura do Contrato ${contract.contract_number}`,
    message: `Por favor, assine o contrato ${contract.contract_number}.`,
    expires_at: '',
    reminder_enabled: true,
    reminder_delay_days: 3,
    signers: [
      {
        name: contract.customer_data.contractor_name || '',
        email: contract.customer_data.contractor_email || '',
        role: 'contractor',
        signing_order: 1,
        signature_fields: [
          {
            field_type: 'signature',
            field_name: 'contractor_signature',
            page_number: 1,
            required: true
          }
        ]
      }
    ]
  });

  // Load signature requests
  useEffect(() => {
    loadSignatureRequests();
  }, [contract.id]);

  const loadSignatureRequests = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/contracts/${contract.id}/signature-request`);
      const result = await response.json();
      
      if (result.success) {
        setSignatureRequests(result.data);
      }
    } catch (error) {
      console.error('Failed to load signature requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSignatureRequest = async () => {
    try {
      const response = await fetch(`/api/contracts/${contract.id}/signature-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      
      if (result.success) {
        setSignatureRequests([result.data, ...signatureRequests]);
        setShowCreateDialog(false);
        onSignatureRequestCreated?.(result.data);
      } else {
        throw new Error(result.error || 'Failed to create signature request');
      }
    } catch (error) {
      console.error('Error creating signature request:', error);
      alert('Erro ao criar solicitação de assinatura');
    }
  };

  const handleSendSignatureRequest = async (requestId: string) => {
    try {
      const response = await fetch(`/api/signature-requests/${requestId}/send`, {
        method: 'POST',
      });

      const result = await response.json();
      
      if (result.success) {
        await loadSignatureRequests();
      } else {
        throw new Error(result.error || 'Failed to send signature request');
      }
    } catch (error) {
      console.error('Error sending signature request:', error);
      alert('Erro ao enviar solicitação de assinatura');
    }
  };

  const handleSyncStatus = async (requestId: string) => {
    try {
      const response = await fetch(`/api/signature-requests/${requestId}/sync`, {
        method: 'POST',
      });

      const result = await response.json();
      
      if (result.success) {
        await loadSignatureRequests();
      } else {
        throw new Error(result.error || 'Failed to sync status');
      }
    } catch (error) {
      console.error('Error syncing status:', error);
      alert('Erro ao sincronizar status');
    }
  };

  const handleSendReminder = async (requestId: string, signerEmail: string) => {
    try {
      const response = await fetch(`/api/signature-requests/${requestId}/reminder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ signer_email: signerEmail }),
      });

      const result = await response.json();
      
      if (result.success) {
        setShowReminderDialog(false);
        alert('Lembrete enviado com sucesso');
      } else {
        throw new Error(result.error || 'Failed to send reminder');
      }
    } catch (error) {
      console.error('Error sending reminder:', error);
      alert('Erro ao enviar lembrete');
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    try {
      const response = await fetch(`/api/signature-requests/${requestId}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      
      if (result.success) {
        await loadSignatureRequests();
      } else {
        throw new Error(result.error || 'Failed to cancel request');
      }
    } catch (error) {
      console.error('Error cancelling request:', error);
      alert('Erro ao cancelar solicitação');
    }
  };

  const getRequestStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'declined':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'expired':
        return <Clock className="h-5 w-5 text-gray-500" />;
      case 'sent':
        return <Send className="h-5 w-5 text-blue-500" />;
      default:
        return <FileSignature className="h-5 w-5 text-yellow-500" />;
    }
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

  const addSigner = () => {
    setFormData({
      ...formData,
      signers: [
        ...formData.signers,
        {
          name: '',
          email: '',
          role: '',
          signing_order: formData.signers.length + 1,
          signature_fields: [
            {
              field_type: 'signature',
              field_name: `signature_${formData.signers.length + 1}`,
              page_number: 1,
              required: true
            }
          ]
        }
      ]
    });
  };

  const removeSigner = (index: number) => {
    const newSigners = formData.signers.filter((_, i) => i !== index);
    setFormData({ ...formData, signers: newSigners });
  };

  const updateSigner = (index: number, field: string, value: any) => {
    const newSigners = [...formData.signers];
    newSigners[index] = { ...newSigners[index], [field]: value };
    setFormData({ ...formData, signers: newSigners });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Assinaturas Eletrônicas</h3>
          <p className="text-gray-600">Gerencie as solicitações de assinatura para este contrato</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <FileSignature className="h-4 w-4 mr-2" />
              Nova Solicitação
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Solicitação de Assinatura</DialogTitle>
              <DialogDescription>
                Configure os signatários e envie o contrato para assinatura eletrônica.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Provider Selection */}
              <div>
                <Label htmlFor="provider">Provedor de Assinatura</Label>
                <Select 
                  value={formData.provider} 
                  onValueChange={(value: ESignatureProvider) => setFormData({ ...formData, provider: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="docusign">DocuSign</SelectItem>
                    <SelectItem value="hellosign">HelloSign</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Subject and Message */}
              <div>
                <Label htmlFor="subject">Assunto</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="message">Mensagem</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={3}
                />
              </div>

              {/* Expiration */}
              <div>
                <Label htmlFor="expires_at">Data de Expiração (opcional)</Label>
                <Input
                  id="expires_at"
                  type="datetime-local"
                  value={formData.expires_at}
                  onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                />
              </div>

              {/* Signers */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>Signatários</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addSigner}>
                    Adicionar Signatário
                  </Button>
                </div>
                
                {formData.signers.map((signer, index) => (
                  <Card key={index} className="mb-4">
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-sm">Signatário {index + 1}</CardTitle>
                        {formData.signers.length > 1 && (
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => removeSigner(index)}
                          >
                            Remover
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Nome</Label>
                          <Input
                            value={signer.name}
                            onChange={(e) => updateSigner(index, 'name', e.target.value)}
                            placeholder="Nome completo"
                          />
                        </div>
                        <div>
                          <Label>Email</Label>
                          <Input
                            type="email"
                            value={signer.email}
                            onChange={(e) => updateSigner(index, 'email', e.target.value)}
                            placeholder="email@exemplo.com"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Função</Label>
                          <Input
                            value={signer.role}
                            onChange={(e) => updateSigner(index, 'role', e.target.value)}
                            placeholder="Ex: Contratante, Empresa"
                          />
                        </div>
                        <div>
                          <Label>Ordem de Assinatura</Label>
                          <Input
                            type="number"
                            min="1"
                            value={signer.signing_order}
                            onChange={(e) => updateSigner(index, 'signing_order', parseInt(e.target.value))}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateSignatureRequest}>
                  Criar Solicitação
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Signature Requests List */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4">
          {[...Array(2)].map((_, i) => (
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
      ) : signatureRequests.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileSignature className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma solicitação de assinatura
            </h3>
            <p className="text-gray-600 mb-4">
              Crie uma solicitação de assinatura para enviar este contrato para assinatura eletrônica.
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <FileSignature className="h-4 w-4 mr-2" />
              Criar Primeira Solicitação
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {signatureRequests.map((request) => {
            const progress = calculateSignatureProgress(request.signers);
            const isExpired = isSignatureRequestExpired(request);
            
            return (
              <Card key={request.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {getRequestStatusIcon(request.status)}
                        {request.subject}
                      </CardTitle>
                      <CardDescription>
                        {request.provider.toUpperCase()} | Criado em {formatDate(request.created_at)}
                        {isExpired && <span className="text-red-600 ml-2">(Expirado)</span>}
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
                      <span>Progresso das Assinaturas</span>
                      <span>{progress.signed_count}/{progress.total_signers}</span>
                    </div>
                    <Progress value={progress.completion_percentage} className="h-2" />
                  </div>

                  {/* Signers */}
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      Signatários
                    </h4>
                    <div className="space-y-2">
                      {request.signers.map((signer) => (
                        <div key={signer.id} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex items-center gap-2">
                            <div>
                              <div className="text-sm font-medium">{signer.name}</div>
                              <div className="text-xs text-gray-500">{signer.email}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge size="sm" className={getStatusColor(signer.status)}>
                              {getStatusLabel(signer.status)}
                            </Badge>
                            {signer.status === 'sent' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setSelectedSigner(signer);
                                  setShowReminderDialog(true);
                                }}
                              >
                                <Mail className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Request Details */}
                  {request.expires_at && (
                    <div className="text-sm text-gray-600 flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Expira em: {formatDate(request.expires_at)}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    {request.status === 'draft' && (
                      <Button
                        size="sm"
                        onClick={() => handleSendSignatureRequest(request.id)}
                      >
                        <Send className="h-4 w-4 mr-1" />
                        Enviar
                      </Button>
                    )}
                    
                    {request.status === 'sent' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSyncStatus(request.id)}
                      >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Sincronizar
                      </Button>
                    )}

                    {(request.status === 'draft' || request.status === 'sent') && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleCancelRequest(request.id)}
                      >
                        Cancelar
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Reminder Dialog */}
      <AlertDialog open={showReminderDialog} onOpenChange={setShowReminderDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Enviar Lembrete</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja enviar um lembrete para {selectedSigner?.name} ({selectedSigner?.email})?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (selectedRequest && selectedSigner) {
                  handleSendReminder(selectedRequest.id, selectedSigner.email);
                }
              }}
            >
              Enviar Lembrete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};