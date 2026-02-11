/**
 * Webhook Endpoints API
 * 
 * Manages webhook endpoint configuration for tenants,
 * allowing them to register URLs for receiving event notifications.
 * 
 * Requirements: 10.2 - Webhook system and third-party integrations
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getWebhookService, WebhookEventType } from '@/lib/services/webhook';
import { z } from 'zod';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Request schemas
const CreateEndpointSchema = z.object({
  url: z.string().url(),
  events: z.array(z.string()).min(1),
  name: z.string().optional(),
  description: z.string().optional(),
  secret: z.string().optional()
});

const UpdateEndpointSchema = z.object({
  url: z.string().url().optional(),
  events: z.array(z.string()).min(1).optional(),
  name: z.string().optional(),
  description: z.string().optional(),
  active: z.boolean().optional()
});

/**
 * GET /api/webhooks/endpoints
 * Get webhook endpoints for the current tenant
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenant_id');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID is required' },
        { status: 400 }
      );
    }

    const webhookService = getWebhookService();
    const endpoints = await webhookService.getEndpoints(tenantId);

    return NextResponse.json({
      endpoints: endpoints.map(endpoint => ({
        ...endpoint,
        secret: '***' // Hide secret in response
      }))
    });
  } catch (error) {
    console.error('Failed to get webhook endpoints:', error);
    return NextResponse.json(
      { error: 'Failed to get webhook endpoints' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/webhooks/endpoints
 * Create a new webhook endpoint
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenant_id');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID is required' },
        { status: 400 }
      );
    }

    // Validate request body
    const validatedData = CreateEndpointSchema.parse(body);

    // Validate event types
    const validEvents = [
      'lead.created', 'lead.updated', 'lead.status_changed',
      'contract.generated', 'contract.signed', 'contract.expired',
      'invoice.created', 'invoice.paid', 'invoice.overdue',
      'payment.succeeded', 'payment.failed',
      'screening.completed',
      'whatsapp.message_sent', 'whatsapp.message_received',
      'user.created', 'user.updated',
      'tenant.updated'
    ];

    const invalidEvents = validatedData.events.filter(event => !validEvents.includes(event));
    if (invalidEvents.length > 0) {
      return NextResponse.json(
        { error: `Invalid event types: ${invalidEvents.join(', ')}` },
        { status: 400 }
      );
    }

    const webhookService = getWebhookService();
    const endpoint = await webhookService.registerEndpoint(
      tenantId,
      validatedData.url,
      validatedData.events as WebhookEventType[],
      validatedData.secret
    );

    return NextResponse.json({
      endpoint: {
        ...endpoint,
        secret: '***' // Hide secret in response
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to create webhook endpoint:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create webhook endpoint' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/webhooks/endpoints/[id]
 * Update webhook endpoint
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const endpointId = searchParams.get('id');

    if (!endpointId) {
      return NextResponse.json(
        { error: 'Endpoint ID is required' },
        { status: 400 }
      );
    }

    // Validate request body
    const validatedData = UpdateEndpointSchema.parse(body);

    // Validate event types if provided
    if (validatedData.events) {
      const validEvents = [
        'lead.created', 'lead.updated', 'lead.status_changed',
        'contract.generated', 'contract.signed', 'contract.expired',
        'invoice.created', 'invoice.paid', 'invoice.overdue',
        'payment.succeeded', 'payment.failed',
        'screening.completed',
        'whatsapp.message_sent', 'whatsapp.message_received',
        'user.created', 'user.updated',
        'tenant.updated'
      ];

      const invalidEvents = validatedData.events.filter(event => !validEvents.includes(event));
      if (invalidEvents.length > 0) {
        return NextResponse.json(
          { error: `Invalid event types: ${invalidEvents.join(', ')}` },
          { status: 400 }
        );
      }
    }

    const webhookService = getWebhookService();
    const endpoint = await webhookService.updateEndpoint(endpointId, validatedData);

    return NextResponse.json({
      endpoint: {
        ...endpoint,
        secret: '***' // Hide secret in response
      }
    });
  } catch (error) {
    console.error('Failed to update webhook endpoint:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update webhook endpoint' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/webhooks/endpoints/[id]
 * Delete webhook endpoint
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const endpointId = searchParams.get('id');

    if (!endpointId) {
      return NextResponse.json(
        { error: 'Endpoint ID is required' },
        { status: 400 }
      );
    }

    const webhookService = getWebhookService();
    await webhookService.deleteEndpoint(endpointId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete webhook endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to delete webhook endpoint' },
      { status: 500 }
    );
  }
}