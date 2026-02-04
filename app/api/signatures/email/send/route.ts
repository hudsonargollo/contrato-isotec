/**
 * Email Signature Send API Route
 * POST /api/signatures/email/send - Generate and send verification code
 * 
 * Requirements: 5.1
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { emailVerificationRequestSchema } from '@/lib/types/schemas';
import { sendVerificationEmail } from '@/lib/services/email';

/**
 * Generate a random 6-digit verification code
 */
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * POST /api/signatures/email/send
 * Generate verification code and send email
 * Validates: Requirements 5.1
 */
export async function POST(request: NextRequest) {
  try {
    // Get Supabase client (no auth required for public signature)
    const supabase = await createClient();

    // Parse and validate request body
    const body = await request.json();
    const validationResult = emailVerificationRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: validationResult.error.errors 
        },
        { status: 400 }
      );
    }

    const { email, contractId } = validationResult.data;

    // Verify contract exists and is pending signature
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select('id, uuid, status, contractor_email, contractor_name')
      .eq('id', contractId)
      .single();

    if (contractError || !contract) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }

    if (contract.status !== 'pending_signature') {
      return NextResponse.json(
        { error: 'Contract is not pending signature' },
        { status: 400 }
      );
    }

    // Rate limiting: Check recent verification codes for this contract
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    
    const { data: recentCodes, error: recentCodesError } = await supabase
      .from('verification_codes')
      .select('id')
      .eq('contract_id', contractId)
      .gte('created_at', fifteenMinutesAgo);

    if (recentCodesError) {
      console.error('Error checking recent codes:', recentCodesError);
    }

    if (recentCodes && recentCodes.length >= 5) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded. Please wait 15 minutes before requesting a new code.',
          retryAfter: 900 // 15 minutes in seconds
        },
        { status: 429 }
      );
    }

    // Generate verification code
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now

    // Get client IP and user agent
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Store verification code
    const { error: insertError } = await supabase
      .from('verification_codes')
      .insert({
        contract_id: contractId,
        email: email,
        code: code,
        expires_at: expiresAt.toISOString(),
        ip_address: ipAddress,
        user_agent: userAgent
      });

    if (insertError) {
      console.error('Error storing verification code:', insertError);
      return NextResponse.json(
        { error: 'Failed to generate verification code' },
        { status: 500 }
      );
    }

    // TODO: Send email with verification code
    // For MVP, we'll log the code (in production, integrate with email service)
    console.log(`Verification code for ${email}: ${code}`);
    console.log(`Contract UUID: ${contract.uuid}`);
    console.log(`Expires at: ${expiresAt.toISOString()}`);

    // Send email using Supabase-based email service
    const emailResult = await sendVerificationEmail(
      email,
      code,
      contract.contractor_name
    );

    if (!emailResult.success) {
      console.error('Failed to send email:', emailResult.error);
      // Don't fail the request if email fails - code is still stored
    }

    // In development, return the code for testing
    // In production, remove this and only send via email
    const isDevelopment = process.env.NODE_ENV === 'development';

    return NextResponse.json({
      success: true,
      message: 'Verification code sent to email',
      expiresAt: expiresAt.toISOString(),
      ...(isDevelopment && { code }) // Only include code in development
    });

  } catch (error) {
    console.error('Unexpected error in POST /api/signatures/email/send:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
