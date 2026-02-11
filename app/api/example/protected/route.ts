/**
 * Example Protected API Route
 * 
 * Demonstrates how to use the API authentication middleware
 * for protected endpoints with rate limiting and permission checks.
 * 
 * Requirements: 10.1, 10.3 - API-first architecture
 */

import { NextRequest } from 'next/server';
import { 
  withApiAuth, 
  AuthContext, 
  RateLimitStatus,
  createApiResponse,
  validateTenantAccess,
  extractTenantId
} from '@/lib/middleware/api-auth';

/**
 * GET /api/example/protected
 * Example protected endpoint that requires authentication
 */
export const GET = withApiAuth(
  async (request: NextRequest, context: AuthContext, rateLimitStatus: RateLimitStatus) => {
    // Extract tenant ID from request
    const requestedTenantId = extractTenantId(request);
    
    // Validate tenant access if tenant ID is provided
    if (requestedTenantId && !validateTenantAccess(context, requestedTenantId)) {
      return createApiResponse(
        { error: 'Access denied to requested tenant' },
        403,
        rateLimitStatus
      );
    }
    
    // Example business logic
    const responseData = {
      message: 'Successfully accessed protected endpoint',
      user_id: context.user_id,
      tenant_id: context.tenant_id,
      role: context.role,
      auth_method: context.auth_method,
      subscription_plan: context.subscription_plan,
      timestamp: new Date().toISOString()
    };
    
    return createApiResponse(responseData, 200, rateLimitStatus);
  },
  'leads.view' // Required permission
);

/**
 * POST /api/example/protected
 * Example protected endpoint that requires specific permission
 */
export const POST = withApiAuth(
  async (request: NextRequest, context: AuthContext, rateLimitStatus: RateLimitStatus) => {
    try {
      const body = await request.json();
      
      // Validate request body
      if (!body.name) {
        return createApiResponse(
          { error: 'Name is required', details: { field: 'name' } },
          400,
          rateLimitStatus
        );
      }
      
      // Example business logic - create a resource
      const resource = {
        id: crypto.randomUUID(),
        name: body.name,
        tenant_id: context.tenant_id,
        created_by: context.user_id,
        created_at: new Date().toISOString()
      };
      
      return createApiResponse(
        { message: 'Resource created successfully', resource },
        201,
        rateLimitStatus
      );
    } catch (error) {
      return createApiResponse(
        { error: 'Invalid JSON in request body' },
        400,
        rateLimitStatus
      );
    }
  },
  'leads.create' // Required permission
);