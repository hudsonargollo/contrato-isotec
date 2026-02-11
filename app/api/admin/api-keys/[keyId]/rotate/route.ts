/**
 * API Key Rotation Route
 * 
 * API endpoint for rotating API keys to generate new credentials
 * while maintaining the same configuration and permissions.
 * 
 * Requirements: 10.4 - API rate limiting and usage tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAPIKeyManagementService } from '@/lib/services/api-key-management';
import { withApiAuth } from '@/lib/middleware/api-auth';

/**
 * POST /api/admin/api-keys/[keyId]/rotate
 * Rotate an API key (generate new credentials)
 */
export const POST = withApiAuth(async (request, context, rateLimitStatus, { params }) => {
  try {
    const keyId = params.keyId;
    
    if (!keyId) {
      return NextResponse.json(
        { error: 'API key ID is required' },
        { status: 400 }
      );
    }

    const apiKeyService = getAPIKeyManagementService();
    const rotatedApiKey = await apiKeyService.rotateAPIKey(context.tenant_id, keyId);

    return NextResponse.json({
      message: 'API key rotated successfully',
      api_key: rotatedApiKey,
      warning: 'The old API key is now invalid. Please update your applications with the new key.'
    }, {
      headers: {
        'X-RateLimit-Limit': rateLimitStatus.limit.toString(),
        'X-RateLimit-Remaining': rateLimitStatus.remaining.toString(),
        'X-RateLimit-Reset': rateLimitStatus.reset.toString()
      }
    });
  } catch (error) {
    console.error('Error rotating API key:', error);
    return NextResponse.json(
      { error: 'Failed to rotate API key' },
      { status: 500 }
    );
  }
}, 'admin:all');