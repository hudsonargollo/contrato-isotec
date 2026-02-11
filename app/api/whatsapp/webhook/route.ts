/**
 * WhatsApp Business API Webhook Handler
 * Requirements: 5.1, 5.2 - Handle incoming messages and delivery status updates
 */

import { NextRequest, NextResponse } from 'next/server';
import { createWhatsAppService } from '@/lib/services/whatsapp';
import { getTenantContext } from '@/lib/utils/tenant-context';
import { WhatsAppWebhookPayload } from '@/lib/types/whatsapp';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    if (!mode || !token || !challenge) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Get tenant context from subdomain or header
    const tenantContext = await getTenantContext(request);
    if (!tenantContext) {
      return NextResponse.json(
        { error: 'Tenant context not found' },
        { status: 400 }
      );
    }

    // Create WhatsApp service instance
    const whatsappService = createWhatsAppService(tenantContext.tenant_id);

    // Handle webhook verification
    const verificationResponse = whatsappService.handleWebhookVerification(
      mode,
      token,
      challenge
    );

    if (verificationResponse) {
      return new NextResponse(verificationResponse, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    return NextResponse.json(
      { error: 'Webhook verification failed' },
      { status: 403 }
    );

  } catch (error) {
    console.error('Webhook verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get tenant context
    const tenantContext = await getTenantContext(request);
    if (!tenantContext) {
      return NextResponse.json(
        { error: 'Tenant context not found' },
        { status: 400 }
      );
    }

    // Parse webhook payload
    const payload: WhatsAppWebhookPayload = await request.json();

    // Verify webhook signature (in production)
    const signature = request.headers.get('x-hub-signature-256');
    if (signature) {
      const whatsappService = createWhatsAppService(tenantContext.tenant_id);
      const body = JSON.stringify(payload);
      
      if (!whatsappService.verifyWebhookSignature(body, signature)) {
        return NextResponse.json(
          { error: 'Invalid webhook signature' },
          { status: 403 }
        );
      }
    }

    // Validate payload structure
    if (!payload.object || payload.object !== 'whatsapp_business_account') {
      return NextResponse.json(
        { error: 'Invalid webhook object type' },
        { status: 400 }
      );
    }

    if (!payload.entry || !Array.isArray(payload.entry)) {
      return NextResponse.json(
        { error: 'Invalid webhook entry format' },
        { status: 400 }
      );
    }

    // Process webhook asynchronously
    const whatsappService = createWhatsAppService(tenantContext.tenant_id);
    
    // Process webhook in background (don't await to respond quickly)
    whatsappService.processWebhook(payload, tenantContext).catch(error => {
      console.error('Webhook processing failed:', error);
    });

    // Respond immediately to WhatsApp
    return NextResponse.json({ status: 'received' }, { status: 200 });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}