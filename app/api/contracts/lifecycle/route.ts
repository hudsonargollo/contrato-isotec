/**
 * Contract Lifecycle API Routes
 * 
 * Handles contract lifecycle tracking, renewal alerts, expiration monitoring,
 * and lifecycle analytics operations.
 * 
 * Requirements: 7.4 - Contract lifecycle tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { createContractLifecycleService } from '@/lib/services/contract-lifecycle';
import { getTenantContext } from '@/lib/utils/tenant-context';
import { z } from 'zod';

// Request schemas
const lifecycleEventSchema = z.object({
  contract_id: z.string().uuid(),
  event_type: z.enum([
    'created', 'approved', 'sent_for_signature', 'partially_signed', 
    'fully_signed', 'expired', 'renewed', 'cancelled', 'archived'
  ]),
  event_data: z.record(z.any()).optional().default({}),
  previous_status: z.string().optional(),
  new_status: z.string().optional()
});

const updateStatusSchema = z.object({
  contract_id: z.string().uuid(),
  new_status: z.enum(['draft', 'pending_approval', 'approved', 'sent', 'signed', 'cancelled', 'expired']),
  event_data: z.record(z.any()).optional().default({})
});

const lifecycleFiltersSchema = z.object({
  status: z.array(z.string()).optional(),
  signature_status: z.array(z.string()).optional(),
  date_range: z.object({
    start: z.string().datetime(),
    end: z.string().datetime()
  }).optional(),
  customer_id: z.string().uuid().optional(),
  template_id: z.string().uuid().optional(),
  expires_within_days: z.number().int().min(0).max(365).optional(),
  renewal_within_days: z.number().int().min(0).max(365).optional()
});

/**
 * GET /api/contracts/lifecycle
 * Get contract lifecycle statistics and data
 */
export async function GET(request: NextRequest) {
  try {
    const tenantContext = await getTenantContext();
    if (!tenantContext) {
      return NextResponse.json(
        { error: 'Tenant context not found' },
        { status: 401 }
      );
    }

    const lifecycleService = createContractLifecycleService(tenantContext);
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'stats': {
        // Parse filters from query parameters
        const filters: any = {};
        
        if (searchParams.get('status')) {
          filters.status = searchParams.get('status')?.split(',');
        }
        if (searchParams.get('signature_status')) {
          filters.signature_status = searchParams.get('signature_status')?.split(',');
        }
        if (searchParams.get('start_date') && searchParams.get('end_date')) {
          filters.date_range = {
            start: new Date(searchParams.get('start_date')!),
            end: new Date(searchParams.get('end_date')!)
          };
        }
        if (searchParams.get('customer_id')) {
          filters.customer_id = searchParams.get('customer_id');
        }
        if (searchParams.get('template_id')) {
          filters.template_id = searchParams.get('template_id');
        }
        if (searchParams.get('expires_within_days')) {
          filters.expires_within_days = parseInt(searchParams.get('expires_within_days')!);
        }
        if (searchParams.get('renewal_within_days')) {
          filters.renewal_within_days = parseInt(searchParams.get('renewal_within_days')!);
        }

        const stats = await lifecycleService.getLifecycleStats(filters);
        return NextResponse.json({ stats });
      }

      case 'contracts': {
        // Parse filters from query parameters
        const filters: any = {};
        
        if (searchParams.get('status')) {
          filters.status = searchParams.get('status')?.split(',');
        }
        if (searchParams.get('signature_status')) {
          filters.signature_status = searchParams.get('signature_status')?.split(',');
        }
        if (searchParams.get('start_date') && searchParams.get('end_date')) {
          filters.date_range = {
            start: new Date(searchParams.get('start_date')!),
            end: new Date(searchParams.get('end_date')!)
          };
        }

        const contracts = await lifecycleService.listContracts(filters);
        return NextResponse.json({ contracts });
      }

      case 'renewal-alerts': {
        const daysAhead = searchParams.get('days_ahead') 
          ? parseInt(searchParams.get('days_ahead')!) 
          : 30;
        
        const alerts = await lifecycleService.getRenewalAlerts(daysAhead);
        return NextResponse.json({ alerts });
      }

      case 'expiration-alerts': {
        const daysAhead = searchParams.get('days_ahead') 
          ? parseInt(searchParams.get('days_ahead')!) 
          : 30;
        
        const alerts = await lifecycleService.getExpirationAlerts(daysAhead);
        return NextResponse.json({ alerts });
      }

      case 'history': {
        const contractId = searchParams.get('contract_id');
        if (!contractId) {
          return NextResponse.json(
            { error: 'Contract ID is required for history' },
            { status: 400 }
          );
        }

        const history = await lifecycleService.getContractLifecycleHistory(contractId);
        return NextResponse.json({ history });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Contract lifecycle GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/contracts/lifecycle
 * Create lifecycle events and update contract status
 */
export async function POST(request: NextRequest) {
  try {
    const tenantContext = await getTenantContext();
    if (!tenantContext) {
      return NextResponse.json(
        { error: 'Tenant context not found' },
        { status: 401 }
      );
    }

    const lifecycleService = createContractLifecycleService(tenantContext);
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const body = await request.json();

    switch (action) {
      case 'track-event': {
        const validatedData = lifecycleEventSchema.parse(body);
        
        const event = await lifecycleService.trackLifecycleEvent(
          validatedData.contract_id,
          validatedData.event_type,
          validatedData.event_data,
          validatedData.previous_status as any,
          validatedData.new_status as any
        );

        return NextResponse.json({ event });
      }

      case 'update-status': {
        const validatedData = updateStatusSchema.parse(body);
        
        const contract = await lifecycleService.updateContractStatus(
          validatedData.contract_id,
          validatedData.new_status,
          validatedData.event_data
        );

        return NextResponse.json({ contract });
      }

      case 'process-expired': {
        const result = await lifecycleService.processExpiredContracts();
        return NextResponse.json({ result });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Contract lifecycle POST error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/contracts/lifecycle
 * Update lifecycle settings and configurations
 */
export async function PUT(request: NextRequest) {
  try {
    const tenantContext = await getTenantContext();
    if (!tenantContext) {
      return NextResponse.json(
        { error: 'Tenant context not found' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const body = await request.json();

    switch (action) {
      case 'acknowledge-renewal-alert': {
        const { alert_id } = body;
        if (!alert_id) {
          return NextResponse.json(
            { error: 'Alert ID is required' },
            { status: 400 }
          );
        }

        // This would be implemented in the lifecycle service
        // For now, return success
        return NextResponse.json({ success: true });
      }

      case 'acknowledge-expiration-alert': {
        const { alert_id } = body;
        if (!alert_id) {
          return NextResponse.json(
            { error: 'Alert ID is required' },
            { status: 400 }
          );
        }

        // This would be implemented in the lifecycle service
        // For now, return success
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Contract lifecycle PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}