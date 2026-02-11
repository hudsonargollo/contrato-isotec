/**
 * Automated Billing and Payments Service
 * 
 * Comprehensive service for automated recurring billing, payment processing,
 * and payment failure handling using Stripe integration.
 * 
 * Requirements: 9.3, 9.4 - Automated billing and payments
 */

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { getUsageBillingService } from './usage-billing';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20'
});

// Payment Method Schema
export const paymentMethodSchema = z.object({
  id: z.string(),
  tenant_id: z.string().uuid(),
  stripe_payment_method_id: z.string(),
  type: z.enum(['card', 'bank_account', 'pix']),
  last_four: z.string().optional(),
  brand: z.string().optional(),
  exp_month: z.number().int().min(1).max(12).optional(),
  exp_year: z.number().int().optional(),
  is_default: z.boolean().default(false),
  created_at: z.date(),
  updated_at: z.date()
});

// Billing Invoice Schema
export const billingInvoiceSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  billing_cycle_id: z.string().uuid(),
  stripe_invoice_id: z.string().optional(),
  invoice_number: z.string(),
  amount_due: z.number().min(0),
  amount_paid: z.number().min(0).default(0),
  currency: z.string().length(3).default('BRL'),
  status: z.enum(['draft', 'open', 'paid', 'void', 'uncollectible']),
  due_date: z.date(),
  paid_at: z.date().optional(),
  payment_method_id: z.string().optional(),
  payment_failure_reason: z.string().optional(),
  retry_count: z.number().int().min(0).default(0),
  next_retry_at: z.date().optional(),
  created_at: z.date(),
  updated_at: z.date()
});

// Payment Transaction Schema
export const paymentTransactionSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  invoice_id: z.string().uuid(),
  stripe_payment_intent_id: z.string().optional(),
  amount: z.number().min(0),
  currency: z.string().length(3).default('BRL'),
  status: z.enum(['pending', 'processing', 'succeeded', 'failed', 'canceled']),
  payment_method_type: z.string(),
  failure_reason: z.string().optional(),
  processed_at: z.date().optional(),
  created_at: z.date(),
  updated_at: z.date()
});

// Subscription Billing Schema
export const subscriptionBillingSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  stripe_subscription_id: z.string(),
  stripe_customer_id: z.string(),
  status: z.enum(['active', 'past_due', 'canceled', 'incomplete', 'trialing']),
  current_period_start: z.date(),
  current_period_end: z.date(),
  cancel_at_period_end: z.boolean().default(false),
  canceled_at: z.date().optional(),
  trial_end: z.date().optional(),
  created_at: z.date(),
  updated_at: z.date()
});

// Type exports
export type PaymentMethod = z.infer<typeof paymentMethodSchema>;
export type BillingInvoice = z.infer<typeof billingInvoiceSchema>;
export type PaymentTransaction = z.infer<typeof paymentTransactionSchema>;
export type SubscriptionBilling = z.infer<typeof subscriptionBillingSchema>;

// Stripe Price IDs for subscription plans (these would be configured in Stripe Dashboard)
const STRIPE_PRICE_IDS = {
  starter: process.env.STRIPE_STARTER_PRICE_ID || 'price_starter_monthly',
  professional: process.env.STRIPE_PROFESSIONAL_PRICE_ID || 'price_professional_monthly',
  enterprise: process.env.STRIPE_ENTERPRISE_PRICE_ID || 'price_enterprise_monthly'
};

export class AutomatedBillingService {
  private supabase;
  private usageBillingService;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    this.usageBillingService = getUsageBillingService();
  }

  /**
   * Create Stripe customer for tenant
   */
  async createStripeCustomer(
    tenantId: string,
    email: string,
    name: string,
    metadata: Record<string, string> = {}
  ): Promise<Stripe.Customer> {
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        tenant_id: tenantId,
        ...metadata
      }
    });

    // Update tenant with Stripe customer ID
    await this.supabase
      .from('tenants')
      .update({
        subscription: this.supabase.raw(`
          jsonb_set(
            COALESCE(subscription, '{}'),
            '{stripe_customer_id}',
            '"${customer.id}"'
          )
        `),
        updated_at: new Date().toISOString()
      })
      .eq('id', tenantId);

    return customer;
  }

  /**
   * Create subscription for tenant
   */
  async createSubscription(
    tenantId: string,
    plan: 'starter' | 'professional' | 'enterprise',
    paymentMethodId?: string,
    trialDays?: number
  ): Promise<Stripe.Subscription> {
    // Get tenant data
    const { data: tenant, error: tenantError } = await this.supabase
      .from('tenants')
      .select('subscription, name')
      .eq('id', tenantId)
      .single();

    if (tenantError || !tenant) {
      throw new Error(`Failed to get tenant: ${tenantError?.message}`);
    }

    const subscription = typeof tenant.subscription === 'string' 
      ? JSON.parse(tenant.subscription) 
      : tenant.subscription;

    let customerId = subscription.stripe_customer_id;

    // Create customer if doesn't exist
    if (!customerId) {
      const customer = await this.createStripeCustomer(
        tenantId,
        `billing@${tenant.name.toLowerCase().replace(/\s+/g, '')}.com`,
        tenant.name
      );
      customerId = customer.id;
    }

    // Attach payment method if provided
    if (paymentMethodId) {
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId
      });

      // Set as default payment method
      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId
        }
      });
    }

    // Create subscription
    const subscriptionParams: Stripe.SubscriptionCreateParams = {
      customer: customerId,
      items: [{ price: STRIPE_PRICE_IDS[plan] }],
      payment_behavior: 'default_incomplete',
      payment_settings: {
        save_default_payment_method: 'on_subscription'
      },
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        tenant_id: tenantId,
        plan: plan
      }
    };

    if (trialDays && trialDays > 0) {
      subscriptionParams.trial_period_days = trialDays;
    }

    const stripeSubscription = await stripe.subscriptions.create(subscriptionParams);

    // Store subscription billing record
    await this.supabase
      .from('subscription_billing')
      .insert({
        tenant_id: tenantId,
        stripe_subscription_id: stripeSubscription.id,
        stripe_customer_id: customerId,
        status: stripeSubscription.status,
        current_period_start: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
        trial_end: stripeSubscription.trial_end 
          ? new Date(stripeSubscription.trial_end * 1000).toISOString() 
          : null
      });

    // Update tenant subscription
    await this.supabase
      .from('tenants')
      .update({
        subscription: this.supabase.raw(`
          jsonb_set(
            jsonb_set(
              jsonb_set(
                COALESCE(subscription, '{}'),
                '{stripe_subscription_id}',
                '"${stripeSubscription.id}"'
              ),
              '{stripe_customer_id}',
              '"${customerId}"'
            ),
            '{plan}',
            '"${plan}"'
          )
        `),
        updated_at: new Date().toISOString()
      })
      .eq('id', tenantId);

    return stripeSubscription;
  }

  /**
   * Process usage-based billing for a tenant
   */
  async processUsageBilling(tenantId: string, billingCycleId: string): Promise<BillingInvoice> {
    // Get billing cycle
    const { data: cycle, error: cycleError } = await this.supabase
      .from('billing_cycles')
      .select('*')
      .eq('id', billingCycleId)
      .single();

    if (cycleError || !cycle) {
      throw new Error(`Failed to get billing cycle: ${cycleError?.message}`);
    }

    // Process the billing cycle to calculate charges
    const processedCycle = await this.usageBillingService.processBillingCycle(billingCycleId);

    // Create invoice
    const invoiceNumber = `INV-${tenantId.slice(0, 8)}-${Date.now()}`;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30); // 30 days payment terms

    const { data: invoice, error: invoiceError } = await this.supabase
      .from('billing_invoices')
      .insert({
        tenant_id: tenantId,
        billing_cycle_id: billingCycleId,
        invoice_number: invoiceNumber,
        amount_due: processedCycle.total_charges,
        currency: processedCycle.currency,
        status: 'open',
        due_date: dueDate.toISOString()
      })
      .select()
      .single();

    if (invoiceError) {
      throw new Error(`Failed to create invoice: ${invoiceError.message}`);
    }

    // Create Stripe invoice if usage charges > 0
    if (processedCycle.total_usage_charges > 0) {
      await this.createStripeUsageInvoice(tenantId, invoice.id, processedCycle);
    }

    return this.parseBillingInvoice(invoice);
  }

  /**
   * Create Stripe invoice for usage charges
   */
  private async createStripeUsageInvoice(
    tenantId: string,
    invoiceId: string,
    billingCycle: any
  ): Promise<Stripe.Invoice> {
    // Get tenant Stripe customer ID
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

    const customerId = subscription.stripe_customer_id;
    if (!customerId) {
      throw new Error('No Stripe customer ID found for tenant');
    }

    // Create invoice items for usage charges
    const usageSummaries = await this.usageBillingService.getUsageSummary(
      tenantId,
      new Date(billingCycle.cycle_start),
      new Date(billingCycle.cycle_end)
    );

    for (const summary of usageSummaries) {
      if (summary.total_charge > 0) {
        await stripe.invoiceItems.create({
          customer: customerId,
          amount: Math.round(summary.total_charge * 100), // Convert to cents
          currency: summary.currency.toLowerCase(),
          description: `${summary.event_type} usage charges (${summary.billable_quantity} units)`,
          metadata: {
            tenant_id: tenantId,
            billing_cycle_id: billingCycle.id,
            event_type: summary.event_type
          }
        });
      }
    }

    // Create and finalize invoice
    const stripeInvoice = await stripe.invoices.create({
      customer: customerId,
      auto_advance: true,
      collection_method: 'charge_automatically',
      metadata: {
        tenant_id: tenantId,
        internal_invoice_id: invoiceId,
        billing_cycle_id: billingCycle.id
      }
    });

    await stripe.invoices.finalizeInvoice(stripeInvoice.id);

    // Update internal invoice with Stripe invoice ID
    await this.supabase
      .from('billing_invoices')
      .update({
        stripe_invoice_id: stripeInvoice.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', invoiceId);

    return stripeInvoice;
  }

  /**
   * Handle payment failure
   */
  async handlePaymentFailure(
    invoiceId: string,
    failureReason: string,
    retryCount: number = 0
  ): Promise<void> {
    const maxRetries = 3;
    const retryDelayDays = [1, 3, 7]; // Retry after 1, 3, and 7 days

    let nextRetryAt: Date | null = null;
    if (retryCount < maxRetries) {
      nextRetryAt = new Date();
      nextRetryAt.setDate(nextRetryAt.getDate() + retryDelayDays[retryCount]);
    }

    // Update invoice with failure information
    await this.supabase
      .from('billing_invoices')
      .update({
        payment_failure_reason: failureReason,
        retry_count: retryCount + 1,
        next_retry_at: nextRetryAt?.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', invoiceId);

    // If max retries reached, mark as uncollectible
    if (retryCount >= maxRetries) {
      await this.supabase
        .from('billing_invoices')
        .update({
          status: 'uncollectible',
          updated_at: new Date().toISOString()
        })
        .eq('id', invoiceId);

      // Optionally suspend tenant account
      await this.suspendTenantForNonPayment(invoiceId);
    }

    // Send notification to tenant about payment failure
    await this.sendPaymentFailureNotification(invoiceId, retryCount, nextRetryAt);
  }

  /**
   * Retry failed payments
   */
  async retryFailedPayments(): Promise<void> {
    const now = new Date();

    // Get invoices ready for retry
    const { data: invoices, error } = await this.supabase
      .from('billing_invoices')
      .select('*')
      .eq('status', 'open')
      .not('payment_failure_reason', 'is', null)
      .lte('next_retry_at', now.toISOString())
      .lt('retry_count', 3);

    if (error) {
      console.error('Failed to get invoices for retry:', error);
      return;
    }

    for (const invoice of invoices || []) {
      try {
        if (invoice.stripe_invoice_id) {
          // Retry Stripe invoice
          await stripe.invoices.pay(invoice.stripe_invoice_id);
        }
      } catch (error) {
        console.error(`Failed to retry payment for invoice ${invoice.id}:`, error);
        
        // Handle retry failure
        await this.handlePaymentFailure(
          invoice.id,
          error instanceof Error ? error.message : 'Unknown error',
          invoice.retry_count
        );
      }
    }
  }

  /**
   * Suspend tenant for non-payment
   */
  private async suspendTenantForNonPayment(invoiceId: string): Promise<void> {
    // Get tenant ID from invoice
    const { data: invoice, error } = await this.supabase
      .from('billing_invoices')
      .select('tenant_id')
      .eq('id', invoiceId)
      .single();

    if (error || !invoice) {
      console.error('Failed to get invoice for suspension:', error);
      return;
    }

    // Update tenant status to suspended
    await this.supabase
      .from('tenants')
      .update({
        status: 'suspended',
        updated_at: new Date().toISOString()
      })
      .eq('id', invoice.tenant_id);

    console.log(`Tenant ${invoice.tenant_id} suspended for non-payment`);
  }

  /**
   * Send payment failure notification
   */
  private async sendPaymentFailureNotification(
    invoiceId: string,
    retryCount: number,
    nextRetryAt: Date | null
  ): Promise<void> {
    // In a real implementation, this would send email/SMS notifications
    console.log(`Payment failure notification for invoice ${invoiceId}`, {
      retryCount,
      nextRetryAt
    });
  }

  /**
   * Get billing portal URL for tenant
   */
  async getBillingPortalUrl(tenantId: string, returnUrl: string): Promise<string> {
    // Get tenant Stripe customer ID
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

    const customerId = subscription.stripe_customer_id;
    if (!customerId) {
      throw new Error('No Stripe customer ID found for tenant');
    }

    // Create billing portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl
    });

    return session.url;
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(
    tenantId: string,
    cancelAtPeriodEnd: boolean = true
  ): Promise<Stripe.Subscription> {
    // Get subscription billing record
    const { data: billing, error: billingError } = await this.supabase
      .from('subscription_billing')
      .select('stripe_subscription_id')
      .eq('tenant_id', tenantId)
      .eq('status', 'active')
      .single();

    if (billingError || !billing) {
      throw new Error(`Failed to get subscription: ${billingError?.message}`);
    }

    // Cancel Stripe subscription
    const subscription = await stripe.subscriptions.update(billing.stripe_subscription_id, {
      cancel_at_period_end: cancelAtPeriodEnd
    });

    // Update billing record
    await this.supabase
      .from('subscription_billing')
      .update({
        cancel_at_period_end: cancelAtPeriodEnd,
        canceled_at: cancelAtPeriodEnd ? null : new Date().toISOString(),
        status: cancelAtPeriodEnd ? 'active' : 'canceled',
        updated_at: new Date().toISOString()
      })
      .eq('tenant_id', tenantId);

    return subscription;
  }

  /**
   * Get tenant billing history
   */
  async getBillingHistory(tenantId: string, limit: number = 12): Promise<BillingInvoice[]> {
    const { data: invoices, error } = await this.supabase
      .from('billing_invoices')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to get billing history: ${error.message}`);
    }

    return (invoices || []).map(this.parseBillingInvoice);
  }

  /**
   * Get payment methods for tenant
   */
  async getPaymentMethods(tenantId: string): Promise<PaymentMethod[]> {
    const { data: methods, error } = await this.supabase
      .from('payment_methods')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get payment methods: ${error.message}`);
    }

    return (methods || []).map(this.parsePaymentMethod);
  }

  /**
   * Parse billing invoice from database
   */
  private parseBillingInvoice(invoice: any): BillingInvoice {
    return {
      ...invoice,
      due_date: new Date(invoice.due_date),
      paid_at: invoice.paid_at ? new Date(invoice.paid_at) : undefined,
      next_retry_at: invoice.next_retry_at ? new Date(invoice.next_retry_at) : undefined,
      created_at: new Date(invoice.created_at),
      updated_at: new Date(invoice.updated_at)
    };
  }

  /**
   * Parse payment method from database
   */
  private parsePaymentMethod(method: any): PaymentMethod {
    return {
      ...method,
      created_at: new Date(method.created_at),
      updated_at: new Date(method.updated_at)
    };
  }
}

// Singleton instance
let automatedBillingService: AutomatedBillingService | null = null;

export const getAutomatedBillingService = (): AutomatedBillingService => {
  if (!automatedBillingService) {
    automatedBillingService = new AutomatedBillingService();
  }
  return automatedBillingService;
};