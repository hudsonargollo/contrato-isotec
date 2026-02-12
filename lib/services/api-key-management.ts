/**
 * API Key Management Service
 * 
 * Comprehensive service for managing API keys, including creation, validation,
 * rotation, and usage tracking for the SolarCRM Pro platform.
 * 
 * Requirements: 10.4 - API rate limiting and usage tracking
 */

import { createClient } from '@supabase/supabase-js';
import { randomBytes, createHash } from 'crypto';

// Lazy-loaded Supabase client to avoid build-time initialization
let supabase: ReturnType<typeof createClient> | null = null;

function getSupabaseClient() {
  if (!supabase) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    // If environment variables are missing (during build), return a mock client
    if (!supabaseUrl || !supabaseServiceKey) {
      return createMockSupabaseClient();
    }
    
    supabase = createClient(supabaseUrl, supabaseServiceKey);
  }
  return supabase;
}

function createMockSupabaseClient() {
  const mockQuery = {
    select: () => mockQuery,
    insert: () => mockQuery,
    update: () => mockQuery,
    delete: () => mockQuery,
    eq: () => mockQuery,
    single: () => Promise.resolve({ data: null, error: null }),
    order: () => mockQuery,
  };

  return {
    from: () => mockQuery,
  } as any;
}

// API Key interfaces
export interface APIKey {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  key_hash: string;
  key_prefix: string;
  scopes: string[];
  permissions: Record<string, any>;
  active: boolean;
  rate_limit_override?: RateLimitOverride;
  last_used_at?: Date;
  total_requests: number;
  created_by?: string;
  created_at: Date;
  updated_at: Date;
  expires_at?: Date;
}

export interface RateLimitOverride {
  requestsPerMinute?: number;
  requestsPerHour?: number;
  requestsPerDay?: number;
  burstLimit?: number;
}

export interface CreateAPIKeyRequest {
  tenant_id: string;
  name: string;
  description?: string;
  scopes: string[];
  permissions?: Record<string, any>;
  rate_limit_override?: RateLimitOverride;
  expires_at?: Date;
  created_by?: string;
}

export interface APIKeyWithSecret {
  id: string;
  key: string; // The actual API key (only returned once)
  prefix: string;
  name: string;
  scopes: string[];
  expires_at?: Date;
}

// Available API scopes
export const API_SCOPES = {
  // CRM operations
  'leads:read': 'Read lead data',
  'leads:write': 'Create and update leads',
  'leads:delete': 'Delete leads',
  
  // Contract operations
  'contracts:read': 'Read contract data',
  'contracts:write': 'Create and update contracts',
  'contracts:delete': 'Delete contracts',
  
  // Invoice operations
  'invoices:read': 'Read invoice data',
  'invoices:write': 'Create and update invoices',
  'invoices:delete': 'Delete invoices',
  
  // Analytics operations
  'analytics:read': 'Read analytics data',
  'analytics:write': 'Create custom analytics',
  
  // WhatsApp operations
  'whatsapp:read': 'Read WhatsApp messages',
  'whatsapp:write': 'Send WhatsApp messages',
  
  // Webhook operations
  'webhooks:read': 'Read webhook configurations',
  'webhooks:write': 'Create and update webhooks',
  
  // Integration operations
  'integrations:read': 'Read integration configurations',
  'integrations:write': 'Create and update integrations',
  
  // Admin operations
  'admin:all': 'Full administrative access'
} as const;

export type APIScope = keyof typeof API_SCOPES;

export class APIKeyManagementService {
  /**
   * Create a new API key
   */
  async createAPIKey(request: CreateAPIKeyRequest): Promise<APIKeyWithSecret> {
    // Generate API key
    const keyData = this.generateAPIKey();
    const keyHash = this.hashAPIKey(keyData.key);
    
    // Validate scopes
    this.validateScopes(request.scopes);
    
    // Insert into database
    const { data: apiKey, error } = await getSupabaseClient()
      .from('api_keys')
      .insert({
        tenant_id: request.tenant_id,
        name: request.name,
        description: request.description,
        key_hash: keyHash,
        key_prefix: keyData.prefix,
        scopes: request.scopes,
        permissions: request.permissions || {},
        rate_limit_override: request.rate_limit_override,
        expires_at: request.expires_at?.toISOString(),
        created_by: request.created_by
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create API key: ${error.message}`);
    }

    return {
      id: apiKey.id,
      key: keyData.key,
      prefix: keyData.prefix,
      name: apiKey.name,
      scopes: apiKey.scopes,
      expires_at: apiKey.expires_at ? new Date(apiKey.expires_at) : undefined
    };
  }

  /**
   * Get API keys for a tenant
   */
  async getAPIKeys(tenantId: string): Promise<APIKey[]> {
    const { data: apiKeys, error } = await getSupabaseClient()
      .from('api_keys')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get API keys: ${error.message}`);
    }

    return apiKeys.map(this.mapAPIKeyFromDB);
  }

  /**
   * Get API key by ID
   */
  async getAPIKey(tenantId: string, keyId: string): Promise<APIKey | null> {
    const { data: apiKey, error } = await getSupabaseClient()
      .from('api_keys')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('id', keyId)
      .single();

    if (error || !apiKey) {
      return null;
    }

    return this.mapAPIKeyFromDB(apiKey);
  }

  /**
   * Validate API key and get details
   */
  async validateAPIKey(key: string): Promise<APIKey | null> {
    const keyHash = this.hashAPIKey(key);
    
    const { data: apiKey, error } = await getSupabaseClient()
      .from('api_keys')
      .select('*')
      .eq('key_hash', keyHash)
      .eq('active', true)
      .single();

    if (error || !apiKey) {
      return null;
    }

    // Check expiration
    if (apiKey.expires_at && new Date(apiKey.expires_at) < new Date()) {
      return null;
    }

    return this.mapAPIKeyFromDB(apiKey);
  }

  /**
   * Update API key
   */
  async updateAPIKey(
    tenantId: string,
    keyId: string,
    updates: Partial<Pick<APIKey, 'name' | 'description' | 'scopes' | 'permissions' | 'active' | 'rate_limit_override' | 'expires_at'>>
  ): Promise<APIKey> {
    // Validate scopes if provided
    if (updates.scopes) {
      this.validateScopes(updates.scopes);
    }

    const { data: apiKey, error } = await getSupabaseClient()
      .from('api_keys')
      .update({
        ...updates,
        expires_at: updates.expires_at?.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('tenant_id', tenantId)
      .eq('id', keyId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update API key: ${error.message}`);
    }

    return this.mapAPIKeyFromDB(apiKey);
  }

  /**
   * Delete API key
   */
  async deleteAPIKey(tenantId: string, keyId: string): Promise<void> {
    const { error } = await getSupabaseClient()
      .from('api_keys')
      .delete()
      .eq('tenant_id', tenantId)
      .eq('id', keyId);

    if (error) {
      throw new Error(`Failed to delete API key: ${error.message}`);
    }
  }

  /**
   * Rotate API key (generate new key, keep same ID and settings)
   */
  async rotateAPIKey(tenantId: string, keyId: string): Promise<APIKeyWithSecret> {
    // Get existing key
    const existingKey = await this.getAPIKey(tenantId, keyId);
    if (!existingKey) {
      throw new Error('API key not found');
    }

    // Generate new key
    const keyData = this.generateAPIKey();
    const keyHash = this.hashAPIKey(keyData.key);

    // Update in database
    const { data: apiKey, error } = await getSupabaseClient()
      .from('api_keys')
      .update({
        key_hash: keyHash,
        key_prefix: keyData.prefix,
        updated_at: new Date().toISOString()
      })
      .eq('tenant_id', tenantId)
      .eq('id', keyId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to rotate API key: ${error.message}`);
    }

    return {
      id: apiKey.id,
      key: keyData.key,
      prefix: keyData.prefix,
      name: apiKey.name,
      scopes: apiKey.scopes,
      expires_at: apiKey.expires_at ? new Date(apiKey.expires_at) : undefined
    };
  }

  /**
   * Get API key usage statistics
   */
  async getAPIKeyUsage(
    tenantId: string,
    keyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    requestsByDay: Array<{ date: string; count: number }>;
    topEndpoints: Array<{ endpoint: string; count: number }>;
  }> {
    const { data: usageLogs, error } = await getSupabaseClient()
      .from('api_usage_logs')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('api_key_id', keyId)
      .gte('timestamp', startDate.toISOString())
      .lte('timestamp', endDate.toISOString());

    if (error) {
      throw new Error(`Failed to get API key usage: ${error.message}`);
    }

    if (!usageLogs || usageLogs.length === 0) {
      return {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        requestsByDay: [],
        topEndpoints: []
      };
    }

    const totalRequests = usageLogs.length;
    const successfulRequests = usageLogs.filter(log => log.status_code < 400).length;
    const failedRequests = totalRequests - successfulRequests;
    const averageResponseTime = usageLogs.reduce((sum, log) => sum + log.response_time_ms, 0) / totalRequests;

    // Group by day
    const requestsByDay = usageLogs.reduce((acc, log) => {
      const date = new Date(log.timestamp).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Group by endpoint
    const endpointCounts = usageLogs.reduce((acc, log) => {
      acc[log.endpoint] = (acc[log.endpoint] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      averageResponseTime,
      requestsByDay: Object.entries(requestsByDay)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date)),
      topEndpoints: Object.entries(endpointCounts)
        .map(([endpoint, count]) => ({ endpoint, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
    };
  }

  /**
   * Check if API key has specific scope
   */
  hasScope(apiKey: APIKey, scope: APIScope): boolean {
    return apiKey.scopes.includes(scope) || apiKey.scopes.includes('admin:all');
  }

  /**
   * Check if API key has specific permission
   */
  hasPermission(apiKey: APIKey, permission: string): boolean {
    if (this.hasScope(apiKey, 'admin:all')) {
      return true;
    }

    // Check specific permissions
    const permissions = apiKey.permissions || {};
    return permissions[permission] === true || permissions['*'] === true;
  }

  /**
   * Generate API key
   */
  private generateAPIKey(): { key: string; prefix: string } {
    const prefix = 'sk_live_';
    const randomPart = randomBytes(32).toString('hex');
    const key = `${prefix}${randomPart}`;
    
    return {
      key,
      prefix: key.substring(0, 8)
    };
  }

  /**
   * Hash API key for storage
   */
  private hashAPIKey(key: string): string {
    return createHash('sha256').update(key).digest('hex');
  }

  /**
   * Validate API scopes
   */
  private validateScopes(scopes: string[]): void {
    const validScopes = Object.keys(API_SCOPES);
    const invalidScopes = scopes.filter(scope => !validScopes.includes(scope));
    
    if (invalidScopes.length > 0) {
      throw new Error(`Invalid scopes: ${invalidScopes.join(', ')}`);
    }
  }

  /**
   * Map API key from database format
   */
  private mapAPIKeyFromDB(dbKey: any): APIKey {
    return {
      id: dbKey.id,
      tenant_id: dbKey.tenant_id,
      name: dbKey.name,
      description: dbKey.description,
      key_hash: dbKey.key_hash,
      key_prefix: dbKey.key_prefix,
      scopes: dbKey.scopes || [],
      permissions: dbKey.permissions || {},
      active: dbKey.active,
      rate_limit_override: dbKey.rate_limit_override,
      last_used_at: dbKey.last_used_at ? new Date(dbKey.last_used_at) : undefined,
      total_requests: dbKey.total_requests || 0,
      created_by: dbKey.created_by,
      created_at: new Date(dbKey.created_at),
      updated_at: new Date(dbKey.updated_at),
      expires_at: dbKey.expires_at ? new Date(dbKey.expires_at) : undefined
    };
  }
}

// Singleton instance
let apiKeyManagementService: APIKeyManagementService;

export function getAPIKeyManagementService(): APIKeyManagementService {
  if (!apiKeyManagementService) {
    apiKeyManagementService = new APIKeyManagementService();
  }
  return apiKeyManagementService;
}