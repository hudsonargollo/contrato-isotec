/**
 * Simplified Stripe Payment Integration Tests
 * Tests the API routes and basic integration without mocking complex Stripe internals
 * Requirements: 4.3 - Payment gateway integration and tracking
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { POST as createPaymentIntent } from '@/app/api/payments/stripe/payment-intent/route';
import { POST as createRefund } from '@/app/api/payments/stripe/refund/route';
import { POST as reconcilePayments } from '@/app/api/payments/stripe/reconcile/route';

// Mock the services
const mockStripeService = {
  createPaymentIntent: jest.fn(),
  getPaymentIntent: jest.fn(),
  createRefund: jest.fn(),
  reconcilePayments: jest.fn(),
  verifyWebhookSignature: jest.fn(),
  processWebhookEvent: jest.fn(),
};

const mockInvoiceService = {
  getInvoice: jest.fn(),
  addPayment: jest.fn(),
};

const mockAuditLogger = {
  log: jest.fn(),
};

const mockGetTenantContext = jest.fn();

jest.mock('@/lib/services/stripe', () => ({
  stripeService: mockStripeService
}));

jest.mock('@/lib/services/invoice', () => ({
  invoiceService: mockInvoiceService
}));

jest.mock('@/lib/services/audit-logger', () => ({
  auditLogger: mockAuditLogger
}));

jest.mock('@/lib/utils/tenant-context', () => ({
  getTenantContext: mockGetTenantContext
}));

describe('Stripe Payment Integration API Routes', () => {
  const mockTenantContext = {
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
    mockGetTenantContext.mockResolvedValue(mockTenantContext);
    mockInvoiceService.getInvoice.mockResolvedValue(mockInvoice);
    mockAuditLogger.log.mockResolvedValue();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Payment Intent Creation', () => {
    it('should create payment intent successfully', async () => {
      const mockPaymentIntent = {
        payment_intent_id: 'pi_test123',
        client_secret: 'pi_test123_secret',
        status: 'requires_payment_method',
        amount: 100.00,
        currency: 'USD',
        metadata: {
          invoice_id: 'test-invoice-id',
          tenant_id: 'test-tenant-id'
        }
      };

      mockStripeService.createPaymentIntent.mockResolvedValue(mockPaymentIntent);

      const request = new NextRequest('http://localhost:3000/api/payments/stripe/payment-intent', {
        method: 'POST',
        body: JSON.stringify({
          invoice_id: 'test-invoice-id',
          amount: 100.00,
          currency: 'USD',
          customer_email: 'john@example.com'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await createPaymentIntent(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.message).toBe('Payment intent created successfully');
      expect(data.payment_intent).toEqual(mockPaymentIntent);
      expect(data.invoice.id).toBe('test-invoice-id');

      expect(mockStripeService.createPaymentIntent).toHaveBeenCalledWith({
        invoice_id: 'test-invoice-id',
        amount: 100.00,
        currency: 'USD',
        customer_email: 'john@example.com',
        metadata: {
          tenant_id: 'test-tenant-id',
          invoice_number: 'INV-001',
          customer_name: 'John Doe'
        }
      }, mockTenantContext);

      expect(mockAuditLogger.log).toHaveBeenCalledWith({
        tenant_id: 'test-tenant-id',
        user_id: 'test-user-id',
        action: 'payments.create_intent',
        resource_type: 'invoice',
        resource_id: 'test-invoice-id',
        details: expect.objectContaining({
          invoice_number: 'INV-001',
          customer_name: 'John Doe',
          payment_intent_id: 'pi_test123',
          amount: 100.00,
          currency: 'USD',
          status: 'requires_payment_method'
        })
      });
    });

    it('should validate required fields', async () => {
      const request = new NextRequest('http://localhost:3000/api/payments/stripe/payment-intent', {
        method: 'POST',
        body: JSON.stringify({
          // Missing invoice_id
          amount: 100.00,
          currency: 'USD'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await createPaymentIntent(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invoice ID is required');
    });

    it('should validate payment amount', async () => {
      const request = new NextRequest('http://localhost:3000/api/payments/stripe/payment-intent', {
        method: 'POST',
        body: JSON.stringify({
          invoice_id: 'test-invoice-id',
          amount: -50.00, // Invalid negative amount
          currency: 'USD'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await createPaymentIntent(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Payment amount must be greater than 0');
    });

    it('should validate currency', async () => {
      const request = new NextRequest('http://localhost:3000/api/payments/stripe/payment-intent', {
        method: 'POST',
        body: JSON.stringify({
          invoice_id: 'test-invoice-id',
          amount: 100.00,
          currency: 'INVALID' // Invalid currency
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await createPaymentIntent(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid currency. Supported currencies: BRL, USD, EUR');
    });

    it('should handle invoice not found', async () => {
      mockInvoiceService.getInvoice.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/payments/stripe/payment-intent', {
        method: 'POST',
        body: JSON.stringify({
          invoice_id: 'non-existent-invoice',
          amount: 100.00,
          currency: 'USD'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await createPaymentIntent(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Invoice not found');
    });

    it('should handle cancelled invoice', async () => {
      mockInvoiceService.getInvoice.mockResolvedValue({
        ...mockInvoice,
        status: 'cancelled'
      });

      const request = new NextRequest('http://localhost:3000/api/payments/stripe/payment-intent', {
        method: 'POST',
        body: JSON.stringify({
          invoice_id: 'test-invoice-id',
          amount: 100.00,
          currency: 'USD'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await createPaymentIntent(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Cannot create payment for cancelled invoice');
    });

    it('should handle already paid invoice', async () => {
      mockInvoiceService.getInvoice.mockResolvedValue({
        ...mockInvoice,
        status: 'paid'
      });

      const request = new NextRequest('http://localhost:3000/api/payments/stripe/payment-intent', {
        method: 'POST',
        body: JSON.stringify({
          invoice_id: 'test-invoice-id',
          amount: 100.00,
          currency: 'USD'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await createPaymentIntent(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invoice is already paid');
    });

    it('should handle unauthorized access', async () => {
      mockGetTenantContext.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/payments/stripe/payment-intent', {
        method: 'POST',
        body: JSON.stringify({
          invoice_id: 'test-invoice-id',
          amount: 100.00,
          currency: 'USD'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await createPaymentIntent(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('Refund Creation', () => {
    it('should create refund successfully', async () => {
      const mockPaymentIntent = {
        id: 'pi_test123',
        status: 'succeeded',
        metadata: {
          tenant_id: 'test-tenant-id',
          invoice_id: 'test-invoice-id',
          invoice_number: 'INV-001'
        }
      };

      const mockRefund = {
        id: 're_test123',
        amount: 5000, // $50.00 in cents
        currency: 'usd',
        status: 'succeeded',
        reason: 'requested_by_customer',
        created: Math.floor(Date.now() / 1000),
        charge: 'ch_test123'
      };

      mockStripeService.getPaymentIntent.mockResolvedValue(mockPaymentIntent);
      mockStripeService.createRefund.mockResolvedValue(mockRefund);

      const request = new NextRequest('http://localhost:3000/api/payments/stripe/refund', {
        method: 'POST',
        body: JSON.stringify({
          payment_intent_id: 'pi_test123',
          amount: 50.00,
          reason: 'requested_by_customer',
          description: 'Customer requested refund'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await createRefund(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.message).toBe('Refund created successfully');
      expect(data.refund.id).toBe('re_test123');
      expect(data.refund.amount).toBe(50.00);
      expect(data.refund.currency).toBe('USD');

      expect(mockStripeService.createRefund).toHaveBeenCalledWith(
        'pi_test123',
        50.00,
        'requested_by_customer',
        expect.objectContaining({
          tenant_id: 'test-tenant-id',
          invoice_id: 'test-invoice-id',
          invoice_number: 'INV-001',
          refunded_by: 'test-user-id',
          refund_reason: 'requested_by_customer',
          refund_description: 'Customer requested refund'
        })
      );

      expect(mockInvoiceService.addPayment).toHaveBeenCalledWith(
        expect.objectContaining({
          invoice_id: 'test-invoice-id',
          amount: -50.00, // Negative for refund
          currency: 'USD',
          payment_method: 'credit_card',
          transaction_id: 're_test123',
          gateway_reference: 'ch_test123',
          notes: 'Refund for payment intent pi_test123. Reason: requested_by_customer'
        }),
        mockTenantContext
      );
    });

    it('should validate required fields for refund', async () => {
      const request = new NextRequest('http://localhost:3000/api/payments/stripe/refund', {
        method: 'POST',
        body: JSON.stringify({
          // Missing payment_intent_id
          amount: 50.00
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await createRefund(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Payment intent ID is required');
    });

    it('should validate refund amount', async () => {
      const request = new NextRequest('http://localhost:3000/api/payments/stripe/refund', {
        method: 'POST',
        body: JSON.stringify({
          payment_intent_id: 'pi_test123',
          amount: -10.00 // Invalid negative amount
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await createRefund(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Refund amount must be greater than 0');
    });
  });

  describe('Payment Reconciliation', () => {
    it('should reconcile payments successfully', async () => {
      const mockReconciliationResult = {
        processed_payments: 5,
        failed_reconciliations: 1,
        errors: [{
          payment_intent_id: 'pi_failed123',
          error: 'Invoice not found'
        }]
      };

      mockStripeService.reconcilePayments.mockResolvedValue(mockReconciliationResult);

      const request = new NextRequest('http://localhost:3000/api/payments/stripe/reconcile', {
        method: 'POST',
        body: JSON.stringify({
          start_date: '2024-01-01T00:00:00Z',
          end_date: '2024-01-31T23:59:59Z'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await reconcilePayments(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Payment reconciliation completed');
      expect(data.result).toEqual(mockReconciliationResult);
      expect(data.summary.total_processed).toBe(5);
      expect(data.summary.total_failed).toBe(1);
      expect(data.summary.success_rate).toBe(83.33333333333334); // 5/6 * 100

      expect(mockStripeService.reconcilePayments).toHaveBeenCalledWith(
        mockTenantContext,
        new Date('2024-01-01T00:00:00Z'),
        new Date('2024-01-31T23:59:59Z')
      );

      expect(mockAuditLogger.log).toHaveBeenCalledWith({
        tenant_id: 'test-tenant-id',
        user_id: 'test-user-id',
        action: 'payments.reconcile',
        resource_type: 'payment',
        resource_id: 'bulk',
        details: expect.objectContaining({
          processed_payments: 5,
          failed_reconciliations: 1,
          errors_count: 1
        })
      });
    });

    it('should handle invalid date format', async () => {
      const request = new NextRequest('http://localhost:3000/api/payments/stripe/reconcile', {
        method: 'POST',
        body: JSON.stringify({
          start_date: 'invalid-date',
          end_date: '2024-01-31T23:59:59Z'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await reconcilePayments(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid start_date format');
    });

    it('should validate date range', async () => {
      const request = new NextRequest('http://localhost:3000/api/payments/stripe/reconcile', {
        method: 'POST',
        body: JSON.stringify({
          start_date: '2024-01-31T23:59:59Z',
          end_date: '2024-01-01T00:00:00Z' // End before start
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await reconcilePayments(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('start_date must be before end_date');
    });
  });

  describe('Error Handling', () => {
    it('should handle Stripe service errors gracefully', async () => {
      mockStripeService.createPaymentIntent.mockRejectedValue(new Error('Stripe API error'));

      const request = new NextRequest('http://localhost:3000/api/payments/stripe/payment-intent', {
        method: 'POST',
        body: JSON.stringify({
          invoice_id: 'test-invoice-id',
          amount: 100.00,
          currency: 'USD'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await createPaymentIntent(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to create payment intent');
      expect(data.details).toBe('Stripe API error');
    });

    it('should handle database errors gracefully', async () => {
      mockInvoiceService.getInvoice.mockRejectedValue(new Error('Database connection failed'));

      const request = new NextRequest('http://localhost:3000/api/payments/stripe/payment-intent', {
        method: 'POST',
        body: JSON.stringify({
          invoice_id: 'test-invoice-id',
          amount: 100.00,
          currency: 'USD'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await createPaymentIntent(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to create payment intent');
      expect(data.details).toBe('Database connection failed');
    });
  });
});