/**
 * Integration Sync API
 * 
 * Handles data synchronization between SolarCRM Pro and
 * external services with real-time updates.
 * 
 * Requirements: 10.2 - Real-time data synchronization
 */

import { NextRequest, NextResponse } from 'next/server';
import { getThirdPartyIntegrationService } from '@/lib/services/third-party-integration';
import { z } from 'zod';

// Request schemas
const SyncRequestSchema = z.object({
  integration_id: z.string().uuid(),
  operation_type: z.enum(['create', 'update', 'delete', 'sync']),
  entity_type: z.string().min(1),
  entity_id: z.string().uuid().optional(),
  data: z.record(z.any()).optional()
});

/**
 * POST /api/integrations/sync
 * Trigger data synchronization
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
    const validatedData = SyncRequestSchema.parse(body);

    const integrationService = getThirdPartyIntegrationService();
    const syncOperation = await integrationService.syncData(
      validatedData.integration_id,
      validatedData.operation_type,
      validatedData.entity_type,
      validatedData.entity_id,
      validatedData.data
    );

    return NextResponse.json({
      sync_operation: syncOperation
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to trigger sync:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to trigger sync' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/integrations/sync/history
 * Get sync operation history
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenant_id');
    const integrationId = searchParams.get('integration_id');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID is required' },
        { status: 400 }
      );
    }

    const integrationService = getThirdPartyIntegrationService();
    const syncHistory = await integrationService.getSyncHistory(
      tenantId,
      integrationId || undefined,
      limit,
      offset
    );

    return NextResponse.json({
      sync_operations: syncHistory,
      pagination: {
        limit,
        offset,
        total: syncHistory.length
      }
    });
  } catch (error) {
    console.error('Failed to get sync history:', error);
    return NextResponse.json(
      { error: 'Failed to get sync history' },
      { status: 500 }
    );
  }
}