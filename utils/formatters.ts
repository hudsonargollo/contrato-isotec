
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const formatCPF = (value: string): string => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
};

export const formatCEP = (value: string): string => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .replace(/(-\d{3})\d+?$/, '$1');
};

// Simple utility to convert number to currency words (Brazilian Portuguese)
export const numberToWordsBRL = (value: number): string => {
  // Simplified implementation for the demo
  const formatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  const formatted = formatter.format(value);
  
  // Real apps would use a complex library like 'extenso'
  // Mocking for visual placeholder:
  return `${formatted.replace('R$', '').trim()} Reais`;
};
