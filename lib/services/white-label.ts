/**
 * White-Label Features Service
 * 
 * Comprehensive service for enterprise white-label features including
 * advanced customization, API access management, and enterprise feature toggles.
 * 
 * Requirements: 9.5 - Enterprise white-label features
 */

import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { TenantBranding, hasFeature } from '@/lib/types/tenant';

// White-label configuration schema
export const whiteLabelConfigSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  custom_domain: z.string().optional(),
  custom_domain_verified: z.boolean().default(false),
  ssl_certificate_id: z.string().optional(),
  favicon_url: z.string().url().optional(),
  login_logo_url: z.string().url().optional(),
  email_logo_url: z.string().url().optional(),
  custom_css: z.string().default(''),
  custom_js: z.string().default(''),
  hide_branding: z.boolean().default(false),
  custom_email_templates: z.record(z.string()).default({}),
  custom_notification_settings: z.record(z.any()).default({}),
  api_subdomain: z.string().optional(),
  webhook_endpoints: z.array(z.string().url()).default([]),
  created_at: z.date(),
  updated_at: z.date()
});

// API access configuration schema
export const apiAccessConfigSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  api_key: z.string(),
  api_secret: z.string(),
  rate_limit_per_hour: z.number().int().min(0).default(25000),
  rate_limit_per_day: z.number().int().min(0).default(500000),
  allowed_endpoints: z.array(z.string()).default(['*']),
  webhook_secret: z.string(),
  ip_whitelist: z.array(z.string()).default([]),
  cors_origins: z.array(z.string()).default([]),
  is_active: z.boolean().default(true),
  last_used_at: z.date().optional(),
  created_at: z.date(),
  updated_at: z.date()
});

// Enterprise feature toggle schema
export const enterpriseFeatureSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  feature_key: z.string(),
  feature_name: z.string(),
  is_enabled: z.boolean().default(true),
  configuration: z.record(z.any()).default({}),
  usage_limits: z.record(z.number()).default({}),
  created_at: z.date(),
  updated_at: z.date()
});

// Custom domain verification schema
export const domainVerificationSchema = z.object({
  domain: z.string(),
  verification_token: z.string(),
  dns_records: z.array(z.object({
    type: z.enum(['CNAME', 'A', 'TXT']),
    name: z.string(),
    value: z.string(),
    ttl: z.number().optional()
  })),
  status: z.enum(['pending', 'verified', 'failed']),
  verified_at: z.date().optional()
});

// Type exports
export type WhiteLabelConfig = z.infer<typeof whiteLabelConfigSchema>;
export type ApiAccessConfig = z.infer<typeof apiAccessConfigSchema>;
export type EnterpriseFeature = z.infer<typeof enterpriseFeatureSchema>;
export type DomainVerification = z.infer<typeof domainVerificationSchema>;

// Available enterprise features
export const ENTERPRISE_FEATURES = {
  CUSTOM_DOMAIN: 'custom_domain',
  API_ACCESS: 'api_access',
  WEBHOOK_INTEGRATION: 'webhook_integration',
  CUSTOM_BRANDING: 'custom_branding',
  ADVANCED_ANALYTICS: 'advanced_analytics',
  BULK_OPERATIONS: 'bulk_operations',
  CUSTOM_FIELDS: 'custom_fields',
  ADVANCED_PERMISSIONS: 'advanced_permissions',
  SSO_INTEGRATION: 'sso_integration',
  AUDIT_LOGS: 'audit_logs',
  DATA_EXPORT: 'data_export',
  PRIORITY_SUPPORT: 'priority_support'
} as const;

// Default enterprise feature configurations
export const DEFAULT_ENTERPRISE_FEATURES = [
  {
    feature_key: ENTERPRISE_FEATURES.CUSTOM_DOMAIN,
    feature_name: 'Custom Domain',
    configuration: { max_domains: 3 }
  },
  {
    feature_key: ENTERPRISE_FEATURES.API_ACCESS,
    feature_name: 'API Access',
    configuration: { rate_limit: 25000, webhook_limit: 10 }
  },
  {
    feature_key: ENTERPRISE_FEATURES.WEBHOOK_INTEGRATION,
    feature_name: 'Webhook Integration',
    configuration: { max_webhooks: 10, retry_attempts: 3 }
  },
  {
    feature_key: ENTERPRISE_FEATURES.CUSTOM_BRANDING,
    feature_name: 'Custom Branding',
    configuration: { hide_platform_branding: true }
  },
  {
    feature_key: ENTERPRISE_FEATURES.ADVANCED_ANALYTICS,
    feature_name: 'Advanced Analytics',
    configuration: { data_retention_days: 365, custom_reports: true }
  },
  {
    feature_key: ENTERPRISE_FEATURES.BULK_OPERATIONS,
    feature_name: 'Bulk Operations',
    configuration: { max_batch_size: 10000 }
  },
  {
    feature_key: ENTERPRISE_FEATURES.CUSTOM_FIELDS,
    feature_name: 'Custom Fields',
    configuration: { max_custom_fields: 50 }
  },
  {
    feature_key: ENTERPRISE_FEATURES.ADVANCED_PERMISSIONS,
    feature_name: 'Advanced Permissions',
    configuration: { custom_roles: true, field_level_permissions: true }
  },
  {
    feature_key: ENTERPRISE_FEATURES.SSO_INTEGRATION,
    feature_name: 'SSO Integration',
    configuration: { saml: true, oauth: true, ldap: true }
  },
  {
    feature_key: ENTERPRISE_FEATURES.AUDIT_LOGS,
    feature_name: 'Audit Logs',
    configuration: { retention_days: 365, real_time_alerts: true }
  },
  {
    feature_key: ENTERPRISE_FEATURES.DATA_EXPORT,
    feature_name: 'Data Export',
    configuration: { formats: ['csv', 'json', 'xml'], scheduled_exports: true }
  },
  {
    feature_key: ENTERPRISE_FEATURES.PRIORITY_SUPPORT,
    feature_name: 'Priority Support',
    configuration: { sla_hours: 4, dedicated_manager: true }
  }
];

export class WhiteLabelService {
  private supabase;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  /**
   * Initialize white-label features for enterprise tenant
   */
  async initializeWhiteLabelFeatures(tenantId: string): Promise<void> {
    // Check if tenant has enterprise plan
    const { data: tenant, error: tenantError } = await this.supabase
      .from('tenants')
      .select('subscription')
      .eq('id', tenantId)
      .single();

    if (tenantError || !tenant) {
      throw new Error(`Failed to get tenant: ${tenantError?.message}`);
    }

    const subscription = typeof tenant.subscription === 'string' 
      ? JSON.parse(tenant.subscription) 
      : tenant.subscription;

    if (!hasFeature(subscription, 'white_label')) {
      throw new Error('White-label features not available for this subscription plan');
    }

    // Create white-label configuration
    const { error: configError } = await this.supabase
      .from('white_label_configs')
      .insert({
        tenant_id: tenantId,
        custom_css: '',
        custom_js: '',
        hide_branding: false,
        custom_email_templates: {},
        custom_notification_settings: {},
        webhook_endpoints: []
      });

    if (configError) {
      throw new Error(`Failed to create white-label config: ${configError.message}`);
    }

    // Create API access configuration
    const apiKey = this.generateApiKey();
    const apiSecret = this.generateApiSecret();
    const webhookSecret = this.generateWebhookSecret();

    const { error: apiError } = await this.supabase
      .from('api_access_configs')
      .insert({
        tenant_id: tenantId,
        api_key: apiKey,
        api_secret: apiSecret,
        webhook_secret: webhookSecret,
        rate_limit_per_hour: 25000,
        rate_limit_per_day: 500000,
        allowed_endpoints: ['*'],
        ip_whitelist: [],
        cors_origins: [],
        is_active: true
      });

    if (apiError) {
      throw new Error(`Failed to create API access config: ${apiError.message}`);
    }

    // Create enterprise feature toggles
    const featureInserts = DEFAULT_ENTERPRISE_FEATURES.map(feature => ({
      tenant_id: tenantId,
      feature_key: feature.feature_key,
      feature_name: feature.feature_name,
      is_enabled: true,
      configuration: feature.configuration,
      usage_limits: {}
    }));

    const { error: featuresError } = await this.supabase
      .from('enterprise_features')
      .insert(featureInserts);

    if (featuresError) {
      throw new Error(`Failed to create enterprise features: ${featuresError.message}`);
    }
  }

  /**
   * Get white-label configuration for tenant
   */
  async getWhiteLabelConfig(tenantId: string): Promise<WhiteLabelConfig | null> {
    const { data: config, error } = await this.supabase
      .from('white_label_configs')
      .select('*')
      .eq('tenant_id', tenantId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get white-label config: ${error.message}`);
    }

    return config ? this.parseWhiteLabelConfig(config) : null;
  }

  /**
   * Update white-label configuration
   */
  async updateWhiteLabelConfig(
    tenantId: string,
    updates: Partial<Omit<WhiteLabelConfig, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>>
  ): Promise<WhiteLabelConfig> {
    const { data: config, error } = await this.supabase
      .from('white_label_configs')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update white-label config: ${error.message}`);
    }

    return this.parseWhiteLabelConfig(config);
  }

  /**
   * Verify custom domain
   */
  async verifyCustomDomain(tenantId: string, domain: string): Promise<DomainVerification> {
    // Generate verification token
    const verificationToken = this.generateVerificationToken();

    // Create DNS records for verification
    const dnsRecords = [
      {
        type: 'CNAME' as const,
        name: domain,
        value: `${tenantId}.solarcrm.clubemkt.digital`,
        ttl: 300
      },
      {
        type: 'TXT' as const,
        name: `_solarcrm-verification.${domain}`,
        value: verificationToken,
        ttl: 300
      }
    ];

    // Store verification record
    const { error } = await this.supabase
      .from('domain_verifications')
      .insert({
        tenant_id: tenantId,
        domain: domain,
        verification_token: verificationToken,
        dns_records: dnsRecords,
        status: 'pending'
      });

    if (error) {
      throw new Error(`Failed to create domain verification: ${error.message}`);
    }

    return {
      domain,
      verification_token: verificationToken,
      dns_records: dnsRecords,
      status: 'pending'
    };
  }

  /**
   * Check domain verification status
   */
  async checkDomainVerification(tenantId: string, domain: string): Promise<boolean> {
    try {
      // In a real implementation, this would check DNS records
      // For now, we'll simulate the verification process
      
      const { data: verification, error } = await this.supabase
        .from('domain_verifications')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('domain', domain)
        .single();

      if (error) {
        return false;
      }

      // Simulate DNS verification (in real implementation, use DNS lookup)
      const isVerified = Math.random() > 0.5; // 50% chance for demo

      if (isVerified && verification.status === 'pending') {
        // Update verification status
        await this.supabase
          .from('domain_verifications')
          .update({
            status: 'verified',
            verified_at: new Date().toISOString()
          })
          .eq('tenant_id', tenantId)
          .eq('domain', domain);

        // Update white-label config with verified domain
        await this.supabase
          .from('white_label_configs')
          .update({
            custom_domain: domain,
            custom_domain_verified: true,
            updated_at: new Date().toISOString()
          })
          .eq('tenant_id', tenantId);

        return true;
      }

      return verification.status === 'verified';
    } catch (error) {
      console.error('Error checking domain verification:', error);
      return false;
    }
  }

  /**
   * Get API access configuration
   */
  async getApiAccessConfig(tenantId: string): Promise<ApiAccessConfig | null> {
    const { data: config, error } = await this.supabase
      .from('api_access_configs')
      .select('*')
      .eq('tenant_id', tenantId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get API access config: ${error.message}`);
    }

    return config ? this.parseApiAccessConfig(config) : null;
  }

  /**
   * Regenerate API credentials
   */
  async regenerateApiCredentials(tenantId: string): Promise<{ apiKey: string; apiSecret: string }> {
    const newApiKey = this.generateApiKey();
    const newApiSecret = this.generateApiSecret();

    const { error } = await this.supabase
      .from('api_access_configs')
      .update({
        api_key: newApiKey,
        api_secret: newApiSecret,
        updated_at: new Date().toISOString()
      })
      .eq('tenant_id', tenantId);

    if (error) {
      throw new Error(`Failed to regenerate API credentials: ${error.message}`);
    }

    return { apiKey: newApiKey, apiSecret: newApiSecret };
  }

  /**
   * Update API access configuration
   */
  async updateApiAccessConfig(
    tenantId: string,
    updates: Partial<Omit<ApiAccessConfig, 'id' | 'tenant_id' | 'api_key' | 'api_secret' | 'webhook_secret' | 'created_at' | 'updated_at'>>
  ): Promise<ApiAccessConfig> {
    const { data: config, error } = await this.supabase
      .from('api_access_configs')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update API access config: ${error.message}`);
    }

    return this.parseApiAccessConfig(config);
  }

  /**
   * Get enterprise features for tenant
   */
  async getEnterpriseFeatures(tenantId: string): Promise<EnterpriseFeature[]> {
    const { data: features, error } = await this.supabase
      .from('enterprise_features')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('feature_name');

    if (error) {
      throw new Error(`Failed to get enterprise features: ${error.message}`);
    }

    return (features || []).map(this.parseEnterpriseFeature);
  }

  /**
   * Toggle enterprise feature
   */
  async toggleEnterpriseFeature(
    tenantId: string,
    featureKey: string,
    enabled: boolean
  ): Promise<EnterpriseFeature> {
    const { data: feature, error } = await this.supabase
      .from('enterprise_features')
      .update({
        is_enabled: enabled,
        updated_at: new Date().toISOString()
      })
      .eq('tenant_id', tenantId)
      .eq('feature_key', featureKey)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to toggle enterprise feature: ${error.message}`);
    }

    return this.parseEnterpriseFeature(feature);
  }

  /**
   * Update enterprise feature configuration
   */
  async updateEnterpriseFeatureConfig(
    tenantId: string,
    featureKey: string,
    configuration: Record<string, any>
  ): Promise<EnterpriseFeature> {
    const { data: feature, error } = await this.supabase
      .from('enterprise_features')
      .update({
        configuration,
        updated_at: new Date().toISOString()
      })
      .eq('tenant_id', tenantId)
      .eq('feature_key', featureKey)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update enterprise feature config: ${error.message}`);
    }

    return this.parseEnterpriseFeature(feature);
  }

  /**
   * Check if enterprise feature is enabled
   */
  async isFeatureEnabled(tenantId: string, featureKey: string): Promise<boolean> {
    const { data: feature, error } = await this.supabase
      .from('enterprise_features')
      .select('is_enabled')
      .eq('tenant_id', tenantId)
      .eq('feature_key', featureKey)
      .single();

    if (error) {
      return false;
    }

    return feature?.is_enabled || false;
  }

  /**
   * Generate custom CSS for tenant branding
   */
  generateCustomCSS(branding: TenantBranding): string {
    return `
      :root {
        --primary-color: ${branding.primary_color};
        --secondary-color: ${branding.secondary_color};
        --accent-color: ${branding.accent_color};
        --background-color: ${branding.background_color};
        --text-color: ${branding.text_color};
      }

      .tenant-branding {
        --primary: ${branding.primary_color};
        --secondary: ${branding.secondary_color};
        --accent: ${branding.accent_color};
        --background: ${branding.background_color};
        --foreground: ${branding.text_color};
      }

      ${branding.white_label ? `
        .platform-branding {
          display: none !important;
        }
      ` : ''}

      ${branding.custom_css || ''}
    `;
  }

  /**
   * Generate API key
   */
  private generateApiKey(): string {
    return `sk_${this.generateRandomString(32)}`;
  }

  /**
   * Generate API secret
   */
  private generateApiSecret(): string {
    return this.generateRandomString(64);
  }

  /**
   * Generate webhook secret
   */
  private generateWebhookSecret(): string {
    return `whsec_${this.generateRandomString(32)}`;
  }

  /**
   * Generate verification token
   */
  private generateVerificationToken(): string {
    return this.generateRandomString(32);
  }

  /**
   * Generate random string
   */
  private generateRandomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Parse white-label config from database
   */
  private parseWhiteLabelConfig(config: any): WhiteLabelConfig {
    return {
      ...config,
      custom_email_templates: config.custom_email_templates || {},
      custom_notification_settings: config.custom_notification_settings || {},
      webhook_endpoints: config.webhook_endpoints || [],
      created_at: new Date(config.created_at),
      updated_at: new Date(config.updated_at)
    };
  }

  /**
   * Parse API access config from database
   */
  private parseApiAccessConfig(config: any): ApiAccessConfig {
    return {
      ...config,
      allowed_endpoints: config.allowed_endpoints || ['*'],
      ip_whitelist: config.ip_whitelist || [],
      cors_origins: config.cors_origins || [],
      last_used_at: config.last_used_at ? new Date(config.last_used_at) : undefined,
      created_at: new Date(config.created_at),
      updated_at: new Date(config.updated_at)
    };
  }

  /**
   * Parse enterprise feature from database
   */
  private parseEnterpriseFeature(feature: any): EnterpriseFeature {
    return {
      ...feature,
      configuration: feature.configuration || {},
      usage_limits: feature.usage_limits || {},
      created_at: new Date(feature.created_at),
      updated_at: new Date(feature.updated_at)
    };
  }
}

// Singleton instance
let whiteLabelService: WhiteLabelService | null = null;

export const getWhiteLabelService = (): WhiteLabelService => {
  if (!whiteLabelService) {
    whiteLabelService = new WhiteLabelService();
  }
  return whiteLabelService;
};