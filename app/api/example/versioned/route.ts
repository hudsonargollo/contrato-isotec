/**
 * Example Versioned API Route
 * 
 * Demonstrates how to implement API versioning with backward compatibility
 * and version-specific response transformations.
 * 
 * Requirements: 10.5 - API versioning and backward compatibility
 */

import { NextRequest } from 'next/server';
import { 
  withApiVersioning,
  createVersionedResponse,
  ApiVersion
} from '@/lib/middleware/api-versioning';
import { 
  withApiAuth,
  AuthContext,
  RateLimitStatus
} from '@/lib/middleware/api-auth';

// Example data structure that evolves across versions
interface ExampleResource {
  id: string;
  name: string;
  created_at: string;
  // v1.1+ fields
  enhanced_analytics?: {
    views: number;
    interactions: number;
  };
  advanced_permissions?: string[];
}

/**
 * Handler for API v1.0
 */
async function handleV1_0(
  request: NextRequest,
  context: AuthContext,
  rateLimitStatus: RateLimitStatus
) {
  const version: ApiVersion = '1.0';
  
  // Example resource data
  const resource: ExampleResource = {
    id: crypto.randomUUID(),
    name: 'Example Resource',
    created_at: new Date().toISOString()
    // Note: v1.0 doesn't include enhanced_analytics or advanced_permissions
  };
  
  return createVersionedResponse(
    {
      message: 'Resource retrieved successfully (v1.0)',
      resource,
      version,
      tenant_id: context.tenant_id
    },
    version,
    200,
    {
      'X-RateLimit-Limit': rateLimitStatus.limit.toString(),
      'X-RateLimit-Remaining': rateLimitStatus.remaining.toString()
    }
  );
}

/**
 * Handler for API v1.1
 */
async function handleV1_1(
  request: NextRequest,
  context: AuthContext,
  rateLimitStatus: RateLimitStatus
) {
  const version: ApiVersion = '1.1';
  
  // Example resource data with v1.1 enhancements
  const resource: ExampleResource = {
    id: crypto.randomUUID(),
    name: 'Example Resource',
    created_at: new Date().toISOString(),
    // v1.1 additions
    enhanced_analytics: {
      views: 42,
      interactions: 15
    },
    advanced_permissions: ['read', 'write', 'admin']
  };
  
  return createVersionedResponse(
    {
      message: 'Resource retrieved successfully (v1.1)',
      resource,
      version,
      tenant_id: context.tenant_id,
      // v1.1 specific metadata
      metadata: {
        api_enhancements: ['enhanced_analytics', 'advanced_permissions'],
        backward_compatible: true
      }
    },
    version,
    200,
    {
      'X-RateLimit-Limit': rateLimitStatus.limit.toString(),
      'X-RateLimit-Remaining': rateLimitStatus.remaining.toString()
    }
  );
}

/**
 * GET /api/example/versioned
 * Versioned endpoint that supports multiple API versions
 */
export const GET = withApiVersioning({
  '1.0': withApiAuth(handleV1_0, 'leads.view'),
  '1.1': withApiAuth(handleV1_1, 'leads.view')
});

/**
 * POST /api/example/versioned
 * Example of handling version-specific request formats
 */
export const POST = withApiVersioning({
  '1.0': withApiAuth(
    async (request: NextRequest, context: AuthContext, rateLimitStatus: RateLimitStatus) => {
      const version: ApiVersion = '1.0';
      
      try {
        const body = await request.json();
        
        // v1.0 validation - only basic fields
        if (!body.name) {
          return createVersionedResponse(
            { error: 'Name is required' },
            version,
            400
          );
        }
        
        const resource: ExampleResource = {
          id: crypto.randomUUID(),
          name: body.name,
          created_at: new Date().toISOString()
        };
        
        return createVersionedResponse(
          {
            message: 'Resource created successfully (v1.0)',
            resource
          },
          version,
          201
        );
      } catch (error) {
        return createVersionedResponse(
          { error: 'Invalid JSON in request body' },
          version,
          400
        );
      }
    },
    'leads.create'
  ),
  
  '1.1': withApiAuth(
    async (request: NextRequest, context: AuthContext, rateLimitStatus: RateLimitStatus) => {
      const version: ApiVersion = '1.1';
      
      try {
        const body = await request.json();
        
        // v1.1 validation - supports additional fields
        if (!body.name) {
          return createVersionedResponse(
            { error: 'Name is required' },
            version,
            400
          );
        }
        
        const resource: ExampleResource = {
          id: crypto.randomUUID(),
          name: body.name,
          created_at: new Date().toISOString(),
          // v1.1 can accept and store additional fields
          enhanced_analytics: body.enhanced_analytics || {
            views: 0,
            interactions: 0
          },
          advanced_permissions: body.advanced_permissions || ['read']
        };
        
        return createVersionedResponse(
          {
            message: 'Resource created successfully (v1.1)',
            resource,
            enhancements_applied: {
              enhanced_analytics: !!body.enhanced_analytics,
              advanced_permissions: !!body.advanced_permissions
            }
          },
          version,
          201
        );
      } catch (error) {
        return createVersionedResponse(
          { error: 'Invalid JSON in request body' },
          version,
          400
        );
      }
    },
    'leads.create'
  )
});

/**
 * PUT /api/example/versioned
 * Example of version-specific update behavior
 */
export const PUT = withApiVersioning({
  '1.0': withApiAuth(
    async (request: NextRequest, context: AuthContext, rateLimitStatus: RateLimitStatus) => {
      const version: ApiVersion = '1.0';
      
      try {
        const body = await request.json();
        
        // v1.0 update - only allows updating basic fields
        const updatedResource: ExampleResource = {
          id: body.id || crypto.randomUUID(),
          name: body.name || 'Updated Resource',
          created_at: new Date().toISOString()
        };
        
        return createVersionedResponse(
          {
            message: 'Resource updated successfully (v1.0)',
            resource: updatedResource,
            updated_fields: ['name']
          },
          version,
          200
        );
      } catch (error) {
        return createVersionedResponse(
          { error: 'Invalid JSON in request body' },
          version,
          400
        );
      }
    },
    'leads.update'
  ),
  
  '1.1': withApiAuth(
    async (request: NextRequest, context: AuthContext, rateLimitStatus: RateLimitStatus) => {
      const version: ApiVersion = '1.1';
      
      try {
        const body = await request.json();
        
        // v1.1 update - supports updating all fields including new ones
        const updatedResource: ExampleResource = {
          id: body.id || crypto.randomUUID(),
          name: body.name || 'Updated Resource',
          created_at: new Date().toISOString(),
          enhanced_analytics: body.enhanced_analytics || {
            views: 0,
            interactions: 0
          },
          advanced_permissions: body.advanced_permissions || ['read']
        };
        
        const updatedFields = [];
        if (body.name) updatedFields.push('name');
        if (body.enhanced_analytics) updatedFields.push('enhanced_analytics');
        if (body.advanced_permissions) updatedFields.push('advanced_permissions');
        
        return createVersionedResponse(
          {
            message: 'Resource updated successfully (v1.1)',
            resource: updatedResource,
            updated_fields: updatedFields,
            version_enhancements: ['enhanced_analytics', 'advanced_permissions']
          },
          version,
          200
        );
      } catch (error) {
        return createVersionedResponse(
          { error: 'Invalid JSON in request body' },
          version,
          400
        );
      }
    },
    'leads.update'
  )
});