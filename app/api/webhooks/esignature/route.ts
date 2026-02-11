/**
 * E-Signature Webhook Handler
 * 
 * Webhook endpoint for processing events from e-signature providers
 * (DocuSign and HelloSign).
 * 
 * Requirements: 7.3 - E-signature integration
 */

import { NextRequest, NextResponse } from 'next/server';
import { createESignatureService } from '@/lib/services/e-signature';
import { getTenantContext } from '@/lib/utils/tenant-context';
import { ESignatureProvider } from '@/lib/types/e-signature';
import crypto from 'crypto';

/**
 * POST /api/webhooks/esignature
 * Process webhook events from e-signature providers
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headers = Object.fromEntries(request.headers.entries());
    
    // Determine provider from headers or URL parameters
    const provider = determineProvider(headers, request.url);
    
    if (!provider) {
      return NextResponse.json(
        { error: 'Unable to determine e-signature provider' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    const isValid = await verifyWebhookSignature(body, headers, provider);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      );
    }

    // Parse webhook data
    const eventData = JSON.parse(body);
    
    // Extract tenant context from event data
    const tenantContext = await extractTenantContextFromEvent(eventData, provider);
    if (!tenantContext) {
      return NextResponse.json(
        { error: 'Unable to determine tenant context' },
        { status: 400 }
      );
    }

    // Process the webhook event
    const eSignatureService = createESignatureService(tenantContext);
    await eSignatureService.processWebhookEvent(eventData, provider);

    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully'
    });

  } catch (error) {
    console.error('Error processing e-signature webhook:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process webhook',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Determine the e-signature provider from request headers or URL
 */
function determineProvider(headers: Record<string, string>, url: string): ESignatureProvider | null {
  // Check for DocuSign headers
  if (headers['x-docusign-signature-1'] || headers['x-docusign-signature-2']) {
    return 'docusign';
  }

  // Check for HelloSign headers
  if (headers['x-hellosign-event-hash']) {
    return 'hellosign';
  }

  // Check URL parameters
  const urlObj = new URL(url);
  const providerParam = urlObj.searchParams.get('provider');
  if (providerParam === 'docusign' || providerParam === 'hellosign') {
    return providerParam as ESignatureProvider;
  }

  return null;
}

/**
 * Verify webhook signature based on provider
 */
async function verifyWebhookSignature(
  body: string, 
  headers: Record<string, string>, 
  provider: ESignatureProvider
): Promise<boolean> {
  try {
    if (provider === 'docusign') {
      return verifyDocuSignSignature(body, headers);
    } else if (provider === 'hellosign') {
      return verifyHelloSignSignature(body, headers);
    }
    return false;
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}

/**
 * Verify DocuSign webhook signature
 */
function verifyDocuSignSignature(body: string, headers: Record<string, string>): boolean {
  // DocuSign webhook signature verification
  // This is a simplified implementation - in production, you would:
  // 1. Get the webhook secret from your DocuSign app configuration
  // 2. Verify the signature using the DocuSign algorithm
  
  const signature1 = headers['x-docusign-signature-1'];
  const signature2 = headers['x-docusign-signature-2'];
  
  // For now, just check if signatures exist (in production, verify them)
  return !!(signature1 || signature2);
}

/**
 * Verify HelloSign webhook signature
 */
function verifyHelloSignSignature(body: string, headers: Record<string, string>): boolean {
  // HelloSign webhook signature verification
  // This is a simplified implementation - in production, you would:
  // 1. Get the webhook secret from your HelloSign app configuration
  // 2. Create HMAC-SHA256 hash of the body with the secret
  // 3. Compare with the x-hellosign-event-hash header
  
  const eventHash = headers['x-hellosign-event-hash'];
  
  // For now, just check if hash exists (in production, verify it)
  return !!eventHash;
}

/**
 * Extract tenant context from webhook event data
 */
async function extractTenantContextFromEvent(
  eventData: any, 
  provider: ESignatureProvider
): Promise<any> {
  // This is a simplified implementation
  // In production, you would extract tenant information from the event data
  // and look up the tenant context from your database
  
  try {
    let envelopeId: string | null = null;
    
    if (provider === 'docusign') {
      envelopeId = eventData.envelopeId || eventData.data?.envelopeId;
    } else if (provider === 'hellosign') {
      envelopeId = eventData.signature_request?.signature_request_id;
    }
    
    if (!envelopeId) {
      return null;
    }
    
    // TODO: Look up tenant context from signature request
    // For now, return a mock tenant context
    return {
      tenant_id: 'mock-tenant-id',
      user_id: 'system'
    };
    
  } catch (error) {
    console.error('Error extracting tenant context:', error);
    return null;
  }
}

/**
 * GET /api/webhooks/esignature
 * Health check endpoint for webhook
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'E-signature webhook endpoint is active',
    timestamp: new Date().toISOString()
  });
}