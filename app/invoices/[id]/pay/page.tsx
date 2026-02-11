/**
 * Customer Invoice Payment Portal
 * Public page for customers to view and pay invoices
 * Requirements: 4.4 - Customer invoice portal
 */

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { InvoicePaymentPortal } from '@/components/invoices/InvoicePaymentPortal';
import { InvoiceViewerSkeleton } from '@/components/invoices/InvoiceViewerSkeleton';

interface InvoicePaymentPageProps {
  params: {
    id: string;
  };
  searchParams: {
    token?: string;
  };
}

async function getInvoiceForPayment(invoiceId: string, token?: string) {
  const supabase = createClient();

  // If token is provided, verify it and get invoice
  if (token) {
    const { data: tokenData, error: tokenError } = await supabase
      .from('invoice_payment_tokens')
      .select('invoice_id, expires_at')
      .eq('token', token)
      .eq('invoice_id', invoiceId)
      .single();

    if (tokenError || !tokenData) {
      return null;
    }

    // Check if token is expired
    if (new Date(tokenData.expires_at) < new Date()) {
      return null;
    }
  }

  // Get invoice data (public access for payment)
  const { data: invoice, error } = await supabase
    .from('invoices')
    .select(`
      id,
      invoice_number,
      customer_name,
      customer_email,
      customer_phone,
      customer_address,
      items,
      subtotal,
      discount_amount,
      tax_amount,
      total_amount,
      currency,
      payment_terms,
      due_date,
      status,
      notes,
      footer_text,
      created_at,
      tenant_id,
      template:invoice_templates(
        name,
        primary_color,
        secondary_color,
        header_logo_url
      ),
      tenant:tenants(
        name,
        branding,
        settings
      ),
      payments:payment_records(
        id,
        amount,
        payment_method,
        payment_date,
        status
      )
    `)
    .eq('id', invoiceId)
    .in('status', ['sent', 'approved', 'overdue']) // Only allow payment for these statuses
    .single();

  if (error) {
    return null;
  }

  return invoice;
}

export default async function InvoicePaymentPage({
  params,
  searchParams
}: InvoicePaymentPageProps) {
  const invoice = await getInvoiceForPayment(params.id, searchParams.token);

  if (!invoice) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <Suspense fallback={<InvoiceViewerSkeleton />}>
          <InvoicePaymentPortal 
            invoice={invoice}
            paymentToken={searchParams.token}
          />
        </Suspense>
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  const invoice = await getInvoiceForPayment(params.id);
  
  if (!invoice) {
    return {
      title: 'Invoice Not Found'
    };
  }

  return {
    title: `Invoice ${invoice.invoice_number} - ${invoice.tenant.name}`,
    description: `Pay invoice ${invoice.invoice_number} for ${invoice.customer_name}`,
    robots: 'noindex, nofollow' // Prevent indexing of payment pages
  };
}