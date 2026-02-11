/**
 * API Key Management Routes
 * 
 * API endpoints for managing API keys including creation, listing,
 * updating, and deletion with proper authentication and authorization.
 * 
 * Requirements: 10.4 - API rate limiting and usage tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAPIKeyManagementService, CreateAPIKeyRequest } from '@/lib/services/api-key-management';
import { withApiAuth } from '@/lib/middleware/api-auth';
import { z } from 'zod';

// Request validation schemas
const createAPIKeySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  scopes: z.array(z.string()).min(1),
  permissions: z.record(z.any()).optional(),
  rate_limit_override: z.object({
    requestsPerMinute: z.number().int().min(1).optional(),
    requestsPerHour: z.number().int().min(1).optional(),
    requestsPerDay: z.number().int().min(1).optional(),
    burstLimit: z.number().int().min(1).optional()
  }).optional(),
  expires_at: z.string().datetime().optional()
});

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
 * GET /api/admin/api-keys
 * List all API keys for the authenticated tenant
 */
export const GET = withApiAuth(async (request, context, rateLimitStatus) => {
  try {
    const apiKeyService = getAPIKeyManagementService();
    const apiKeys = await apiKeyService.getAPIKeys(context.tenant_id);

    return NextResponse.json({
      api_keys: apiKeys,
      total: apiKeys.length
    }, {
      headers: {
        'X-RateLimit-Limit': rateLimitStatus.limit.toString(),
        'X-RateLimit-Remaining': rateLimitStatus.remaining.toString(),
        'X-RateLimit-Reset': rateLimitStatus.reset.toString()
      }
    });
  } catch (error) {
    console.error('Error listing API keys:', error);
    return NextResponse.json(
      { error: 'Failed to list API keys' },
      { status: 500 }
    );
  }
}, 'admin:all');

/**
 * POST /api/admin/api-keys
 * Create a new API key
 */
export const POST = withApiAuth(async (request, context, rateLimitStatus) => {
  try {
    const body = await request.json();
    const validatedData = createAPIKeySchema.parse(body);

    const apiKeyService = getAPIKeyManagementService();
    
    const createRequest: CreateAPIKeyRequest = {
      tenant_id: context.tenant_id,
      name: validatedData.name,
      description: validatedData.description,
      scopes: validatedData.scopes,
      permissions: validatedData.permissions,
      rate_limit_override: validatedData.rate_limit_override,
      expires_at: validatedData.expires_at ? new Date(validatedData.expires_at) : undefined,
      created_by: context.user_id
    };

    const apiKeyWithSecret = await apiKeyService.createAPIKey(createRequest);

    return NextResponse.json({
      message: 'API key created successfully',
      api_key: apiKeyWithSecret
    }, {
      status: 201,
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

    console.error('Error creating API key:', error);
    return NextResponse.json(
      { error: 'Failed to create API key' },
      { status: 500 }
    );
  }
}, 'admin:all');