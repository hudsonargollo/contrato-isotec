/**
 * Custom Domain Management API Routes
 * 
 * API endpoints for managing custom domain verification and configuration
 * for enterprise white-label features.
 * 
 * Requirements: 9.5 - Enterprise white-label features
 */

import { NextRequest, NextResponse } from 'next/server';
import { getWhiteLabelService } from '@/lib/services/white-label';
import { z } from 'zod';

// Request validation schemas
const verifyDomainSchema = z.object({
  domain: z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.[a-zA-Z]{2,}$/, 'Invalid domain format')
});

/**
 * POST /api/white-label/domain/verify
 * Initiate custom domain verification process
 */
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenant_id');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { domain } = verifyDomainSchema.parse(body);

    const whiteLabelService = getWhiteLabelService();
    const verification = await whiteLabelService.verifyCustomDomain(tenantId, domain);

    return NextResponse.json({ verification });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid domain format', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error verifying custom domain:', error);
    return NextResponse.json(
      { error: 'Failed to verify custom domain' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/white-label/domain/status
 * Check custom domain verification status
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenant_id');
    const domain = searchParams.get('domain');

    if (!tenantId || !domain) {
      return NextResponse.json(
        { error: 'Tenant ID and domain are required' },
        { status: 400 }
      );
    }

    const whiteLabelService = getWhiteLabelService();
    const isVerified = await whiteLabelService.checkDomainVerification(tenantId, domain);

    return NextResponse.json({ 
      domain,
      verified: isVerified,
      status: isVerified ? 'verified' : 'pending'
    });
  } catch (error) {
    console.error('Error checking domain verification:', error);
    return NextResponse.json(
      { error: 'Failed to check domain verification status' },
      { status: 500 }
    );
  }
}