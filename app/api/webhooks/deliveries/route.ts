/**
 * Webhook Deliveries API
 * 
 * Provides access to webhook delivery history and statistics
 * for monitoring webhook performance and debugging issues.
 * 
 * Requirements: 10.2 - Webhook system and third-party integrations
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getWebhookService } from '@/lib/services/webhook';

/**
 * GET /api/webhooks/deliveries
 * Get webhook delivery history for a tenant
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenant_id');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const endpointId = searchParams.get('endpoint_id');
    const status = searchParams.get('status');
    const eventType = searchParams.get('event_type');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID is required' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Build query
    let query = supabase
      .from('webhook_deliveries')
      .select(`
        *,
        endpoint:webhook_endpoints(id, url, name)
      `)
      .eq('tenant_id', tenantId);

    if (endpointId) {
      query = query.eq('endpoint_id', endpointId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (eventType) {
      query = query.eq('event_type', eventType);
    }

    const { data: deliveries, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    // Get delivery statistics
    const { data: stats } = await supabase
      .rpc('get_webhook_delivery_stats', {
        p_tenant_id: tenantId,
        p_days: 7
      });

    return NextResponse.json({
      deliveries: deliveries || [],
      statistics: stats?.[0] || {
        total_deliveries: 0,
        successful_deliveries: 0,
        failed_deliveries: 0,
        pending_deliveries: 0,
        success_rate: 0
      },
      pagination: {
        limit,
        offset,
        total: deliveries?.length || 0
      }
    });
  } catch (error) {
    console.error('Failed to get webhook deliveries:', error);
    return NextResponse.json(
      { error: 'Failed to get webhook deliveries' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/webhooks/deliveries/retry
 * Retry failed webhook deliveries
 */
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenant_id');
    const deliveryId = searchParams.get('delivery_id');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID is required' },
        { status: 400 }
      );
    }

    const supabase = createClient();
    let retryCount = 0;

    if (deliveryId) {
      // Retry specific delivery
      const { data: delivery, error: fetchError } = await supabase
        .from('webhook_deliveries')
        .select('*')
        .eq('id', deliveryId)
        .eq('tenant_id', tenantId)
        .single();

      if (fetchError || !delivery) {
        return NextResponse.json(
          { error: 'Delivery not found' },
          { status: 404 }
        );
      }

      if (delivery.status !== 'failed') {
        return NextResponse.json(
          { error: 'Only failed deliveries can be retried' },
          { status: 400 }
        );
      }

      // Update delivery to retrying status
      const { error: updateError } = await supabase
        .from('webhook_deliveries')
        .update({
          status: 'retrying',
          next_retry_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', deliveryId);

      if (updateError) {
        throw updateError;
      }

      retryCount = 1;
    } else {
      // Retry all failed deliveries for tenant
      const { data: retryResult } = await supabase
        .rpc('retry_failed_webhook_deliveries', {
          p_tenant_id: tenantId,
          p_max_retries: 5
        });

      retryCount = retryResult || 0;
    }

    // Process retries
    const webhookService = getWebhookService();
    await webhookService.processRetries();

    return NextResponse.json({
      success: true,
      retried_count: retryCount
    });
  } catch (error) {
    console.error('Failed to retry webhook deliveries:', error);
    return NextResponse.json(
      { error: 'Failed to retry webhook deliveries' },
      { status: 500 }
    );
  }
}