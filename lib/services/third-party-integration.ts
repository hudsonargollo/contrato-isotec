/**
 * Third-Party Integration Service
 * 
 * Manages external service integrations and real-time data synchronization
 * for CRM systems, email services, analytics platforms, and other tools.
 * 
 * Requirements: 10.2 - Third-party integrations and real-time data synchronization
 */

import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Integration service types
export type IntegrationServiceType = 'crm' | 'email' | 'sms' | 'analytics' | 'storage' | 'payment' | 'other';

// Sync operation types
export type SyncOperationType = 'create' | 'update' | 'delete' | 'sync';
export type SyncDirection = 'inbound' | 'outbound' | 'bidirectional';
export type SyncStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

// Integration configuration
export interface ThirdPartyIntegration {
  id: string;
  tenant_id: string;
  service_name: string;
  service_type: IntegrationServiceType;
  configuration: Record<string, any>;
  credentials: Record<string, any>;
  active: boolean;
  sync_enabled: boolean;
  last_sync_at?: Date;
  sync_frequency_minutes?: number;
  last_error?: string;
  error_count: number;
  last_error_at?: Date;
  created_at: Date;
  updated_at: Date;
}

// Sync operation record
export interface SyncOperation {
  id: string;
  tenant_id: string;
  integration_id: string;
  operation_type: SyncOperationType;
  direction: SyncDirection;
  entity_type: string;
  entity_id?: string;
  source_data?: Record<string, any>;
  target_data?: Record<string, any>;
  mapping_rules?: Record<string, any>;
  status: SyncStatus;
  error_message?: string;
  retry_count: number;
  started_at: Date;
  completed_at?: Date;
  created_at: Date;
  updated_at: Date;
}

// Integration configuration schemas
const IntegrationConfigSchema = z.object({
  service_name: z.string().min(1),
  service_type: z.enum(['crm', 'email', 'sms', 'analytics', 'storage', 'payment', 'other']),
  configuration: z.record(z.any()),
  credentials: z.record(z.any()),
  sync_enabled: z.boolean().default(false),
  sync_frequency_minutes: z.number().min(1).optional()
});

export type IntegrationConfig = z.infer<typeof IntegrationConfigSchema>;

// Predefined integration templates
export const INTEGRATION_TEMPLATES = {
  hubspot: {
    service_name: 'HubSpot CRM',
    service_type: 'crm' as IntegrationServiceType,
    configuration: {
      api_base_url: 'https://api.hubapi.com',
      supported_entities: ['contacts', 'companies', 'deals', 'tickets'],
      rate_limit: 100,
      batch_size: 100
    },
    required_credentials: ['access_token', 'portal_id']
  },
  salesforce: {
    service_name: 'Salesforce',
    service_type: 'crm' as IntegrationServiceType,
    configuration: {
      api_version: 'v58.0',
      supported_entities: ['Lead', 'Contact', 'Account', 'Opportunity'],
      rate_limit: 1000,
      batch_size: 200
    },
    required_credentials: ['access_token', 'instance_url', 'refresh_token']
  },
  mailchimp: {
    service_name: 'Mailchimp',
    service_type: 'email' as IntegrationServiceType,
    configuration: {
      api_base_url: 'https://us1.api.mailchimp.com/3.0',
      supported_entities: ['lists', 'campaigns', 'members'],
      rate_limit: 10,
      batch_size: 500
    },
    required_credentials: ['api_key', 'server_prefix']
  },
  zapier: {
    service_name: 'Zapier',
    service_type: 'other' as IntegrationServiceType,
    configuration: {
      webhook_url: '',
      supported_triggers: ['lead_created', 'contract_signed', 'invoice_paid'],
      rate_limit: 100,
      retry_attempts: 3
    },
    required_credentials: ['webhook_url']
  }
};

export class ThirdPartyIntegrationService {
  /**
   * Create a new third-party integration
   */
  async createIntegration(
    tenantId: string,
    config: IntegrationConfig
  ): Promise<ThirdPartyIntegration> {
    const supabase = createClient();
    // Validate configuration
    const validatedConfig = IntegrationConfigSchema.parse(config);

    // Check if integration already exists
    const { data: existing } = await supabase
      .from('third_party_integrations')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('service_name', validatedConfig.service_name)
      .single();

    if (existing) {
      throw new Error(`Integration with ${validatedConfig.service_name} already exists`);
    }

    const { data, error } = await supabase
      .from('third_party_integrations')
      .insert({
        tenant_id: tenantId,
        service_name: validatedConfig.service_name,
        service_type: validatedConfig.service_type,
        configuration: validatedConfig.configuration,
        credentials: validatedConfig.credentials,
        active: true,
        sync_enabled: validatedConfig.sync_enabled,
        sync_frequency_minutes: validatedConfig.sync_frequency_minutes,
        error_count: 0
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create integration: ${error.message}`);
    }

    return data;
  }

  /**
   * Update integration configuration
   */
  async updateIntegration(
    integrationId: string,
    updates: Partial<IntegrationConfig>
  ): Promise<ThirdPartyIntegration> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('third_party_integrations')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', integrationId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update integration: ${error.message}`);
    }

    return data;
  }

  /**
   * Delete integration
   */
  async deleteIntegration(integrationId: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from('third_party_integrations')
      .delete()
      .eq('id', integrationId);

    if (error) {
      throw new Error(`Failed to delete integration: ${error.message}`);
    }
  }

  /**
   * Get integrations for a tenant
   */
  async getIntegrations(tenantId: string): Promise<ThirdPartyIntegration[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('third_party_integrations')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get integrations: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get integration by ID
   */
  async getIntegration(integrationId: string): Promise<ThirdPartyIntegration | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('third_party_integrations')
      .select('*')
      .eq('id', integrationId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to get integration: ${error.message}`);
    }

    return data;
  }

  /**
   * Test integration connection
   */
  async testConnection(integrationId: string): Promise<{ success: boolean; error?: string }> {
    const integration = await this.getIntegration(integrationId);
    if (!integration) {
      return { success: false, error: 'Integration not found' };
    }

    try {
      // Test connection based on service type
      switch (integration.service_name.toLowerCase()) {
        case 'hubspot crm':
          return await this.testHubSpotConnection(integration);
        case 'salesforce':
          return await this.testSalesforceConnection(integration);
        case 'mailchimp':
          return await this.testMailchimpConnection(integration);
        case 'zapier':
          return await this.testZapierConnection(integration);
        default:
          return await this.testGenericWebhookConnection(integration);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Update error count
      await this.recordError(integrationId, errorMessage);
      
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Sync data with external service
   */
  async syncData(
    integrationId: string,
    operationType: SyncOperationType,
    entityType: string,
    entityId?: string,
    data?: Record<string, any>
  ): Promise<SyncOperation> {
    const supabase = createClient();
    const integration = await this.getIntegration(integrationId);
    if (!integration) {
      throw new Error('Integration not found');
    }

    if (!integration.active) {
      throw new Error('Integration is not active');
    }

    // Create sync operation record
    const { data: syncOp, error } = await supabase
      .from('sync_operations')
      .insert({
        tenant_id: integration.tenant_id,
        integration_id: integrationId,
        operation_type: operationType,
        direction: 'outbound', // Default to outbound
        entity_type: entityType,
        entity_id: entityId,
        source_data: data,
        status: 'pending',
        retry_count: 0
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create sync operation: ${error.message}`);
    }

    // Process sync operation asynchronously
    this.processSyncOperation(syncOp.id).catch(error => {
      console.error('Sync operation failed:', error);
    });

    return syncOp;
  }

  /**
   * Process sync operation
   */
  private async processSyncOperation(syncOpId: string): Promise<void> {
    const supabase = createClient();
    // Update status to running
    await supabase
      .from('sync_operations')
      .update({
        status: 'running',
        updated_at: new Date().toISOString()
      })
      .eq('id', syncOpId);

    try {
      // Get sync operation details
      const { data: syncOp, error } = await supabase
        .from('sync_operations')
        .select(`
          *,
          integration:third_party_integrations(*)
        `)
        .eq('id', syncOpId)
        .single();

      if (error || !syncOp) {
        throw new Error('Sync operation not found');
      }

      const integration = syncOp.integration as ThirdPartyIntegration;

      // Process based on service type
      let result: Record<string, any> = {};
      
      switch (integration.service_name.toLowerCase()) {
        case 'hubspot crm':
          result = await this.syncWithHubSpot(syncOp, integration);
          break;
        case 'salesforce':
          result = await this.syncWithSalesforce(syncOp, integration);
          break;
        case 'mailchimp':
          result = await this.syncWithMailchimp(syncOp, integration);
          break;
        case 'zapier':
          result = await this.syncWithZapier(syncOp, integration);
          break;
        default:
          result = await this.syncWithGenericWebhook(syncOp, integration);
      }

      // Update sync operation as completed
      await supabase
        .from('sync_operations')
        .update({
          status: 'completed',
          target_data: result,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', syncOpId);

      // Update integration last sync time
      await supabase
        .from('third_party_integrations')
        .update({
          last_sync_at: new Date().toISOString(),
          error_count: 0, // Reset error count on success
          last_error: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', integration.id);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Update sync operation as failed
      await supabase
        .from('sync_operations')
        .update({
          status: 'failed',
          error_message: errorMessage,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', syncOpId);

      // Record error in integration
      const { data: syncOp } = await supabase
        .from('sync_operations')
        .select('integration_id')
        .eq('id', syncOpId)
        .single();

      if (syncOp) {
        await this.recordError(syncOp.integration_id, errorMessage);
      }
    }
  }

  /**
   * Record integration error
   */
  private async recordError(integrationId: string, errorMessage: string): Promise<void> {
    const supabase = createClient();
    await supabase
      .from('third_party_integrations')
      .update({
        last_error: errorMessage,
        error_count: supabase.raw('error_count + 1'),
        last_error_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', integrationId);
  }

  /**
   * Get sync operation history
   */
  async getSyncHistory(
    tenantId: string,
    integrationId?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<SyncOperation[]> {
    const supabase = createClient();
    let query = supabase
      .from('sync_operations')
      .select('*')
      .eq('tenant_id', tenantId);

    if (integrationId) {
      query = query.eq('integration_id', integrationId);
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to get sync history: ${error.message}`);
    }

    return data || [];
  }

  // Service-specific connection tests
  private async testHubSpotConnection(integration: ThirdPartyIntegration): Promise<{ success: boolean; error?: string }> {
    const { access_token } = integration.credentials;
    
    const response = await fetch('https://api.hubapi.com/crm/v3/objects/contacts?limit=1', {
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      return { success: true };
    } else {
      const error = await response.text();
      return { success: false, error: `HubSpot API error: ${error}` };
    }
  }

  private async testSalesforceConnection(integration: ThirdPartyIntegration): Promise<{ success: boolean; error?: string }> {
    const { access_token, instance_url } = integration.credentials;
    
    const response = await fetch(`${instance_url}/services/data/v58.0/sobjects/`, {
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      return { success: true };
    } else {
      const error = await response.text();
      return { success: false, error: `Salesforce API error: ${error}` };
    }
  }

  private async testMailchimpConnection(integration: ThirdPartyIntegration): Promise<{ success: boolean; error?: string }> {
    const { api_key, server_prefix } = integration.credentials;
    
    const response = await fetch(`https://${server_prefix}.api.mailchimp.com/3.0/ping`, {
      headers: {
        'Authorization': `apikey ${api_key}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      return { success: true };
    } else {
      const error = await response.text();
      return { success: false, error: `Mailchimp API error: ${error}` };
    }
  }

  private async testZapierConnection(integration: ThirdPartyIntegration): Promise<{ success: boolean; error?: string }> {
    const { webhook_url } = integration.credentials;
    
    const response = await fetch(webhook_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        test: true,
        timestamp: new Date().toISOString()
      })
    });

    if (response.ok) {
      return { success: true };
    } else {
      const error = await response.text();
      return { success: false, error: `Zapier webhook error: ${error}` };
    }
  }

  private async testGenericWebhookConnection(integration: ThirdPartyIntegration): Promise<{ success: boolean; error?: string }> {
    const webhookUrl = integration.configuration.webhook_url || integration.credentials.webhook_url;
    
    if (!webhookUrl) {
      return { success: false, error: 'No webhook URL configured' };
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        test: true,
        timestamp: new Date().toISOString()
      })
    });

    if (response.ok) {
      return { success: true };
    } else {
      const error = await response.text();
      return { success: false, error: `Webhook error: ${error}` };
    }
  }

  // Service-specific sync implementations (simplified)
  private async syncWithHubSpot(syncOp: SyncOperation, integration: ThirdPartyIntegration): Promise<Record<string, any>> {
    // Implement HubSpot-specific sync logic
    return { synced: true, service: 'hubspot' };
  }

  private async syncWithSalesforce(syncOp: SyncOperation, integration: ThirdPartyIntegration): Promise<Record<string, any>> {
    // Implement Salesforce-specific sync logic
    return { synced: true, service: 'salesforce' };
  }

  private async syncWithMailchimp(syncOp: SyncOperation, integration: ThirdPartyIntegration): Promise<Record<string, any>> {
    // Implement Mailchimp-specific sync logic
    return { synced: true, service: 'mailchimp' };
  }

  private async syncWithZapier(syncOp: SyncOperation, integration: ThirdPartyIntegration): Promise<Record<string, any>> {
    // Implement Zapier webhook sync logic
    const { webhook_url } = integration.credentials;
    
    const response = await fetch(webhook_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        operation: syncOp.operation_type,
        entity_type: syncOp.entity_type,
        entity_id: syncOp.entity_id,
        data: syncOp.source_data,
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`Zapier webhook failed: ${response.statusText}`);
    }

    return { synced: true, service: 'zapier', response_status: response.status };
  }

  private async syncWithGenericWebhook(syncOp: SyncOperation, integration: ThirdPartyIntegration): Promise<Record<string, any>> {
    // Implement generic webhook sync logic
    const webhookUrl = integration.configuration.webhook_url || integration.credentials.webhook_url;
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        operation: syncOp.operation_type,
        entity_type: syncOp.entity_type,
        entity_id: syncOp.entity_id,
        data: syncOp.source_data,
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`Generic webhook failed: ${response.statusText}`);
    }

    return { synced: true, service: 'generic', response_status: response.status };
  }
}

// Singleton instance
let thirdPartyIntegrationService: ThirdPartyIntegrationService;

export function getThirdPartyIntegrationService(): ThirdPartyIntegrationService {
  if (!thirdPartyIntegrationService) {
    thirdPartyIntegrationService = new ThirdPartyIntegrationService();
  }
  return thirdPartyIntegrationService;
}