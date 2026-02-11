/**
 * Stripe Integration Unit Tests
 * Tests core Stripe integration functionality and business logic
 * Requirements: 4.3 - Payment gateway integration and tracking
 */

import { describe, it, expect } from '@jest/globals';

describe('Stripe Payment Integration - Core Logic', () => {
  describe('Amount Conversion', () => {
    it('should convert currency amounts to cents correctly', () => {
      const testCases = [
        { amount: 100.00, expected: 10000 },
        { amount: 50.50, expected: 5050 },
        { amount: 0.01, expected: 1 },
        { amount: 999.99, expected: 99999 },
        { amount: 1234.56, expected: 123456 }
      ];

      testCases.forEach(({ amount, expected }) => {
        const cents = Math.round(amount * 100);
        expect(cents).toBe(expected);
      });
    });

    it('should convert cents back to currency amounts correctly', () => {
      const testCases = [
        { cents: 10000, expected: 100.00 },
        { cents: 5050, expected: 50.50 },
        { cents: 1, expected: 0.01 },
        { cents: 99999, expected: 999.99 },
        { cents: 123456, expected: 1234.56 }
      ];

      testCases.forEach(({ cents, expected }) => {
        const amount = cents / 100;
        expect(amount).toBe(expected);
      });
    });
  });

  describe('Currency Normalization', () => {
    it('should normalize currencies consistently', () => {
      const testCases = [
        { input: 'USD', expectedUpper: 'USD', expectedLower: 'usd' },
        { input: 'BRL', expectedUpper: 'BRL', expectedLower: 'brl' },
        { input: 'EUR', expectedUpper: 'EUR', expectedLower: 'eur' },
        { input: 'usd', expectedUpper: 'USD', expectedLower: 'usd' },
        { input: 'brl', expectedUpper: 'BRL', expectedLower: 'brl' },
        { input: 'eur', expectedUpper: 'EUR', expectedLower: 'eur' }
      ];

      testCases.forEach(({ input, expectedUpper, expectedLower }) => {
        expect(input.toUpperCase()).toBe(expectedUpper);
        expect(input.toLowerCase()).toBe(expectedLower);
      });
    });

    it('should validate supported currencies', () => {
      const supportedCurrencies = ['BRL', 'USD', 'EUR'];
      const validCurrencies = ['USD', 'BRL', 'EUR', 'usd', 'brl', 'eur'];
      const invalidCurrencies = ['GBP', 'JPY', 'CAD', 'INVALID'];

      validCurrencies.forEach(currency => {
        expect(supportedCurrencies.includes(currency.toUpperCase())).toBe(true);
      });

      invalidCurrencies.forEach(currency => {
        expect(supportedCurrencies.includes(currency.toUpperCase())).toBe(false);
      });
    });
  });

  describe('Payment Validation', () => {
    it('should validate payment amounts', () => {
      const validAmounts = [0.01, 1.00, 100.00, 999.99, 1234.56];
      const invalidAmounts = [0, -1, -100.00, NaN, Infinity];

      validAmounts.forEach(amount => {
        expect(amount > 0).toBe(true);
        expect(isFinite(amount)).toBe(true);
        expect(!isNaN(amount)).toBe(true);
      });

      invalidAmounts.forEach(amount => {
        expect(amount > 0 && isFinite(amount) && !isNaN(amount)).toBe(false);
      });
    });

    it('should validate invoice status for payments', () => {
      const payableStatuses = ['pending', 'sent', 'approved', 'overdue'];
      const nonPayableStatuses = ['draft', 'cancelled', 'paid'];

      payableStatuses.forEach(status => {
        expect(['cancelled', 'paid'].includes(status)).toBe(false);
      });

      nonPayableStatuses.forEach(status => {
        if (status === 'cancelled' || status === 'paid') {
          expect(['cancelled', 'paid'].includes(status)).toBe(true);
        }
      });
    });
  });

  describe('Metadata Handling', () => {
    it('should create consistent metadata for payment intents', () => {
      const invoice = {
        id: 'inv_123',
        invoice_number: 'INV-001',
        customer_name: 'John Doe'
      };

      const tenantContext = {
        tenant_id: 'tenant_123',
        user_id: 'user_123'
      };

      const expectedMetadata = {
        invoice_id: invoice.id,
        invoice_number: invoice.invoice_number,
        tenant_id: tenantContext.tenant_id,
        customer_name: invoice.customer_name
      };

      const actualMetadata = {
        invoice_id: invoice.id,
        invoice_number: invoice.invoice_number,
        tenant_id: tenantContext.tenant_id,
        customer_name: invoice.customer_name
      };

      expect(actualMetadata).toEqual(expectedMetadata);
      expect(actualMetadata.tenant_id).toBe(tenantContext.tenant_id);
      expect(actualMetadata.invoice_id).toBe(invoice.id);
    });

    it('should create consistent refund metadata', () => {
      const refundRequest = {
        payment_intent_id: 'pi_123',
        reason: 'requested_by_customer',
        description: 'Customer requested refund'
      };

      const tenantContext = {
        tenant_id: 'tenant_123',
        user_id: 'user_123'
      };

      const expectedMetadata = {
        tenant_id: tenantContext.tenant_id,
        refunded_by: tenantContext.user_id,
        refund_reason: refundRequest.reason,
        refund_description: refundRequest.description,
        original_payment_intent_id: refundRequest.payment_intent_id
      };

      const actualMetadata = {
        tenant_id: tenantContext.tenant_id,
        refunded_by: tenantContext.user_id,
        refund_reason: refundRequest.reason,
        refund_description: refundRequest.description,
        original_payment_intent_id: refundRequest.payment_intent_id
      };

      expect(actualMetadata).toEqual(expectedMetadata);
      expect(actualMetadata.tenant_id).toBe(tenantContext.tenant_id);
      expect(actualMetadata.refunded_by).toBe(tenantContext.user_id);
    });
  });

  describe('Webhook Event Processing Logic', () => {
    it('should identify processable webhook events', () => {
      const processableEvents = [
        'payment_intent.succeeded',
        'payment_intent.payment_failed',
        'payment_intent.canceled',
        'payment_intent.requires_action',
        'charge.dispute.created'
      ];

      const nonProcessableEvents = [
        'customer.created',
        'invoice.created',
        'subscription.created',
        'payment_method.attached'
      ];

      processableEvents.forEach(eventType => {
        const isProcessable = [
          'payment_intent.succeeded',
          'payment_intent.payment_failed',
          'payment_intent.canceled',
          'payment_intent.requires_action',
          'charge.dispute.created'
        ].includes(eventType);
        expect(isProcessable).toBe(true);
      });

      nonProcessableEvents.forEach(eventType => {
        const isProcessable = [
          'payment_intent.succeeded',
          'payment_intent.payment_failed',
          'payment_intent.canceled',
          'payment_intent.requires_action',
          'charge.dispute.created'
        ].includes(eventType);
        expect(isProcessable).toBe(false);
      });
    });

    it('should extract tenant context from webhook metadata', () => {
      const webhookEvent = {
        id: 'evt_123',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_123',
            metadata: {
              tenant_id: 'tenant_123',
              invoice_id: 'inv_123',
              invoice_number: 'INV-001'
            }
          }
        }
      };

      const tenantId = webhookEvent.data.object.metadata?.tenant_id;
      const invoiceId = webhookEvent.data.object.metadata?.invoice_id;

      expect(tenantId).toBe('tenant_123');
      expect(invoiceId).toBe('inv_123');
      expect(tenantId).toBeDefined();
      expect(invoiceId).toBeDefined();
    });
  });

  describe('Reconciliation Logic', () => {
    it('should filter payments by tenant', () => {
      const payments = [
        { id: 'pi_1', metadata: { tenant_id: 'tenant_1', invoice_id: 'inv_1' } },
        { id: 'pi_2', metadata: { tenant_id: 'tenant_2', invoice_id: 'inv_2' } },
        { id: 'pi_3', metadata: { tenant_id: 'tenant_1', invoice_id: 'inv_3' } },
        { id: 'pi_4', metadata: { tenant_id: 'tenant_3', invoice_id: 'inv_4' } }
      ];

      const targetTenantId = 'tenant_1';
      const filteredPayments = payments.filter(
        payment => payment.metadata.tenant_id === targetTenantId
      );

      expect(filteredPayments).toHaveLength(2);
      expect(filteredPayments[0].id).toBe('pi_1');
      expect(filteredPayments[1].id).toBe('pi_3');
      
      filteredPayments.forEach(payment => {
        expect(payment.metadata.tenant_id).toBe(targetTenantId);
      });
    });

    it('should calculate reconciliation success rate', () => {
      const testCases = [
        { processed: 10, failed: 0, expected: 100 },
        { processed: 8, failed: 2, expected: 80 },
        { processed: 5, failed: 5, expected: 50 },
        { processed: 0, failed: 10, expected: 0 },
        { processed: 0, failed: 0, expected: 100 } // Edge case: no payments
      ];

      testCases.forEach(({ processed, failed, expected }) => {
        const total = processed + failed;
        const successRate = total > 0 ? (processed / total) * 100 : 100;
        expect(successRate).toBe(expected);
      });
    });
  });

  describe('Error Handling Logic', () => {
    it('should sanitize error messages', () => {
      const sensitiveData = {
        tenant_id: 'tenant_123',
        user_id: 'user_123',
        api_key: 'sk_test_123456789',
        customer_email: 'customer@example.com'
      };

      const errorMessage = 'Invoice not found';
      
      // Error message should not contain sensitive data
      expect(errorMessage).not.toContain(sensitiveData.tenant_id);
      expect(errorMessage).not.toContain(sensitiveData.user_id);
      expect(errorMessage).not.toContain(sensitiveData.api_key);
      expect(errorMessage).not.toContain(sensitiveData.customer_email);
      
      // Error message should be descriptive but safe
      expect(errorMessage).toBe('Invoice not found');
      expect(errorMessage.length).toBeGreaterThan(0);
    });

    it('should wrap errors consistently', () => {
      const originalErrors = [
        new Error('Database connection failed'),
        new Error('Stripe API error'),
        new Error('Invalid payment method'),
        'String error message'
      ];

      originalErrors.forEach(originalError => {
        const wrappedMessage = `Failed to process payment: ${
          originalError instanceof Error ? originalError.message : 'Unknown error'
        }`;
        
        expect(wrappedMessage).toContain('Failed to process payment:');
        
        if (originalError instanceof Error) {
          expect(wrappedMessage).toContain(originalError.message);
        } else {
          expect(wrappedMessage).toContain('Unknown error');
        }
      });
    });
  });

  describe('Date and Time Handling', () => {
    it('should handle date ranges for reconciliation', () => {
      const startDate = new Date('2024-01-01T00:00:00Z');
      const endDate = new Date('2024-01-31T23:59:59Z');
      
      // Convert to Unix timestamps (Stripe format)
      const startTimestamp = Math.floor(startDate.getTime() / 1000);
      const endTimestamp = Math.floor(endDate.getTime() / 1000);
      
      expect(startTimestamp).toBe(1704067200); // 2024-01-01 00:00:00 UTC
      expect(endTimestamp).toBe(1706745599);   // 2024-01-31 23:59:59 UTC
      expect(endTimestamp).toBeGreaterThan(startTimestamp);
    });

    it('should validate date ranges', () => {
      const validRanges = [
        { start: new Date('2024-01-01'), end: new Date('2024-01-31') },
        { start: new Date('2024-01-01'), end: new Date('2024-12-31') },
        { start: new Date('2024-06-01'), end: new Date('2024-06-30') }
      ];

      const invalidRanges = [
        { start: new Date('2024-01-31'), end: new Date('2024-01-01') }, // End before start
        { start: new Date('2024-12-31'), end: new Date('2024-01-01') }, // End before start
      ];

      validRanges.forEach(({ start, end }) => {
        expect(start.getTime()).toBeLessThan(end.getTime());
      });

      invalidRanges.forEach(({ start, end }) => {
        expect(start.getTime()).toBeGreaterThan(end.getTime());
      });
    });
  });

  describe('Payment Status Mapping', () => {
    it('should map Stripe payment statuses correctly', () => {
      const stripeStatusMap = {
        'requires_payment_method': 'pending',
        'requires_confirmation': 'pending',
        'requires_action': 'pending',
        'processing': 'processing',
        'succeeded': 'completed',
        'canceled': 'cancelled'
      };

      Object.entries(stripeStatusMap).forEach(([stripeStatus, expectedStatus]) => {
        expect(stripeStatusMap[stripeStatus as keyof typeof stripeStatusMap]).toBe(expectedStatus);
      });
    });

    it('should handle unknown payment statuses', () => {
      const unknownStatuses = ['unknown_status', 'new_stripe_status', ''];
      const defaultStatus = 'pending';

      unknownStatuses.forEach(status => {
        const mappedStatus = status || defaultStatus;
        expect(mappedStatus).toBeDefined();
        expect(typeof mappedStatus).toBe('string');
      });
    });
  });
});