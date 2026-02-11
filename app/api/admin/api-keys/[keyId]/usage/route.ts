/**
 * API Key Usage Analytics Route
 * 
 * API endpoint for retrieving usage analytics and statistics
 * for individual API keys.
 * 
 * Requirements: 10.4 - API rate limiting and usage tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAPIKeyManagementService } from '@/lib/services/api-key-management';
import { withApiAuth } from '@/lib/middleware/api-auth';

/**
 * GET /api/admin/api-keys/[keyId]/usage
 * Get usage analytics for a specific API key
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

    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('start_date');
    const endDateParam = searchParams.get('end_date');
    const period = searchParams.get('period') || '30d';

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

    const apiKeyService = getAPIKeyManagementService();
    const usage = await apiKeyService.getAPIKeyUsage(
      context.tenant_id,
      keyId,
      startDate,
      endDate
    );

    return NextResponse.json({
      usage,
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
    console.error('Error getting API key usage:', error);
    return NextResponse.json(
      { error: 'Failed to get API key usage' },
      { status: 500 }
    );
  }
}, 'admin:all');