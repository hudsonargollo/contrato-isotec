/**
 * Invoice Delivery Manager Component
 * Manages invoice delivery settings and sending
 * Requirements: 4.4 - Automated invoice delivery system management
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Send, 
  Mail, 
  Calendar, 
  Settings, 
  Clock,
  CheckCircle,
  AlertCircle,
  Download,
  Eye,
  Plus,
  X
} from 'lucide-react';
import { InvoiceStatusBadge } from './InvoiceStatusBadge';
import { formatDate, formatCurrency } from '@/lib/utils';

interface DeliveryPreferences {
  auto_send_new_invoices: boolean;
  send_payment_reminders: boolean;
  reminder_days_before_due: number[];
  send_overdue_notices: boolean;
  overdue_notice_frequency: number;
  include_pdf_attachment: boolean;
  include_payment_link: boolean;
  cc_emails?: string[];
  bcc_emails?: string[];
}

interface DeliveryHistory {
  id: string;
  delivery_method: string;
  recipients: string[];
  status: string;
  delivered_at?: string;
  failed_recipients?: Array<{ email: string; error: string }>;
  created_at: string;
}

interface InvoiceDeliveryManagerProps {
  invoice: {
    id: string;
    invoice_number: string;
    customer_name: string;
    customer_email?: string;
    total_amount: number;
    currency: string;
    status: string;
    due_date: string;
    sent_at?: string;
    sent_to?: string[];
  };
  onDeliveryComplete?: () => void;
}

export function InvoiceDeliveryManager({ invoice, onDeliveryComplete }: InvoiceDeliveryManagerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Delivery form state
  const [recipients, setRecipients] = useState<string[]>(
    invoice.customer_email ? [invoice.customer_email] : []
  );
  const [subject, setSubject] = useState(`Invoice ${invoice.invoice_number}`);
  const [message, setMessage] = useState('');
  const [includePdf, setIncludePdf] = useState(true);
  const [includePaymentLink, setIncludePaymentLink] = useState(true);
  const [scheduleAt, setScheduleAt] = useState('');
  
  // Settings state
  const [preferences, setPreferences] = useState<DeliveryPreferences>({
    auto_send_new_invoices: false,
    send_payment_reminders: true,
    reminder_days_before_due: [7, 3, 1],
    send_overdue_notices: true,
    overdue_notice_frequency: 7,
    include_pdf_attachment: true,
    include_payment_link: true
  });
  
  // History state
  const [deliveryHistory, setDeliveryHistory] = useState<DeliveryHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    loadDeliveryPreferences();
    loadDeliveryHistory();
  }, []);

  const loadDeliveryPreferences = async () => {
    try {
      const response = await fetch('/api/settings/delivery-preferences');
      if (response.ok) {
        const data = await response.json();
        setPreferences(data.preferences);
      }
    } catch (error) {
      console.error('Failed to load delivery preferences:', error);
    }
  };

  const loadDeliveryHistory = async () => {
    try {
      const response = await fetch(`/api/invoices/${invoice.id}/send`);
      if (response.ok) {
        const data = await response.json();
        setDeliveryHistory(data.delivery_history || []);
      }
    } catch (error) {
      console.error('Failed to load delivery history:', error);
    }
  };

  const handleSendInvoice = async () => {
    if (recipients.length === 0) {
      setError('At least one recipient is required');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/invoices/${invoice.id}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipients,
          subject,
          message,
          include_pdf: includePdf,
          include_payment_link: includePaymentLink,
          schedule_at: scheduleAt || undefined
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send invoice');
      }

      if (result.scheduled) {
        setSuccess(`Invoice scheduled for delivery on ${formatDate(result.scheduled_at)}`);
      } else {
        setSuccess(`Invoice sent successfully to ${result.delivered_to.length} recipient(s)`);
      }

      // Reload history and notify parent
      await loadDeliveryHistory();
      onDeliveryComplete?.();

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to send invoice');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendReminder = async (reminderType: 'gentle' | 'urgent' | 'final') => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/invoices/${invoice.id}/reminder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reminder_type: reminderType,
          custom_message: message
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send reminder');
      }

      setSuccess(`Payment reminder sent successfully`);
      await loadDeliveryHistory();

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to send reminder');
    } finally {
      setIsLoading(false);
    }
  };

  const addRecipient = () => {
    setRecipients([...recipients, '']);
  };

  const updateRecipient = (index: number, email: string) => {
    const updated = [...recipients];
    updated[index] = email;
    setRecipients(updated);
  };

  const removeRecipient = (index: number) => {
    setRecipients(recipients.filter((_, i) => i !== index));
  };

  const isOverdue = new Date(invoice.due_date) < new Date();
  const canSend = ['draft', 'approved', 'sent'].includes(invoice.status);

  return (
    <div className="space-y-6">
      {/* Invoice Summary */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Invoice Delivery
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                {invoice.invoice_number} - {invoice.customer_name}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <InvoiceStatusBadge status={invoice.status} />
              {isOverdue && (
                <Badge variant="destructive">Overdue</Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Amount</p>
              <p className="font-semibold">{formatCurrency(invoice.total_amount, invoice.currency)}</p>
            </div>
            <div>
              <p className="text-gray-600">Due Date</p>
              <p className="font-semibold">{formatDate(invoice.due_date)}</p>
            </div>
            <div>
              <p className="text-gray-600">Last Sent</p>
              <p className="font-semibold">
                {invoice.sent_at ? formatDate(invoice.sent_at) : 'Never'}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Recipients</p>
              <p className="font-semibold">
                {invoice.sent_to?.length || 0} recipient(s)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Send Invoice Form */}
      {canSend && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Send Invoice
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Recipients */}
            <div>
              <Label>Recipients</Label>
              <div className="space-y-2 mt-2">
                {recipients.map((email, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      type="email"
                      placeholder="Enter email address"
                      value={email}
                      onChange={(e) => updateRecipient(index, e.target.value)}
                      className="flex-1"
                    />
                    {recipients.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeRecipient(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addRecipient}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Recipient
                </Button>
              </div>
            </div>

            {/* Subject */}
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email subject"
              />
            </div>

            {/* Message */}
            <div>
              <Label htmlFor="message">Custom Message (Optional)</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Add a personal message to include in the email"
                rows={3}
              />
            </div>

            {/* Options */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="include-pdf">Include PDF Attachment</Label>
                <Switch
                  id="include-pdf"
                  checked={includePdf}
                  onCheckedChange={setIncludePdf}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="include-payment-link">Include Payment Link</Label>
                <Switch
                  id="include-payment-link"
                  checked={includePaymentLink}
                  onCheckedChange={setIncludePaymentLink}
                />
              </div>
            </div>

            {/* Schedule Delivery */}
            <div>
              <Label htmlFor="schedule-at">Schedule Delivery (Optional)</Label>
              <Input
                id="schedule-at"
                type="datetime-local"
                value={scheduleAt}
                onChange={(e) => setScheduleAt(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>

            {/* Send Button */}
            <Button
              onClick={handleSendInvoice}
              disabled={isLoading || recipients.length === 0}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  {scheduleAt ? 'Scheduling...' : 'Sending...'}
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  {scheduleAt ? 'Schedule Delivery' : 'Send Now'}
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      {invoice.status === 'sent' && (
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSendReminder('gentle')}
                disabled={isLoading}
              >
                <Mail className="h-4 w-4 mr-2" />
                Send Gentle Reminder
              </Button>
              
              {isOverdue && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSendReminder('urgent')}
                    disabled={isLoading}
                  >
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Send Urgent Reminder
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSendReminder('final')}
                    disabled={isLoading}
                  >
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Send Final Notice
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={() => setShowHistory(!showHistory)}
        >
          <Eye className="h-4 w-4 mr-2" />
          {showHistory ? 'Hide' : 'Show'} Delivery History
        </Button>
        
        <Button
          variant="outline"
          onClick={() => setShowSettings(!showSettings)}
        >
          <Settings className="h-4 w-4 mr-2" />
          {showSettings ? 'Hide' : 'Show'} Settings
        </Button>
      </div>

      {/* Delivery History */}
      {showHistory && (
        <Card>
          <CardHeader>
            <CardTitle>Delivery History</CardTitle>
          </CardHeader>
          <CardContent>
            {deliveryHistory.length === 0 ? (
              <p className="text-gray-600 text-center py-4">
                No delivery history available
              </p>
            ) : (
              <div className="space-y-4">
                {deliveryHistory.map((delivery) => (
                  <div key={delivery.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium">
                          {delivery.delivery_method.toUpperCase()} Delivery
                        </p>
                        <p className="text-sm text-gray-600">
                          {formatDate(delivery.created_at)}
                        </p>
                      </div>
                      <Badge 
                        variant={delivery.status === 'sent' ? 'default' : 'destructive'}
                      >
                        {delivery.status}
                      </Badge>
                    </div>
                    
                    <div className="text-sm space-y-1">
                      <p>
                        <strong>Recipients:</strong> {delivery.recipients.join(', ')}
                      </p>
                      {delivery.delivered_at && (
                        <p>
                          <strong>Delivered:</strong> {formatDate(delivery.delivered_at)}
                        </p>
                      )}
                      {delivery.failed_recipients && delivery.failed_recipients.length > 0 && (
                        <div>
                          <strong>Failed Recipients:</strong>
                          <ul className="list-disc list-inside ml-4 text-red-600">
                            {delivery.failed_recipients.map((failed, index) => (
                              <li key={index}>
                                {failed.email}: {failed.error}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Delivery Settings */}
      {showSettings && (
        <Card>
          <CardHeader>
            <CardTitle>Delivery Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Auto-send New Invoices</Label>
                <p className="text-sm text-gray-600">
                  Automatically send invoices when they are approved
                </p>
              </div>
              <Switch
                checked={preferences.auto_send_new_invoices}
                onCheckedChange={(checked) =>
                  setPreferences({ ...preferences, auto_send_new_invoices: checked })
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label>Send Payment Reminders</Label>
                <p className="text-sm text-gray-600">
                  Send automatic payment reminders before due date
                </p>
              </div>
              <Switch
                checked={preferences.send_payment_reminders}
                onCheckedChange={(checked) =>
                  setPreferences({ ...preferences, send_payment_reminders: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Send Overdue Notices</Label>
                <p className="text-sm text-gray-600">
                  Send automatic notices for overdue invoices
                </p>
              </div>
              <Switch
                checked={preferences.send_overdue_notices}
                onCheckedChange={(checked) =>
                  setPreferences({ ...preferences, send_overdue_notices: checked })
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label>Include PDF Attachment</Label>
                <p className="text-sm text-gray-600">
                  Always include PDF attachment in emails
                </p>
              </div>
              <Switch
                checked={preferences.include_pdf_attachment}
                onCheckedChange={(checked) =>
                  setPreferences({ ...preferences, include_pdf_attachment: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Include Payment Link</Label>
                <p className="text-sm text-gray-600">
                  Always include payment link in emails
                </p>
              </div>
              <Switch
                checked={preferences.include_payment_link}
                onCheckedChange={(checked) =>
                  setPreferences({ ...preferences, include_payment_link: checked })
                }
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}