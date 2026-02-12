/**
 * Tenant Management Service
 * 
 * Server-side service for managing tenants, users, and tenant-related operations.
 * Handles tenant creation, user management, usage tracking, and subscription limits.
 * 
 * Requirements: 1.1, 1.2, 1.5 - Multi-Tenant Architecture
 */

import { createClient as createSupabaseClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { 
  Tenant, 
  TenantUser, 
  TenantUsage,
  CreateTenant, 
  UpdateTenant,
  CreateTenantUser,
  UpdateTenantUser,
  InviteTenantUser,
  UserRole,
  UsageMetric,
  DEFAULT_TENANT_CONFIG,
  PLAN_LIMITS,
  PLAN_FEATURES
} from '@/lib/types/tenant';

export class TenantService {
  private supabase;

  constructor() {
    // Use our centralized client that handles build-time mocking
    this.supabase = null; // Will be initialized lazily
  }

  private async getSupabaseClient() {
    if (!this.supabase) {
      this.supabase = await createSupabaseClient();
    }
    return this.supabase;
  }

  // Tenant Management
  async createTenant(data: CreateTenant): Promise<Tenant> {
    const supabase = await this.getSupabaseClient();
    const { data: tenant, error } = await supabase
      .from('tenants')
      .insert({
        ...data,
        branding: JSON.stringify(data.branding),
        subscription: JSON.stringify(data.subscription),
        settings: JSON.stringify(data.settings)
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create tenant: ${error.message}`);
    }

    return this.parseTenant(tenant);
  }

  async getTenant(id: string): Promise<Tenant | null> {
    const supabase = await this.getSupabaseClient();
    const { data: tenant, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to get tenant: ${error.message}`);
    }

    return this.parseTenant(tenant);
  }

  async getTenantByDomain(domain: string): Promise<Tenant | null> {
    const { data: tenant, error } = await await this.getSupabaseClient()
      .from('tenants')
      .select('*')
      .eq('domain', domain)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to get tenant by domain: ${error.message}`);
    }

    return this.parseTenant(tenant);
  }

  async getTenantBySubdomain(subdomain: string): Promise<Tenant | null> {
    const { data: tenant, error } = await await this.getSupabaseClient()
      .from('tenants')
      .select('*')
      .eq('subdomain', subdomain)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to get tenant by subdomain: ${error.message}`);
    }

    return this.parseTenant(tenant);
  }

  async updateTenant(id: string, data: UpdateTenant): Promise<Tenant> {
    const updateData: any = { ...data };
    
    if (data.branding) {
      updateData.branding = JSON.stringify(data.branding);
    }
    if (data.subscription) {
      updateData.subscription = JSON.stringify(data.subscription);
    }
    if (data.settings) {
      updateData.settings = JSON.stringify(data.settings);
    }

    const { data: tenant, error } = await await this.getSupabaseClient()
      .from('tenants')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update tenant: ${error.message}`);
    }

    return this.parseTenant(tenant);
  }

  async deleteTenant(id: string): Promise<void> {
    const { error } = await await this.getSupabaseClient()
      .from('tenants')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete tenant: ${error.message}`);
    }
  }

  async listTenants(limit = 50, offset = 0): Promise<Tenant[]> {
    const { data: tenants, error } = await await this.getSupabaseClient()
      .from('tenants')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to list tenants: ${error.message}`);
    }

    return tenants.map(tenant => this.parseTenant(tenant));
  }

  // Tenant User Management
  async addUserToTenant(data: CreateTenantUser): Promise<TenantUser> {
    const { data: tenantUser, error } = await await this.getSupabaseClient()
      .from('tenant_users')
      .insert({
        ...data,
        permissions: JSON.stringify(data.permissions)
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to add user to tenant: ${error.message}`);
    }

    return this.parseTenantUser(tenantUser);
  }

  async updateTenantUser(id: string, data: UpdateTenantUser): Promise<TenantUser> {
    const updateData: any = { ...data };
    
    if (data.permissions) {
      updateData.permissions = JSON.stringify(data.permissions);
    }

    const { data: tenantUser, error } = await await this.getSupabaseClient()
      .from('tenant_users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update tenant user: ${error.message}`);
    }

    return this.parseTenantUser(tenantUser);
  }

  async removeTenantUser(id: string): Promise<void> {
    const { error } = await await this.getSupabaseClient()
      .from('tenant_users')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to remove tenant user: ${error.message}`);
    }
  }

  async getTenantUsers(tenantId: string): Promise<TenantUser[]> {
    const { data: tenantUsers, error } = await await this.getSupabaseClient()
      .from('tenant_users')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('role', { ascending: true })
      .order('joined_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to get tenant users: ${error.message}`);
    }

    return tenantUsers.map(user => this.parseTenantUser(user));
  }

  async getUserTenants(userId: string): Promise<TenantUser[]> {
    const { data: tenantUsers, error } = await await this.getSupabaseClient()
      .from('tenant_users')
      .select(`
        *,
        tenant:tenants(*)
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('role', { ascending: true })
      .order('joined_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to get user tenants: ${error.message}`);
    }

    return tenantUsers.map(user => this.parseTenantUser(user));
  }

  async inviteUserToTenant(tenantId: string, data: InviteTenantUser, invitedBy: string): Promise<void> {
    // Check if user already exists
    const { data: existingUser } = await await this.getSupabaseClient().auth.admin.getUserByEmail(data.email);
    
    if (existingUser.user) {
      // User exists, add them directly
      await this.addUserToTenant({
        tenant_id: tenantId,
        user_id: existingUser.user.id,
        role: data.role,
        permissions: data.permissions,
        status: 'active',
        invited_by: invitedBy,
        invited_at: new Date()
      });
    } else {
      // User doesn't exist, create invitation
      // This would typically involve sending an email invitation
      // For now, we'll create a pending tenant user record
      const { data: newUser, error: createError } = await await this.getSupabaseClient().auth.admin.createUser({
        email: data.email,
        email_confirm: false,
        user_metadata: {
          invited_to_tenant: tenantId,
          invited_role: data.role
        }
      });

      if (createError) {
        throw new Error(`Failed to create user invitation: ${createError.message}`);
      }

      if (newUser.user) {
        await this.addUserToTenant({
          tenant_id: tenantId,
          user_id: newUser.user.id,
          role: data.role,
          permissions: data.permissions,
          status: 'pending',
          invited_by: invitedBy,
          invited_at: new Date()
        });
      }
    }

    // TODO: Send invitation email if data.send_invitation is true
  }

  // Usage Tracking
  async trackUsage(tenantId: string, metric: UsageMetric, value = 1): Promise<void> {
    const { error } = await await this.getSupabaseClient().rpc('update_tenant_usage', {
      tenant_id_param: tenantId,
      metric_name_param: metric,
      increment_value: value
    });

    if (error) {
      throw new Error(`Failed to track usage: ${error.message}`);
    }
  }

  async getTenantUsage(tenantId: string, metric?: UsageMetric): Promise<TenantUsage[]> {
    let query = await this.getSupabaseClient()
      .from('tenant_usage')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('period_start', { ascending: false });

    if (metric) {
      query = query.eq('metric_name', metric);
    }

    const { data: usage, error } = await query;

    if (error) {
      throw new Error(`Failed to get tenant usage: ${error.message}`);
    }

    return usage.map(u => ({
      ...u,
      metadata: typeof u.metadata === 'string' ? JSON.parse(u.metadata) : u.metadata,
      period_start: new Date(u.period_start),
      period_end: new Date(u.period_end),
      created_at: new Date(u.created_at)
    }));
  }

  async getCurrentUsage(tenantId: string): Promise<Record<UsageMetric, number>> {
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const { data: usage, error } = await await this.getSupabaseClient()
      .from('tenant_usage')
      .select('metric_name, metric_value')
      .eq('tenant_id', tenantId)
      .eq('period_start', currentMonth.toISOString());

    if (error) {
      throw new Error(`Failed to get current usage: ${error.message}`);
    }

    const usageMap: Record<string, number> = {};
    usage.forEach(u => {
      usageMap[u.metric_name] = u.metric_value;
    });

    return usageMap as Record<UsageMetric, number>;
  }

  // Subscription Management
  async checkLimit(tenantId: string, limitType: string): Promise<boolean> {
    const { data, error } = await await this.getSupabaseClient().rpc('check_tenant_limit', {
      tenant_id_param: tenantId,
      limit_type: limitType
    });

    if (error) {
      throw new Error(`Failed to check limit: ${error.message}`);
    }

    return data;
  }

  async upgradeSubscription(tenantId: string, newPlan: 'starter' | 'professional' | 'enterprise'): Promise<Tenant> {
    const tenant = await this.getTenant(tenantId);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    const updatedSubscription = {
      ...tenant.subscription,
      plan: newPlan,
      limits: PLAN_LIMITS[newPlan],
      features: PLAN_FEATURES[newPlan]
    };

    return this.updateTenant(tenantId, {
      subscription: updatedSubscription
    });
  }

  // Branding Management
  async updateTenantBranding(tenantId: string, branding: Partial<any>): Promise<Tenant> {
    const tenant = await this.getTenant(tenantId);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    const updatedBranding = {
      ...tenant.branding,
      ...branding
    };

    return this.updateTenant(tenantId, {
      branding: updatedBranding
    });
  }

  async getTenantBranding(tenantId: string): Promise<any> {
    const tenant = await this.getTenant(tenantId);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    return tenant.branding;
  }

  // Utility Methods
  private parseTenant(tenant: any): Tenant {
    return {
      ...tenant,
      branding: typeof tenant.branding === 'string' 
        ? JSON.parse(tenant.branding) 
        : tenant.branding,
      subscription: typeof tenant.subscription === 'string'
        ? JSON.parse(tenant.subscription)
        : tenant.subscription,
      settings: typeof tenant.settings === 'string'
        ? JSON.parse(tenant.settings)
        : tenant.settings,
      created_at: new Date(tenant.created_at),
      updated_at: new Date(tenant.updated_at)
    };
  }

  private parseTenantUser(tenantUser: any): TenantUser {
    return {
      ...tenantUser,
      permissions: typeof tenantUser.permissions === 'string'
        ? JSON.parse(tenantUser.permissions)
        : tenantUser.permissions,
      invited_at: tenantUser.invited_at ? new Date(tenantUser.invited_at) : undefined,
      joined_at: new Date(tenantUser.joined_at),
      last_active_at: new Date(tenantUser.last_active_at),
      created_at: new Date(tenantUser.created_at),
      updated_at: new Date(tenantUser.updated_at)
    };
  }

  // Tenant Context Helpers
  async setTenantContext(tenantId: string): Promise<void> {
    // This would be used in middleware to set the current tenant context
    // Implementation depends on how you want to store the context (session, cookie, etc.)
  }

  async getCurrentTenantId(): Promise<string | null> {
    // Get current tenant ID from context
    // This would typically be set by middleware based on domain/subdomain
    try {
      const { data } = await await this.getSupabaseClient().rpc('get_current_tenant_id');
      return data;
    } catch {
      return null;
    }
  }

  // Tenant Creation Helper
  async createTenantWithOwner(
    tenantData: Omit<CreateTenant, 'subscription' | 'settings' | 'branding'> & {
      subscription?: Partial<CreateTenant['subscription']>;
      settings?: Partial<CreateTenant['settings']>;
      branding?: Partial<CreateTenant['branding']>;
    },
    ownerId: string
  ): Promise<{ tenant: Tenant; tenantUser: TenantUser }> {
    // Merge with defaults
    const fullTenantData: CreateTenant = {
      ...DEFAULT_TENANT_CONFIG,
      ...tenantData,
      branding: { ...DEFAULT_TENANT_CONFIG.branding, ...tenantData.branding },
      subscription: { ...DEFAULT_TENANT_CONFIG.subscription, ...tenantData.subscription },
      settings: { ...DEFAULT_TENANT_CONFIG.settings, ...tenantData.settings }
    };

    // Create tenant
    const tenant = await this.createTenant(fullTenantData);

    // Add owner to tenant
    const tenantUser = await this.addUserToTenant({
      tenant_id: tenant.id,
      user_id: ownerId,
      role: 'owner',
      permissions: [],
      status: 'active'
    });

    return { tenant, tenantUser };
  }
}