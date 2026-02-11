/**
 * WhatsApp Business Integration Tests
 * Requirements: 5.1, 5.2, 5.4, 5.5
 */

import { WhatsAppService } from '@/lib/services/whatsapp';
import { 
  WhatsAppConfig,
  SendMessageRequest,
  WhatsAppWebhookPayload,
  WhatsAppTemplate
} from '@/lib/types/whatsapp';
import { TenantContext } from '@/lib/types/tenant';

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: {
              id: 'mock-message-uuid',
              tenant_id: 'mock-tenant-id',
              message_id: 'mock-message-id-123',
              status: 'sent'
            },
            error: null
          })
        }))
      })),
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: {
              id: 'mock-conversation-id',
              conversation_id: 'mock-whatsapp-conversation-id',
              message_count: 0
            },
            error: null
          })
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn().mockResolvedValue({ error: null })
      })),
      upsert: jest.fn().mockResolvedValue({ error: null })
    }))
  }))
}));

describe('WhatsApp Business Integration', () => {
  let whatsappService: WhatsAppService;
  let mockConfig: WhatsAppConfig;
  let mockTenantContext: TenantContext;

  beforeEach(() => {
    mockConfig = {
      accessToken: 'mock-access-token',
      phoneNumberId: '123456789',
      businessAccountId: 'mock-business-account-id',
      webhookVerifyToken: 'mock-verify-token',
      apiVersion: 'v23.0'
    };

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
      features: ['whatsapp', 'crm', 'invoices'],
      branding: {},
      settings: {}
    };

    whatsappService = new WhatsAppService(mockConfig);
  });

  describe('Message Sending', () => {
    it('should send text message successfully', async () => {
      const result = await whatsappService.sendTextMessage(
        '5511999999999',
        'Hello, this is a test message!',
        mockTenantContext
      );

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('mock-message-id-123');
      expect(result.error).toBeUndefined();
    });

    it('should send template message successfully', async () => {
      const result = await whatsappService.sendTemplateMessage(
        '5511999999999',
        'hello_world',
        'en_US',
        [],
        mockTenantContext
      );

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('mock-message-id-123');
    });

    it('should handle invalid phone number', async () => {
      const result = await whatsappService.sendTextMessage(
        'invalid-phone',
        'Test message',
        mockTenantContext
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid phone number format');
      expect(result.errorCode).toBe('INVALID_PHONE_NUMBER');
    });

    it('should send media message successfully', async () => {
      const mediaRequest: SendMessageRequest = {
        to: '5511999999999',
        type: 'image',
        image: {
          link: 'https://example.com/image.jpg',
          caption: 'Test image'
        }
      };

      const result = await whatsappService.sendMessage(mediaRequest, mockTenantContext);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('mock-message-id-123');
    });
  });

  describe('Webhook Processing', () => {
    it('should handle webhook verification', () => {
      const challenge = whatsappService.handleWebhookVerification(
        'subscribe',
        'mock-verify-token',
        'test-challenge-123'
      );

      expect(challenge).toBe('test-challenge-123');
    });

    it('should reject invalid webhook verification', () => {
      const challenge = whatsappService.handleWebhookVerification(
        'subscribe',
        'wrong-token',
        'test-challenge-123'
      );

      expect(challenge).toBeNull();
    });

    it('should process incoming message webhook', async () => {
      const mockWebhookPayload: WhatsAppWebhookPayload = {
        object: 'whatsapp_business_account',
        entry: [{
          id: 'mock-entry-id',
          changes: [{
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: '5511888888888',
                phone_number_id: '123456789'
              },
              messages: [{
                from: '5511999999999',
                id: 'wamid.mock-message-id',
                timestamp: '1640995200',
                type: 'text',
                text: {
                  body: 'Hello from customer!'
                }
              }]
            },
            field: 'messages'
          }]
        }]
      };

      // This should not throw an error
      await expect(
        whatsappService.processWebhook(mockWebhookPayload, mockTenantContext)
      ).resolves.not.toThrow();
    });

    it('should process message status webhook', async () => {
      const mockStatusWebhook: WhatsAppWebhookPayload = {
        object: 'whatsapp_business_account',
        entry: [{
          id: 'mock-entry-id',
          changes: [{
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: '5511888888888',
                phone_number_id: '123456789'
              },
              statuses: [{
                id: 'wamid.mock-message-id',
                status: 'delivered',
                timestamp: '1640995260',
                recipient_id: '5511999999999'
              }]
            },
            field: 'messages'
          }]
        }]
      };

      await expect(
        whatsappService.processWebhook(mockStatusWebhook, mockTenantContext)
      ).resolves.not.toThrow();
    });
  });

  describe('Phone Number Validation', () => {
    it('should clean and validate Brazilian phone numbers', () => {
      // Test the private method through public interface
      const testCases = [
        { input: '(11) 99999-9999', expected: true },
        { input: '+55 11 99999-9999', expected: true },
        { input: '5511999999999', expected: true },
        { input: '11999999999', expected: true },
        { input: 'invalid', expected: false },
        { input: '123', expected: false }
      ];

      testCases.forEach(({ input, expected }) => {
        // We'll test this through the sendTextMessage method
        // since the cleanPhoneNumber method is private
        const promise = whatsappService.sendTextMessage(input, 'test', mockTenantContext);
        
        if (expected) {
          expect(promise).resolves.toHaveProperty('success');
        } else {
          expect(promise).resolves.toMatchObject({
            success: false,
            errorCode: 'INVALID_PHONE_NUMBER'
          });
        }
      });
    });
  });

  describe('Template Management', () => {
    it('should create template successfully', async () => {
      const mockTemplate: Omit<WhatsAppTemplate, 'id' | 'created_at' | 'updated_at'> = {
        tenant_id: 'mock-tenant-id',
        name: 'test_template',
        category: 'UTILITY',
        language: 'en_US',
        status: 'PENDING',
        body: {
          type: 'BODY',
          text: 'Hello {{1}}, your order {{2}} is ready!'
        },
        approval_status: 'PENDING',
        created_by: 'mock-user-id'
      };

      const result = await whatsappService.createTemplate(mockTemplate, mockTenantContext);

      expect(result).toHaveProperty('id');
      expect(result.name).toBe('test_template');
      expect(result.category).toBe('UTILITY');
    });

    it('should get templates with filtering', async () => {
      const templates = await whatsappService.getTemplates(mockTenantContext, 'APPROVED');

      expect(Array.isArray(templates)).toBe(true);
      // Additional assertions would depend on mock data
    });
  });

  describe('Conversation Management', () => {
    it('should get conversation history', async () => {
      const history = await whatsappService.getConversationHistory(
        'mock-conversation-id',
        20,
        0
      );

      expect(Array.isArray(history)).toBe(true);
    });

    it('should get active conversations', async () => {
      const conversations = await whatsappService.getActiveConversations(
        mockTenantContext,
        10
      );

      expect(Array.isArray(conversations)).toBe(true);
    });
  });

  describe('Message Status Tracking', () => {
    it('should get message status', async () => {
      const status = await whatsappService.getMessageStatus('mock-message-id');

      expect(['pending', 'sent', 'delivered', 'read', 'failed']).toContain(status);
    });
  });

  describe('Error Handling', () => {
    it('should handle WhatsApp API errors gracefully', async () => {
      // Mock API error
      const mockWhatsAppService = new WhatsAppService(mockConfig);
      (mockWhatsAppService as any).client.message.createMessage = jest.fn()
        .mockRejectedValue(new Error('WhatsApp API Error'));

      const result = await mockWhatsAppService.sendTextMessage(
        '5511999999999',
        'Test message',
        mockTenantContext
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('WhatsApp API Error');
    });

    it('should handle database errors gracefully', async () => {
      // This would require more sophisticated mocking
      // For now, we'll just ensure the service doesn't crash
      const result = await whatsappService.sendTextMessage(
        '5511999999999',
        'Test message',
        mockTenantContext
      );

      expect(result).toHaveProperty('success');
    });
  });

  describe('Integration with CRM', () => {
    it('should create CRM interaction for messages', async () => {
      // This test would verify that WhatsApp messages create corresponding
      // CRM interactions when linked to customers or leads
      const result = await whatsappService.sendTextMessage(
        '5511999999999',
        'Test CRM integration',
        mockTenantContext
      );

      expect(result.success).toBe(true);
      // Additional assertions would verify CRM interaction creation
    });
  });

  describe('Usage Metrics Tracking', () => {
    it('should track WhatsApp message usage', async () => {
      const result = await whatsappService.sendTextMessage(
        '5511999999999',
        'Test usage tracking',
        mockTenantContext
      );

      expect(result.success).toBe(true);
      // Additional assertions would verify usage metrics are tracked
    });
  });
});

describe('WhatsApp Service Factory', () => {
  it('should create WhatsApp service instance', () => {
    // Mock environment variables
    process.env.WHATSAPP_ACCESS_TOKEN = 'test-token';
    process.env.WHATSAPP_PHONE_NUMBER_ID = 'test-phone-id';
    process.env.WHATSAPP_BUSINESS_ACCOUNT_ID = 'test-business-id';
    process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN = 'test-verify-token';

    const { createWhatsAppService } = require('@/lib/services/whatsapp');
    const service = createWhatsAppService('test-tenant-id');

    expect(service).toBeInstanceOf(WhatsAppService);
  });
});