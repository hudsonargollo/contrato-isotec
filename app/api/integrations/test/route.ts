/**
 * Integration Testing API
 * 
 * Tests connections to third-party services and validates
 * integration configurations before activation.
 * 
 * Requirements: 10.2 - Third-party integrations
 */

import { NextRequest, NextResponse } from 'next/server';
import { getThirdPartyIntegrationService } from '@/lib/services/third-party-integration';

/**
 * POST /api/integrations/test
 * Test integration connection
 */
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const integrationId = searchParams.get('integration_id');

    if (!integrationId) {
      return NextResponse.json(
        { error: 'Integration ID is required' },
        { status: 400 }
      );
    }

    const integrationService = getThirdPartyIntegrationService();
    const result = await integrationService.testConnection(integrationId);

    return NextResponse.json({
      success: result.success,
      error: result.error,
      tested_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to test integration:', error);
    return NextResponse.json(
      { error: 'Failed to test integration' },
      { status: 500 }
    );
  }
}