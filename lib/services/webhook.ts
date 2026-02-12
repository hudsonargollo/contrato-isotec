/**
 * Webhook Service
 * 
 * Provides a comprehensive webhook system for outbound notifications
 * and third-party integrations with real-time data synchronization.
 * 
 * Requirements: 10.2 - Webhook system and third-party integrations
 */

import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Webhook event types
export type WebhookEventType = 
  | 'lead.created'
  | 'lead.updated' 
  | 'lead.status_changed'
  | 'contract.generated'
  | 'contract.signed'
  | 'contract.expired'
  | 'invoice.created'
  | 'invoice.paid'
  | 'invoice.overdue'
  | 'payment.succeeded'
  | 'payment.failed'
  | 'screening.completed'
  | 'whatsapp.message_sent'
  | 'whatsapp.message_received'
  | 'user.created'
  | 'user.updated'
  | 'tenant.updated';

// Webhook delivery status
export type WebhookDeliveryStatus = 'pending' | 'delivered' | 'failed' | 'retrying';

// Webhook endpoint configuration
export interface WebhookEndpoint {
  id: string;
  tenant_id: string;
  url: string;
  secret: string;
  events: WebhookEventType[];
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

// Webhook delivery record
export interface WebhookDelivery {
  id: string;
  tenant_id: string;
  endpoint_id: string;
  event_type: WebhookEventType;
  payload: Record<string, any>;
  status: WebhookDeliveryStatus;
  response_status?: number;
  response_body?: string;
  error_message?: string;
  retry_count: number;
  next_retry_at?: Date;
  delivered_at?: Date;
  created_at: Date;
  updated_at: Date;
}

// Webhook payload schema
const WebhookPayloadSchema = z.object({
  event: z.string(),
  tenant_id: z.string().uuid(),
  timestamp: z.string(),
  data: z.record(z.any()),
  metadata: z.record(z.any()).optional()
});

export type WebhookPayload = z.infer<typeof WebhookPayloadSchema>;

export class WebhookService {
  private readonly maxRetries = 5;
  private readonly retryDelays = [30, 60, 300, 900, 3600]; // seconds

  /**
   * Register a new webhook endpoint for a tenant
   */
  async registerEndpoint(
    tenantId: string,
    url: string,
    events: WebhookEventType[],
    secret?: string
  ): Promise<WebhookEndpoint> {
    const supabase = createClient();
    // Generate secret if not provided
    const webhookSecret = secret || this.generateSecret();

    const { data, error } = await supabase
      .from('webhook_endpoints')
      .insert({
        tenant_id: tenantId,
        url,
        secret: webhookSecret,
        events,
        active: true
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to register webhook endpoint: ${error.message}`);
    }

    return data;
  }

  /**
   * Update webhook endpoint configuration
   */
  async updateEndpoint(
    endpointId: string,
    updates: Partial<Pick<WebhookEndpoint, 'url' | 'events' | 'active'>>
  ): Promise<WebhookEndpoint> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('webhook_endpoints')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', endpointId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update webhook endpoint: ${error.message}`);
    }

    return data;
  }

  /**
   * Delete webhook endpoint
   */
  async deleteEndpoint(endpointId: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from('webhook_endpoints')
      .delete()
      .eq('id', endpointId);

    if (error) {
      throw new Error(`Failed to delete webhook endpoint: ${error.message}`);
    }
  }

  /**
   * Get webhook endpoints for a tenant
   */
  async getEndpoints(tenantId: string): Promise<WebhookEndpoint[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('webhook_endpoints')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get webhook endpoints: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Send webhook notification
   */
  async sendWebhook(
    tenantId: string,
    eventType: WebhookEventType,
    data: Record<string, any>,
    metadata?: Record<string, any>
  ): Promise<void> {
    const supabase = createClient();
    // Get active endpoints for this tenant and event type
    const { data: endpoints, error } = await supabase
      .from('webhook_endpoints')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('active', true)
      .contains('events', [eventType]);

    if (error) {
      console.error('Failed to get webhook endpoints:', error);
      return;
    }

    if (!endpoints || endpoints.length === 0) {
      return; // No endpoints configured for this event
    }

    // Create webhook payload
    const payload: WebhookPayload = {
      event: eventType,
      tenant_id: tenantId,
      timestamp: new Date().toISOString(),
      data,
      metadata
    };

    // Send to each endpoint
    for (const endpoint of endpoints) {
      await this.deliverWebhook(endpoint, payload);
    }
  }

  /**
   * Deliver webhook to specific endpoint
   */
  private async deliverWebhook(
    endpoint: WebhookEndpoint,
    payload: WebhookPayload
  ): Promise<void> {
    const supabase = createClient();
    // Create delivery record
    const { data: delivery, error: insertError } = await supabase
      .from('webhook_deliveries')
      .insert({
        tenant_id: endpoint.tenant_id,
        endpoint_id: endpoint.id,
        event_type: payload.event,
        payload,
        status: 'pending',
        retry_count: 0
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to create webhook delivery record:', insertError);
      return;
    }

    // Attempt delivery
    await this.attemptDelivery(delivery);
  }

  /**
   * Attempt webhook delivery
   */
  private async attemptDelivery(delivery: WebhookDelivery): Promise<void> {
    const supabase = createClient();
    try {
      // Get endpoint details
      const { data: endpoint, error: endpointError } = await supabase
        .from('webhook_endpoints')
        .select('*')
        .eq('id', delivery.endpoint_id)
        .single();

      if (endpointError || !endpoint) {
        throw new Error('Webhook endpoint not found');
      }

      // Generate signature
      const signature = this.generateSignature(
        JSON.stringify(delivery.payload),
        endpoint.secret
      );

      // Send HTTP request
      const response = await fetch(endpoint.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Timestamp': new Date().toISOString(),
          'User-Agent': 'SolarCRM-Webhooks/1.0'
        },
        body: JSON.stringify(delivery.payload),
        signal: AbortSignal.timeout(30000) // 30 second timeout
      });

      const responseBody = await response.text();

      if (response.ok) {
        // Success
        await supabase
          .from('webhook_deliveries')
          .update({
            status: 'delivered',
            response_status: response.status,
            response_body: responseBody.substring(0, 1000), // Limit response body size
            delivered_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', delivery.id);
      } else {
        // HTTP error
        throw new Error(`HTTP ${response.status}: ${responseBody}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Update delivery record with error
      const newRetryCount = delivery.retry_count + 1;
      const shouldRetry = newRetryCount <= this.maxRetries;
      
      const updates: any = {
        status: shouldRetry ? 'retrying' : 'failed',
        error_message: errorMessage,
        retry_count: newRetryCount,
        updated_at: new Date().toISOString()
      };

      if (shouldRetry) {
        const retryDelay = this.retryDelays[newRetryCount - 1] || 3600;
        updates.next_retry_at = new Date(Date.now() + retryDelay * 1000).toISOString();
      }

      await supabase
        .from('webhook_deliveries')
        .update(updates)
        .eq('id', delivery.id);

      console.error(`Webhook delivery failed (attempt ${newRetryCount}):`, errorMessage);
    }
  }

  /**
   * Process webhook retries
   */
  async processRetries(): Promise<void> {
    const supabase = createClient();
    const { data: deliveries, error } = await supabase
      .from('webhook_deliveries')
      .select('*')
      .eq('status', 'retrying')
      .lte('next_retry_at', new Date().toISOString())
      .limit(100);

    if (error) {
      console.error('Failed to get webhook retries:', error);
      return;
    }

    for (const delivery of deliveries || []) {
      await this.attemptDelivery(delivery);
    }
  }

  /**
   * Get webhook delivery history
   */
  async getDeliveryHistory(
    tenantId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<WebhookDelivery[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('webhook_deliveries')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to get delivery history: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Generate webhook secret
   */
  private generateSecret(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Generate HMAC signature for webhook payload
   */
  private generateSignature(payload: string, secret: string): string {
    const crypto = require('crypto');
    return crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
  }

  /**
   * Verify webhook signature
   */
  verifySignature(payload: string, signature: string, secret: string): boolean {
    const expectedSignature = this.generateSignature(payload, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }
}

// Singleton instance
let webhookService: WebhookService;

export function getWebhookService(): WebhookService {
  if (!webhookService) {
    webhookService = new WebhookService();
  }
  return webhookService;
}

// Webhook event helpers
export class WebhookEvents {
  private static getService(): WebhookService {
    return getWebhookService();
  }

  static async leadCreated(tenantId: string, lead: any): Promise<void> {
    await this.getService().sendWebhook(tenantId, 'lead.created', { lead });
  }

  static async leadUpdated(tenantId: string, lead: any, changes: any): Promise<void> {
    await this.getService().sendWebhook(tenantId, 'lead.updated', { lead, changes });
  }

  static async leadStatusChanged(tenantId: string, lead: any, oldStatus: string, newStatus: string): Promise<void> {
    await this.getService().sendWebhook(tenantId, 'lead.status_changed', { 
      lead, 
      old_status: oldStatus, 
      new_status: newStatus 
    });
  }

  static async contractGenerated(tenantId: string, contract: any): Promise<void> {
    await this.getService().sendWebhook(tenantId, 'contract.generated', { contract });
  }

  static async contractSigned(tenantId: string, contract: any): Promise<void> {
    await this.getService().sendWebhook(tenantId, 'contract.signed', { contract });
  }

  static async invoiceCreated(tenantId: string, invoice: any): Promise<void> {
    await this.getService().sendWebhook(tenantId, 'invoice.created', { invoice });
  }

  static async invoicePaid(tenantId: string, invoice: any, payment: any): Promise<void> {
    await this.getService().sendWebhook(tenantId, 'invoice.paid', { invoice, payment });
  }

  static async paymentSucceeded(tenantId: string, payment: any): Promise<void> {
    await this.getService().sendWebhook(tenantId, 'payment.succeeded', { payment });
  }

  static async paymentFailed(tenantId: string, payment: any, error: string): Promise<void> {
    await this.getService().sendWebhook(tenantId, 'payment.failed', { payment, error });
  }

  static async screeningCompleted(tenantId: string, screening: any): Promise<void> {
    await this.getService().sendWebhook(tenantId, 'screening.completed', { screening });
  }

  static async whatsappMessageSent(tenantId: string, message: any): Promise<void> {
    await this.getService().sendWebhook(tenantId, 'whatsapp.message_sent', { message });
  }

  static async whatsappMessageReceived(tenantId: string, message: any): Promise<void> {
    await this.getService().sendWebhook(tenantId, 'whatsapp.message_received', { message });
  }

  static async userCreated(tenantId: string, user: any): Promise<void> {
    await this.getService().sendWebhook(tenantId, 'user.created', { user });
  }

  static async tenantUpdated(tenantId: string, tenant: any, changes: any): Promise<void> {
    await this.getService().sendWebhook(tenantId, 'tenant.updated', { tenant, changes });
  }
}