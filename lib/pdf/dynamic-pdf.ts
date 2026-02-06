/**
 * Dynamic PDF Generation
 * Lazy loads PDF generation components to reduce initial bundle size
 */

// Define the contract data interface for PDF generation
interface ContractData {
  contractor_name: string;
  contractor_email: string;
  contractor_phone: string;
  contractor_cpf: string;
  contractor_rg: string;
  installation_address: string;
  installation_city: string;
  installation_state: string;
  installation_cep: string;
  installation_coordinates?: string;
  equipment_items: Array<{
    name: string;
    quantity: number;
    unit: string;
    unit_price: number;
    total_price: number;
  }>;
  service_items: Array<{
    name: string;
    description: string;
    included: boolean;
  }>;
  total_equipment_value: number;
  total_service_value: number;
  total_contract_value: number;
  signature_email?: string;
  signature_timestamp?: string;
  signature_ip?: string;
  signature_user_agent?: string;
}

// Dynamic import for PDF renderer to reduce bundle size
export const generateContractPDF = async (contractData: ContractData): Promise<Buffer> => {
  // Dynamically import PDF dependencies only when needed
  const [{ renderToBuffer }, { ContractPDF }, React] = await Promise.all([
    import('@react-pdf/renderer'),
    import('./ContractPDF'),
    import('react'),
  ]);

  // Generate PDF buffer
  // @ts-ignore - Temporary fix for type mismatch
  const pdfElement = React.createElement(ContractPDF, { data: contractData });
  const pdfBuffer = await renderToBuffer(pdfElement as any);

  return pdfBuffer;
};