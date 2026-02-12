/**
 * API Usage Analytics Routes
 * 
 * Comprehensive API endpoints for retrieving usage analytics,
 * rate limit status, and monitoring data for tenant API usage.
 * 
 * Requirements: 10.4 - API rate limiting and usage tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAPIRateLimitingService } from '@/lib/services/api-rate-limiting';
import { withApiAuth } from '@/lib/middleware/api-auth';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/admin/usage-analytics
 * Get comprehensive usage analytics for the tenant
 */
export const GET = withApiAuth(async (request, context, rateLimitStatus) => {
  try {
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('start_date');
    const endDateParam = searchParams.get('end_date');
    const period = searchParams.get('period') || '30d';
    const includeRateLimit = searchParams.get('include_rate_limit') === 'true';

    // Calculate date range
    let startDate: Date;
    let endDate: Date = new Date();

    if (startDateParam && endDateParam) {
      startDate = new Date(startDateParam);
      endDate = new Date(endDateParam);
    } else {
      // Use period parameter
      const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
      startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
    }

    const rateLimitingService = getAPIRateLimitingService();
    const supabase = createClient();
    
    // Get usage analytics
    const analytics = await rateLimitingService.getUsageAnalytics(
      context.tenant_id,
      startDate,
      endDate
    );

    // Get current rate limit status if requested
    let currentRateLimit = null;
    if (includeRateLimit) {
      const subscriptionTier = await rateLimitingService.getTenantSubscriptionTier(context.tenant_id);
      currentRateLimit = await rateLimitingService.getCurrentUsage(
        context.tenant_id,
        subscriptionTier
      );
    }

    // Get additional statistics from database
    const { data: additionalStats } = await supabase.rpc('get_api_usage_stats', {
      p_tenant_id: context.tenant_id,
      p_start_date: startDate.toISOString(),
      p_end_date: endDate.toISOString()
    });

    const { data: topEndpoints } = await supabase.rpc('get_top_endpoints', {
      p_tenant_id: context.tenant_id,
      p_start_date: startDate.toISOString(),
      p_end_date: endDate.toISOString(),
      p_limit: 10
    });

    // Get rate limit violations
    const { data: violations } = await supabase
      .from('rate_limit_violations')
      .select('*')
      .eq('tenant_id', context.tenant_id)
      .gte('violated_at', startDate.toISOString())
      .lte('violated_at', endDate.toISOString())
      .order('violated_at', { ascending: false })
      .limit(50);

    // Get usage quotas
    const { data: quotas } = await supabase
      .from('usage_quotas')
      .select('*')
      .eq('tenant_id', context.tenant_id)
      .gte('period_start', startDate.toISOString().split('T')[0])
      .lte('period_end', endDate.toISOString().split('T')[0])
      .order('period_start', { ascending: false });

    return NextResponse.json({
      analytics: {
        ...analytics,
        ...additionalStats?.[0],
        topEndpoints: topEndpoints || [],
        violations: violations || [],
        quotas: quotas || []
      },
      currentRateLimit,
      period: {
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        days: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      }
    }, {
      headers: {
        'X-RateLimit-Limit': rateLimitStatus.limit.toString(),
        'X-RateLimit-Remaining': rateLimitStatus.remaining.toString(),
        'X-RateLimit-Reset': rateLimitStatus.reset.toString()
      }
    });
  } catch (error) {
    console.error('Error getting usage analytics:', error);
    return NextResponse.json(
      { error: 'Failed to get usage analytics' },
      { status: 500 }
    );
  }
}, 'analytics:read');