/**
 * Dashboard Utility Functions
 * Helper functions for admin dashboard formatting and display
 * 
 * Requirements: 7.2, 7.6
 */

import { formatCurrency } from '@/lib/validation/currency';

/**
 * Format date for dashboard display (relative time)
 */
export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const targetDate = new Date(date);
  const diffInMs = now.getTime() - targetDate.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMinutes < 1) {
    return 'Agora mesmo';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} min atrás`;
  } else if (diffInHours < 24) {
    return `${diffInHours}h atrás`;
  } else if (diffInDays < 7) {
    return `${diffInDays} dias atrás`;
  } else {
    return targetDate.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
}

/**
 * Format date for dashboard display (absolute time)
 */
export function formatDate(date: string | Date): string {
  const targetDate = new Date(date);
  return targetDate.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Format contract status for display
 */
export function formatContractStatus(status: string): { label: string; color: string } {
  switch (status) {
    case 'pending_signature':
      return { label: 'Aguardando Assinatura', color: 'text-yellow-400' };
    case 'signed':
      return { label: 'Assinado', color: 'text-green-400' };
    case 'cancelled':
      return { label: 'Cancelado', color: 'text-red-400' };
    default:
      return { label: 'Desconhecido', color: 'text-neutral-400' };
  }
}

/**
 * Format contract value for dashboard display
 */
export function formatContractValue(value: number): string {
  return formatCurrency(value);
}

/**
 * Get status icon for contract status
 */
export function getStatusIcon(status: string): string {
  switch (status) {
    case 'pending_signature':
      return '⏳';
    case 'signed':
      return '✅';
    case 'cancelled':
      return '❌';
    default:
      return '❓';
  }
}

/**
 * Truncate text for display
 */
export function truncateText(text: string, maxLength: number = 50): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength) + '...';
}