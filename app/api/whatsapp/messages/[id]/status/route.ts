/**
 * WhatsApp Message Status API
 * Requirements: 5.1, 5.2 - Track message delivery status
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';
import { createWhatsAppService } from '@/lib/services/whatsapp';
import { getTenantContext } from '@/lib/utils/tenant-context';
import { requireAuth } from '@/lib/middleware/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const supabase = createClient();

    // Get message details
    const { data: message, error } = await supabase
      .from('whatsapp_messages')
      .select(`
        *,
        whatsapp_conversations(
          customer_phone,
          customers(name, email),
          leads(name, email)
        )
      `)
      .eq('id', params.id)
      .eq('tenant_id', tenantContext.tenant_id)
      .single();

    if (error || !message) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }

    // If message has a WhatsApp message ID, try to get updated status
    if (message.message_id) {
      const whatsappService = createWhatsAppService(tenantContext.tenant_id);
      const currentStatus = await whatsappService.getMessageStatus(message.message_id);
      
      // Update status in database if it has changed
      if (currentStatus !== message.status) {
        await supabase
          .from('whatsapp_messages')
          .update({ 
            status: currentStatus,
            updated_at: new Date()
          })
          .eq('id', params.id);
        
        message.status = currentStatus;
      }
    }

    // Calculate delivery metrics
    const deliveryMetrics = {
      sent_at: message.sent_at,
      delivered_at: message.delivered_at,
      read_at: message.read_at,
      delivery_time: message.sent_at && message.delivered_at 
        ? new Date(message.delivered_at).getTime() - new Date(message.sent_at).getTime()
        : null,
      read_time: message.delivered_at && message.read_at
        ? new Date(message.read_at).getTime() - new Date(message.delivered_at).getTime()
        : null
    };

    return NextResponse.json({
      message: {
        id: message.id,
        message_id: message.message_id,
        status: message.status,
        message_type: message.message_type,
        direction: message.direction,
        from_phone_number: message.from_phone_number,
        to_phone_number: message.to_phone_number,
        content: message.content,
        error_code: message.error_code,
        error_message: message.error_message,
        created_at: message.created_at,
        updated_at: message.updated_at
      },
      delivery_metrics: deliveryMetrics,
      conversation: message.whatsapp_conversations
    });

  } catch (error) {
    console.error('Get message status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const body = await request.json();
    const { action } = body;

    const supabase = createClient();

    // Get message details
    const { data: message, error } = await supabase
      .from('whatsapp_messages')
      .select('*')
      .eq('id', params.id)
      .eq('tenant_id', tenantContext.tenant_id)
      .single();

    if (error || !message) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }

    switch (action) {
      case 'retry': {
        // Only allow retry for failed messages
        if (message.status !== 'failed') {
          return NextResponse.json(
            { error: 'Only failed messages can be retried' },
            { status: 400 }
          );
        }

        // Create WhatsApp service and retry sending
        const whatsappService = createWhatsAppService(tenantContext.tenant_id);
        
        const retryRequest = {
          to: message.to_phone_number,
          type: message.message_type,
          ...message.content
        };

        const result = await whatsappService.sendMessage(retryRequest, tenantContext);

        if (result.success) {
          // Update message with new message ID and status
          await supabase
            .from('whatsapp_messages')
            .update({
              message_id: result.messageId,
              status: 'sent',
              sent_at: new Date(),
              error_code: null,
              error_message: null,
              updated_at: new Date()
            })
            .eq('id', params.id);

          return NextResponse.json({
            success: true,
            message: 'Message retried successfully',
            new_message_id: result.messageId
          });
        } else {
          return NextResponse.json({
            success: false,
            error: result.error,
            error_code: result.errorCode
          }, { status: 400 });
        }
      }

      case 'mark_read': {
        // Mark message as read (for inbound messages)
        if (message.direction !== 'inbound') {
          return NextResponse.json(
            { error: 'Only inbound messages can be marked as read' },
            { status: 400 }
          );
        }

        await supabase
          .from('whatsapp_messages')
          .update({
            status: 'read',
            read_at: new Date(),
            updated_at: new Date()
          })
          .eq('id', params.id);

        return NextResponse.json({
          success: true,
          message: 'Message marked as read'
        });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Message action error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}