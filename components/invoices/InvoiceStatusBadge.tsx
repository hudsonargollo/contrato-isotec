/**
 * Invoice Status Badge Component
 * Displays invoice status with appropriate styling
 * Requirements: 4.4 - Invoice status tracking
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  Send, 
  FileText,
  DollarSign
} from 'lucide-react';

interface InvoiceStatusBadgeProps {
  status: string;
  className?: string;
}

export function InvoiceStatusBadge({ status, className }: InvoiceStatusBadgeProps) {
  const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft':
        return {
          label: 'Draft',
          variant: 'secondary' as const,
          icon: <FileText className="h-3 w-3" />,
          className: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        };
      
      case 'pending_approval':
        return {
          label: 'Pending Approval',
          variant: 'secondary' as const,
          icon: <Clock className="h-3 w-3" />,
          className: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
        };
      
      case 'approved':
        return {
          label: 'Approved',
          variant: 'secondary' as const,
          icon: <CheckCircle className="h-3 w-3" />,
          className: 'bg-green-100 text-green-700 hover:bg-green-200'
        };
      
      case 'sent':
        return {
          label: 'Sent',
          variant: 'default' as const,
          icon: <Send className="h-3 w-3" />,
          className: 'bg-blue-100 text-blue-700 hover:bg-blue-200'
        };
      
      case 'paid':
        return {
          label: 'Paid',
          variant: 'secondary' as const,
          icon: <DollarSign className="h-3 w-3" />,
          className: 'bg-green-100 text-green-700 hover:bg-green-200'
        };
      
      case 'overdue':
        return {
          label: 'Overdue',
          variant: 'destructive' as const,
          icon: <AlertCircle className="h-3 w-3" />,
          className: 'bg-red-100 text-red-700 hover:bg-red-200'
        };
      
      case 'cancelled':
        return {
          label: 'Cancelled',
          variant: 'secondary' as const,
          icon: <XCircle className="h-3 w-3" />,
          className: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        };
      
      default:
        return {
          label: status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' '),
          variant: 'secondary' as const,
          icon: <FileText className="h-3 w-3" />,
          className: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Badge 
      variant={config.variant}
      className={`inline-flex items-center gap-1 ${config.className} ${className}`}
    >
      {config.icon}
      {config.label}
    </Badge>
  );
}