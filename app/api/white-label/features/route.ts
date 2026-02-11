/**
 * Enterprise Features Management API Routes
 * 
 * API endpoints for managing enterprise feature toggles and configurations
 * for white-label tenants.
 * 
 * Requirements: 9.5 - Enterprise white-label features
 */

import { NextRequest, NextResponse } from 'next/server';
import { getWhiteLabelService } from '@/lib/services/white-label';
import { z } from 'zod';

// Request validation schemas
const toggleFeatureSchema = z.object({
  feature_key: z.string().min(1),
  enabled: z.boolean()
});

const updateFeatureConfigSchema = z.object({
  feature_key: z.string().min(1),
  configuration: z.record(z.any())
});

/**
 * GET /api/white-label/features
 * Get all enterprise features for current tenant
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
    const features = await whiteLabelService.getEnterpriseFeatures(tenantId);

    return NextResponse.json({ features });
  } catch (error) {
    console.error('Error getting enterprise features:', error);
    return NextResponse.json(
      { error: 'Failed to get enterprise features' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/white-label/features/toggle
 * Toggle enterprise feature on/off for current tenant
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

    const body = await request.json();
    const { feature_key, enabled } = toggleFeatureSchema.parse(body);

    const whiteLabelService = getWhiteLabelService();
    const updatedFeature = await whiteLabelService.toggleEnterpriseFeature(
      tenantId,
      feature_key,
      enabled
    );

    return NextResponse.json({ 
      message: `Feature ${enabled ? 'enabled' : 'disabled'} successfully`,
      feature: updatedFeature
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error toggling enterprise feature:', error);
    return NextResponse.json(
      { error: 'Failed to toggle enterprise feature' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/white-label/features/config
 * Update enterprise feature configuration for current tenant
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
    const { feature_key, configuration } = updateFeatureConfigSchema.parse(body);

    const whiteLabelService = getWhiteLabelService();
    const updatedFeature = await whiteLabelService.updateEnterpriseFeatureConfig(
      tenantId,
      feature_key,
      configuration
    );

    return NextResponse.json({ 
      message: 'Feature configuration updated successfully',
      feature: updatedFeature
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating feature configuration:', error);
    return NextResponse.json(
      { error: 'Failed to update feature configuration' },
      { status: 500 }
    );
  }
}