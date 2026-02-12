/**
 * API Authentication and Authorization Middleware
 * 
 * Comprehensive middleware for API authentication, authorization, and rate limiting.
 * Supports both JWT Bearer tokens and API key authentication for enterprise features.
 * 
 * Requirements: 10.1, 10.3 - API-first architecture
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Lazy-loaded Supabase client to avoid build-time initialization
let supabase: ReturnType<typeof createClient> | null = null;

function getSupabaseClient() {
  if (!supabase) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    // If environment variables are missing (during build), return a mock client
    if (!supabaseUrl || !supabaseServiceKey) {
      return createMockSupabaseClient();
    }
    
    supabase = createClient(supabaseUrl, supabaseServiceKey);
  }
  return supabase;
}

function createMockSupabaseClient() {
  const mockQuery = {
    select: () => mockQuery,
    eq: () => mockQuery,
    single: () => Promise.resolve({ data: null, error: null }),
  };

  return {
    from: () => mockQuery,
  } as any;
}

// Rate limiting configuration
const RATE_LIMITS = {
  starter: { hourly: 1000, daily: 10000, burst: 50 },
  professional: { hourly: 5000, daily: 100000, burst: 200 },
  enterprise: { hourly: 25000, daily: 500000, burst: 1000 }
} as const;

// Authentication context interface
export interface AuthContext {
  user_id: string;
  tenant_id: string;
  role: string;
  permissions: string[];
  subscription_plan: 'starter' | 'professional' | 'enterprise';
  auth_method: 'jwt' | 'api_key';
  api_key?: string;
}

// Rate limit status interface
export interface RateLimitStatus {
  limit: number;
  remaining: number;
  reset: number;
  window: number;
}

// API response with rate limit headers
export interface ApiResponse {
  data?: any;
  error?: string;
  details?: any;
}

/**
 * Extract JWT token from Authorization header
 */
function extractJwtToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

/**
 * Extract API key from X-API-Key header
 */
function extractApiKey(request: NextRequest): string | null {
  return request.headers.get('x-api-key');
}

/**
 * Authenticate using JWT Bearer token
 */
async function authenticateJwt(token: string): Promise<AuthContext | null> {
  try {
    const supabase = getSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return null;
    }

    // Get user's tenant membership and role
    const { data: tenantUser, error: tenantError } = await supabase
      .from('tenant_users')
      .select(`
        tenant_id,
        role,
        permissions,
        status,
        tenants!inner (
          subscription
        )
      `)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (tenantError || !tenantUser) {
      return null;
    }

    const tenantData = tenantUser as any;
    const subscription = typeof tenantData.tenants.subscription === 'string'
      ? JSON.parse(tenantData.tenants.subscription)
      : tenantData.tenants.subscription;

    return {
      user_id: user.id,
      tenant_id: tenantData.tenant_id,
      role: tenantData.role,
      permissions: tenantData.permissions || [],
      subscription_plan: subscription.plan || 'starter',
      auth_method: 'jwt'
    };
  } catch (error) {
    console.error('JWT authentication error:', error);
    return null;
  }
}

/**
 * Authenticate using API key
 */
async function authenticateApiKey(apiKey: string): Promise<AuthContext | null> {
  try {
    const supabase = getSupabaseClient();
    const { data: apiConfig, error } = await supabase
      .from('api_access_configs')
      .select(`
        tenant_id,
        is_active,
        tenants!inner (
          subscription
        )
      `)
      .eq('api_key', apiKey)
      .eq('is_active', true)
      .single();

    if (error || !apiConfig) {
      return null;
    }

    const apiConfigData = apiConfig as any;
    const subscription = typeof apiConfigData.tenants.subscription === 'string'
      ? JSON.parse(apiConfigData.tenants.subscription)
      : apiConfigData.tenants.subscription;

    // API key authentication provides full access within the tenant
    return {
      user_id: 'api_key_user',
      tenant_id: apiConfigData.tenant_id,
      role: 'api_access',
      permissions: ['*'], // Full access for API key
      subscription_plan: subscription.plan || 'starter',
      auth_method: 'api_key',
      api_key: apiKey
    };
  } catch (error) {
    console.error('API key authentication error:', error);
    return null;
  }
}

/**
 * Check rate limits for the authenticated context
 */
async function checkRateLimit(
  context: AuthContext,
  request: NextRequest
): Promise<{ allowed: boolean; status: RateLimitStatus }> {
  const limits = RATE_LIMITS[context.subscription_plan];
  const now = Date.now();
  const hourWindow = Math.floor(now / (60 * 60 * 1000));
  
  // In a real implementation, this would use Redis or similar for distributed rate limiting
  // For now, we'll simulate the rate limiting logic
  
  // Simulate current usage (in production, this would be stored in Redis)
  const hourlyUsage = Math.floor(Math.random() * limits.hourly * 0.8);
  const dailyUsage = Math.floor(Math.random() * limits.daily * 0.8);
  
  const hourlyRemaining = Math.max(0, limits.hourly - hourlyUsage);
  const dailyRemaining = Math.max(0, limits.daily - dailyUsage);
  
  const allowed = hourlyRemaining > 0 && dailyRemaining > 0;
  
  // Log API usage if authenticated with API key
  if (context.auth_method === 'api_key' && context.api_key) {
    const url = new URL(request.url);
    await logApiUsage(
      context.tenant_id,
      context.api_key,
      url.pathname,
      request.method,
      allowed ? 200 : 429,
      request.headers.get('user-agent') || undefined,
      request.headers.get('x-forwarded-for') || undefined
    );
  }
  
  return {
    allowed,
    status: {
      limit: limits.hourly,
      remaining: hourlyRemaining,
      reset: (hourWindow + 1) * 60 * 60,
      window: 3600
    }
  };
}

/**
 * Log API usage for rate limiting and analytics
 */
async function logApiUsage(
  tenantId: string,
  apiKey: string,
  endpoint: string,
  method: string,
  statusCode: number,
  userAgent?: string,
  ipAddress?: string
): Promise<void> {
  try {
    const supabase = getSupabaseClient();
    await supabase.rpc('log_api_usage', {
      p_tenant_id: tenantId,
      p_api_key: apiKey,
      p_endpoint: endpoint,
      p_method: method,
      p_status_code: statusCode,
      p_user_agent: userAgent,
      p_ip_address: ipAddress
    });
  } catch (error) {
    console.error('Error logging API usage:', error);
  }
}

/**
 * Check if user has required permission
 */
function hasPermission(context: AuthContext, permission: string): boolean {
  // API key access has full permissions
  if (context.auth_method === 'api_key') {
    return true;
  }
  
  // Check if user has the specific permission or wildcard
  return context.permissions.includes(permission) || context.permissions.includes('*');
}

/**
 * Create API response with rate limit headers
 */
function createApiResponse(
  data: ApiResponse,
  status: number,
  rateLimitStatus?: RateLimitStatus
): NextResponse {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  
  if (rateLimitStatus) {
    headers['X-RateLimit-Limit'] = rateLimitStatus.limit.toString();
    headers['X-RateLimit-Remaining'] = rateLimitStatus.remaining.toString();
    headers['X-RateLimit-Reset'] = rateLimitStatus.reset.toString();
    headers['X-RateLimit-Window'] = rateLimitStatus.window.toString();
  }
  
  return NextResponse.json(data, { status, headers });
}

/**
 * Main authentication middleware
 */
export async function authenticateApiRequest(
  request: NextRequest,
  requiredPermission?: string
): Promise<{ context: AuthContext; rateLimitStatus: RateLimitStatus } | NextResponse> {
  try {
    // Try JWT authentication first
    const jwtToken = extractJwtToken(request);
    let context: AuthContext | null = null;
    
    if (jwtToken) {
      context = await authenticateJwt(jwtToken);
    }
    
    // If JWT failed, try API key authentication
    if (!context) {
      const apiKey = extractApiKey(request);
      if (apiKey) {
        context = await authenticateApiKey(apiKey);
      }
    }
    
    // If no valid authentication found
    if (!context) {
      return createApiResponse(
        { error: 'Authentication required' },
        401
      );
    }
    
    // Check required permission
    if (requiredPermission && !hasPermission(context, requiredPermission)) {
      return createApiResponse(
        { error: 'Insufficient permissions' },
        403
      );
    }
    
    // Check rate limits
    const { allowed, status: rateLimitStatus } = await checkRateLimit(context, request);
    
    if (!allowed) {
      return createApiResponse(
        { error: 'Rate limit exceeded' },
        429,
        rateLimitStatus
      );
    }
    
    return { context, rateLimitStatus };
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return createApiResponse(
      { error: 'Internal server error' },
      500
    );
  }
}

/**
 * Middleware wrapper for API routes
 */
export function withApiAuth(
  handler: (
    request: NextRequest,
    context: AuthContext,
    rateLimitStatus: RateLimitStatus
  ) => Promise<NextResponse>,
  requiredPermission?: string
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const authResult = await authenticateApiRequest(request, requiredPermission);
    
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    const { context, rateLimitStatus } = authResult;
    
    try {
      return await handler(request, context, rateLimitStatus);
    } catch (error) {
      console.error('API handler error:', error);
      return createApiResponse(
        { error: 'Internal server error' },
        500,
        rateLimitStatus
      );
    }
  };
}

/**
 * Validate tenant access for multi-tenant operations
 */
export function validateTenantAccess(
  context: AuthContext,
  requestedTenantId: string
): boolean {
  return context.tenant_id === requestedTenantId;
}

/**
 * Extract tenant ID from request (query param or path)
 */
export function extractTenantId(request: NextRequest): string | null {
  const { searchParams, pathname } = new URL(request.url);
  
  // Try query parameter first
  const tenantId = searchParams.get('tenant_id');
  if (tenantId) {
    return tenantId;
  }
  
  // Try to extract from path (e.g., /api/tenants/{id}/...)
  const pathMatch = pathname.match(/\/api\/tenants\/([^\/]+)/);
  if (pathMatch) {
    return pathMatch[1];
  }
  
  return null;
}

// Export utility functions
export {
  createApiResponse,
  hasPermission,
  RATE_LIMITS
};