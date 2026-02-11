/**
 * API Access Management Routes
 * 
 * API endpoints for managing enterprise API access configurations,
 * credentials, and usage tracking.
 * 
 * Requirements: 9.5 - Enterprise white-label features
 */

import { NextRequest, NextResponse } from 'next/server';
import { getWhiteLabelService } from '@/lib/services/white-label';
import { z } from 'zod';

// Request validation schemas
const updateApiAccessSchema = z.object({
  rate_limit_per_hour: z.number().int().min(0).optional(),
  rate_limit_per_day: z.number().int().min(0).optional(),
  allowed_endpoints: z.array(z.string()).optional(),
  ip_whitelist: z.array(z.string()).optional(),
  cors_origins: z.array(z.string()).optional(),
  is_active: z.boolean().optional()
});

/**
 * GET /api/white-label/api-access
 * Get API access configuration for current tenant
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

    const whiteLabelService = getWhiteLabelService();
    const config = await whiteLabelService.getApiAccessConfig(tenantId);

    if (!config) {
      return NextResponse.json(
        { error: 'API access configuration not found' },
        { status: 404 }
      );
    }

    // Don't expose sensitive credentials in response
    const safeConfig = {
      ...config,
      api_secret: '***hidden***',
      webhook_secret: '***hidden***'
    };

    return NextResponse.json({ config: safeConfig });
  } catch (error) {
    console.error('Error getting API access config:', error);
    return NextResponse.json(
      { error: 'Failed to get API access configuration' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/white-label/api-access
 * Update API access configuration for current tenant
 */
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenant_id');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = updateApiAccessSchema.parse(body);

    const whiteLabelService = getWhiteLabelService();
    const updatedConfig = await whiteLabelService.updateApiAccessConfig(
      tenantId,
      validatedData
    );

    // Don't expose sensitive credentials in response
    const safeConfig = {
      ...updatedConfig,
      api_secret: '***hidden***',
      webhook_secret: '***hidden***'
    };

    return NextResponse.json({ config: safeConfig });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating API access config:', error);
    return NextResponse.json(
      { error: 'Failed to update API access configuration' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/white-label/api-access/regenerate
 * Regenerate API credentials for current tenant
 */
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenant_id');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID is required' },
        { status: 400 }
      );
    }

    const whiteLabelService = getWhiteLabelService();
    const newCredentials = await whiteLabelService.regenerateApiCredentials(tenantId);

    return NextResponse.json({ 
      message: 'API credentials regenerated successfully',
      credentials: newCredentials
    });
  } catch (error) {
    console.error('Error regenerating API credentials:', error);
    return NextResponse.json(
      { error: 'Failed to regenerate API credentials' },
      { status: 500 }
    );
  }
}