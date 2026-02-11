/**
 * Contract Signature Request API Routes
 * 
 * API endpoints for creating and managing e-signature requests for contracts.
 * 
 * Requirements: 7.3 - E-signature integration
 */

import { NextRequest, NextResponse } from 'next/server';
import { createESignatureService, createSignatureRequestFromContract } from '@/lib/services/e-signature';
import { createContractGenerationService } from '@/lib/services/contract-generation';
import { getTenantContext } from '@/lib/utils/tenant-context';
import { 
  CreateSignatureRequest,
  CreateSigner,
  CreateSignatureField,
  ESignatureProvider
} from '@/lib/types/e-signature';

/**
 * POST /api/contracts/[id]/signature-request
 * Create a signature request for a contract
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenantContext = await getTenantContext();
    if (!tenantContext) {
      return NextResponse.json(
        { error: 'Tenant context not found' },
        { status: 401 }
      );
    }

    const contractId = params.id;
    const body = await request.json();

    // Get contract details
    const contractService = createContractGenerationService(tenantContext);
    const contract = await contractService.getGeneratedContract(contractId);
    
    if (!contract) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }

    // Create e-signature service
    const eSignatureService = createESignatureService(tenantContext);

    // Create signature request
    const provider: ESignatureProvider = body.provider || 'docusign';
    const signatureRequestData: CreateSignatureRequest = {
      ...createSignatureRequestFromContract(contract, provider),
      subject: body.subject || `Assinatura do Contrato ${contract.contract_number}`,
      message: body.message || `Por favor, assine o contrato ${contract.contract_number}.`,
      expires_at: body.expires_at ? new Date(body.expires_at) : undefined,
      reminder_enabled: body.reminder_enabled ?? true,
      reminder_delay_days: body.reminder_delay_days || 3
    };

    const signatureRequest = await eSignatureService.createSignatureRequest(signatureRequestData);

    // Add signers
    const signers = body.signers || [];
    for (const signerData of signers) {
      const signer: CreateSigner = {
        signature_request_id: signatureRequest.id,
        name: signerData.name,
        email: signerData.email,
        phone: signerData.phone,
        role: signerData.role,
        signing_order: signerData.signing_order || 1,
        auth_method: signerData.auth_method || 'email',
        require_id_verification: signerData.require_id_verification || false,
        status: 'pending'
      };

      const createdSigner = await eSignatureService.addSigner(signatureRequest.id, signer);

      // Add signature fields for this signer
      const fields = signerData.signature_fields || [];
      for (const fieldData of fields) {
        const field: CreateSignatureField = {
          signer_id: createdSigner.id,
          field_type: fieldData.field_type,
          field_name: fieldData.field_name,
          required: fieldData.required ?? true,
          page_number: fieldData.page_number || 1,
          x_position: fieldData.x_position,
          y_position: fieldData.y_position,
          width: fieldData.width,
          height: fieldData.height,
          font_size: fieldData.font_size || 12,
          font_color: fieldData.font_color || '#000000',
          background_color: fieldData.background_color,
          validation_pattern: fieldData.validation_pattern,
          validation_message: fieldData.validation_message
        };

        await eSignatureService.addSignatureField(createdSigner.id, field);
      }
    }

    // Get the complete signature request with signers
    const completeRequest = await eSignatureService.getSignatureRequestWithSigners(signatureRequest.id);

    return NextResponse.json({
      success: true,
      data: completeRequest
    });

  } catch (error) {
    console.error('Error creating signature request:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create signature request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/contracts/[id]/signature-request
 * Get signature requests for a contract
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenantContext = await getTenantContext();
    if (!tenantContext) {
      return NextResponse.json(
        { error: 'Tenant context not found' },
        { status: 401 }
      );
    }

    const contractId = params.id;
    const eSignatureService = createESignatureService(tenantContext);

    // Get signature requests for this contract
    const { requests } = await eSignatureService.listSignatureRequests({
      contract_id: contractId
    });

    return NextResponse.json({
      success: true,
      data: requests
    });

  } catch (error) {
    console.error('Error getting signature requests:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get signature requests',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}