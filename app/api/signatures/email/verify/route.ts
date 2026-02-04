/**
 * Email Signature Verify API Route
 * POST /api/signatures/email/verify - Verify code and complete signature
 * 
 * Requirements: 5.2, 5.3, 5.4, 5.5
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { emailVerificationCodeSchema } from '@/lib/types/schemas';
import { generateContractHash } from '@/lib/services/contract-hash';
import { createAuditLog } from '@/lib/services/audit-log';
import { sendContractSignedNotification } from '@/lib/services/email';
import { Contract } from '@/lib/types';

/**
 * POST /api/signatures/email/verify
 * Verify code and complete contract signature
 * Validates: Requirements 5.2, 5.3, 5.4, 5.5
 */
export async function POST(request: NextRequest) {
  try {
    // Get Supabase client (no auth required for public signature)
    const supabase = await createClient();

    // Parse and validate request body
    const body = await request.json();
    const validationResult = emailVerificationCodeSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: validationResult.error.errors 
        },
        { status: 400 }
      );
    }

    const { code, contractId } = validationResult.data;

    // Get client IP and user agent
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Find valid verification code
    const { data: verificationCodes, error: codeError } = await supabase
      .from('verification_codes')
      .select('*')
      .eq('contract_id', contractId)
      .eq('code', code)
      .eq('verified', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1);

    if (codeError) {
      console.error('Error fetching verification code:', codeError);
      return NextResponse.json(
        { error: 'Failed to verify code' },
        { status: 500 }
      );
    }

    if (!verificationCodes || verificationCodes.length === 0) {
      return NextResponse.json(
        { error: 'Invalid or expired verification code' },
        { status: 400 }
      );
    }

    const verificationCode = verificationCodes[0];

    // Check if max attempts exceeded
    if (verificationCode.attempts >= verificationCode.max_attempts) {
      return NextResponse.json(
        { error: 'Maximum verification attempts exceeded' },
        { status: 429 }
      );
    }

    // Increment attempts
    await supabase
      .from('verification_codes')
      .update({ attempts: verificationCode.attempts + 1 })
      .eq('id', verificationCode.id);

    // Fetch contract with items
    const { data: contractData, error: contractError } = await supabase
      .from('contracts')
      .select('*, contract_items(*)')
      .eq('id', contractId)
      .single();

    if (contractError || !contractData) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }

    // Check if contract is pending signature
    if (contractData.status !== 'pending_signature') {
      return NextResponse.json(
        { error: 'Contract is not pending signature' },
        { status: 400 }
      );
    }

    // Transform database contract to Contract type for hashing
    const contract: Contract = {
      id: contractData.id,
      uuid: contractData.uuid,
      contractorName: contractData.contractor_name,
      contractorCPF: contractData.contractor_cpf,
      contractorEmail: contractData.contractor_email,
      contractorPhone: contractData.contractor_phone,
      addressCEP: contractData.address_cep,
      addressStreet: contractData.address_street,
      addressNumber: contractData.address_number,
      addressComplement: contractData.address_complement,
      addressNeighborhood: contractData.address_neighborhood,
      addressCity: contractData.address_city,
      addressState: contractData.address_state,
      locationLatitude: contractData.location_latitude ? parseFloat(contractData.location_latitude) : undefined,
      locationLongitude: contractData.location_longitude ? parseFloat(contractData.location_longitude) : undefined,
      projectKWp: parseFloat(contractData.project_kwp),
      installationDate: contractData.installation_date ? new Date(contractData.installation_date) : undefined,
      services: contractData.services,
      items: contractData.contract_items?.map((item: any) => ({
        id: item.id,
        contractId: item.contract_id,
        itemName: item.item_name,
        quantity: item.quantity,
        unit: item.unit,
        sortOrder: item.sort_order,
        createdAt: new Date(item.created_at)
      })),
      contractValue: parseFloat(contractData.contract_value),
      paymentMethod: contractData.payment_method,
      status: contractData.status,
      contractHash: contractData.contract_hash,
      createdBy: contractData.created_by,
      createdAt: new Date(contractData.created_at),
      updatedAt: new Date(contractData.updated_at),
      signedAt: contractData.signed_at ? new Date(contractData.signed_at) : undefined
    };

    // Generate contract hash
    const contractHash = generateContractHash(contract);

    // Update contract status to signed
    const signedAt = new Date();
    const { error: updateError } = await supabase
      .from('contracts')
      .update({
        status: 'signed',
        contract_hash: contractHash,
        signed_at: signedAt.toISOString()
      })
      .eq('id', contractId);

    if (updateError) {
      console.error('Error updating contract:', updateError);
      return NextResponse.json(
        { error: 'Failed to update contract status' },
        { status: 500 }
      );
    }

    // Mark verification code as verified
    await supabase
      .from('verification_codes')
      .update({
        verified: true,
        verified_at: signedAt.toISOString()
      })
      .eq('id', verificationCode.id);

    // Create audit log entry
    try {
      await createAuditLog({
        contractId: contractId,
        eventType: 'signature_completed',
        signatureMethod: 'email',
        contractHash: contractHash,
        signerIdentifier: verificationCode.email,
        ipAddress: ipAddress,
        userAgent: userAgent
      }, true); // Use server client
    } catch (auditError) {
      console.error('Error creating audit log:', auditError);
      // Don't fail the request if audit log creation fails
    }

    // Send confirmation email
    try {
      await sendContractSignedNotification(
        verificationCode.email,
        contractData.uuid,
        contractData.contractor_name
      );
    } catch (emailError) {
      console.error('Error sending confirmation email:', emailError);
      // Don't fail the request if email fails
    }

    // Return success response
    return NextResponse.json({
      success: true,
      contract: {
        id: contractId,
        uuid: contractData.uuid,
        status: 'signed',
        signedAt: signedAt.toISOString(),
        contractHash: contractHash
      }
    });

  } catch (error) {
    console.error('Unexpected error in POST /api/signatures/email/verify:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
