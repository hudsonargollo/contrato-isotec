/**
 * E-Signature Service
 * 
 * Service layer for e-signature integration with DocuSign and HelloSign,
 * managing signature requests, workflows, and status tracking.
 * 
 * Requirements: 7.3 - E-signature integration
 */

import { createClient } from '@/lib/supabase/server';
import { 
  SignatureRequest,
  Signer,
  SignatureField,
  ProviderConfig,
  WebhookEvent,
  SignatureRequestWithSigners,
  CreateSignatureRequest,
  UpdateSignatureRequest,
  CreateSigner,
  UpdateSigner,
  CreateSignatureField,
  UpdateSignatureField,
  ESignatureProvider,
  SignatureProgress,
  ESignatureStats,
  calculateSignatureProgress,
  isSignatureRequestExpired,
  isSignatureRequestCompleted,
  getNextSignerInOrder,
  DocuSignEnvelopeResponse,
  HelloSignSignatureRequestResponse
} from '@/lib/types/e-signature';
import { TenantContext } from '@/lib/types/tenant';
import { GeneratedContract } from '@/lib/types/contract-generation';

// Provider-specific implementations
interface ESignatureProvider {
  createSignatureRequest(request: SignatureRequestWithSigners): Promise<string>;
  getSignatureRequestStatus(providerRequestId: string): Promise<any>;
  sendReminder(providerRequestId: string, signerEmail: string): Promise<void>;
  cancelSignatureRequest(providerRequestId: string): Promise<void>;
  getEmbeddedSigningUrl(providerRequestId: string, signerEmail: string): Promise<string>;
}

export class ESignatureService {
  private supabase;
  private tenantContext: TenantContext;
  private providers: Map<ESignatureProvider, ESignatureProvider> = new Map();

  constructor(tenantContext: TenantContext) {
    this.supabase = createClient();
    this.tenantContext = tenantContext;
    this.initializeProviders();
  }

  private async initializeProviders() {
    // Initialize DocuSign provider
    this.providers.set('docusign', new DocuSignProvider(this.tenantContext));
    
    // Initialize HelloSign provider
    this.providers.set('hellosign', new HelloSignProvider(this.tenantContext));
  }

  /**
   * Create a new signature request
   */
  async createSignatureRequest(data: CreateSignatureRequest): Promise<SignatureRequest> {
    await this.supabase.rpc('set_tenant_context', { tenant_id: this.tenantContext.tenant_id });

    const requestData = {
      ...data,
      tenant_id: this.tenantContext.tenant_id,
      created_by: this.tenantContext.user_id
    };

    const { data: request, error } = await this.supabase
      .from('signature_requests')
      .insert(requestData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create signature request: ${error.message}`);
    }

    return this.mapDatabaseToSignatureRequest(request);
  }

  /**
   * Add signer to signature request
   */
  async addSigner(signatureRequestId: string, signerData: CreateSigner): Promise<Signer> {
    await this.supabase.rpc('set_tenant_context', { tenant_id: this.tenantContext.tenant_id });

    const { data: signer, error } = await this.supabase
      .from('signature_request_signers')
      .insert({
        ...signerData,
        signature_request_id: signatureRequestId
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to add signer: ${error.message}`);
    }

    return this.mapDatabaseToSigner(signer);
  }

  /**
   * Add signature field to signer
   */
  async addSignatureField(signerId: string, fieldData: CreateSignatureField): Promise<SignatureField> {
    await this.supabase.rpc('set_tenant_context', { tenant_id: this.tenantContext.tenant_id });

    const { data: field, error } = await this.supabase
      .from('signature_fields')
      .insert({
        ...fieldData,
        signer_id: signerId
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to add signature field: ${error.message}`);
    }

    return this.mapDatabaseToSignatureField(field);
  }
  /**
   * Send signature request to provider
   */
  async sendSignatureRequest(requestId: string): Promise<SignatureRequest> {
    const request = await this.getSignatureRequestWithSigners(requestId);
    if (!request) {
      throw new Error('Signature request not found');
    }

    const provider = this.providers.get(request.provider);
    if (!provider) {
      throw new Error(`Provider ${request.provider} not configured`);
    }

    try {
      // Send to provider
      const providerEnvelopeId = await provider.createSignatureRequest(request);

      // Update request status
      const updatedRequest = await this.updateSignatureRequest(requestId, {
        provider_envelope_id: providerEnvelopeId,
        status: 'sent',
        sent_at: new Date()
      });

      // Update signers status
      for (const signer of request.signers) {
        await this.updateSigner(signer.id, {
          status: 'sent',
          sent_at: new Date()
        });
      }

      return updatedRequest;

    } catch (error) {
      // Update request with error status
      await this.updateSignatureRequest(requestId, {
        status: 'cancelled'
      });
      
      throw new Error(`Failed to send signature request: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get signature request with signers
   */
  async getSignatureRequestWithSigners(id: string): Promise<SignatureRequestWithSigners | null> {
    await this.supabase.rpc('set_tenant_context', { tenant_id: this.tenantContext.tenant_id });

    const { data: request, error } = await this.supabase
      .from('signature_requests')
      .select(`
        *,
        signers:signature_request_signers(
          *,
          signature_fields(*)
        ),
        contract:generated_contracts(id, contract_number, customer_data)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to get signature request: ${error.message}`);
    }

    return this.mapDatabaseToSignatureRequestWithSigners(request);
  }

  /**
   * Update signature request
   */
  async updateSignatureRequest(id: string, data: UpdateSignatureRequest): Promise<SignatureRequest> {
    await this.supabase.rpc('set_tenant_context', { tenant_id: this.tenantContext.tenant_id });

    const { data: request, error } = await this.supabase
      .from('signature_requests')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update signature request: ${error.message}`);
    }

    return this.mapDatabaseToSignatureRequest(request);
  }

  /**
   * Update signer
   */
  async updateSigner(id: string, data: UpdateSigner): Promise<Signer> {
    await this.supabase.rpc('set_tenant_context', { tenant_id: this.tenantContext.tenant_id });

    const { data: signer, error } = await this.supabase
      .from('signature_request_signers')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update signer: ${error.message}`);
    }

    return this.mapDatabaseToSigner(signer);
  }

  /**
   * Get signature request status from provider
   */
  async syncSignatureRequestStatus(requestId: string): Promise<SignatureRequest> {
    const request = await this.getSignatureRequestWithSigners(requestId);
    if (!request || !request.provider_envelope_id) {
      throw new Error('Signature request not found or not sent to provider');
    }

    const provider = this.providers.get(request.provider);
    if (!provider) {
      throw new Error(`Provider ${request.provider} not configured`);
    }

    try {
      const providerStatus = await provider.getSignatureRequestStatus(request.provider_envelope_id);
      
      // Update request and signers based on provider response
      await this.updateFromProviderStatus(request, providerStatus);
      
      return await this.getSignatureRequest(requestId);

    } catch (error) {
      throw new Error(`Failed to sync status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Send reminder to signer
   */
  async sendReminder(requestId: string, signerEmail: string): Promise<void> {
    const request = await this.getSignatureRequestWithSigners(requestId);
    if (!request || !request.provider_envelope_id) {
      throw new Error('Signature request not found or not sent to provider');
    }

    const provider = this.providers.get(request.provider);
    if (!provider) {
      throw new Error(`Provider ${request.provider} not configured`);
    }

    await provider.sendReminder(request.provider_envelope_id, signerEmail);
  }

  /**
   * Cancel signature request
   */
  async cancelSignatureRequest(requestId: string): Promise<SignatureRequest> {
    const request = await this.getSignatureRequestWithSigners(requestId);
    if (!request) {
      throw new Error('Signature request not found');
    }

    // Cancel with provider if sent
    if (request.provider_envelope_id && request.status === 'sent') {
      const provider = this.providers.get(request.provider);
      if (provider) {
        try {
          await provider.cancelSignatureRequest(request.provider_envelope_id);
        } catch (error) {
          console.warn('Failed to cancel with provider:', error);
        }
      }
    }

    // Update local status
    return await this.updateSignatureRequest(requestId, {
      status: 'cancelled'
    });
  }

  /**
   * Get embedded signing URL for signer
   */
  async getEmbeddedSigningUrl(requestId: string, signerEmail: string): Promise<string> {
    const request = await this.getSignatureRequestWithSigners(requestId);
    if (!request || !request.provider_envelope_id) {
      throw new Error('Signature request not found or not sent to provider');
    }

    const provider = this.providers.get(request.provider);
    if (!provider) {
      throw new Error(`Provider ${request.provider} not configured`);
    }

    return await provider.getEmbeddedSigningUrl(request.provider_envelope_id, signerEmail);
  }

  /**
   * Process webhook event from provider
   */
  async processWebhookEvent(eventData: any, provider: ESignatureProvider): Promise<void> {
    // Store webhook event
    const webhookEvent: Omit<WebhookEvent, 'id' | 'created_at'> = {
      tenant_id: this.tenantContext.tenant_id,
      provider,
      event_type: eventData.event || eventData.eventType || 'unknown',
      event_data: eventData,
      provider_event_id: eventData.eventId || eventData.event_id,
      processed: false
    };

    const { data: event, error } = await this.supabase
      .from('signature_webhook_events')
      .insert(webhookEvent)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to store webhook event: ${error.message}`);
    }

    try {
      // Process the event
      await this.handleWebhookEvent(event, eventData);
      
      // Mark as processed
      await this.supabase
        .from('signature_webhook_events')
        .update({ processed: true, processed_at: new Date() })
        .eq('id', event.id);

    } catch (error) {
      // Mark as failed
      await this.supabase
        .from('signature_webhook_events')
        .update({ 
          processed: false, 
          processing_error: error instanceof Error ? error.message : 'Unknown error'
        })
        .eq('id', event.id);
      
      throw error;
    }
  }

  /**
   * List signature requests with filtering
   */
  async listSignatureRequests(filters: {
    status?: string;
    contract_id?: string;
    created_after?: Date;
    created_before?: Date;
    page?: number;
    limit?: number;
  } = {}): Promise<{ requests: SignatureRequestWithSigners[]; total: number }> {
    await this.supabase.rpc('set_tenant_context', { tenant_id: this.tenantContext.tenant_id });

    let query = this.supabase
      .from('signature_requests')
      .select(`
        *,
        signers:signature_request_signers(
          *,
          signature_fields(*)
        ),
        contract:generated_contracts(id, contract_number, customer_data)
      `, { count: 'exact' });

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.contract_id) {
      query = query.eq('contract_id', filters.contract_id);
    }

    if (filters.created_after) {
      query = query.gte('created_at', filters.created_after.toISOString());
    }

    if (filters.created_before) {
      query = query.lte('created_at', filters.created_before.toISOString());
    }

    // Apply pagination
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    // Order by created_at desc
    query = query.order('created_at', { ascending: false });

    const { data: requests, error, count } = await query;

    if (error) {
      throw new Error(`Failed to list signature requests: ${error.message}`);
    }

    const mappedRequests = requests?.map(request => 
      this.mapDatabaseToSignatureRequestWithSigners(request)
    ) || [];

    return {
      requests: mappedRequests,
      total: count || 0
    };
  }

  /**
   * Get signature statistics
   */
  async getSignatureStats(dateRange?: { start: Date; end: Date }): Promise<ESignatureStats> {
    await this.supabase.rpc('set_tenant_context', { tenant_id: this.tenantContext.tenant_id });

    let query = this.supabase
      .from('signature_requests')
      .select('status, created_at, completed_at');

    if (dateRange) {
      query = query
        .gte('created_at', dateRange.start.toISOString())
        .lte('created_at', dateRange.end.toISOString());
    }

    const { data: requests, error } = await query;

    if (error) {
      throw new Error(`Failed to get signature stats: ${error.message}`);
    }

    const total = requests?.length || 0;
    const completed = requests?.filter(r => r.status === 'completed').length || 0;
    const pending = requests?.filter(r => r.status === 'sent').length || 0;
    const declined = requests?.filter(r => r.status === 'declined').length || 0;
    const expired = requests?.filter(r => r.status === 'expired').length || 0;

    // Calculate average completion time
    const completedRequests = requests?.filter(r => r.status === 'completed' && r.completed_at) || [];
    const totalCompletionTime = completedRequests.reduce((sum, request) => {
      const created = new Date(request.created_at);
      const completed = new Date(request.completed_at);
      return sum + (completed.getTime() - created.getTime());
    }, 0);

    const averageCompletionTimeHours = completedRequests.length > 0 
      ? Math.round((totalCompletionTime / completedRequests.length) / (1000 * 60 * 60))
      : 0;

    return {
      total_requests: total,
      completed_requests: completed,
      pending_requests: pending,
      declined_requests: declined,
      expired_requests: expired,
      completion_rate: total > 0 ? Math.round((completed / total) * 100) : 0,
      average_completion_time_hours: averageCompletionTimeHours
    };
  }

  // Private helper methods
  private async getSignatureRequest(id: string): Promise<SignatureRequest> {
    const { data: request, error } = await this.supabase
      .from('signature_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Failed to get signature request: ${error.message}`);
    }

    return this.mapDatabaseToSignatureRequest(request);
  }

  private async updateFromProviderStatus(request: SignatureRequestWithSigners, providerStatus: any): Promise<void> {
    // Implementation depends on provider response format
    // This is a simplified version
    
    if (request.provider === 'docusign') {
      await this.updateFromDocuSignStatus(request, providerStatus as DocuSignEnvelopeResponse);
    } else if (request.provider === 'hellosign') {
      await this.updateFromHelloSignStatus(request, providerStatus as HelloSignSignatureRequestResponse);
    }
  }

  private async updateFromDocuSignStatus(request: SignatureRequestWithSigners, status: DocuSignEnvelopeResponse): Promise<void> {
    // Update request status
    let requestStatus = request.status;
    if (status.status === 'completed') {
      requestStatus = 'completed';
    } else if (status.status === 'declined') {
      requestStatus = 'declined';
    }

    await this.updateSignatureRequest(request.id, { status: requestStatus });

    // Update signers
    if (status.recipients?.signers) {
      for (const providerSigner of status.recipients.signers) {
        const localSigner = request.signers.find(s => s.email === providerSigner.email);
        if (localSigner) {
          let signerStatus = localSigner.status;
          if (providerSigner.status === 'completed') {
            signerStatus = 'signed';
          } else if (providerSigner.status === 'declined') {
            signerStatus = 'declined';
          }

          await this.updateSigner(localSigner.id, {
            status: signerStatus,
            signed_at: providerSigner.signedDateTime ? new Date(providerSigner.signedDateTime) : undefined
          });
        }
      }
    }
  }

  private async updateFromHelloSignStatus(request: SignatureRequestWithSigners, status: HelloSignSignatureRequestResponse): Promise<void> {
    // Update request status
    let requestStatus = request.status;
    if (status.signature_request.is_complete) {
      requestStatus = 'completed';
    } else if (status.signature_request.is_declined) {
      requestStatus = 'declined';
    }

    await this.updateSignatureRequest(request.id, { status: requestStatus });

    // Update signers
    for (const providerSignature of status.signature_request.signatures) {
      const localSigner = request.signers.find(s => s.email === providerSignature.signer_email_address);
      if (localSigner) {
        let signerStatus = localSigner.status;
        if (providerSignature.status_code === 'signed') {
          signerStatus = 'signed';
        } else if (providerSignature.status_code === 'declined') {
          signerStatus = 'declined';
        }

        await this.updateSigner(localSigner.id, {
          status: signerStatus,
          signed_at: providerSignature.signed_at ? new Date(providerSignature.signed_at * 1000) : undefined,
          viewed_at: providerSignature.last_viewed_at ? new Date(providerSignature.last_viewed_at * 1000) : undefined
        });
      }
    }
  }

  private async handleWebhookEvent(event: WebhookEvent, eventData: any): Promise<void> {
    // Find related signature request
    let signatureRequestId: string | null = null;
    
    if (event.provider === 'docusign') {
      // DocuSign webhook handling
      signatureRequestId = await this.findSignatureRequestByProviderEnvelopeId(eventData.envelopeId);
    } else if (event.provider === 'hellosign') {
      // HelloSign webhook handling
      signatureRequestId = await this.findSignatureRequestByProviderEnvelopeId(eventData.signature_request?.signature_request_id);
    }

    if (signatureRequestId) {
      // Sync status from provider
      await this.syncSignatureRequestStatus(signatureRequestId);
    }
  }

  private async findSignatureRequestByProviderEnvelopeId(providerEnvelopeId: string): Promise<string | null> {
    const { data: request, error } = await this.supabase
      .from('signature_requests')
      .select('id')
      .eq('provider_envelope_id', providerEnvelopeId)
      .single();

    if (error || !request) {
      return null;
    }

    return request.id;
  }

  // Database mapping methods
  private mapDatabaseToSignatureRequest(data: any): SignatureRequest {
    return {
      id: data.id,
      tenant_id: data.tenant_id,
      contract_id: data.contract_id,
      provider: data.provider,
      provider_envelope_id: data.provider_envelope_id,
      provider_document_id: data.provider_document_id,
      document_name: data.document_name,
      document_url: data.document_url,
      document_content: data.document_content,
      subject: data.subject,
      message: data.message,
      expires_at: data.expires_at ? new Date(data.expires_at) : undefined,
      reminder_enabled: data.reminder_enabled,
      reminder_delay_days: data.reminder_delay_days,
      status: data.status,
      sent_at: data.sent_at ? new Date(data.sent_at) : undefined,
      completed_at: data.completed_at ? new Date(data.completed_at) : undefined,
      declined_at: data.declined_at ? new Date(data.declined_at) : undefined,
      created_by: data.created_by,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at)
    };
  }

  private mapDatabaseToSigner(data: any): Signer {
    return {
      id: data.id,
      signature_request_id: data.signature_request_id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      role: data.role,
      signing_order: data.signing_order,
      auth_method: data.auth_method,
      require_id_verification: data.require_id_verification,
      provider_signer_id: data.provider_signer_id,
      provider_recipient_id: data.provider_recipient_id,
      status: data.status,
      sent_at: data.sent_at ? new Date(data.sent_at) : undefined,
      viewed_at: data.viewed_at ? new Date(data.viewed_at) : undefined,
      signed_at: data.signed_at ? new Date(data.signed_at) : undefined,
      declined_at: data.declined_at ? new Date(data.declined_at) : undefined,
      decline_reason: data.decline_reason,
      signature_url: data.signature_url,
      embedded_signing_url: data.embedded_signing_url,
      ip_address: data.ip_address,
      user_agent: data.user_agent,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at)
    };
  }

  private mapDatabaseToSignatureField(data: any): SignatureField {
    return {
      id: data.id,
      signer_id: data.signer_id,
      field_type: data.field_type,
      field_name: data.field_name,
      required: data.required,
      page_number: data.page_number,
      x_position: data.x_position,
      y_position: data.y_position,
      width: data.width,
      height: data.height,
      font_size: data.font_size,
      font_color: data.font_color,
      background_color: data.background_color,
      validation_pattern: data.validation_pattern,
      validation_message: data.validation_message,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at)
    };
  }

  private mapDatabaseToSignatureRequestWithSigners(data: any): SignatureRequestWithSigners {
    const request = this.mapDatabaseToSignatureRequest(data);
    
    return {
      ...request,
      signers: data.signers?.map((signer: any) => ({
        ...this.mapDatabaseToSigner(signer),
        signature_fields: signer.signature_fields?.map((field: any) => 
          this.mapDatabaseToSignatureField(field)
        ) || []
      })) || [],
      contract: data.contract ? {
        id: data.contract.id,
        contract_number: data.contract.contract_number,
        customer_data: data.contract.customer_data
      } : undefined
    };
  }
}

// Provider implementations (simplified)
class DocuSignProvider implements ESignatureProvider {
  private tenantContext: TenantContext;

  constructor(tenantContext: TenantContext) {
    this.tenantContext = tenantContext;
  }

  async createSignatureRequest(request: SignatureRequestWithSigners): Promise<string> {
    // TODO: Implement DocuSign API integration
    // This is a mock implementation
    return `docusign_envelope_${Date.now()}`;
  }

  async getSignatureRequestStatus(providerRequestId: string): Promise<DocuSignEnvelopeResponse> {
    // TODO: Implement DocuSign status check
    return {
      envelopeId: providerRequestId,
      status: 'sent',
      statusDateTime: new Date().toISOString(),
      uri: `/envelopes/${providerRequestId}`
    };
  }

  async sendReminder(providerRequestId: string, signerEmail: string): Promise<void> {
    // TODO: Implement DocuSign reminder
    console.log(`Sending DocuSign reminder for ${providerRequestId} to ${signerEmail}`);
  }

  async cancelSignatureRequest(providerRequestId: string): Promise<void> {
    // TODO: Implement DocuSign cancellation
    console.log(`Cancelling DocuSign envelope ${providerRequestId}`);
  }

  async getEmbeddedSigningUrl(providerRequestId: string, signerEmail: string): Promise<string> {
    // TODO: Implement DocuSign embedded signing
    return `https://demo.docusign.net/signing/${providerRequestId}?email=${signerEmail}`;
  }
}

class HelloSignProvider implements ESignatureProvider {
  private tenantContext: TenantContext;

  constructor(tenantContext: TenantContext) {
    this.tenantContext = tenantContext;
  }

  async createSignatureRequest(request: SignatureRequestWithSigners): Promise<string> {
    // TODO: Implement HelloSign API integration
    // This is a mock implementation
    return `hellosign_request_${Date.now()}`;
  }

  async getSignatureRequestStatus(providerRequestId: string): Promise<HelloSignSignatureRequestResponse> {
    // TODO: Implement HelloSign status check
    return {
      signature_request: {
        signature_request_id: providerRequestId,
        title: 'Contract Signature',
        subject: 'Please sign this contract',
        message: 'Please review and sign the attached contract.',
        is_complete: false,
        is_declined: false,
        has_error: false,
        signatures: []
      }
    };
  }

  async sendReminder(providerRequestId: string, signerEmail: string): Promise<void> {
    // TODO: Implement HelloSign reminder
    console.log(`Sending HelloSign reminder for ${providerRequestId} to ${signerEmail}`);
  }

  async cancelSignatureRequest(providerRequestId: string): Promise<void> {
    // TODO: Implement HelloSign cancellation
    console.log(`Cancelling HelloSign request ${providerRequestId}`);
  }

  async getEmbeddedSigningUrl(providerRequestId: string, signerEmail: string): Promise<string> {
    // TODO: Implement HelloSign embedded signing
    return `https://app.hellosign.com/sign/${providerRequestId}?email=${signerEmail}`;
  }
}

// Utility functions
export const createESignatureService = (tenantContext: TenantContext) => {
  return new ESignatureService(tenantContext);
};

export const createSignatureRequestFromContract = (
  contract: GeneratedContract,
  provider: ESignatureProvider = 'docusign'
): CreateSignatureRequest => {
  return {
    tenant_id: contract.tenant_id,
    contract_id: contract.id,
    provider,
    document_name: `${contract.contract_number}.pdf`,
    document_url: contract.file_url,
    subject: `Assinatura do Contrato ${contract.contract_number}`,
    message: `Por favor, assine o contrato ${contract.contract_number}.`,
    expires_at: contract.expires_at ? new Date(contract.expires_at) : undefined,
    reminder_enabled: true,
    reminder_delay_days: 3,
    status: 'draft',
    created_by: contract.created_by
  };
};