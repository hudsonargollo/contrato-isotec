/**
 * Third-Party Integrations API
 * 
 * Manages external service integrations for tenants,
 * including configuration, testing, and synchronization.
 * 
 * Requirements: 10.2 - Third-party integrations and real-time data synchronization
 */

import { NextRequest, NextResponse } from 'next/server';
import { getThirdPartyIntegrationService, INTEGRATION_TEMPLATES, IntegrationConfig } from '@/lib/services/third-party-integration';
import { z } from 'zod';

// Request schemas
const CreateIntegrationSchema = z.object({
  service_name: z.string().min(1),
  service_type: z.enum(['crm', 'email', 'sms', 'analytics', 'storage', 'payment', 'other']),
  configuration: z.record(z.any()).default({}),
  credentials: z.record(z.any()),
  sync_enabled: z.boolean().default(false),
  sync_frequency_minutes: z.number().min(1).optional()
});

const UpdateIntegrationSchema = z.object({
  configuration: z.record(z.any()).optional(),
  credentials: z.record(z.any()).optional(),
  sync_enabled: z.boolean().optional(),
  sync_frequency_minutes: z.number().min(1).optional(),
  active: z.boolean().optional()
});

/**
 * GET /api/integrations
 * Get integrations for a tenant
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

    const integrationService = getThirdPartyIntegrationService();
    const integrations = await integrationService.getIntegrations(tenantId);

    // Hide sensitive credentials in response
    const sanitizedIntegrations = integrations.map(integration => ({
      ...integration,
      credentials: Object.keys(integration.credentials).reduce((acc, key) => {
        acc[key] = '***';
        return acc;
      }, {} as Record<string, string>)
    }));

    return NextResponse.json({
      integrations: sanitizedIntegrations,
      templates: INTEGRATION_TEMPLATES
    });
  } catch (error) {
    console.error('Failed to get integrations:', error);
    return NextResponse.json(
      { error: 'Failed to get integrations' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/integrations
 * Create a new integration
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
    const validatedData = CreateIntegrationSchema.parse(body);

    const integrationService = getThirdPartyIntegrationService();
    const integration = await integrationService.createIntegration(tenantId, validatedData);

    // Hide credentials in response
    const sanitizedIntegration = {
      ...integration,
      credentials: Object.keys(integration.credentials).reduce((acc, key) => {
        acc[key] = '***';
        return acc;
      }, {} as Record<string, string>)
    };

    return NextResponse.json({
      integration: sanitizedIntegration
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to create integration:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message.includes('already exists')) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create integration' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/integrations/[id]
 * Update integration
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const integrationId = searchParams.get('id');

    if (!integrationId) {
      return NextResponse.json(
        { error: 'Integration ID is required' },
        { status: 400 }
      );
    }

    // Validate request body
    const validatedData = UpdateIntegrationSchema.parse(body);

    const integrationService = getThirdPartyIntegrationService();
    const integration = await integrationService.updateIntegration(integrationId, validatedData);

    // Hide credentials in response
    const sanitizedIntegration = {
      ...integration,
      credentials: Object.keys(integration.credentials).reduce((acc, key) => {
        acc[key] = '***';
        return acc;
      }, {} as Record<string, string>)
    };

    return NextResponse.json({
      integration: sanitizedIntegration
    });
  } catch (error) {
    console.error('Failed to update integration:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update integration' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/integrations/[id]
 * Delete integration
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const integrationId = searchParams.get('id');

    if (!integrationId) {
      return NextResponse.json(
        { error: 'Integration ID is required' },
        { status: 400 }
      );
    }

    const integrationService = getThirdPartyIntegrationService();
    await integrationService.deleteIntegration(integrationId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete integration:', error);
    return NextResponse.json(
      { error: 'Failed to delete integration' },
      { status: 500 }
    );
  }
}