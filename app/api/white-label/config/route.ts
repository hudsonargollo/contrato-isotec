/**
 * White-Label Configuration API Routes
 * 
 * API endpoints for managing enterprise white-label configurations
 * including custom branding, domain settings, and feature toggles.
 * 
 * Requirements: 9.5 - Enterprise white-label features
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getWhiteLabelService } from '@/lib/services/white-label';
import { z } from 'zod';

// Request validation schemas
const updateConfigSchema = z.object({
  custom_domain: z.string().optional(),
  favicon_url: z.string().url().optional(),
  login_logo_url: z.string().url().optional(),
  email_logo_url: z.string().url().optional(),
  custom_css: z.string().optional(),
  custom_js: z.string().optional(),
  hide_branding: z.boolean().optional(),
  custom_email_templates: z.record(z.string()).optional(),
  custom_notification_settings: z.record(z.any()).optional(),
  webhook_endpoints: z.array(z.string().url()).optional()
});

/**
 * GET /api/white-label/config
 * Get white-label configuration for current tenant
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
    const config = await whiteLabelService.getWhiteLabelConfig(tenantId);

    if (!config) {
      return NextResponse.json(
        { error: 'White-label configuration not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ config });
  } catch (error) {
    console.error('Error getting white-label config:', error);
    return NextResponse.json(
      { error: 'Failed to get white-label configuration' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/white-label/config
 * Update white-label configuration for current tenant
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
    const validatedData = updateConfigSchema.parse(body);

    const whiteLabelService = getWhiteLabelService();
    const updatedConfig = await whiteLabelService.updateWhiteLabelConfig(
      tenantId,
      validatedData
    );

    return NextResponse.json({ config: updatedConfig });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating white-label config:', error);
    return NextResponse.json(
      { error: 'Failed to update white-label configuration' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/white-label/config/initialize
 * Initialize white-label features for enterprise tenant
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
    await whiteLabelService.initializeWhiteLabelFeatures(tenantId);

    return NextResponse.json({ 
      message: 'White-label features initialized successfully' 
    });
  } catch (error) {
    console.error('Error initializing white-label features:', error);
    return NextResponse.json(
      { error: 'Failed to initialize white-label features' },
      { status: 500 }
    );
  }
}