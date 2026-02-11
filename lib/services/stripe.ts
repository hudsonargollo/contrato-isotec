/**
 * Stripe Payment Service
 * Handles Stripe payment processing, webhooks, and reconciliation
 * Requirements: 4.3 - Payment gateway integration and tracking
 */

import Stripe from 'stripe';
import { TenantContext } from '@/lib/types/tenant';
import { Invoice, PaymentRecord, CreatePaymentRecordRequest } from '@/lib/types/invoice';
import { invoiceService } from './invoice';

// Helper function to ensure Stripe is initialized
function ensureStripe(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY not found in environment variables');
  }
  return new Stripe(secretKey, {
    apiVersion: '2024-12-18.acacia',
    typescript: true,
  });
}

export interface StripePaymentIntentRequest {
  invoice_id: string;
  amount: number;
  currency: string;
  customer_email?: string;
  customer_name?: string;
  metadata?: Record<string, string>;
  automatic_payment_methods?: boolean;
  return_url?: string;
}

export interface StripePaymentIntentResponse {
  payment_intent_id: string;
  client_secret: string;
  status: string;
  amount: number;
  currency: string;
  metadata: Record<string, string>;
}

export interface StripeCustomerRequest {
  email: string;
  name?: string;
  phone?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
  metadata?: Record<string, string>;
}

export interface StripeWebhookEvent {
  id: string;
  type: string;
  data: {
    object: any;
  };
  created: number;
  livemode: boolean;
}

export interface PaymentReconciliationResult {
  processed_payments: number;
  failed_reconciliations: number;
  errors: Array<{
    payment_intent_id: string;
    error: string;
  }>;
}

export class StripeService {
  /**
   * Create or retrieve Stripe customer
   */
  async createOrGetCustomer(
    request: StripeCustomerRequest,
    context: TenantContext
  ): Promise<Stripe.Customer> {
    try {
      const stripe = ensureStripe();
      
      // First, try to find existing customer by email
      const existingCustomers = await stripe.customers.list({
        email: request.email,
        limit: 1,
      });

      if (existingCustomers.data.length > 0) {
        const customer = existingCustomers.data[0];
        
        // Update customer if needed
        if (request.name || request.phone || request.address) {
          return await stripe.customers.update(customer.id, {
            name: request.name,
            phone: request.phone,
            address: request.address,
            metadata: {
              ...customer.metadata,
              ...request.metadata,
              tenant_id: context.tenant_id,
              updated_at: new Date().toISOString(),
            },
          });
        }
        
        return customer;
      }

      // Create new customer
      return await stripe.customers.create({
        email: request.email,
        name: request.name,
        phone: request.phone,
        address: request.address,
        metadata: {
          ...request.metadata,
          tenant_id: context.tenant_id,
          created_at: new Date().toISOString(),
        },
      });
    } catch (error) {
      throw new Error(`Failed to create/get Stripe customer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create payment intent for invoice
   */
  async createPaymentIntent(
    request: StripePaymentIntentRequest,
    context: TenantContext
  ): Promise<StripePaymentIntentResponse> {
    try {
      const stripe = ensureStripe();
      // Get invoice details
      const invoice = await invoiceService.getInvoice(request.invoice_id, context);
      if (!invoice) {
        throw new Error('Invoice not found');
      }

      // Validate amount matches invoice
      const expectedAmount = Math.round(invoice.total_amount * 100); // Convert to cents
      const requestAmount = Math.round(request.amount * 100);
      
      if (requestAmount !== expectedAmount) {
        throw new Error(`Payment amount (${request.amount}) does not match invoice total (${invoice.total_amount})`);
      }

      // Create or get customer if email provided
      let customer_id: string | undefined;
      if (request.customer_email) {
        const customer = await this.createOrGetCustomer({
          email: request.customer_email,
          name: request.customer_name || invoice.customer_name,
          metadata: {
            invoice_id: invoice.id,
            tenant_id: context.tenant_id,
          },
        }, context);
        customer_id = customer.id;
      }

      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: requestAmount,
        currency: request.currency.toLowerCase(),
        customer: customer_id,
        automatic_payment_methods: {
          enabled: request.automatic_payment_methods !== false,
        },
        metadata: {
          invoice_id: invoice.id,
          invoice_number: invoice.invoice_number,
          tenant_id: context.tenant_id,
          customer_name: invoice.customer_name,
          ...request.metadata,
        },
        description: `Payment for Invoice ${invoice.invoice_number}`,
        receipt_email: request.customer_email || invoice.customer_email,
        return_url: request.return_url,
      });

      return {
        payment_intent_id: paymentIntent.id,
        client_secret: paymentIntent.client_secret!,
        status: paymentIntent.status,
        amount: paymentIntent.amount / 100, // Convert back to currency units
        currency: paymentIntent.currency.toUpperCase(),
        metadata: paymentIntent.metadata,
      };
    } catch (error) {
      throw new Error(`Failed to create payment intent: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Retrieve payment intent
   */
  async getPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    try {
      const stripe = ensureStripe();
      return await stripe.paymentIntents.retrieve(paymentIntentId);
    } catch (error) {
      throw new Error(`Failed to retrieve payment intent: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Confirm payment intent (for server-side confirmation)
   */
  async confirmPaymentIntent(
    paymentIntentId: string,
    paymentMethodId?: string
  ): Promise<Stripe.PaymentIntent> {
    try {
      const stripe = ensureStripe();
      const confirmData: Stripe.PaymentIntentConfirmParams = {};
      
      if (paymentMethodId) {
        confirmData.payment_method = paymentMethodId;
      }

      return await stripe.paymentIntents.confirm(paymentIntentId, confirmData);
    } catch (error) {
      throw new Error(`Failed to confirm payment intent: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Cancel payment intent
   */
  async cancelPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    try {
      const stripe = ensureStripe();
      return await stripe.paymentIntents.cancel(paymentIntentId);
    } catch (error) {
      throw new Error(`Failed to cancel payment intent: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Process webhook event
   */
  async processWebhookEvent(
    event: StripeWebhookEvent,
    context: TenantContext
  ): Promise<void> {
    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent, context);
          break;
        
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailed(event.data.object as Stripe.PaymentIntent, context);
          break;
        
        case 'payment_intent.canceled':
          await this.handlePaymentCanceled(event.data.object as Stripe.PaymentIntent, context);
          break;
        
        case 'payment_intent.requires_action':
          await this.handlePaymentRequiresAction(event.data.object as Stripe.PaymentIntent, context);
          break;
        
        case 'charge.dispute.created':
          await this.handleChargeDispute(event.data.object as Stripe.Dispute, context);
          break;
        
        default:
          console.log(`Unhandled webhook event type: ${event.type}`);
      }
    } catch (error) {
      throw new Error(`Failed to process webhook event: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Handle successful payment
   */
  private async handlePaymentSucceeded(
    paymentIntent: Stripe.PaymentIntent,
    context: TenantContext
  ): Promise<void> {
    const invoiceId = paymentIntent.metadata.invoice_id;
    if (!invoiceId) {
      throw new Error('Invoice ID not found in payment intent metadata');
    }

    // Create payment record
    const paymentRequest: CreatePaymentRecordRequest = {
      invoice_id: invoiceId,
      amount: paymentIntent.amount / 100, // Convert from cents
      currency: paymentIntent.currency.toUpperCase(),
      payment_method: 'credit_card', // Stripe payments are typically credit card
      payment_date: new Date(),
      transaction_id: paymentIntent.id,
      gateway_reference: paymentIntent.charges.data[0]?.id,
      gateway_response: {
        payment_intent_id: paymentIntent.id,
        status: paymentIntent.status,
        payment_method_id: paymentIntent.payment_method,
        receipt_url: paymentIntent.charges.data[0]?.receipt_url,
        created: paymentIntent.created,
      },
      metadata: {
        stripe_payment_intent_id: paymentIntent.id,
        stripe_charge_id: paymentIntent.charges.data[0]?.id,
        payment_method_type: paymentIntent.charges.data[0]?.payment_method_details?.type,
      },
    };

    await invoiceService.addPayment(paymentRequest, context);
  }

  /**
   * Handle failed payment
   */
  private async handlePaymentFailed(
    paymentIntent: Stripe.PaymentIntent,
    context: TenantContext
  ): Promise<void> {
    const invoiceId = paymentIntent.metadata.invoice_id;
    if (!invoiceId) {
      throw new Error('Invoice ID not found in payment intent metadata');
    }

    // Create failed payment record
    const paymentRequest: CreatePaymentRecordRequest = {
      invoice_id: invoiceId,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency.toUpperCase(),
      payment_method: 'credit_card',
      payment_date: new Date(),
      transaction_id: paymentIntent.id,
      gateway_response: {
        payment_intent_id: paymentIntent.id,
        status: paymentIntent.status,
        last_payment_error: paymentIntent.last_payment_error,
        created: paymentIntent.created,
      },
      metadata: {
        stripe_payment_intent_id: paymentIntent.id,
        failure_reason: paymentIntent.last_payment_error?.message,
        failure_code: paymentIntent.last_payment_error?.code,
      },
    };

    await invoiceService.addPayment(paymentRequest, context);
  }

  /**
   * Handle canceled payment
   */
  private async handlePaymentCanceled(
    paymentIntent: Stripe.PaymentIntent,
    context: TenantContext
  ): Promise<void> {
    // Log the cancellation - no payment record needed for canceled intents
    console.log(`Payment intent ${paymentIntent.id} was canceled for invoice ${paymentIntent.metadata.invoice_id}`);
  }

  /**
   * Handle payment requiring action
   */
  private async handlePaymentRequiresAction(
    paymentIntent: Stripe.PaymentIntent,
    context: TenantContext
  ): Promise<void> {
    // Log that payment requires additional action (3D Secure, etc.)
    console.log(`Payment intent ${paymentIntent.id} requires action for invoice ${paymentIntent.metadata.invoice_id}`);
  }

  /**
   * Handle charge dispute
   */
  private async handleChargeDispute(
    dispute: Stripe.Dispute,
    context: TenantContext
  ): Promise<void> {
    // Log dispute creation - would typically trigger notification to admin
    console.log(`Dispute created for charge ${dispute.charge} - Amount: ${dispute.amount / 100} ${dispute.currency.toUpperCase()}`);
  }

  /**
   * Reconcile payments with Stripe
   */
  async reconcilePayments(
    context: TenantContext,
    startDate?: Date,
    endDate?: Date
  ): Promise<PaymentReconciliationResult> {
    const result: PaymentReconciliationResult = {
      processed_payments: 0,
      failed_reconciliations: 0,
      errors: [],
    };

    try {
      const stripe = ensureStripe();
      
      // Get payment intents from Stripe
      const listParams: Stripe.PaymentIntentListParams = {
        limit: 100,
      };

      if (startDate) {
        listParams.created = {
          gte: Math.floor(startDate.getTime() / 1000),
        };
      }

      if (endDate) {
        listParams.created = {
          ...listParams.created,
          lte: Math.floor(endDate.getTime() / 1000),
        };
      }

      const paymentIntents = await stripe.paymentIntents.list(listParams);

      for (const paymentIntent of paymentIntents.data) {
        try {
          // Only process succeeded payments with invoice metadata
          if (paymentIntent.status === 'succeeded' && paymentIntent.metadata.invoice_id && paymentIntent.metadata.tenant_id === context.tenant_id) {
            await this.handlePaymentSucceeded(paymentIntent, context);
            result.processed_payments++;
          }
        } catch (error) {
          result.failed_reconciliations++;
          result.errors.push({
            payment_intent_id: paymentIntent.id,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      return result;
    } catch (error) {
      throw new Error(`Failed to reconcile payments: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create refund for payment
   */
  async createRefund(
    paymentIntentId: string,
    amount?: number,
    reason?: string,
    metadata?: Record<string, string>
  ): Promise<Stripe.Refund> {
    try {
      const stripe = ensureStripe();
      const paymentIntent = await this.getPaymentIntent(paymentIntentId);
      
      if (!paymentIntent.charges.data.length) {
        throw new Error('No charges found for payment intent');
      }

      const charge = paymentIntent.charges.data[0];

      return await stripe.refunds.create({
        charge: charge.id,
        amount: amount ? Math.round(amount * 100) : undefined, // Convert to cents if specified
        reason: reason as Stripe.RefundCreateParams.Reason,
        metadata: {
          ...metadata,
          original_payment_intent_id: paymentIntentId,
          refund_created_at: new Date().toISOString(),
        },
      });
    } catch (error) {
      throw new Error(`Failed to create refund: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get payment methods for customer
   */
  async getCustomerPaymentMethods(customerId: string): Promise<Stripe.PaymentMethod[]> {
    try {
      const stripe = ensureStripe();
      const paymentMethods = await stripe.paymentMethods.list({
        customer: customerId,
        type: 'card',
      });

      return paymentMethods.data;
    } catch (error) {
      throw new Error(`Failed to get customer payment methods: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): StripeWebhookEvent {
    try {
      const stripe = ensureStripe();
      const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;
      return stripe.webhooks.constructEvent(payload, signature, endpointSecret) as StripeWebhookEvent;
    } catch (error) {
      throw new Error(`Webhook signature verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const stripeService = new StripeService();