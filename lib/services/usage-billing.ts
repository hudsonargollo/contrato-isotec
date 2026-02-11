/**
 * Usage-Based Billing Tracking Service
 * 
 * Comprehensive service for tracking platform usage metrics, calculating usage-based charges,
 * and managing billing cycles for multi-tenant SaaS platform.
 * 
 * Requirements: 9.2 - Usage-based billing tracking
 */

import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

// Usage Event Schema
export const usageEventSchema = z.object({
  tenant_id: z.string().uuid(),
  event_type: z.enum([
    'api_call',
    'whatsapp_message_sent',
    'whatsapp_message_received',
    'email_sent',
    'sms_sent',
    'contract_generated',
    'invoice_created',
    'lead_created',
    'storage_used',
    'user_session',
    'report_generated',
    'webhook_delivered'
  ]),
  quantity: z.number().int().min(1).default(1),
  metadata: z.record(z.any()).default({}),
  timestamp: z.date().default(() => new Date())
});

// Billing Rate Schema
export const billingRateSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid().optional(), // null for global rates
  event_type: z.string(),
  rate_per_unit: z.number().min(0),
  currency: z.string().length(3).default('BRL'),
  tier_start: z.number().int().min(0).default(0),
  tier_end: z.number().int().optional(), // null for unlimited
  subscription_plan: z.enum(['starter', 'professional', 'enterprise']).optional(),
  effective_from: z.date(),
  effective_until: z.date().optional(),
  created_at: z.date(),
  updated_at: z.date()
});

// Usage Summary Schema
export const usageSummarySchema = z.object({
  tenant_id: z.string().uuid(),
  billing_period_start: z.date(),
  billing_period_end: z.date(),
  event_type: z.string(),
  total_quantity: z.number().int().min(0),
  billable_quantity: z.number().int().min(0),
  rate_per_unit: z.number().min(0),
  total_charge: z.number().min(0),
  currency: z.string().length(3),
  tier_breakdown: z.array(z.object({
    tier_start: z.number().int(),
    tier_end: z.number().int().optional(),
    quantity: z.number().int(),
    rate: z.number(),
    charge: z.number()
  })).default([]),
  created_at: z.date(),
  updated_at: z.date()
});

// Billing Cycle Schema
export const billingCycleSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  cycle_start: z.date(),
  cycle_end: z.date(),
  status: z.enum(['active', 'processing', 'completed', 'failed']),
  total_usage_charges: z.number().min(0).default(0),
  subscription_charges: z.number().min(0).default(0),
  total_charges: z.number().min(0).default(0),
  currency: z.string().length(3).default('BRL'),
  invoice_id: z.string().uuid().optional(),
  processed_at: z.date().optional(),
  created_at: z.date(),
  updated_at: z.date()
});

// Type exports
export type UsageEvent = z.infer<typeof usageEventSchema>;
export type BillingRate = z.infer<typeof billingRateSchema>;
export type UsageSummary = z.infer<typeof usageSummarySchema>;
export type BillingCycle = z.infer<typeof billingCycleSchema>;

// Default billing rates by subscription plan
export const DEFAULT_BILLING_RATES: Record<string, { starter: number; professional: number; enterprise: number }> = {
  api_call: { starter: 0.001, professional: 0.0008, enterprise: 0.0005 },
  whatsapp_message_sent: { starter: 0.05, professional: 0.04, enterprise: 0.03 },
  whatsapp_message_received: { starter: 0.02, professional: 0.015, enterprise: 0.01 },
  email_sent: { starter: 0.01, professional: 0.008, enterprise: 0.005 },
  sms_sent: { starter: 0.08, professional: 0.06, enterprise: 0.04 },
  contract_generated: { starter: 0.50, professional: 0.40, enterprise: 0.30 },
  invoice_created: { starter: 0.25, professional: 0.20, enterprise: 0.15 },
  storage_used: { starter: 0.10, professional: 0.08, enterprise: 0.05 }, // per GB per month
  report_generated: { starter: 0.15, professional: 0.12, enterprise: 0.08 },
  webhook_delivered: { starter: 0.002, professional: 0.0015, enterprise: 0.001 }
};

// Free tier allowances by subscription plan
export const FREE_TIER_ALLOWANCES: Record<string, { starter: number; professional: number; enterprise: number }> = {
  api_call: { starter: 1000, professional: 5000, enterprise: 25000 },
  whatsapp_message_sent: { starter: 100, professional: 500, enterprise: 2500 },
  whatsapp_message_received: { starter: 500, professional: 2500, enterprise: 12500 },
  email_sent: { starter: 1000, professional: 5000, enterprise: 25000 },
  sms_sent: { starter: 50, professional: 250, enterprise: 1250 },
  contract_generated: { starter: 50, professional: 250, enterprise: 1250 },
  invoice_created: { starter: 100, professional: 500, enterprise: 2500 },
  storage_used: { starter: 10, professional: 50, enterprise: 200 }, // GB
  report_generated: { starter: 25, professional: 125, enterprise: 625 },
  webhook_delivered: { starter: 1000, professional: 5000, enterprise: 25000 }
};

export class UsageBillingService {
  private supabase;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  /**
   * Track a usage event for billing purposes
   */
  async trackUsageEvent(event: Omit<UsageEvent, 'timestamp'>): Promise<void> {
    const validatedEvent = usageEventSchema.parse({
      ...event,
      timestamp: new Date()
    });

    // Insert usage event
    const { error: eventError } = await this.supabase
      .from('usage_events')
      .insert({
        tenant_id: validatedEvent.tenant_id,
        event_type: validatedEvent.event_type,
        quantity: validatedEvent.quantity,
        metadata: validatedEvent.metadata,
        timestamp: validatedEvent.timestamp.toISOString()
      });

    if (eventError) {
      throw new Error(`Failed to track usage event: ${eventError.message}`);
    }

    // Update real-time usage metrics for the current billing period
    await this.updateCurrentPeriodUsage(
      validatedEvent.tenant_id,
      validatedEvent.event_type,
      validatedEvent.quantity
    );
  }

  /**
   * Track multiple usage events in batch
   */
  async trackUsageEventsBatch(events: Omit<UsageEvent, 'timestamp'>[]): Promise<void> {
    const validatedEvents = events.map(event => 
      usageEventSchema.parse({
        ...event,
        timestamp: new Date()
      })
    );

    // Insert usage events in batch
    const { error: eventError } = await this.supabase
      .from('usage_events')
      .insert(
        validatedEvents.map(event => ({
          tenant_id: event.tenant_id,
          event_type: event.event_type,
          quantity: event.quantity,
          metadata: event.metadata,
          timestamp: event.timestamp.toISOString()
        }))
      );

    if (eventError) {
      throw new Error(`Failed to track usage events batch: ${eventError.message}`);
    }

    // Update usage metrics for each tenant/event type combination
    const usageUpdates = new Map<string, number>();
    
    for (const event of validatedEvents) {
      const key = `${event.tenant_id}:${event.event_type}`;
      usageUpdates.set(key, (usageUpdates.get(key) || 0) + event.quantity);
    }

    // Update current period usage for each unique tenant/event type
    for (const [key, quantity] of usageUpdates) {
      const [tenantId, eventType] = key.split(':');
      await this.updateCurrentPeriodUsage(tenantId, eventType, quantity);
    }
  }

  /**
   * Update current billing period usage metrics
   */
  private async updateCurrentPeriodUsage(
    tenantId: string,
    eventType: string,
    quantity: number
  ): Promise<void> {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const { error } = await this.supabase.rpc('upsert_usage_summary', {
      p_tenant_id: tenantId,
      p_event_type: eventType,
      p_period_start: periodStart.toISOString(),
      p_period_end: periodEnd.toISOString(),
      p_quantity_increment: quantity
    });

    if (error) {
      console.error('Failed to update current period usage:', error);
    }
  }

  /**
   * Calculate usage charges for a billing period
   */
  async calculateUsageCharges(
    tenantId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<UsageSummary[]> {
    // Get tenant subscription info
    const { data: tenant, error: tenantError } = await this.supabase
      .from('tenants')
      .select('subscription')
      .eq('id', tenantId)
      .single();

    if (tenantError || !tenant) {
      throw new Error(`Failed to get tenant subscription: ${tenantError?.message}`);
    }

    const subscription = typeof tenant.subscription === 'string' 
      ? JSON.parse(tenant.subscription) 
      : tenant.subscription;

    // Get usage events for the period
    const { data: usageEvents, error: usageError } = await this.supabase
      .from('usage_events')
      .select('event_type, quantity')
      .eq('tenant_id', tenantId)
      .gte('timestamp', periodStart.toISOString())
      .lte('timestamp', periodEnd.toISOString());

    if (usageError) {
      throw new Error(`Failed to get usage events: ${usageError.message}`);
    }

    // Aggregate usage by event type
    const usageByType = new Map<string, number>();
    for (const event of usageEvents || []) {
      const current = usageByType.get(event.event_type) || 0;
      usageByType.set(event.event_type, current + event.quantity);
    }

    // Calculate charges for each event type
    const usageSummaries: UsageSummary[] = [];
    
    for (const [eventType, totalQuantity] of usageByType) {
      const freeAllowance = FREE_TIER_ALLOWANCES[eventType]?.[subscription.plan] || 0;
      const billableQuantity = Math.max(0, totalQuantity - freeAllowance);
      const ratePerUnit = DEFAULT_BILLING_RATES[eventType]?.[subscription.plan] || 0;
      const totalCharge = billableQuantity * ratePerUnit;

      const summary: UsageSummary = {
        tenant_id: tenantId,
        billing_period_start: periodStart,
        billing_period_end: periodEnd,
        event_type: eventType,
        total_quantity: totalQuantity,
        billable_quantity: billableQuantity,
        rate_per_unit: ratePerUnit,
        total_charge: totalCharge,
        currency: subscription.currency || 'BRL',
        tier_breakdown: [{
          tier_start: freeAllowance,
          tier_end: undefined,
          quantity: billableQuantity,
          rate: ratePerUnit,
          charge: totalCharge
        }],
        created_at: new Date(),
        updated_at: new Date()
      };

      usageSummaries.push(summary);
    }

    return usageSummaries;
  }

  /**
   * Get current billing cycle for a tenant
   */
  async getCurrentBillingCycle(tenantId: string): Promise<BillingCycle | null> {
    const now = new Date();
    
    const { data: cycle, error } = await this.supabase
      .from('billing_cycles')
      .select('*')
      .eq('tenant_id', tenantId)
      .lte('cycle_start', now.toISOString())
      .gte('cycle_end', now.toISOString())
      .eq('status', 'active')
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get current billing cycle: ${error.message}`);
    }

    return cycle ? this.parseBillingCycle(cycle) : null;
  }

  /**
   * Create a new billing cycle
   */
  async createBillingCycle(
    tenantId: string,
    cycleStart: Date,
    cycleEnd: Date
  ): Promise<BillingCycle> {
    const { data: cycle, error } = await this.supabase
      .from('billing_cycles')
      .insert({
        tenant_id: tenantId,
        cycle_start: cycleStart.toISOString(),
        cycle_end: cycleEnd.toISOString(),
        status: 'active',
        total_usage_charges: 0,
        subscription_charges: 0,
        total_charges: 0,
        currency: 'BRL'
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create billing cycle: ${error.message}`);
    }

    return this.parseBillingCycle(cycle);
  }

  /**
   * Process billing cycle and calculate final charges
   */
  async processBillingCycle(cycleId: string): Promise<BillingCycle> {
    // Get billing cycle
    const { data: cycle, error: cycleError } = await this.supabase
      .from('billing_cycles')
      .select('*')
      .eq('id', cycleId)
      .single();

    if (cycleError || !cycle) {
      throw new Error(`Failed to get billing cycle: ${cycleError?.message}`);
    }

    // Calculate usage charges
    const usageSummaries = await this.calculateUsageCharges(
      cycle.tenant_id,
      new Date(cycle.cycle_start),
      new Date(cycle.cycle_end)
    );

    const totalUsageCharges = usageSummaries.reduce(
      (sum, summary) => sum + summary.total_charge,
      0
    );

    // Get subscription charges (base plan cost)
    const { data: tenant, error: tenantError } = await this.supabase
      .from('tenants')
      .select('subscription')
      .eq('id', cycle.tenant_id)
      .single();

    if (tenantError || !tenant) {
      throw new Error(`Failed to get tenant for billing: ${tenantError?.message}`);
    }

    const subscription = typeof tenant.subscription === 'string' 
      ? JSON.parse(tenant.subscription) 
      : tenant.subscription;

    // Base subscription costs (monthly)
    const subscriptionCosts = {
      starter: 99.00,
      professional: 299.00,
      enterprise: 999.00
    };

    const subscriptionCharges = subscriptionCosts[subscription.plan] || 0;
    const totalCharges = totalUsageCharges + subscriptionCharges;

    // Update billing cycle
    const { data: updatedCycle, error: updateError } = await this.supabase
      .from('billing_cycles')
      .update({
        status: 'processing',
        total_usage_charges: totalUsageCharges,
        subscription_charges: subscriptionCharges,
        total_charges: totalCharges,
        processed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', cycleId)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update billing cycle: ${updateError.message}`);
    }

    // Store usage summaries
    if (usageSummaries.length > 0) {
      const { error: summaryError } = await this.supabase
        .from('usage_summaries')
        .insert(
          usageSummaries.map(summary => ({
            tenant_id: summary.tenant_id,
            billing_period_start: summary.billing_period_start.toISOString(),
            billing_period_end: summary.billing_period_end.toISOString(),
            event_type: summary.event_type,
            total_quantity: summary.total_quantity,
            billable_quantity: summary.billable_quantity,
            rate_per_unit: summary.rate_per_unit,
            total_charge: summary.total_charge,
            currency: summary.currency,
            tier_breakdown: summary.tier_breakdown
          }))
        );

      if (summaryError) {
        console.error('Failed to store usage summaries:', summaryError);
      }
    }

    return this.parseBillingCycle(updatedCycle);
  }

  /**
   * Get usage summary for a tenant and period
   */
  async getUsageSummary(
    tenantId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<UsageSummary[]> {
    const { data: summaries, error } = await this.supabase
      .from('usage_summaries')
      .select('*')
      .eq('tenant_id', tenantId)
      .gte('billing_period_start', periodStart.toISOString())
      .lte('billing_period_end', periodEnd.toISOString())
      .order('event_type');

    if (error) {
      throw new Error(`Failed to get usage summary: ${error.message}`);
    }

    return (summaries || []).map(this.parseUsageSummary);
  }

  /**
   * Get real-time usage for current period
   */
  async getCurrentPeriodUsage(tenantId: string): Promise<Record<string, number>> {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const { data: events, error } = await this.supabase
      .from('usage_events')
      .select('event_type, quantity')
      .eq('tenant_id', tenantId)
      .gte('timestamp', periodStart.toISOString())
      .lte('timestamp', periodEnd.toISOString());

    if (error) {
      throw new Error(`Failed to get current period usage: ${error.message}`);
    }

    const usage: Record<string, number> = {};
    for (const event of events || []) {
      usage[event.event_type] = (usage[event.event_type] || 0) + event.quantity;
    }

    return usage;
  }

  /**
   * Get billing history for a tenant
   */
  async getBillingHistory(
    tenantId: string,
    limit = 12
  ): Promise<BillingCycle[]> {
    const { data: cycles, error } = await this.supabase
      .from('billing_cycles')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('cycle_start', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to get billing history: ${error.message}`);
    }

    return (cycles || []).map(this.parseBillingCycle);
  }

  /**
   * Parse billing cycle from database
   */
  private parseBillingCycle(cycle: any): BillingCycle {
    return {
      ...cycle,
      cycle_start: new Date(cycle.cycle_start),
      cycle_end: new Date(cycle.cycle_end),
      processed_at: cycle.processed_at ? new Date(cycle.processed_at) : undefined,
      created_at: new Date(cycle.created_at),
      updated_at: new Date(cycle.updated_at)
    };
  }

  /**
   * Parse usage summary from database
   */
  private parseUsageSummary(summary: any): UsageSummary {
    return {
      ...summary,
      billing_period_start: new Date(summary.billing_period_start),
      billing_period_end: new Date(summary.billing_period_end),
      tier_breakdown: summary.tier_breakdown || [],
      created_at: new Date(summary.created_at),
      updated_at: new Date(summary.updated_at)
    };
  }
}

// Singleton instance
let usageBillingService: UsageBillingService | null = null;

export const getUsageBillingService = (): UsageBillingService => {
  if (!usageBillingService) {
    usageBillingService = new UsageBillingService();
  }
  return usageBillingService;
};