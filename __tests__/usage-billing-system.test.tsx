/**
 * Usage Billing System Tests
 * 
 * Comprehensive tests for usage-based billing tracking system including
 * usage event tracking, billing calculations, and cycle management.
 * 
 * Requirements: 9.2 - Usage-based billing tracking
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { getUsageBillingService, UsageEvent, BillingCycle } from '@/lib/services/usage-billing';

// Mock Supabase client
const mockSupabase = {
  from: jest.fn(),
  rpc: jest.fn()
};

const mockSelect = jest.fn();
const mockInsert = jest.fn();
const mockUpdate = jest.fn();
const mockEq = jest.fn();
const mockGte = jest.fn();
const mockLte = jest.fn();
const mockOrder = jest.fn();
const mockLimit = jest.fn();
const mockSingle = jest.fn();

// Mock implementation setup
beforeEach(() => {
  // Reset all mocks
  jest.clearAllMocks();
  
  // Create a chainable mock object
  const createChainableMock = () => ({
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    eq: mockEq,
    gte: mockGte,
    lte: mockLte,
    order: mockOrder,
    limit: mockLimit,
    single: mockSingle
  });
  
  // Setup mock chain - all methods return the same chainable object
  const chainableMock = createChainableMock();
  
  mockSupabase.from.mockReturnValue(chainableMock);
  mockSelect.mockReturnValue(chainableMock);
  mockInsert.mockReturnValue(chainableMock);
  mockUpdate.mockReturnValue(chainableMock);
  mockEq.mockReturnValue(chainableMock);
  mockGte.mockReturnValue(chainableMock);
  mockLte.mockReturnValue(chainableMock);
  mockOrder.mockReturnValue(chainableMock);
  mockLimit.mockReturnValue(chainableMock);
  
  // Default successful responses
  mockSingle.mockResolvedValue({ data: null, error: null });
  mockSupabase.rpc.mockResolvedValue({ error: null });
});

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';

// Mock Supabase client creation
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabase)
}));

describe('UsageBillingService', () => {
  let usageBillingService: ReturnType<typeof getUsageBillingService>;
  const mockTenantId = '123e4567-e89b-12d3-a456-426614174000';

  beforeEach(() => {
    usageBillingService = getUsageBillingService();
  });

  describe('Usage Event Tracking', () => {
    it('should track single usage event successfully', async () => {
      // Mock successful insert
      mockSingle.mockResolvedValue({ data: null, error: null });
      mockSupabase.rpc.mockResolvedValue({ error: null });

      const event: Omit<UsageEvent, 'timestamp'> = {
        tenant_id: mockTenantId,
        event_type: 'api_call',
        quantity: 5,
        metadata: { endpoint: '/api/test' }
      };

      await expect(usageBillingService.trackUsageEvent(event)).resolves.not.toThrow();

      // Verify insert was called with correct data
      expect(mockSupabase.from).toHaveBeenCalledWith('usage_events');
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          tenant_id: mockTenantId,
          event_type: 'api_call',
          quantity: 5,
          metadata: { endpoint: '/api/test' }
        })
      );

      // Verify usage summary update was called
      expect(mockSupabase.rpc).toHaveBeenCalledWith('upsert_usage_summary', 
        expect.objectContaining({
          p_tenant_id: mockTenantId,
          p_event_type: 'api_call',
          p_quantity_increment: 5
        })
      );
    });

    it('should track batch usage events successfully', async () => {
      // Mock successful batch insert
      mockInsert.mockResolvedValue({ error: null });
      mockSupabase.rpc.mockResolvedValue({ error: null });

      const events: Omit<UsageEvent, 'timestamp'>[] = [
        {
          tenant_id: mockTenantId,
          event_type: 'api_call',
          quantity: 3,
          metadata: {}
        },
        {
          tenant_id: mockTenantId,
          event_type: 'whatsapp_message_sent',
          quantity: 1,
          metadata: { recipient: '+5511999999999' }
        }
      ];

      await expect(usageBillingService.trackUsageEventsBatch(events)).resolves.not.toThrow();

      // Verify batch insert was called
      expect(mockSupabase.from).toHaveBeenCalledWith('usage_events');
      expect(mockInsert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            tenant_id: mockTenantId,
            event_type: 'api_call',
            quantity: 3
          }),
          expect.objectContaining({
            tenant_id: mockTenantId,
            event_type: 'whatsapp_message_sent',
            quantity: 1
          })
        ])
      );

      // Verify usage summary updates were called for each event type
      expect(mockSupabase.rpc).toHaveBeenCalledWith('upsert_usage_summary',
        expect.objectContaining({
          p_tenant_id: mockTenantId,
          p_event_type: 'api_call',
          p_quantity_increment: 3
        })
      );
      expect(mockSupabase.rpc).toHaveBeenCalledWith('upsert_usage_summary',
        expect.objectContaining({
          p_tenant_id: mockTenantId,
          p_event_type: 'whatsapp_message_sent',
          p_quantity_increment: 1
        })
      );
    });

    it('should handle usage event tracking errors', async () => {
      // Mock insert error
      mockInsert.mockResolvedValue({ 
        error: { message: 'Database connection failed' } 
      });

      const event: Omit<UsageEvent, 'timestamp'> = {
        tenant_id: mockTenantId,
        event_type: 'api_call',
        quantity: 1,
        metadata: {}
      };

      await expect(usageBillingService.trackUsageEvent(event))
        .rejects.toThrow('Failed to track usage event: Database connection failed');
    });

    it('should validate usage event data', async () => {
      const invalidEvent = {
        tenant_id: 'invalid-uuid',
        event_type: 'invalid_event_type',
        quantity: -1,
        metadata: {}
      } as any;

      await expect(usageBillingService.trackUsageEvent(invalidEvent))
        .rejects.toThrow();
    });
  });

  describe('Usage Calculations', () => {
    it('should calculate usage charges correctly for starter plan', async () => {
      // Mock tenant subscription data
      mockSingle.mockResolvedValue({
        data: {
          subscription: JSON.stringify({
            plan: 'starter',
            currency: 'BRL'
          })
        },
        error: null
      });

      // Mock usage events data
      mockSelect.mockResolvedValue({
        data: [
          { event_type: 'api_call', quantity: 1500 }, // 500 over free tier
          { event_type: 'whatsapp_message_sent', quantity: 150 }, // 50 over free tier
          { event_type: 'email_sent', quantity: 500 } // Within free tier
        ],
        error: null
      });

      const periodStart = new Date('2024-03-01');
      const periodEnd = new Date('2024-03-31');

      const usageSummaries = await usageBillingService.calculateUsageCharges(
        mockTenantId,
        periodStart,
        periodEnd
      );

      expect(usageSummaries).toHaveLength(3);

      // API calls: 500 billable * 0.001 = 0.50
      const apiCallSummary = usageSummaries.find(s => s.event_type === 'api_call');
      expect(apiCallSummary).toBeDefined();
      expect(apiCallSummary!.total_quantity).toBe(1500);
      expect(apiCallSummary!.billable_quantity).toBe(500);
      expect(apiCallSummary!.rate_per_unit).toBe(0.001);
      expect(apiCallSummary!.total_charge).toBe(0.50);

      // WhatsApp messages: 50 billable * 0.05 = 2.50
      const whatsappSummary = usageSummaries.find(s => s.event_type === 'whatsapp_message_sent');
      expect(whatsappSummary).toBeDefined();
      expect(whatsappSummary!.total_quantity).toBe(150);
      expect(whatsappSummary!.billable_quantity).toBe(50);
      expect(whatsappSummary!.rate_per_unit).toBe(0.05);
      expect(whatsappSummary!.total_charge).toBe(2.50);

      // Email: 0 billable (within free tier)
      const emailSummary = usageSummaries.find(s => s.event_type === 'email_sent');
      expect(emailSummary).toBeDefined();
      expect(emailSummary!.total_quantity).toBe(500);
      expect(emailSummary!.billable_quantity).toBe(0);
      expect(emailSummary!.total_charge).toBe(0);
    });

    it('should calculate usage charges correctly for professional plan', async () => {
      // Mock tenant subscription data
      mockSingle.mockResolvedValue({
        data: {
          subscription: JSON.stringify({
            plan: 'professional',
            currency: 'BRL'
          })
        },
        error: null
      });

      // Mock usage events data - higher usage that exceeds professional limits
      mockSelect.mockResolvedValue({
        data: [
          { event_type: 'api_call', quantity: 7000 }, // 2000 over free tier
          { event_type: 'contract_generated', quantity: 300 } // 50 over free tier
        ],
        error: null
      });

      const periodStart = new Date('2024-03-01');
      const periodEnd = new Date('2024-03-31');

      const usageSummaries = await usageBillingService.calculateUsageCharges(
        mockTenantId,
        periodStart,
        periodEnd
      );

      expect(usageSummaries).toHaveLength(2);

      // API calls: 2000 billable * 0.0008 = 1.60
      const apiCallSummary = usageSummaries.find(s => s.event_type === 'api_call');
      expect(apiCallSummary!.billable_quantity).toBe(2000);
      expect(apiCallSummary!.rate_per_unit).toBe(0.0008);
      expect(apiCallSummary!.total_charge).toBe(1.60);

      // Contracts: 50 billable * 0.40 = 20.00
      const contractSummary = usageSummaries.find(s => s.event_type === 'contract_generated');
      expect(contractSummary!.billable_quantity).toBe(50);
      expect(contractSummary!.rate_per_unit).toBe(0.40);
      expect(contractSummary!.total_charge).toBe(20.00);
    });
  });

  describe('Billing Cycle Management', () => {
    it('should create billing cycle successfully', async () => {
      const mockCycleData = {
        id: '456e7890-e89b-12d3-a456-426614174001',
        tenant_id: mockTenantId,
        cycle_start: '2024-03-01T00:00:00Z',
        cycle_end: '2024-03-31T23:59:59Z',
        status: 'active',
        total_usage_charges: 0,
        subscription_charges: 0,
        total_charges: 0,
        currency: 'BRL',
        created_at: '2024-03-01T00:00:00Z',
        updated_at: '2024-03-01T00:00:00Z'
      };

      mockSingle.mockResolvedValue({ data: mockCycleData, error: null });

      const cycleStart = new Date('2024-03-01');
      const cycleEnd = new Date('2024-03-31T23:59:59Z');

      const billingCycle = await usageBillingService.createBillingCycle(
        mockTenantId,
        cycleStart,
        cycleEnd
      );

      expect(billingCycle).toBeDefined();
      expect(billingCycle.tenant_id).toBe(mockTenantId);
      expect(billingCycle.status).toBe('active');
      expect(billingCycle.total_charges).toBe(0);

      // Verify insert was called with correct data
      expect(mockSupabase.from).toHaveBeenCalledWith('billing_cycles');
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          tenant_id: mockTenantId,
          cycle_start: cycleStart.toISOString(),
          cycle_end: cycleEnd.toISOString(),
          status: 'active'
        })
      );
    });

    it('should get current billing cycle', async () => {
      const mockCycleData = {
        id: '456e7890-e89b-12d3-a456-426614174001',
        tenant_id: mockTenantId,
        cycle_start: '2024-03-01T00:00:00Z',
        cycle_end: '2024-03-31T23:59:59Z',
        status: 'active',
        total_usage_charges: 15.50,
        subscription_charges: 99.00,
        total_charges: 114.50,
        currency: 'BRL',
        created_at: '2024-03-01T00:00:00Z',
        updated_at: '2024-03-15T10:30:00Z'
      };

      mockSingle.mockResolvedValue({ data: mockCycleData, error: null });

      const currentCycle = await usageBillingService.getCurrentBillingCycle(mockTenantId);

      expect(currentCycle).toBeDefined();
      expect(currentCycle!.tenant_id).toBe(mockTenantId);
      expect(currentCycle!.status).toBe('active');
      expect(currentCycle!.total_usage_charges).toBe(15.50);
      expect(currentCycle!.subscription_charges).toBe(99.00);
      expect(currentCycle!.total_charges).toBe(114.50);
    });

    it('should return null when no current billing cycle exists', async () => {
      mockSingle.mockResolvedValue({ 
        data: null, 
        error: { code: 'PGRST116', message: 'No rows found' } 
      });

      const currentCycle = await usageBillingService.getCurrentBillingCycle(mockTenantId);

      expect(currentCycle).toBeNull();
    });

    it('should process billing cycle and calculate final charges', async () => {
      const cycleId = '456e7890-e89b-12d3-a456-426614174001';
      
      // Mock billing cycle data
      const mockCycleData = {
        id: cycleId,
        tenant_id: mockTenantId,
        cycle_start: '2024-03-01T00:00:00Z',
        cycle_end: '2024-03-31T23:59:59Z',
        status: 'active'
      };

      // Mock tenant subscription
      const mockTenantData = {
        subscription: JSON.stringify({
          plan: 'starter',
          currency: 'BRL'
        })
      };

      // Mock usage events
      const mockUsageEvents = [
        { event_type: 'api_call', quantity: 1200 },
        { event_type: 'whatsapp_message_sent', quantity: 120 }
      ];

      // Mock updated cycle after processing
      const mockUpdatedCycle = {
        ...mockCycleData,
        status: 'processing',
        total_usage_charges: 1.20, // (200 * 0.001) + (20 * 0.05)
        subscription_charges: 99.00,
        total_charges: 100.20,
        processed_at: '2024-03-31T23:59:59Z',
        updated_at: '2024-03-31T23:59:59Z'
      };

      // Setup mocks in sequence
      mockSingle
        .mockResolvedValueOnce({ data: mockCycleData, error: null }) // Get cycle
        .mockResolvedValueOnce({ data: mockTenantData, error: null }) // Get tenant
        .mockResolvedValueOnce({ data: mockUpdatedCycle, error: null }); // Updated cycle

      mockSelect.mockResolvedValue({ data: mockUsageEvents, error: null });
      mockInsert.mockResolvedValue({ error: null }); // Usage summaries insert

      const processedCycle = await usageBillingService.processBillingCycle(cycleId);

      expect(processedCycle).toBeDefined();
      expect(processedCycle.status).toBe('processing');
      expect(processedCycle.total_usage_charges).toBe(1.20);
      expect(processedCycle.subscription_charges).toBe(99.00);
      expect(processedCycle.total_charges).toBe(100.20);

      // Verify update was called
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'processing',
          total_usage_charges: 1.20,
          subscription_charges: 99.00,
          total_charges: 100.20
        })
      );
    });
  });

  describe('Current Period Usage', () => {
    it('should get current period usage correctly', async () => {
      const mockUsageEvents = [
        { event_type: 'api_call', quantity: 150 },
        { event_type: 'api_call', quantity: 200 },
        { event_type: 'whatsapp_message_sent', quantity: 25 },
        { event_type: 'email_sent', quantity: 100 }
      ];

      mockSelect.mockResolvedValue({ data: mockUsageEvents, error: null });

      const currentUsage = await usageBillingService.getCurrentPeriodUsage(mockTenantId);

      expect(currentUsage).toEqual({
        api_call: 350,
        whatsapp_message_sent: 25,
        email_sent: 100
      });

      // Verify query was called with current month dates
      const now = new Date();
      const expectedStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const expectedEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

      expect(mockGte).toHaveBeenCalledWith('timestamp', expectedStart.toISOString());
      expect(mockLte).toHaveBeenCalledWith('timestamp', expectedEnd.toISOString());
    });

    it('should return empty usage when no events exist', async () => {
      mockSelect.mockResolvedValue({ data: [], error: null });

      const currentUsage = await usageBillingService.getCurrentPeriodUsage(mockTenantId);

      expect(currentUsage).toEqual({});
    });
  });

  describe('Billing History', () => {
    it('should get billing history with correct limit', async () => {
      const mockBillingCycles = [
        {
          id: '1',
          tenant_id: mockTenantId,
          cycle_start: '2024-02-01T00:00:00Z',
          cycle_end: '2024-02-29T23:59:59Z',
          status: 'completed',
          total_charges: 125.50,
          created_at: '2024-02-01T00:00:00Z',
          updated_at: '2024-03-01T00:00:00Z'
        },
        {
          id: '2',
          tenant_id: mockTenantId,
          cycle_start: '2024-01-01T00:00:00Z',
          cycle_end: '2024-01-31T23:59:59Z',
          status: 'completed',
          total_charges: 99.00,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-02-01T00:00:00Z'
        }
      ];

      mockLimit.mockResolvedValue({ data: mockBillingCycles, error: null });

      const billingHistory = await usageBillingService.getBillingHistory(mockTenantId, 6);

      expect(billingHistory).toHaveLength(2);
      expect(billingHistory[0].id).toBe('1');
      expect(billingHistory[1].id).toBe('2');

      // Verify query parameters
      expect(mockEq).toHaveBeenCalledWith('tenant_id', mockTenantId);
      expect(mockOrder).toHaveBeenCalledWith('cycle_start', { ascending: false });
      expect(mockLimit).toHaveBeenCalledWith(6);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      mockSingle.mockResolvedValue({ 
        data: null, 
        error: { message: 'Connection timeout' } 
      });

      await expect(usageBillingService.getCurrentBillingCycle(mockTenantId))
        .rejects.toThrow('Failed to get current billing cycle: Connection timeout');
    });

    it('should handle missing tenant data', async () => {
      mockSingle.mockResolvedValue({ data: null, error: null });

      await expect(usageBillingService.calculateUsageCharges(
        mockTenantId,
        new Date('2024-03-01'),
        new Date('2024-03-31')
      )).rejects.toThrow('Failed to get tenant subscription');
    });
  });
});

describe('Usage Billing Integration', () => {
  it('should handle complete billing workflow', async () => {
    const usageBillingService = getUsageBillingService();
    const mockTenantId = '123e4567-e89b-12d3-a456-426614174000';

    // Mock successful operations
    mockSingle.mockResolvedValue({ data: null, error: null });
    mockSupabase.rpc.mockResolvedValue({ error: null });

    // 1. Track usage events
    const events: Omit<UsageEvent, 'timestamp'>[] = [
      {
        tenant_id: mockTenantId,
        event_type: 'api_call',
        quantity: 100,
        metadata: { source: 'integration_test' }
      },
      {
        tenant_id: mockTenantId,
        event_type: 'whatsapp_message_sent',
        quantity: 10,
        metadata: { campaign: 'test_campaign' }
      }
    ];

    await expect(usageBillingService.trackUsageEventsBatch(events)).resolves.not.toThrow();

    // Verify tracking calls were made
    expect(mockSupabase.from).toHaveBeenCalledWith('usage_events');
    expect(mockInsert).toHaveBeenCalled();
    expect(mockSupabase.rpc).toHaveBeenCalledWith('upsert_usage_summary', expect.any(Object));
  });
});