/**
 * WhatsApp Messages API
 * Requirements: 5.1, 5.2 - Send messages and track delivery
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createWhatsAppService } from '@/lib/services/whatsapp';
import { getTenantContext } from '@/lib/utils/tenant-context';
import { requireAuth } from '@/lib/middleware/auth';
import { trackCustomEvent, recordCustomMetric } from '@/lib/middleware/analytics';
import { SendMessageRequest } from '@/lib/types/whatsapp';

// Request validation schemas
const SendTextMessageSchema = z.object({
  to: z.string().min(1, 'Phone number is required'),
  text: z.string().min(1, 'Message text is required'),
  customer_id: z.string().uuid().optional(),
  lead_id: z.string().uuid().optional()
});

const SendTemplateMessageSchema = z.object({
  to: z.string().min(1, 'Phone number is required'),
  template_name: z.string().min(1, 'Template name is required'),
  language_code: z.string().default('en_US'),
  components: z.array(z.any()).optional(),
  customer_id: z.string().uuid().optional(),
  lead_id: z.string().uuid().optional()
});

const SendMediaMessageSchema = z.object({
  to: z.string().min(1, 'Phone number is required'),
  type: z.enum(['image', 'document', 'audio', 'video']),
  media: z.object({
    id: z.string().optional(),
    link: z.string().optional(),
    caption: z.string().optional(),
    filename: z.string().optional()
  }),
  customer_id: z.string().uuid().optional(),
  lead_id: z.string().uuid().optional()
});

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await requireAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }

    // Get tenant context
    const tenantContext = await getTenantContext(request);
    if (!tenantContext) {
      return NextResponse.json(
        { error: 'Tenant context not found' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const messageType = body.type || 'text';

    // Create WhatsApp service
    const whatsappService = createWhatsAppService(tenantContext.tenant_id);

    let result;

    switch (messageType) {
      case 'text': {
        const validatedData = SendTextMessageSchema.parse(body);
        result = await whatsappService.sendTextMessage(
          validatedData.to,
          validatedData.text,
          tenantContext
        );
        break;
      }

      case 'template': {
        const validatedData = SendTemplateMessageSchema.parse(body);
        result = await whatsappService.sendTemplateMessage(
          validatedData.to,
          validatedData.template_name,
          validatedData.language_code,
          validatedData.components || [],
          tenantContext
        );
        break;
      }

      case 'image':
      case 'document':
      case 'audio':
      case 'video': {
        const validatedData = SendMediaMessageSchema.parse(body);
        
        const messageRequest: SendMessageRequest = {
          to: validatedData.to,
          type: validatedData.type,
          [validatedData.type]: validatedData.media
        };

        result = await whatsappService.sendMessage(messageRequest, tenantContext);
        break;
      }

      default:
        return NextResponse.json(
          { error: `Unsupported message type: ${messageType}` },
          { status: 400 }
        );
    }

    if (result.success) {
      // Track analytics event
      await trackCustomEvent(
        request,
        'whatsapp_message_sent',
        'whatsapp',
        'send',
        {
          message_type: messageType,
          to_phone: body.to,
          has_customer_id: !!body.customer_id,
          has_lead_id: !!body.lead_id
        },
        'message',
        result.messageId
      );

      // Record metric
      await recordCustomMetric(
        request,
        'whatsapp_messages_sent',
        1,
        'counter',
        'whatsapp',
        {
          message_type: messageType,
          success: true
        }
      );

      return NextResponse.json({
        success: true,
        message_id: result.messageId,
        status: 'sent'
      });
    } else {
      // Track failed message
      await trackCustomEvent(
        request,
        'whatsapp_message_failed',
        'whatsapp',
        'send',
        {
          message_type: messageType,
          error: result.error,
          error_code: result.errorCode
        },
        'message'
      );

      // Record error metric
      await recordCustomMetric(
        request,
        'whatsapp_messages_sent',
        1,
        'counter',
        'whatsapp',
        {
          message_type: messageType,
          success: false
        }
      );

      return NextResponse.json({
        success: false,
        error: result.error,
        error_code: result.errorCode
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Send message error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation error',
          details: error.errors
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await requireAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }

    // Get tenant context
    const tenantContext = await getTenantContext(request);
    if (!tenantContext) {
      return NextResponse.json(
        { error: 'Tenant context not found' },
        { status: 400 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const conversationId = searchParams.get('conversation_id');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const whatsappService = createWhatsAppService(tenantContext.tenant_id);

    if (conversationId) {
      // Get conversation history
      const messages = await whatsappService.getConversationHistory(
        conversationId,
        limit,
        offset
      );

      // Track analytics event
      await trackCustomEvent(
        request,
        'whatsapp_conversation_viewed',
        'whatsapp',
        'view',
        {
          conversation_id: conversationId,
          message_count: messages.length,
          limit,
          offset
        },
        'conversation',
        conversationId
      );

      return NextResponse.json({
        messages,
        pagination: {
          limit,
          offset,
          total: messages.length
        }
      });
    } else {
      // Get active conversations
      const conversations = await whatsappService.getActiveConversations(
        tenantContext,
        limit
      );

      // Track analytics event
      await trackCustomEvent(
        request,
        'whatsapp_conversations_listed',
        'whatsapp',
        'view',
        {
          conversation_count: conversations.length,
          limit
        },
        'conversation'
      );

      return NextResponse.json({
        conversations,
        pagination: {
          limit,
          total: conversations.length
        }
      });
    }

  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}