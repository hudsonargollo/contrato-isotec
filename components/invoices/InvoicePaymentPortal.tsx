/**
 * Invoice Payment Portal Component
 * Customer-facing interface for viewing and paying invoices
 * Requirements: 4.4 - Customer invoice portal
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CreditCard, 
  Download, 
  Calendar, 
  Mail, 
  Phone, 
  MapPin,
  CheckCircle,
  AlertCircle,
  Clock,
  Building
} from 'lucide-react';
import { PaymentMethodSelector } from './PaymentMethodSelector';
import { InvoiceStatusBadge } from './InvoiceStatusBadge';
import { formatCurrency, formatDate } from '@/lib/utils';

interface InvoicePaymentPortalProps {
  invoice: {
    id: string;
    invoice_number: string;
    customer_name: string;
    customer_email?: string;
    customer_phone?: string;
    customer_address?: any;
    items: any[];
    subtotal: number;
    discount_amount: number;
    tax_amount: number;
    total_amount: number;
    currency: string;
    payment_terms: string;
    due_date: string;
    status: string;
    notes?: string;
    footer_text?: string;
    created_at: string;
    tenant_id: string;
    template?: {
      name: string;
      primary_color?: string;
      secondary_color?: string;
      header_logo_url?: string;
    };
    tenant: {
      name: string;
      branding?: any;
      settings?: any;
    };
    payments?: Array<{
      id: string;
      amount: number;
      payment_method: string;
      payment_date: string;
      status: string;
    }>;
  };
  paymentToken?: string;
}

export function InvoicePaymentPortal({ invoice, paymentToken }: InvoicePaymentPortalProps) {
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');

  // Calculate payment status
  const totalPaid = invoice.payments?.reduce((sum, payment) => 
    payment.status === 'completed' ? sum + payment.amount : sum, 0
  ) || 0;
  const remainingAmount = invoice.total_amount - totalPaid;
  const isFullyPaid = remainingAmount <= 0;
  const isOverdue = new Date(invoice.due_date) < new Date() && !isFullyPaid;

  // Get branding colors
  const primaryColor = invoice.template?.primary_color || invoice.tenant.branding?.primary_color || '#007bff';
  const secondaryColor = invoice.template?.secondary_color || invoice.tenant.branding?.secondary_color || '#6c757d';

  const handlePayment = async () => {
    if (!selectedPaymentMethod) {
      setPaymentError('Please select a payment method');
      return;
    }

    setIsProcessingPayment(true);
    setPaymentError(null);

    try {
      const response = await fetch(`/api/invoices/${invoice.id}/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payment_method: selectedPaymentMethod,
          amount: remainingAmount,
          token: paymentToken
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Payment failed');
      }

      if (result.payment_url) {
        // Redirect to payment gateway
        window.location.href = result.payment_url;
      } else {
        setPaymentSuccess(true);
      }

    } catch (error) {
      setPaymentError(error instanceof Error ? error.message : 'Payment failed');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const response = await fetch(`/api/invoices/${invoice.id}/pdf`, {
        method: 'GET',
        headers: paymentToken ? { 'Authorization': `Bearer ${paymentToken}` } : {}
      });

      if (!response.ok) {
        throw new Error('Failed to download PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoice.invoice_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (error) {
      console.error('Failed to download PDF:', error);
    }
  };

  if (paymentSuccess) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-green-700 mb-2">Payment Successful!</h1>
              <p className="text-gray-600 mb-6">
                Your payment has been processed successfully. You will receive a confirmation email shortly.
              </p>
              <Button onClick={() => window.print()} variant="outline">
                Print Receipt
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="text-center" style={{ backgroundColor: primaryColor, color: 'white' }}>
          {invoice.template?.header_logo_url && (
            <img 
              src={invoice.template.header_logo_url} 
              alt={invoice.tenant.name}
              className="h-12 mx-auto mb-4"
            />
          )}
          <CardTitle className="text-2xl">Invoice Payment Portal</CardTitle>
          <p className="opacity-90">{invoice.tenant.name}</p>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Invoice Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Invoice Information */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl">Invoice {invoice.invoice_number}</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    Created on {formatDate(invoice.created_at)}
                  </p>
                </div>
                <InvoiceStatusBadge status={invoice.status} />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Customer Information */}
              <div>
                <h3 className="font-semibold mb-2">Bill To:</h3>
                <div className="text-sm space-y-1">
                  <p className="font-medium">{invoice.customer_name}</p>
                  {invoice.customer_email && (
                    <p className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {invoice.customer_email}
                    </p>
                  )}
                  {invoice.customer_phone && (
                    <p className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {invoice.customer_phone}
                    </p>
                  )}
                  {invoice.customer_address && (
                    <p className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-0.5" />
                      <span>
                        {invoice.customer_address.street}<br />
                        {invoice.customer_address.city}, {invoice.customer_address.state} {invoice.customer_address.zip_code}
                      </span>
                    </p>
                  )}
                </div>
              </div>

              <Separator />

              {/* Payment Terms */}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Due: {formatDate(invoice.due_date)}</span>
                  {isOverdue && (
                    <Badge variant="destructive" className="ml-2">
                      Overdue
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>Terms: {invoice.payment_terms}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Invoice Items */}
          <Card>
            <CardHeader>
              <CardTitle>Invoice Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Description</th>
                      <th className="text-center py-2">Qty</th>
                      <th className="text-right py-2">Unit Price</th>
                      <th className="text-right py-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((item, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-3">{item.description}</td>
                        <td className="text-center py-3">{item.quantity}</td>
                        <td className="text-right py-3">
                          {formatCurrency(item.unit_price, invoice.currency)}
                        </td>
                        <td className="text-right py-3">
                          {formatCurrency(item.total_amount, invoice.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(invoice.subtotal, invoice.currency)}</span>
                </div>
                {invoice.discount_amount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount:</span>
                    <span>-{formatCurrency(invoice.discount_amount, invoice.currency)}</span>
                  </div>
                )}
                {invoice.tax_amount > 0 && (
                  <div className="flex justify-between">
                    <span>Tax:</span>
                    <span>{formatCurrency(invoice.tax_amount, invoice.currency)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>{formatCurrency(invoice.total_amount, invoice.currency)}</span>
                </div>
                {totalPaid > 0 && (
                  <>
                    <div className="flex justify-between text-green-600">
                      <span>Paid:</span>
                      <span>-{formatCurrency(totalPaid, invoice.currency)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold text-red-600">
                      <span>Amount Due:</span>
                      <span>{formatCurrency(remainingAmount, invoice.currency)}</span>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {invoice.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">{invoice.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Payment Panel */}
        <div className="space-y-6">
          {/* Payment Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">Amount Due</p>
                <p className="text-2xl font-bold" style={{ color: primaryColor }}>
                  {formatCurrency(remainingAmount, invoice.currency)}
                </p>
              </div>

              {isOverdue && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    This invoice is overdue. Please make payment as soon as possible.
                  </AlertDescription>
                </Alert>
              )}

              {!isFullyPaid ? (
                <div className="space-y-4">
                  <PaymentMethodSelector
                    value={selectedPaymentMethod}
                    onChange={setSelectedPaymentMethod}
                    currency={invoice.currency}
                  />

                  {paymentError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{paymentError}</AlertDescription>
                    </Alert>
                  )}

                  <Button
                    onClick={handlePayment}
                    disabled={isProcessingPayment || !selectedPaymentMethod}
                    className="w-full"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {isProcessingPayment ? 'Processing...' : 'Pay Now'}
                  </Button>
                </div>
              ) : (
                <div className="text-center">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                  <p className="text-green-600 font-semibold">Fully Paid</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={handleDownloadPDF}
                variant="outline"
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>

              <Button
                onClick={() => window.print()}
                variant="outline"
                className="w-full"
              >
                Print Invoice
              </Button>
            </CardContent>
          </Card>

          {/* Payment History */}
          {invoice.payments && invoice.payments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {invoice.payments.map((payment) => (
                    <div key={payment.id} className="flex justify-between items-center text-sm">
                      <div>
                        <p className="font-medium">{payment.payment_method}</p>
                        <p className="text-gray-600">{formatDate(payment.payment_date)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {formatCurrency(payment.amount, invoice.currency)}
                        </p>
                        <Badge 
                          variant={payment.status === 'completed' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {payment.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Company Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Company Information
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p className="font-medium">{invoice.tenant.name}</p>
              {invoice.tenant.settings?.address && (
                <p className="text-gray-600">{invoice.tenant.settings.address}</p>
              )}
              {invoice.tenant.settings?.phone && (
                <p className="text-gray-600">Phone: {invoice.tenant.settings.phone}</p>
              )}
              {invoice.tenant.settings?.email && (
                <p className="text-gray-600">Email: {invoice.tenant.settings.email}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      {invoice.footer_text && (
        <Card>
          <CardContent className="pt-6 text-center text-sm text-gray-600">
            <p>{invoice.footer_text}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}