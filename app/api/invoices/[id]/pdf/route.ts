/**
 * Invoice PDF Generation API Route
 * Generates and serves PDF for invoices
 * Requirements: 4.4 - Invoice PDF download for customer portal
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { pdfGeneratorService } from '@/lib/services/pdf-generator';
import { invoiceService } from '@/lib/services/invoice';
import { TenantContext } from '@/lib/types/tenant';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const invoiceId = params.id;
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    const supabase = createClient();

    // Check if this is a public access with token
    let tenantContext: TenantContext | null = null;

    if (token) {
      // Verify payment token for public access
      const { data: tokenData, error: tokenError } = await supabase
        .from('invoice_payment_tokens')
        .select('invoice_id, expires_at, tenant_id')
        .eq('token', token)
        .eq('invoice_id', invoiceId)
        .single();

      if (tokenError || !tokenData || new Date(tokenData.expires_at) < new Date()) {
        return NextResponse.json(
          { error: 'Invalid or expired token' },
          { status: 401 }
        );
      }

      tenantContext = {
        tenant_id: tokenData.tenant_id,
        user_id: 'public' // Public access
      };
    } else {
      // Check authenticated user access
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      // Get user's tenant context
      const { data: userTenant, error: tenantError } = await supabase
        .from('user_tenants')
        .select('tenant_id')
        .eq('user_id', user.id)
        .single();

      if (tenantError || !userTenant) {
        return NextResponse.json(
          { error: 'User tenant not found' },
          { status: 403 }
        );
      }

      tenantContext = {
        tenant_id: userTenant.tenant_id,
        user_id: user.id
      };
    }

    // Get invoice data
    const invoice = await invoiceService.getInvoice(invoiceId, tenantContext);
    
    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // Generate PDF
    const pdfResult = await pdfGeneratorService.generateInvoicePDF(
      invoice,
      tenantContext
    );

    // Return PDF as response
    return new NextResponse(pdfResult.buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${pdfResult.filename}"`,
        'Content-Length': pdfResult.size.toString(),
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}

// Generate payment token for public access to invoice PDF
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const invoiceId = params.id;
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Verify invoice exists and email matches
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('id, customer_email, tenant_id')
      .eq('id', invoiceId)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    if (invoice.customer_email?.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json(
        { error: 'Email does not match invoice customer' },
        { status: 403 }
      );
    }

    // Generate secure token
    const token = generateSecureToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store token
    const { error: tokenError } = await supabase
      .from('invoice_payment_tokens')
      .insert({
        token,
        invoice_id: invoiceId,
        tenant_id: invoice.tenant_id,
        customer_email: email,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString()
      });

    if (tokenError) {
      console.error('Failed to create payment token:', tokenError);
      return NextResponse.json(
        { error: 'Failed to generate access token' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      token,
      expires_at: expiresAt.toISOString(),
      pdf_url: `/api/invoices/${invoiceId}/pdf`,
      payment_url: `/invoices/${invoiceId}/pay?token=${token}`
    });

  } catch (error) {
    console.error('Token generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate access token' },
      { status: 500 }
    );
  }
}

function generateSecureToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 64; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}