/**
 * Webhook Retry Cron Job
 * 
 * Processes failed webhook deliveries and retries them
 * according to the configured retry schedule.
 * 
 * Requirements: 10.2 - Webhook system reliability
 */

import { NextRequest, NextResponse } from 'next/server';
import { getWebhookService } from '@/lib/services/webhook';

/**
 * POST /api/cron/webhook-retries
 * Process webhook retries (called by cron job)
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron job authorization
    const authHeader = request.headers.get('authorization');
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;
    
    if (!authHeader || authHeader !== expectedAuth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const webhookService = getWebhookService();
    await webhookService.processRetries();

    return NextResponse.json({
      success: true,
      processed_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to process webhook retries:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook retries' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cron/webhook-retries
 * Health check for the cron job
 */
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
}