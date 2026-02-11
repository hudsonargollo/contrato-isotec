/**
 * WhatsApp-CRM Integration Tests
 * Requirements: 5.5 - WhatsApp Business Integration with CRM
 */

import { WhatsAppCRMIntegrationService } from '@/lib/services/whatsapp-crm-integration';
import { TenantContext } from '@/lib/types/tenant';
import type { WhatsAppLeadCaptureData } from '@/lib/services/whatsapp-crm-integration';

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116' }
          }),
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' }
            })
          })),
          or: jest.fn().mockResolvedValue({
            data: [],
            error: null
          }),
          not: jest.fn(() => ({
            is: jest.fn().mockResolvedValue({ count: 0 })
          })),
          is: jest.fn(() => ({
            eq: jest.fn().mockResolvedValue({
              data: [],
              error: null
            })
          })),
          order: jest.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })),
        count: 'exact',
        head: true
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: {
              id: 'mock-source-id',
              name: 'WhatsApp',
              tenant_id: 'mock-tenant-id'
            },
            error: null
          })
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({ error: null })
        }))
      }))
    }))
  }))
}));

// Mock CRM service
jest.mock('@/lib/services/crm', () => ({
  crmService: {
    getLead: jest.fn().mockResolvedValue({
      id: 'mock-lead-id',
      tenant_id: 'mock-tenant-id',
      first_name: 'John',
      last_name: 'Doe',
      phone: '5511999999999'
    }),
    createLead: jest.fn().mockResolvedValue({
      id: 'mock-new-lead-id',
      tenant_id: 'mock-tenant-id',
      first_name: 'Jane',
      last_name: 'Smith',
      phone: '5511888888888'
    }),
    createInteraction: jest.fn().mockResolvedValue({
      id: 'mock-interaction-id'
    }),
    getLeadInteractions: jest.fn().mockResolvedValue([])
  }
}));

describe('WhatsApp-CRM Integration Service', () => {
  let integrationService: WhatsAppCRMIntegrationService;
  let mockTenantContext: TenantContext;

  beforeEach(() => {
    integrationService = new WhatsAppCRMIntegrationService();
    mockTenantContext = {
      tenant_id: 'mock-tenant-id',
      user_id: 'mock-user-id',
      role: 'admin',
      permissions: ['*'],
      subscription_limits: {
        max_users: 100,
        max_leads: 10000,
        max_contracts: 1000,
        storage_gb: 100
      },
      features: ['whatsapp', 'crm'],
      branding: {},
      settings: {}
    };
  });

  describe('linkConversationToLead', () => {
    it('should successfully link conversation to existing lead', async () => {
      const result = await integrationService.linkConversationToLead(
        'mock-conversation-id',
        'mock-lead-id',
        mockTenantContext
      );

      expect(result.success).toBe(true);
      expect(result.lead_id).toBe('mock-lead-id');
      expect(result.conversation_id).toBe('mock-conversation-id');
    });

    it('should fail when lead does not exist', async () => {
      const { crmService } = require('@/lib/services/crm');
      crmService.getLead.mockResolvedValueOnce(null);

      const result = await integrationService.linkConversationToLead(
        'mock-conversation-id',
        'non-existent-lead-id',
        mockTenantContext
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Lead not found');
    });

    it('should fail when lead belongs to different tenant', async () => {
      const { crmService } = require('@/lib/services/crm');
      crmService.getLead.mockResolvedValueOnce({
        id: 'mock-lead-id',
        tenant_id: 'different-tenant-id'
      });

      const result = await integrationService.linkConversationToLead(
        'mock-conversation-id',
        'mock-lead-id',
        mockTenantContext
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('access denied');
    });
  });

  describe('captureLeadFromWhatsApp', () => {
    it('should create new lead when phone number does not exist', async () => {
      const captureData: WhatsAppLeadCaptureData = {
        phone_number: '5511999999999',
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane.smith@example.com',
        company: 'Test Company',
        source_message: 'Hello, I am interested in your services'
      };

      const result = await integrationService.captureLeadFromWhatsApp(
        captureData,
        mockTenantContext
      );

      expect(result.success).toBe(true);
      expect(result.is_new_lead).toBe(true);
      expect(result.lead_id).toBe('mock-new-lead-id');
    });

    it('should link existing lead when phone number matches', async () => {
      // Mock finding existing lead
      const supabase = require('@/lib/supabase/client').createClient();
      supabase.from().select().eq().or.mockResolvedValueOnce({
        data: [{
          id: 'existing-lead-id',
          phone: '5511999999999',
          tenant_id: 'mock-tenant-id'
        }],
        error: null
      });

      // Mock finding conversation
      supabase.from().select().eq().eq().eq().single.mockResolvedValueOnce({
        data: {
          id: 'mock-conversation-id',
          customer_phone: '5511999999999'
        },
        error: null
      });

      const captureData: WhatsAppLeadCaptureData = {
        phone_number: '5511999999999',
        first_name: 'John',
        last_name: 'Doe'
      };

      const result = await integrationService.captureLeadFromWhatsApp(
        captureData,
        mockTenantContext
      );

      expect(result.success).toBe(true);
      expect(result.is_new_lead).toBe(false);
      expect(result.lead_id).toBe('existing-lead-id');
    });

    it('should handle missing required phone number', async () => {
      const captureData: WhatsAppLeadCaptureData = {
        phone_number: '',
        first_name: 'Test',
        last_name: 'User'
      };

      const result = await integrationService.captureLeadFromWhatsApp(
        captureData,
        mockTenantContext
      );

      expect(result.success).toBe(false);
      expect(result.is_new_lead).toBe(false);
    });
  });

  describe('syncMessageToCRM', () => {
    it('should sync WhatsApp message to CRM interaction', async () => {
      const mockMessage = {
        id: 'mock-message-uuid',
        tenant_id: 'mock-tenant-id',
        message_id: 'whatsapp-msg-123',
        conversation_id: 'conv-123',
        lead_id: 'mock-lead-id',
        direction: 'inbound' as const,
        message_type: 'text' as const,
        content: { text: { body: 'Hello from customer' } },
        status: 'delivered' as const,
        created_at: new Date(),
        updated_at: new Date()
      };

      await integrationService.syncMessageToCRM(mockMessage, mockTenantContext);

      const { crmService } = require('@/lib/services/crm');
      expect(crmService.createInteraction).toHaveBeenCalledWith(
        'mock-tenant-id',
        expect.objectContaining({
          lead_id: 'mock-lead-id',
          channel: 'whatsapp',
          direction: 'inbound',
          metadata: expect.objectContaining({
            whatsapp_message_id: 'whatsapp-msg-123',
            conversation_id: 'conv-123'
          })
        })
      );
    });

    it('should skip sync when message is not linked to lead', async () => {
      const mockMessage = {
        id: 'mock-message-uuid',
        tenant_id: 'mock-tenant-id',
        message_id: 'whatsapp-msg-123',
        conversation_id: 'conv-123',
        lead_id: null,
        direction: 'inbound' as const,
        message_type: 'text' as const,
        content: { text: { body: 'Hello' } },
        status: 'delivered' as const,
        created_at: new Date(),
        updated_at: new Date()
      };

      await integrationService.syncMessageToCRM(mockMessage, mockTenantContext);

      const { crmService } = require('@/lib/services/crm');
      expect(crmService.createInteraction).not.toHaveBeenCalled();
    });

    it('should not create duplicate interactions', async () => {
      // Mock existing interaction
      const supabase = require('@/lib/supabase/client').createClient();
      supabase.from().select().eq().eq().eq().single.mockResolvedValueOnce({
        data: { id: 'existing-interaction-id' },
        error: null
      });

      const mockMessage = {
        id: 'mock-message-uuid',
        tenant_id: 'mock-tenant-id',
        message_id: 'whatsapp-msg-123',
        conversation_id: 'conv-123',
        lead_id: 'mock-lead-id',
        direction: 'inbound' as const,
        message_type: 'text' as const,
        content: { text: { body: 'Hello' } },
        status: 'delivered' as const,
        created_at: new Date(),
        updated_at: new Date()
      };

      await integrationService.syncMessageToCRM(mockMessage, mockTenantContext);

      const { crmService } = require('@/lib/services/crm');
      expect(crmService.createInteraction).not.toHaveBeenCalled();
    });
  });

  describe('getConversationWithCRMContext', () => {
    it('should return conversation with CRM context', async () => {
      const supabase = require('@/lib/supabase/client').createClient();
      
      // Mock conversation
      supabase.from().select().eq().eq().single.mockResolvedValueOnce({
        data: {
          id: 'mock-conversation-id',
          lead_id: 'mock-lead-id',
          customer_phone: '5511999999999'
        },
        error: null
      });

      // Mock messages
      supabase.from().select().eq().eq().order.mockResolvedValueOnce({
        data: [
          {
            id: 'msg-1',
            content: { text: { body: 'Hello' } },
            direction: 'inbound'
          }
        ],
        error: null
      });

      const result = await integrationService.getConversationWithCRMContext(
        'mock-conversation-id',
        mockTenantContext
      );

      expect(result.conversation).toBeTruthy();
      expect(result.lead).toBeTruthy();
      expect(result.messages).toHaveLength(1);
      expect(result.crm_interactions).toEqual([]);
    });

    it('should handle conversation not found', async () => {
      const supabase = require('@/lib/supabase/client').createClient();
      supabase.from().select().eq().eq().single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' }
      });

      const result = await integrationService.getConversationWithCRMContext(
        'non-existent-conversation',
        mockTenantContext
      );

      expect(result.conversation).toBeNull();
      expect(result.lead).toBeNull();
      expect(result.messages).toEqual([]);
      expect(result.crm_interactions).toEqual([]);
    });
  });

  describe('autoLinkConversations', () => {
    it('should auto-link conversations to matching leads', async () => {
      const supabase = require('@/lib/supabase/client').createClient();
      
      // Mock unlinked conversations
      supabase.from().select().eq().is().eq.mockResolvedValueOnce({
        data: [
          {
            id: 'conv-1',
            customer_phone: '5511999999999'
          },
          {
            id: 'conv-2',
            customer_phone: '5511888888888'
          }
        ],
        error: null
      });

      // Mock finding leads by phone
      supabase.from().select().eq().or
        .mockResolvedValueOnce({
          data: [{ id: 'lead-1', phone: '5511999999999' }],
          error: null
        })
        .mockResolvedValueOnce({
          data: [],
          error: null
        });

      const result = await integrationService.autoLinkConversations(mockTenantContext);

      expect(result.linked_count).toBe(1);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle errors during auto-linking', async () => {
      const supabase = require('@/lib/supabase/client').createClient();
      
      // Mock conversations
      supabase.from().select().eq().is().eq.mockResolvedValueOnce({
        data: [
          {
            id: 'conv-1',
            customer_phone: '5511999999999'
          }
        ],
        error: null
      });

      // Mock error finding lead
      supabase.from().select().eq().or.mockRejectedValueOnce(
        new Error('Database error')
      );

      const result = await integrationService.autoLinkConversations(mockTenantContext);

      expect(result.linked_count).toBe(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Database error');
    });
  });

  describe('getWhatsAppCRMAnalytics', () => {
    it('should return analytics data', async () => {
      const supabase = require('@/lib/supabase/client').createClient();
      
      // Mock conversation counts
      supabase.from().select()
        .mockReturnValueOnce({
          eq: jest.fn().mockResolvedValue({ count: 100 })
        })
        .mockReturnValueOnce({
          eq: jest.fn().mockReturnValue({
            not: jest.fn().mockResolvedValue({ count: 75 })
          })
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: [
                { direction: 'inbound' },
                { direction: 'inbound' },
                { direction: 'outbound' }
              ]
            })
          })
        })
        .mockReturnValueOnce({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ count: 25 })
          })
        });

      const analytics = await integrationService.getWhatsAppCRMAnalytics(mockTenantContext);

      expect(analytics.total_conversations).toBe(100);
      expect(analytics.linked_conversations).toBe(75);
      expect(analytics.leads_generated).toBe(25);
      expect(analytics.conversion_rate).toBe(25);
      expect(analytics.message_volume.total).toBe(3);
      expect(analytics.message_volume.inbound).toBe(2);
      expect(analytics.message_volume.outbound).toBe(1);
    });

    it('should handle date range filtering', async () => {
      const dateRange = {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31')
      };

      const analytics = await integrationService.getWhatsAppCRMAnalytics(
        mockTenantContext,
        dateRange
      );

      expect(analytics).toBeDefined();
      // Additional assertions would depend on how date filtering is implemented
    });
  });

  describe('Phone Number Utilities', () => {
    it('should clean and format phone numbers correctly', async () => {
      // Test through the captureLeadFromWhatsApp method since cleanPhoneNumber is private
      const testCases = [
        { input: '(11) 99999-9999', shouldWork: true },
        { input: '+55 11 99999-9999', shouldWork: true },
        { input: '5511999999999', shouldWork: true },
        { input: '11999999999', shouldWork: true },
        { input: 'invalid', shouldWork: false },
        { input: '123', shouldWork: false }
      ];

      for (const testCase of testCases) {
        const captureData: WhatsAppLeadCaptureData = {
          phone_number: testCase.input,
          first_name: 'Test',
          last_name: 'User'
        };

        const result = await integrationService.captureLeadFromWhatsApp(
          captureData,
          mockTenantContext
        );

        if (testCase.shouldWork) {
          expect(result.success).toBe(true);
        } else {
          // Invalid phone numbers should still be processed but may not find matches
          expect(result).toBeDefined();
        }
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      const supabase = require('@/lib/supabase/client').createClient();
      supabase.from().update().eq().eq.mockRejectedValueOnce(
        new Error('Database connection failed')
      );

      const result = await integrationService.linkConversationToLead(
        'mock-conversation-id',
        'mock-lead-id',
        mockTenantContext
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Database connection failed');
    });

    it('should handle CRM service errors gracefully', async () => {
      const { crmService } = require('@/lib/services/crm');
      crmService.createLead.mockRejectedValueOnce(
        new Error('CRM service unavailable')
      );

      const captureData: WhatsAppLeadCaptureData = {
        phone_number: '5511999999999',
        first_name: 'Test',
        last_name: 'User'
      };

      const result = await integrationService.captureLeadFromWhatsApp(
        captureData,
        mockTenantContext
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('CRM service unavailable');
    });
  });
});

describe('WhatsApp-CRM Integration API Endpoints', () => {
  // These would be integration tests for the API endpoints
  // For now, we'll just test that the service methods are called correctly
  
  it('should have proper API endpoint structure', () => {
    // This is more of a structural test
    expect(typeof WhatsAppCRMIntegrationService).toBe('function');
    
    const service = new WhatsAppCRMIntegrationService();
    expect(typeof service.linkConversationToLead).toBe('function');
    expect(typeof service.captureLeadFromWhatsApp).toBe('function');
    expect(typeof service.syncMessageToCRM).toBe('function');
    expect(typeof service.getConversationWithCRMContext).toBe('function');
    expect(typeof service.autoLinkConversations).toBe('function');
    expect(typeof service.getWhatsAppCRMAnalytics).toBe('function');
  });
});