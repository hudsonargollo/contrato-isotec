/**
 * Property-Based Tests for Stripe Payment Integration
 * Tests universal properties that should hold across all valid payment scenarios
 * Requirements: 4.3 - Payment gateway integration and tracking
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import fc from 'fast-check';
import { stripeService } from '@/lib/services/stripe';
import { invoiceService } from '@/lib/services/invoice';
import { TenantContext } from '@/lib/types/tenant';

// **Validates: Requirements 4.3**

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

describe('Stripe Payment Integration - Property Tests', () => {
  const mockTenantContext: TenantContext = {
    tenant_id: 'test-tenant-id',
    user_id: 'test-user-id',
    permissions: [],
    subscription_limits: {}
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    mockInvoiceService.getInvoice.mockResolvedValue({
      id: 'test-invoice-id',
      tenant_id: 'test-tenant-id',
      invoice_number: 'INV-001',
      customer_name: 'John Doe',
      customer_email: 'john@example.com',
      total_amount: 100.00,
      currency: 'USD',
      status: 'pending'
    } as any);
    mockAuditLogger.log.mockResolvedValue();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  // Custom generators for payment domain
  const validCurrencyGen = fc.constantFrom('USD', 'BRL', 'EUR');
  const positiveAmountGen = fc.float({ min: Math.fround(0.01), max: Math.fround(999999.99) });
  const emailGen = fc.emailAddress();
  const nameGen = fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0);
  const phoneGen = fc.string({ minLength: 10, maxLength: 15 }).map(s => '+' + s.replace(/[^0-9]/g, ''));
  
  const invoiceGen = fc.record({
    id: fc.uuid(),
    tenant_id: fc.uuid(),
    invoice_number: fc.string({ minLength: 1, maxLength: 50 }),
    customer_name: nameGen,
    customer_email: emailGen,
    total_amount: positiveAmountGen,
    currency: validCurrencyGen,
    status: fc.constantFrom('draft', 'pending', 'sent', 'approved')
  });

  const customerRequestGen = fc.record({
    email: emailGen,
    name: fc.option(nameGen),
    phone: fc.option(phoneGen),
    metadata: fc.option(fc.dictionary(fc.string(), fc.string()))
  });

  const paymentIntentRequestGen = fc.record({
    invoice_id: fc.uuid(),
    amount: positiveAmountGen,
    currency: validCurrencyGen,
    customer_email: fc.option(emailGen),
    customer_name: fc.option(nameGen),
    metadata: fc.option(fc.dictionary(fc.string(), fc.string()))
  });

  describe('Property 1: Customer Creation Consistency', () => {
    it('should always create or retrieve customer with consistent tenant metadata', async () => {
      await fc.assert(fc.asyncProperty(
        customerRequestGen,
        async (customerRequest) => {
          // Setup mocks
          const mockCustomer = {
            id: 'cus_test123',
            email: customerRequest.email,
            name: customerRequest.name || null,
            phone: customerRequest.phone || null,
            metadata: {
              ...customerRequest.metadata,
              tenant_id: mockTenantContext.tenant_id,
              created_at: '2024-01-01T00:00:00Z'
            }
          };

          mockStripe.customers.list.mockResolvedValue({ data: [] });
          mockStripe.customers.create.mockResolvedValue(mockCustomer);

          const result = await stripeService.createOrGetCustomer(customerRequest, mockTenantContext);

          // Property: Customer always has tenant_id in metadata
          expect(result.metadata.tenant_id).toBe(mockTenantContext.tenant_id);
          
          // Property: Customer email matches request
          expect(result.email).toBe(customerRequest.email);
          
          // Property: Customer metadata includes all provided metadata
          if (customerRequest.metadata) {
            Object.keys(customerRequest.metadata).forEach(key => {
              expect(result.metadata[key]).toBe(customerRequest.metadata![key]);
            });
          }
        }
      ), { numRuns: 50 });
    });
  });

  describe('Property 2: Payment Intent Amount Consistency', () => {
    it('should always convert amounts correctly between currency units and cents', async () => {
      await fc.assert(fc.asyncProperty(
        fc.tuple(invoiceGen, paymentIntentRequestGen),
        async ([invoice, paymentRequest]) => {
          // Ensure payment amount matches invoice total for this test
          const adjustedPaymentRequest = {
            ...paymentRequest,
            amount: invoice.total_amount,
            currency: invoice.currency,
            invoice_id: invoice.id
          };

          // Setup mocks
          mockInvoiceService.getInvoice.mockResolvedValue(invoice as any);
          
          const mockPaymentIntent = {
            id: 'pi_test123',
            client_secret: 'pi_test123_secret',
            status: 'requires_payment_method',
            amount: Math.round(invoice.total_amount * 100), // Stripe uses cents
            currency: invoice.currency.toLowerCase(),
            metadata: {
              invoice_id: invoice.id,
              tenant_id: mockTenantContext.tenant_id
            }
          };

          mockStripe.paymentIntents.create.mockResolvedValue(mockPaymentIntent);

          const result = await stripeService.createPaymentIntent(adjustedPaymentRequest, mockTenantContext);

          // Property: Amount conversion is consistent (currency units <-> cents)
          expect(result.amount).toBe(invoice.total_amount);
          expect(Math.round(result.amount * 100)).toBe(mockPaymentIntent.amount);
          
          // Property: Currency is normalized consistently
          expect(result.currency).toBe(invoice.currency.toUpperCase());
          expect(mockPaymentIntent.currency).toBe(invoice.currency.toLowerCase());
          
          // Property: Metadata always includes required fields
          expect(result.metadata.invoice_id).toBe(invoice.id);
          expect(result.metadata.tenant_id).toBe(mockTenantContext.tenant_id);
        }
      ), { numRuns: 30 });
    });
  });

  describe('Property 3: Payment Intent Validation Consistency', () => {
    it('should always reject payment intents when amount does not match invoice', async () => {
      await fc.assert(fc.asyncProperty(
        fc.tuple(invoiceGen, paymentIntentRequestGen),
        async ([invoice, paymentRequest]) => {
          // Ensure amounts are different
          const differentAmount = invoice.total_amount + 10.00;
          const adjustedPaymentRequest = {
            ...paymentRequest,
            amount: differentAmount,
            invoice_id: invoice.id
          };

          // Setup mocks
          mockInvoiceService.getInvoice.mockResolvedValue(invoice as any);

          // Property: Mismatched amounts always throw validation error
          await expect(
            stripeService.createPaymentIntent(adjustedPaymentRequest, mockTenantContext)
          ).rejects.toThrow(/Payment amount .* does not match invoice total/);
        }
      ), { numRuns: 30 });
    });
  });

  describe('Property 4: Webhook Event Processing Consistency', () => {
    it('should always process successful payment webhooks consistently', async () => {
      await fc.assert(fc.asyncProperty(
        fc.tuple(invoiceGen, positiveAmountGen),
        async ([invoice, amount]) => {
          const mockPaymentIntent = {
            id: 'pi_test123',
            status: 'succeeded',
            amount: Math.round(amount * 100), // Stripe cents
            currency: invoice.currency.toLowerCase(),
            metadata: {
              invoice_id: invoice.id,
              tenant_id: mockTenantContext.tenant_id
            },
            charges: {
              data: [{
                id: 'ch_test123',
                receipt_url: 'https://stripe.com/receipt'
              }]
            },
            payment_method: 'pm_test123',
            created: Math.floor(Date.now() / 1000)
          };

          const webhookEvent = {
            id: 'evt_test123',
            type: 'payment_intent.succeeded',
            data: { object: mockPaymentIntent },
            created: Math.floor(Date.now() / 1000),
            livemode: false
          };

          mockInvoiceService.addPayment.mockResolvedValue({} as any);

          await stripeService.processWebhookEvent(webhookEvent, mockTenantContext);

          // Property: Payment record is always created for successful webhooks
          expect(mockInvoiceService.addPayment).toHaveBeenCalledTimes(1);
          
          const paymentCall = mockInvoiceService.addPayment.mock.calls[0][0];
          
          // Property: Payment amount is correctly converted from cents
          expect(paymentCall.amount).toBe(amount);
          
          // Property: Currency is normalized to uppercase
          expect(paymentCall.currency).toBe(invoice.currency.toUpperCase());
          
          // Property: Invoice ID matches webhook metadata
          expect(paymentCall.invoice_id).toBe(invoice.id);
          
          // Property: Transaction ID matches payment intent ID
          expect(paymentCall.transaction_id).toBe(mockPaymentIntent.id);
          
          // Property: Gateway reference matches charge ID
          expect(paymentCall.gateway_reference).toBe('ch_test123');
        }
      ), { numRuns: 30 });
    });
  });

  describe('Property 5: Refund Amount Consistency', () => {
    it('should always handle refund amounts correctly', async () => {
      await fc.assert(fc.asyncProperty(
        fc.tuple(positiveAmountGen, fc.option(positiveAmountGen)),
        async ([originalAmount, refundAmount]) => {
          const mockPaymentIntent = {
            id: 'pi_test123',
            status: 'succeeded',
            charges: {
              data: [{
                id: 'ch_test123'
              }]
            }
          };

          const expectedRefundAmount = refundAmount || originalAmount;
          const mockRefund = {
            id: 're_test123',
            amount: Math.round(expectedRefundAmount * 100), // Stripe cents
            currency: 'usd',
            charge: 'ch_test123',
            status: 'succeeded',
            reason: 'requested_by_customer',
            created: Math.floor(Date.now() / 1000)
          };

          mockStripe.paymentIntents.retrieve.mockResolvedValue(mockPaymentIntent);
          mockStripe.refunds.create.mockResolvedValue(mockRefund);

          const result = await stripeService.createRefund('pi_test123', refundAmount);

          // Property: Refund amount conversion is consistent
          expect(result.amount).toBe(Math.round(expectedRefundAmount * 100));
          
          // Property: Refund is created with correct charge reference
          expect(result.charge).toBe('ch_test123');
          
          // Property: Stripe refund call uses correct amount in cents
          const refundCall = mockStripe.refunds.create.mock.calls[0][0];
          if (refundAmount) {
            expect(refundCall.amount).toBe(Math.round(refundAmount * 100));
          } else {
            expect(refundCall.amount).toBeUndefined(); // Full refund
          }
        }
      ), { numRuns: 30 });
    });
  });

  describe('Property 6: Reconciliation Tenant Isolation', () => {
    it('should always respect tenant boundaries during reconciliation', async () => {
      await fc.assert(fc.asyncProperty(
        fc.array(fc.tuple(fc.uuid(), fc.uuid()), { minLength: 1, maxLength: 10 }),
        async (tenantInvoicePairs) => {
          const mockPaymentIntents = {
            data: tenantInvoicePairs.map((pair, index) => ({
              id: `pi_test${index}`,
              status: 'succeeded',
              metadata: {
                invoice_id: pair[1],
                tenant_id: pair[0]
              },
              amount: 10000,
              currency: 'usd',
              charges: { data: [{ id: `ch_test${index}` }] },
              created: Math.floor(Date.now() / 1000)
            }))
          };

          mockStripe.paymentIntents.list.mockResolvedValue(mockPaymentIntents);
          mockInvoiceService.addPayment.mockResolvedValue({} as any);

          const result = await stripeService.reconcilePayments(mockTenantContext);

          // Property: Only payments for the current tenant are processed
          const expectedProcessedCount = tenantInvoicePairs.filter(
            pair => pair[0] === mockTenantContext.tenant_id
          ).length;

          expect(result.processed_payments).toBe(expectedProcessedCount);
          expect(mockInvoiceService.addPayment).toHaveBeenCalledTimes(expectedProcessedCount);
          
          // Property: All processed payments belong to the correct tenant
          mockInvoiceService.addPayment.mock.calls.forEach(call => {
            const paymentRequest = call[0];
            const context = call[1];
            expect(context.tenant_id).toBe(mockTenantContext.tenant_id);
          });
        }
      ), { numRuns: 20 });
    });
  });

  describe('Property 7: Currency Normalization Consistency', () => {
    it('should always normalize currencies consistently across all operations', async () => {
      await fc.assert(fc.asyncProperty(
        validCurrencyGen,
        async (currency) => {
          const invoice = {
            id: 'test-invoice',
            tenant_id: mockTenantContext.tenant_id,
            total_amount: 100.00,
            currency: currency,
            invoice_number: 'INV-001',
            customer_name: 'Test Customer',
            status: 'pending'
          };

          mockInvoiceService.getInvoice.mockResolvedValue(invoice as any);

          const mockPaymentIntent = {
            id: 'pi_test123',
            client_secret: 'pi_test123_secret',
            status: 'requires_payment_method',
            amount: 10000,
            currency: currency.toLowerCase(),
            metadata: {}
          };

          mockStripe.paymentIntents.create.mockResolvedValue(mockPaymentIntent);

          const result = await stripeService.createPaymentIntent({
            invoice_id: 'test-invoice',
            amount: 100.00,
            currency: currency
          }, mockTenantContext);

          // Property: Response currency is always uppercase
          expect(result.currency).toBe(currency.toUpperCase());
          
          // Property: Stripe API call uses lowercase currency
          const stripeCall = mockStripe.paymentIntents.create.mock.calls[0][0];
          expect(stripeCall.currency).toBe(currency.toLowerCase());
        }
      ), { numRuns: 20 });
    });
  });

  describe('Property 8: Error Handling Consistency', () => {
    it('should always handle errors consistently without exposing sensitive data', async () => {
      await fc.assert(fc.asyncProperty(
        paymentIntentRequestGen,
        async (paymentRequest) => {
          // Force an error by making invoice not found
          mockInvoiceService.getInvoice.mockResolvedValue(null);

          try {
            await stripeService.createPaymentIntent(paymentRequest, mockTenantContext);
            // Should not reach here
            expect(true).toBe(false);
          } catch (error) {
            // Property: Error messages are consistent and don't expose sensitive data
            expect(error).toBeInstanceOf(Error);
            expect((error as Error).message).toBe('Failed to create payment intent: Invoice not found');
            
            // Property: Error message doesn't contain sensitive information
            const errorMessage = (error as Error).message;
            expect(errorMessage).not.toContain(mockTenantContext.tenant_id);
            expect(errorMessage).not.toContain(mockTenantContext.user_id);
            expect(errorMessage).not.toContain(paymentRequest.invoice_id);
          }
        }
      ), { numRuns: 20 });
    });
  });
});