/**
 * Currency Formatting Utilities
 * 
 * Utility functions for formatting currency values across different locales
 * and currencies used in the SaaS platform.
 */

export function formatCurrency(
  amount: number, 
  currency: string = 'BRL', 
  locale: string = 'pt-BR'
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  } catch (error) {
    // Fallback for unsupported currencies/locales
    const symbol = getCurrencySymbol(currency);
    return `${symbol}${amount.toFixed(2)}`;
  }
}

export function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    BRL: 'R$',
    USD: '$',
    EUR: '€',
    GBP: '£'
  };
  
  return symbols[currency] || currency;
}

export function parseCurrency(value: string, currency: string = 'BRL'): number {
  // Remove currency symbols and formatting
  const cleanValue = value
    .replace(/[^\d.,\-]/g, '')
    .replace(',', '.');
  
  return parseFloat(cleanValue) || 0;
}