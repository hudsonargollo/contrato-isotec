/**
 * Stripe Payment Integration Tests
 * Tests for Stripe payment processing, webhooks, and reconciliation
 * Requirements: 4.3 - Payment gateway integration and tracking
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { stripeService } from '@/lib/services/stripe';
import { invoiceService } from '@/lib/services/invoice';
import { auditLogger } from '@/lib/services/audit-logger';
import { TenantContext } from '@/lib/types/tenant';

// Mock Stripe
const mockStripe = {
  customers: {
    list: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  paymentIntents: {
    create: jest.fn(),
    retrieve: jest.fn(),
    confirm: jest.fn(),
    cancel: jest.fn(),
    list: jest.fn(),
  },
  refunds: {
    create: jest.fn(),
  },
  paymentMethods: {
    list: jest.fn(),
  },
  webhooks: {
    constructEvent: jest.fn(),
  },
};

// Mock modules
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => mockStripe);
});

const mockInvoiceService = {
  getInvoice: jest.fn(),
  addPayment: jest.fn(),
};

const mockAuditLogger = {
  log: jest.fn(),
};

jest.mock('@/lib/services/invoice', () => ({
  invoiceService: mockInvoiceService
}));

jest.mock('@/lib/services/audit-logger', () => ({
  auditLogger: mockAuditLogger
}));

describe('Stripe Payment Integration', () => {
  const mockTenantContext: TenantContext = {
    tenant_id: 'test-tenant-id',
    user_id: 'test-user-id',
    permissions: [],
    subscription_limits: {}
  };

  const mockInvoice = {
    id: 'test-invoice-id',
    tenant_id: 'test-tenant-id',
    invoice_number: 'INV-001',
    customer_name: 'John Doe',
    customer_email: 'john@example.com',
    total_amount: 100.00,
    currency: 'USD',
    status: 'pending'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    mockInvoiceService.getInvoice.mockResolvedValue(mockInvoice as any);
    mockAuditLogger.log.mockResolvedValue();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Customer Management', () => {
    it('should create new Stripe customer', async () => {
      const mockCustomer = {
        id: 'cus_test123',
        email: 'john@example.com',
        name: 'John Doe',
        metadata: {}
      };

      mockStripe.customers.list.mockResolvedValue({ data: [] });
      mockStripe.customers.create.mockResolvedValue(mockCustomer);

      const customer = await stripeService.createOrGetCustomer({
        email: 'john@example.com',
        name: 'John Doe',
        metadata: { test: 'value' }
      }, mockTenantContext);

      expect(mockStripe.customers.list).toHaveBeenCalledWith({
        email: 'john@example.com',
        limit: 1
      });

      expect(mockStripe.customers.create).toHaveBeenCalledWith({
        email: 'john@example.com',
        name: 'John Doe',
        phone: undefined,
        address: undefined,
        metadata: {
          test: 'value',
          tenant_id: 'test-tenant-id',
          created_at: expect.any(String)
        }
      });

      expect(customer).toEqual(mockCustomer);
    });

    it('should retrieve existing Stripe customer', async () => {
      const existingCustomer = {
        id: 'cus_existing123',
        email: 'john@example.com',
        name: 'John Doe',
        metadata: { tenant_id: 'test-tenant-id' }
      };

      mockStripe.customers.list.mockResolvedValue({ data: [existingCustomer] });

      const customer = await stripeService.createOrGetCustomer({
        email: 'john@example.com'
      }, mockTenantContext);

      expect(mockStripe.customers.list).toHaveBeenCalledWith({
        email: 'john@example.com',
        limit: 1
      });

      expect(mockStripe.customers.create).not.toHaveBeenCalled();
      expect(customer).toEqual(existingCustomer);
    });

    it('should update existing customer with new information', async () => {
      const existingCustomer = {
        id: 'cus_existing123',
        email: 'john@example.com',
        name: 'Old Name',
        metadata: { tenant_id: 'test-tenant-id' }
      };

      const updatedCustomer = {
        ...existingCustomer,
        name: 'John Doe',
        phone: '+1234567890'
      };

      mockStripe.customers.list.mockResolvedValue({ data: [existingCustomer] });
      mockStripe.customers.update.mockResolvedValue(updatedCustomer);

      const customer = await stripeService.createOrGetCustomer({
        email: 'john@example.com',
        name: 'John Doe',
        phone: '+1234567890'
      }, mockTenantContext);

      expect(mockStripe.customers.update).toHaveBeenCalledWith('cus_existing123', {
        name: 'John Doe',
        phone: '+1234567890',
        address: undefined,
        metadata: {
          tenant_id: 'test-tenant-id',
          updated_at: expect.any(String)
        }
      });

      expect(customer).toEqual(updatedCustomer);
    });
  });

  describe('Payment Intent Management', () => {
    it('should create payment intent successfully', async () => {
      const mockPaymentIntent = {
        id: 'pi_test123',
        client_secret: 'pi_test123_secret',
        status: 'requires_payment_method',
        amount: 10000, // $100.00 in cents
        currency: 'usd',
        metadata: {
          invoice_id: 'test-invoice-id',
          tenant_id: 'test-tenant-id'
        }
      };

      mockStripe.paymentIntents.create.mockResolvedValue(mockPaymentIntent);

      const result = await stripeService.createPaymentIntent({
        invoice_id: 'test-invoice-id',
        amount: 100.00,
        currency: 'USD',
        customer_email: 'john@example.com'
      }, mockTenantContext);

      expect(mockInvoiceService.getInvoice).toHaveBeenCalledWith('test-invoice-id', mockTenantContext);

      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith({
        amount: 10000,
        currency: 'usd',
        customer: undefined, // No customer created in this test
        automatic_payment_methods: { enabled: true },
        metadata: {
          invoice_id: 'test-invoice-id',
          invoice_number: 'INV-001',
          tenant_id: 'test-tenant-id',
          customer_name: 'John Doe'
        },
        description: 'Payment for Invoice INV-001',
        receipt_email: 'john@example.com',
        return_url: undefined
      });

      expect(result).toEqual({
        payment_intent_id: 'pi_test123',
        client_secret: 'pi_test123_secret',
        status: 'requires_payment_method',
        amount: 100.00,
        currency: 'USD',
        metadata: mockPaymentIntent.metadata
      });
    });

    it('should validate payment amount matches invoice total', async () => {
      await expect(
        stripeService.createPaymentIntent({
          invoice_id: 'test-invoice-id',
          amount: 50.00, // Different from invoice total of $100.00
          currency: 'USD'
        }, mockTenantContext)
      ).rejects.toThrow('Payment amount (50) does not match invoice total (100)');
    });

    it('should throw error for non-existent invoice', async () => {
      mockInvoiceService.getInvoice.mockResolvedValue(null);

      await expect(
        stripeService.createPaymentIntent({
          invoice_id: 'non-existent-invoice',
          amount: 100.00,
          currency: 'USD'
        }, mockTenantContext)
      ).rejects.toThrow('Invoice not found');
    });

    it('should retrieve payment intent', async () => {
      const mockPaymentIntent = {
        id: 'pi_test123',
        status: 'succeeded',
        amount: 10000,
        currency: 'usd',
        metadata: { tenant_id: 'test-tenant-id' }
      };

      mockStripe.paymentIntents.retrieve.mockResolvedValue(mockPaymentIntent);

      const result = await stripeService.getPaymentIntent('pi_test123');

      expect(mockStripe.paymentIntents.retrieve).toHaveBeenCalledWith('pi_test123');
      expect(result).toEqual(mockPaymentIntent);
    });

    it('should confirm payment intent', async () => {
      const mockPaymentIntent = {
        id: 'pi_test123',
        status: 'succeeded',
        amount: 10000,
        currency: 'usd'
      };

      mockStripe.paymentIntents.confirm.mockResolvedValue(mockPaymentIntent);

      const result = await stripeService.confirmPaymentIntent('pi_test123', 'pm_test123');

      expect(mockStripe.paymentIntents.confirm).toHaveBeenCalledWith('pi_test123', {
        payment_method: 'pm_test123'
      });
      expect(result).toEqual(mockPaymentIntent);
    });

    it('should cancel payment intent', async () => {
      const mockPaymentIntent = {
        id: 'pi_test123',
        status: 'canceled',
        amount: 10000,
        currency: 'usd'
      };

      mockStripe.paymentIntents.cancel.mockResolvedValue(mockPaymentIntent);

      const result = await stripeService.cancelPaymentIntent('pi_test123');

      expect(mockStripe.paymentIntents.cancel).toHaveBeenCalledWith('pi_test123');
      expect(result).toEqual(mockPaymentIntent);
    });
  });

  describe('Webhook Processing', () => {
    it('should process payment_intent.succeeded webhook', async () => {
      const mockPaymentIntent = {
        id: 'pi_test123',
        status: 'succeeded',
        amount: 10000,
        currency: 'usd',
        metadata: {
          invoice_id: 'test-invoice-id',
          tenant_id: 'test-tenant-id'
        },
        charges: {
          data: [{
            id: 'ch_test123',
            receipt_url: 'https://stripe.com/receipt'
          }]
        },
        payment_method: 'pm_test123',
        created: 1234567890
      };

      const webhookEvent = {
        id: 'evt_test123',
        type: 'payment_intent.succeeded',
        data: { object: mockPaymentIntent },
        created: 1234567890,
        livemode: false
      };

      await stripeService.processWebhookEvent(webhookEvent, mockTenantContext);

      expect(mockInvoiceService.addPayment).toHaveBeenCalledWith({
        invoice_id: 'test-invoice-id',
        amount: 100.00,
        currency: 'USD',
        payment_method: 'credit_card',
        payment_date: expect.any(Date),
        transaction_id: 'pi_test123',
        gateway_reference: 'ch_test123',
        gateway_response: {
          payment_intent_id: 'pi_test123',
          status: 'succeeded',
          payment_method_id: 'pm_test123',
          receipt_url: 'https://stripe.com/receipt',
          created: 1234567890
        },
        metadata: {
          stripe_payment_intent_id: 'pi_test123',
          stripe_charge_id: 'ch_test123',
          payment_method_type: undefined
        }
      }, mockTenantContext);
    });

    it('should process payment_intent.payment_failed webhook', async () => {
      const mockPaymentIntent = {
        id: 'pi_test123',
        status: 'requires_payment_method',
        amount: 10000,
        currency: 'usd',
        metadata: {
          invoice_id: 'test-invoice-id',
          tenant_id: 'test-tenant-id'
        },
        last_payment_error: {
          message: 'Your card was declined.',
          code: 'card_declined'
        },
        created: 1234567890
      };

      const webhookEvent = {
        id: 'evt_test123',
        type: 'payment_intent.payment_failed',
        data: { object: mockPaymentIntent },
        created: 1234567890,
        livemode: false
      };

      await stripeService.processWebhookEvent(webhookEvent, mockTenantContext);

      expect(mockInvoiceService.addPayment).toHaveBeenCalledWith({
        invoice_id: 'test-invoice-id',
        amount: 100.00,
        currency: 'USD',
        payment_method: 'credit_card',
        payment_date: expect.any(Date),
        transaction_id: 'pi_test123',
        gateway_response: {
          payment_intent_id: 'pi_test123',
          status: 'requires_payment_method',
          last_payment_error: mockPaymentIntent.last_payment_error,
          created: 1234567890
        },
        metadata: {
          stripe_payment_intent_id: 'pi_test123',
          failure_reason: 'Your card was declined.',
          failure_code: 'card_declined'
        }
      }, mockTenantContext);
    });

    it('should handle webhook without invoice_id in metadata', async () => {
      const mockPaymentIntent = {
        id: 'pi_test123',
        status: 'succeeded',
        amount: 10000,
        currency: 'usd',
        metadata: {
          tenant_id: 'test-tenant-id'
          // No invoice_id
        }
      };

      const webhookEvent = {
        id: 'evt_test123',
        type: 'payment_intent.succeeded',
        data: { object: mockPaymentIntent },
        created: 1234567890,
        livemode: false
      };

      await expect(
        stripeService.processWebhookEvent(webhookEvent, mockTenantContext)
      ).rejects.toThrow('Invoice ID not found in payment intent metadata');
    });

    it('should verify webhook signature', async () => {
      const mockEvent = {
        id: 'evt_test123',
        type: 'payment_intent.succeeded',
        data: { object: {} },
        created: 1234567890,
        livemode: false
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);

      const result = stripeService.verifyWebhookSignature('raw_body', 'signature');

      expect(mockStripe.webhooks.constructEvent).toHaveBeenCalledWith(
        'raw_body',
        'signature',
        process.env.STRIPE_WEBHOOK_SECRET
      );
      expect(result).toEqual(mockEvent);
    });
  });

  describe('Refund Management', () => {
    it('should create refund successfully', async () => {
      const mockPaymentIntent = {
        id: 'pi_test123',
        status: 'succeeded',
        charges: {
          data: [{
            id: 'ch_test123'
          }]
        },
        metadata: {
          invoice_id: 'test-invoice-id',
          tenant_id: 'test-tenant-id'
        }
      };

      const mockRefund = {
        id: 're_test123',
        amount: 5000, // $50.00 partial refund
        currency: 'usd',
        charge: 'ch_test123',
        status: 'succeeded',
        reason: 'requested_by_customer',
        created: 1234567890
      };

      mockStripe.paymentIntents.retrieve.mockResolvedValue(mockPaymentIntent);
      mockStripe.refunds.create.mockResolvedValue(mockRefund);

      const result = await stripeService.createRefund(
        'pi_test123',
        50.00,
        'requested_by_customer',
        { refund_reason: 'Customer request' }
      );

      expect(mockStripe.refunds.create).toHaveBeenCalledWith({
        charge: 'ch_test123',
        amount: 5000,
        reason: 'requested_by_customer',
        metadata: {
          refund_reason: 'Customer request',
          original_payment_intent_id: 'pi_test123',
          refund_created_at: expect.any(String)
        }
      });

      expect(result).toEqual(mockRefund);
    });

    it('should create full refund when amount not specified', async () => {
      const mockPaymentIntent = {
        id: 'pi_test123',
        status: 'succeeded',
        charges: {
          data: [{
            id: 'ch_test123'
          }]
        }
      };

      const mockRefund = {
        id: 're_test123',
        amount: 10000, // Full refund
        currency: 'usd',
        charge: 'ch_test123',
        status: 'succeeded'
      };

      mockStripe.paymentIntents.retrieve.mockResolvedValue(mockPaymentIntent);
      mockStripe.refunds.create.mockResolvedValue(mockRefund);

      const result = await stripeService.createRefund('pi_test123');

      expect(mockStripe.refunds.create).toHaveBeenCalledWith({
        charge: 'ch_test123',
        amount: undefined, // Full refund
        reason: undefined,
        metadata: {
          original_payment_intent_id: 'pi_test123',
          refund_created_at: expect.any(String)
        }
      });

      expect(result).toEqual(mockRefund);
    });

    it('should throw error when no charges found for refund', async () => {
      const mockPaymentIntent = {
        id: 'pi_test123',
        status: 'succeeded',
        charges: { data: [] } // No charges
      };

      mockStripe.paymentIntents.retrieve.mockResolvedValue(mockPaymentIntent);

      await expect(
        stripeService.createRefund('pi_test123')
      ).rejects.toThrow('No charges found for payment intent');
    });
  });

  describe('Payment Reconciliation', () => {
    it('should reconcile payments successfully', async () => {
      const mockPaymentIntents = {
        data: [
          {
            id: 'pi_test1',
            status: 'succeeded',
            metadata: {
              invoice_id: 'invoice-1',
              tenant_id: 'test-tenant-id'
            },
            amount: 10000,
            currency: 'usd',
            charges: { data: [{ id: 'ch_test1' }] },
            created: 1234567890
          },
          {
            id: 'pi_test2',
            status: 'succeeded',
            metadata: {
              invoice_id: 'invoice-2',
              tenant_id: 'test-tenant-id'
            },
            amount: 20000,
            currency: 'usd',
            charges: { data: [{ id: 'ch_test2' }] },
            created: 1234567890
          }
        ]
      };

      mockStripe.paymentIntents.list.mockResolvedValue(mockPaymentIntents);
      mockInvoiceService.addPayment.mockResolvedValue({} as any);

      const result = await stripeService.reconcilePayments(
        mockTenantContext,
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );

      expect(mockStripe.paymentIntents.list).toHaveBeenCalledWith({
        limit: 100,
        created: {
          gte: Math.floor(new Date('2024-01-01').getTime() / 1000),
          lte: Math.floor(new Date('2024-01-31').getTime() / 1000)
        }
      });

      expect(mockInvoiceService.addPayment).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        processed_payments: 2,
        failed_reconciliations: 0,
        errors: []
      });
    });

    it('should handle reconciliation errors gracefully', async () => {
      const mockPaymentIntents = {
        data: [
          {
            id: 'pi_test1',
            status: 'succeeded',
            metadata: {
              invoice_id: 'invoice-1',
              tenant_id: 'test-tenant-id'
            },
            amount: 10000,
            currency: 'usd',
            charges: { data: [{ id: 'ch_test1' }] },
            created: 1234567890
          }
        ]
      };

      mockStripe.paymentIntents.list.mockResolvedValue(mockPaymentIntents);
      mockInvoiceService.addPayment.mockRejectedValue(new Error('Database error'));

      const result = await stripeService.reconcilePayments(mockTenantContext);

      expect(result).toEqual({
        processed_payments: 0,
        failed_reconciliations: 1,
        errors: [{
          payment_intent_id: 'pi_test1',
          error: 'Database error'
        }]
      });
    });

    it('should skip payments without tenant context', async () => {
      const mockPaymentIntents = {
        data: [
          {
            id: 'pi_test1',
            status: 'succeeded',
            metadata: {
              invoice_id: 'invoice-1',
              tenant_id: 'different-tenant-id' // Different tenant
            }
          },
          {
            id: 'pi_test2',
            status: 'requires_payment_method', // Not succeeded
            metadata: {
              invoice_id: 'invoice-2',
              tenant_id: 'test-tenant-id'
            }
          }
        ]
      };

      mockStripe.paymentIntents.list.mockResolvedValue(mockPaymentIntents);

      const result = await stripeService.reconcilePayments(mockTenantContext);

      expect(mockInvoiceService.addPayment).not.toHaveBeenCalled();
      expect(result).toEqual({
        processed_payments: 0,
        failed_reconciliations: 0,
        errors: []
      });
    });
  });

  describe('Payment Methods', () => {
    it('should get customer payment methods', async () => {
      const mockPaymentMethods = {
        data: [
          {
            id: 'pm_test1',
            type: 'card',
            card: {
              brand: 'visa',
              last4: '4242'
            }
          }
        ]
      };

      mockStripe.paymentMethods.list.mockResolvedValue(mockPaymentMethods);

      const result = await stripeService.getCustomerPaymentMethods('cus_test123');

      expect(mockStripe.paymentMethods.list).toHaveBeenCalledWith({
        customer: 'cus_test123',
        type: 'card'
      });

      expect(result).toEqual(mockPaymentMethods.data);
    });
  });

  describe('Error Handling', () => {
    it('should handle Stripe API errors gracefully', async () => {
      const stripeError = new Error('Stripe API error');
      mockStripe.paymentIntents.create.mockRejectedValue(stripeError);

      await expect(
        stripeService.createPaymentIntent({
          invoice_id: 'test-invoice-id',
          amount: 100.00,
          currency: 'USD'
        }, mockTenantContext)
      ).rejects.toThrow('Failed to create payment intent: Stripe API error');
    });

    it('should handle webhook signature verification errors', async () => {
      const signatureError = new Error('Invalid signature');
      mockStripe.webhooks.constructEvent.mockImplementation(() => {
        throw signatureError;
      });

      expect(() => {
        stripeService.verifyWebhookSignature('invalid_body', 'invalid_signature');
      }).toThrow('Webhook signature verification failed: Invalid signature');
    });
  });
});