/**
 * Individual API Key Management Routes
 * 
 * API endpoints for managing individual API keys including retrieval,
 * updating, deletion, and rotation.
 * 
 * Requirements: 10.4 - API rate limiting and usage tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAPIKeyManagementService } from '@/lib/services/api-key-management';
import { withApiAuth } from '@/lib/middleware/api-auth';
import { z } from 'zod';

// Request validation schemas
const updateAPIKeySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  scopes: z.array(z.string()).min(1).optional(),
  permissions: z.record(z.any()).optional(),
  active: z.boolean().optional(),
  rate_limit_override: z.object({
    requestsPerMinute: z.number().int().min(1).optional(),
    requestsPerHour: z.number().int().min(1).optional(),
    requestsPerDay: z.number().int().min(1).optional(),
    burstLimit: z.number().int().min(1).optional()
  }).optional(),
  expires_at: z.string().datetime().optional()
});

/**
 * GET /api/admin/api-keys/[keyId]
 * Get details of a specific API key
 */
export const GET = withApiAuth(async (request, context, rateLimitStatus, { params }) => {
  try {
    const keyId = params.keyId;
    
    if (!keyId) {
      return NextResponse.json(
        { error: 'API key ID is required' },
        { status: 400 }
      );
    }

    const apiKeyService = getAPIKeyManagementService();
    const apiKey = await apiKeyService.getAPIKey(context.tenant_id, keyId);

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      api_key: apiKey
    }, {
      headers: {
        'X-RateLimit-Limit': rateLimitStatus.limit.toString(),
        'X-RateLimit-Remaining': rateLimitStatus.remaining.toString(),
        'X-RateLimit-Reset': rateLimitStatus.reset.toString()
      }
    });
  } catch (error) {
    console.error('Error getting API key:', error);
    return NextResponse.json(
      { error: 'Failed to get API key' },
      { status: 500 }
    );
  }
}, 'admin:all');

/**
 * PUT /api/admin/api-keys/[keyId]
 * Update an API key
 */
export const PUT = withApiAuth(async (request, context, rateLimitStatus, { params }) => {
  try {
    const keyId = params.keyId;
    
    if (!keyId) {
      return NextResponse.json(
        { error: 'API key ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = updateAPIKeySchema.parse(body);

    const apiKeyService = getAPIKeyManagementService();
    
    const updates = {
      ...validatedData,
      expires_at: validatedData.expires_at ? new Date(validatedData.expires_at) : undefined
    };

    const updatedApiKey = await apiKeyService.updateAPIKey(
      context.tenant_id,
      keyId,
      updates
    );

    return NextResponse.json({
      message: 'API key updated successfully',
      api_key: updatedApiKey
    }, {
      headers: {
        'X-RateLimit-Limit': rateLimitStatus.limit.toString(),
        'X-RateLimit-Remaining': rateLimitStatus.remaining.toString(),
        'X-RateLimit-Reset': rateLimitStatus.reset.toString()
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating API key:', error);
    return NextResponse.json(
      { error: 'Failed to update API key' },
      { status: 500 }
    );
  }
}, 'admin:all');

/**
 * DELETE /api/admin/api-keys/[keyId]
 * Delete an API key
 */
export const DELETE = withApiAuth(async (request, context, rateLimitStatus, { params }) => {
  try {
    const keyId = params.keyId;
    
    if (!keyId) {
      return NextResponse.json(
        { error: 'API key ID is required' },
        { status: 400 }
      );
    }

    const apiKeyService = getAPIKeyManagementService();
    await apiKeyService.deleteAPIKey(context.tenant_id, keyId);

    return NextResponse.json({
      message: 'API key deleted successfully'
    }, {
      headers: {
        'X-RateLimit-Limit': rateLimitStatus.limit.toString(),
        'X-RateLimit-Remaining': rateLimitStatus.remaining.toString(),
        'X-RateLimit-Reset': rateLimitStatus.reset.toString()
      }
    });
  } catch (error) {
    console.error('Error deleting API key:', error);
    return NextResponse.json(
      { error: 'Failed to delete API key' },
      { status: 500 }
    );
  }
}, 'admin:all');