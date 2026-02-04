/**
 * Contract PDF Generation API Route
 * GET /api/contracts/[id]/pdf - Generate and serve PDF for a contract
 * 
 * This endpoint validates admin authentication, fetches the complete contract
 * data including items and audit logs, generates a PDF buffer using the
 * ContractPDF component, and returns it with proper headers for download.
 * 
 * Requirements: 9.6
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { ContractPDF } from '@/lib/pdf/ContractPDF';
import React from 'react';

/**
 * GET /api/contracts/[id]/pdf
 * Generate and download contract PDF
 * 
 * This endpoint:
 * 1. Validates admin authentication
 * 2. Fetches contract with items and audit logs
 * 3. Generates PDF buffer using @react-pdf/renderer
 * 4. Returns PDF with proper Content-Type and Content-Disposition headers
 * 
 * Validates: Requirements 9.6
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get Supabase client
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check admin role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || !['admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Fetch contract with items
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select('*, contract_items(*)')
      .eq('id', id)
      .single();

    if (contractError) {
      if (contractError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Contract not found' },
          { status: 404 }
        );
      }
      
      console.error('Contract fetch error:', contractError);
      return NextResponse.json(
        { error: 'Failed to fetch contract', details: contractError.message },
        { status: 500 }
      );
    }

    // Fetch audit logs for signature data
    const { data: auditLogs, error: auditError } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('contract_id', id)
      .eq('event_type', 'signature_completed')
      .order('created_at', { ascending: false })
      .limit(1);

    if (auditError) {
      console.error('Audit logs fetch error:', auditError);
      // Don't fail the request if audit logs can't be fetched
    }

    // Transform database data to ContractPDF format
    const contractData = {
      // Contractor Information
      contractorName: contract.contractor_name,
      contractorCPF: contract.contractor_cpf,
      contractorEmail: contract.contractor_email || undefined,
      contractorPhone: contract.contractor_phone || undefined,

      // Installation Address
      addressCEP: contract.address_cep,
      addressStreet: contract.address_street,
      addressNumber: contract.address_number,
      addressComplement: contract.address_complement || undefined,
      addressNeighborhood: contract.address_neighborhood,
      addressCity: contract.address_city,
      addressState: contract.address_state,

      // Geographic Location (optional)
      locationLatitude: contract.location_latitude || undefined,
      locationLongitude: contract.location_longitude || undefined,

      // Project Specifications
      projectKWp: parseFloat(contract.project_kwp),
      installationDate: contract.installation_date ? new Date(contract.installation_date) : undefined,

      // Equipment Items
      items: (contract.contract_items || [])
        .sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)
        .map((item: { item_name: string; quantity: number; unit: string }) => ({
          itemName: item.item_name,
          quantity: item.quantity,
          unit: item.unit
        })),

      // Services
      services: Array.isArray(contract.services) ? contract.services : [],

      // Financial Information
      contractValue: parseFloat(contract.contract_value),
      paymentMethod: contract.payment_method as 'pix' | 'cash' | 'credit',

      // Metadata
      createdAt: new Date(contract.created_at),

      // Signature Information (if contract is signed)
      signatureData: auditLogs && auditLogs.length > 0 ? {
        contractHash: auditLogs[0].contract_hash,
        signedAt: new Date(auditLogs[0].created_at),
        signatureMethod: auditLogs[0].signature_method as 'govbr' | 'email',
        signerIdentifier: auditLogs[0].signer_identifier || undefined
      } : undefined
    };

    // Generate PDF buffer
    const pdfElement = React.createElement(ContractPDF, { data: contractData });
    // Type assertion needed because ContractPDF returns a Document component
    // which is valid for renderToBuffer but TypeScript doesn't recognize the type compatibility
    const pdfBuffer = await renderToBuffer(pdfElement as any);

    // Generate filename with contractor name and date
    const sanitizedName = contract.contractor_name
      .replace(/[^a-zA-Z0-9]/g, '_')
      .substring(0, 50);
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `contrato_${sanitizedName}_${dateStr}.pdf`;

    // Convert Buffer to Uint8Array for NextResponse
    const pdfBytes = new Uint8Array(pdfBuffer);

    // Return PDF with proper headers
    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBytes.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('Unexpected error in GET /api/contracts/[id]/pdf:', error);
    
    // Check if it's a PDF rendering error
    if (error instanceof Error && error.message.includes('render')) {
      return NextResponse.json(
        { error: 'Failed to generate PDF', details: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
