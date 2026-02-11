/**
 * E-Signature Service Types
 * 
 * TypeScript types and Zod validation schemas for e-signature integration
 * with DocuSign and HelloSign services.
 * 
 * Requirements: 7.3 - E-signature integration
 */

import { z } from 'zod';

// E-signature Provider Enum
export const ESIGNATURE_PROVIDERS = ['docusign', 'hellosign'] as const;
export type ESignatureProvider = typeof ESIGNATURE_PROVIDERS[number];

// Signature Status Enum
export const SIGNATURE_STATUSES = ['pending', 'sent', 'viewed', 'signed', 'declined', 'expired', 'cancelled'] as const;
export type SignatureStatus = typeof SIGNATURE_STATUSES[number];

// Document Status Enum
export const DOCUMENT_STATUSES = ['draft', 'sent', 'completed', 'declined', 'cancelled', 'expired'] as const;
export type DocumentStatus = typeof DOCUMENT_STATUSES[number];

// Signer Authentication Methods
export const AUTH_METHODS = ['email', 'sms', 'phone', 'knowledge_based', 'id_verification'] as const;
export type AuthMethod = typeof AUTH_METHODS[number];

// Signature Request Schema
export const signatureRequestSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  contract_id: z.string().uuid(),
  provider: z.enum(ESIGNATURE_PROVIDERS),
  provider_envelope_id: z.string().optional(),
  provider_document_id: z.string().optional(),
  
  // Document Information
  document_name: z.string().min(1, 'Nome do documento é obrigatório'),
  document_url: z.string().url().optional(),
  document_content: z.string().optional(),
  
  // Request Configuration
  subject: z.string().min(1, 'Assunto é obrigatório'),
  message: z.string().optional(),
  expires_at: z.date().optional(),
  reminder_enabled: z.boolean().default(true),
  reminder_delay_days: z.number().int().min(1).max(30).default(3),
  
  // Status and Tracking
  status: z.enum(DOCUMENT_STATUSES).default('draft'),
  sent_at: z.date().optional(),
  completed_at: z.date().optional(),
  declined_at: z.date().optional(),
  
  // Audit Fields
  created_by: z.string().uuid(),
  created_at: z.date(),
  updated_at: z.date()
});

// Signer Schema
export const signerSchema = z.object({
  id: z.string().uuid(),
  signature_request_id: z.string().uuid(),
  
  // Signer Information
  name: z.string().min(1, 'Nome do signatário é obrigatório'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
  role: z.string().optional(),
  
  // Signing Configuration
  signing_order: z.number().int().min(1).default(1),
  auth_method: z.enum(AUTH_METHODS).default('email'),
  require_id_verification: z.boolean().default(false),
  
  // Provider-specific IDs
  provider_signer_id: z.string().optional(),
  provider_recipient_id: z.string().optional(),
  
  // Status and Tracking
  status: z.enum(SIGNATURE_STATUSES).default('pending'),
  sent_at: z.date().optional(),
  viewed_at: z.date().optional(),
  signed_at: z.date().optional(),
  declined_at: z.date().optional(),
  decline_reason: z.string().optional(),
  
  // Signature Information
  signature_url: z.string().url().optional(),
  embedded_signing_url: z.string().url().optional(),
  ip_address: z.string().optional(),
  user_agent: z.string().optional(),
  
  created_at: z.date(),
  updated_at: z.date()
});

// Signature Field Schema
export const signatureFieldSchema = z.object({
  id: z.string().uuid(),
  signer_id: z.string().uuid(),
  
  // Field Configuration
  field_type: z.enum(['signature', 'initial', 'date', 'text', 'checkbox']),
  field_name: z.string().min(1, 'Nome do campo é obrigatório'),
  required: z.boolean().default(true),
  
  // Position and Size (for PDF documents)
  page_number: z.number().int().min(1).default(1),
  x_position: z.number().min(0).optional(),
  y_position: z.number().min(0).optional(),
  width: z.number().min(1).optional(),
  height: z.number().min(1).optional(),
  
  // Field Properties
  font_size: z.number().min(8).max(72).default(12),
  font_color: z.string().default('#000000'),
  background_color: z.string().optional(),
  
  // Validation
  validation_pattern: z.string().optional(),
  validation_message: z.string().optional(),
  
  created_at: z.date(),
  updated_at: z.date()
});

// Provider Configuration Schema
export const providerConfigSchema = z.object({
  provider: z.enum(ESIGNATURE_PROVIDERS),
  
  // API Configuration
  api_key: z.string().min(1, 'API key é obrigatória'),
  api_secret: z.string().optional(),
  base_url: z.string().url().optional(),
  environment: z.enum(['sandbox', 'production']).default('sandbox'),
  
  // Default Settings
  default_subject: z.string().default('Documento para assinatura'),
  default_message: z.string().default('Por favor, assine o documento anexo.'),
  default_expiration_days: z.number().int().min(1).max(365).default(30),
  
  // Webhook Configuration
  webhook_url: z.string().url().optional(),
  webhook_secret: z.string().optional(),
  
  // Branding
  brand_id: z.string().optional(),
  custom_branding: z.object({
    logo_url: z.string().url().optional(),
    primary_color: z.string().optional(),
    secondary_color: z.string().optional()
  }).optional(),
  
  created_at: z.date(),
  updated_at: z.date()
});

// Webhook Event Schema
export const webhookEventSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  provider: z.enum(ESIGNATURE_PROVIDERS),
  
  // Event Information
  event_type: z.string(),
  event_data: z.record(z.any()),
  provider_event_id: z.string().optional(),
  
  // Related Objects
  signature_request_id: z.string().uuid().optional(),
  signer_id: z.string().uuid().optional(),
  
  // Processing Status
  processed: z.boolean().default(false),
  processed_at: z.date().optional(),
  processing_error: z.string().optional(),
  
  created_at: z.date()
});

// Input Schemas (for creating/updating)
export const createSignatureRequestSchema = signatureRequestSchema.omit({
  id: true,
  created_at: true,
  updated_at: true
});

export const updateSignatureRequestSchema = createSignatureRequestSchema.partial().omit({
  tenant_id: true,
  contract_id: true,
  created_by: true
});

export const createSignerSchema = signerSchema.omit({
  id: true,
  created_at: true,
  updated_at: true
});

export const updateSignerSchema = createSignerSchema.partial().omit({
  signature_request_id: true
});

export const createSignatureFieldSchema = signatureFieldSchema.omit({
  id: true,
  created_at: true,
  updated_at: true
});

export const updateSignatureFieldSchema = createSignatureFieldSchema.partial().omit({
  signer_id: true
});

export const createProviderConfigSchema = providerConfigSchema.omit({
  created_at: true,
  updated_at: true
});

export const updateProviderConfigSchema = createProviderConfigSchema.partial().omit({
  provider: true
});

// Type exports
export type SignatureRequest = z.infer<typeof signatureRequestSchema>;
export type Signer = z.infer<typeof signerSchema>;
export type SignatureField = z.infer<typeof signatureFieldSchema>;
export type ProviderConfig = z.infer<typeof providerConfigSchema>;
export type WebhookEvent = z.infer<typeof webhookEventSchema>;

export type CreateSignatureRequest = z.infer<typeof createSignatureRequestSchema>;
export type UpdateSignatureRequest = z.infer<typeof updateSignatureRequestSchema>;
export type CreateSigner = z.infer<typeof createSignerSchema>;
export type UpdateSigner = z.infer<typeof updateSignerSchema>;
export type CreateSignatureField = z.infer<typeof createSignatureFieldSchema>;
export type UpdateSignatureField = z.infer<typeof updateSignatureFieldSchema>;
export type CreateProviderConfig = z.infer<typeof createProviderConfigSchema>;
export type UpdateProviderConfig = z.infer<typeof updateProviderConfigSchema>;

// Extended types with relationships
export type SignatureRequestWithSigners = SignatureRequest & {
  signers: (Signer & {
    signature_fields: SignatureField[];
  })[];
  contract?: {
    id: string;
    contract_number: string;
    customer_data: Record<string, any>;
  };
};

export type SignerWithFields = Signer & {
  signature_fields: SignatureField[];
};

// Provider-specific response types
export interface DocuSignEnvelopeResponse {
  envelopeId: string;
  status: string;
  statusDateTime: string;
  uri: string;
  recipients?: {
    signers?: Array<{
      recipientId: string;
      email: string;
      name: string;
      status: string;
      signedDateTime?: string;
      deliveredDateTime?: string;
    }>;
  };
}

export interface HelloSignSignatureRequestResponse {
  signature_request: {
    signature_request_id: string;
    title: string;
    subject: string;
    message: string;
    is_complete: boolean;
    is_declined: boolean;
    has_error: boolean;
    signatures: Array<{
      signature_id: string;
      signer_email_address: string;
      signer_name: string;
      status_code: string;
      signed_at?: number;
      last_viewed_at?: number;
      last_reminded_at?: number;
    }>;
  };
}

// Utility types
export type SignatureProgress = {
  total_signers: number;
  pending_count: number;
  sent_count: number;
  signed_count: number;
  declined_count: number;
  completion_percentage: number;
};

export type ESignatureStats = {
  total_requests: number;
  completed_requests: number;
  pending_requests: number;
  declined_requests: number;
  expired_requests: number;
  completion_rate: number;
  average_completion_time_hours: number;
};

// Default configurations
export const DEFAULT_SIGNATURE_FIELD_CONFIG = {
  signature: {
    width: 150,
    height: 50,
    font_size: 12,
    font_color: '#000000'
  },
  initial: {
    width: 50,
    height: 50,
    font_size: 12,
    font_color: '#000000'
  },
  date: {
    width: 100,
    height: 20,
    font_size: 10,
    font_color: '#000000'
  },
  text: {
    width: 200,
    height: 20,
    font_size: 10,
    font_color: '#000000'
  },
  checkbox: {
    width: 20,
    height: 20
  }
};

// Utility functions
export const getStatusLabel = (status: SignatureStatus | DocumentStatus): string => {
  const labels: Record<string, string> = {
    // Signature statuses
    pending: 'Pendente',
    sent: 'Enviado',
    viewed: 'Visualizado',
    signed: 'Assinado',
    declined: 'Recusado',
    expired: 'Expirado',
    cancelled: 'Cancelado',
    
    // Document statuses
    draft: 'Rascunho',
    completed: 'Concluído'
  };
  
  return labels[status] || status;
};

export const getStatusColor = (status: SignatureStatus | DocumentStatus): string => {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    sent: 'bg-blue-100 text-blue-800',
    viewed: 'bg-purple-100 text-purple-800',
    signed: 'bg-green-100 text-green-800',
    completed: 'bg-green-100 text-green-800',
    declined: 'bg-red-100 text-red-800',
    expired: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-gray-100 text-gray-800',
    draft: 'bg-gray-100 text-gray-800'
  };
  
  return colors[status] || 'bg-gray-100 text-gray-800';
};

export const calculateSignatureProgress = (signers: Signer[]): SignatureProgress => {
  const total = signers.length;
  const pending = signers.filter(s => s.status === 'pending').length;
  const sent = signers.filter(s => s.status === 'sent' || s.status === 'viewed').length;
  const signed = signers.filter(s => s.status === 'signed').length;
  const declined = signers.filter(s => s.status === 'declined').length;
  const expired = signers.filter(s => s.status === 'expired').length;
  const cancelled = signers.filter(s => s.status === 'cancelled').length;
  
  // Count expired and cancelled as declined for progress calculation
  const totalDeclined = declined + expired + cancelled;
  
  return {
    total_signers: total,
    pending_count: pending,
    sent_count: sent,
    signed_count: signed,
    declined_count: totalDeclined,
    completion_percentage: total > 0 ? Math.round((signed / total) * 100) : 0
  };
};

export const isSignatureRequestExpired = (request: SignatureRequest): boolean => {
  if (!request.expires_at) return false;
  return new Date() > new Date(request.expires_at);
};

export const isSignatureRequestCompleted = (request: SignatureRequestWithSigners): boolean => {
  return request.signers.every(signer => signer.status === 'signed');
};

export const getNextSignerInOrder = (signers: Signer[]): Signer | null => {
  const pendingSigners = signers
    .filter(s => s.status === 'pending')
    .sort((a, b) => a.signing_order - b.signing_order);
  
  return pendingSigners.length > 0 ? pendingSigners[0] : null;
};