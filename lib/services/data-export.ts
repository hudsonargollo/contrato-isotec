/**
 * Data Export Service for LGPD Compliance
 * 
 * Provides functionality for users to export their personal data
 * in compliance with LGPD (Lei Geral de Proteção de Dados) requirements.
 * 
 * Requirements: 11.6
 */

import { createClient } from '@/lib/supabase/server';

export interface ContractorDataExport {
  personalInfo: {
    name: string;
    cpf: string;
    email?: string;
    phone?: string;
  };
  contracts: Array<{
    id: string;
    uuid: string;
    createdAt: string;
    status: string;
    address: {
      cep: string;
      street: string;
      number: string;
      complement?: string;
      neighborhood: string;
      city: string;
      state: string;
    };
    location?: {
      latitude: number;
      longitude: number;
    };
    project: {
      kwp: number;
      installationDate?: string;
    };
    financial: {
      value: number;
      paymentMethod: string;
    };
    signedAt?: string;
  }>;
  auditLogs: Array<{
    eventType: string;
    signatureMethod: string;
    timestamp: string;
    ipAddress: string;
  }>;
  exportedAt: string;
}

/**
 * Exports all personal data for a contractor identified by CPF
 * 
 * @param cpf - Contractor's CPF (with or without formatting)
 * @returns Complete data export or null if no data found
 */
export async function exportContractorData(
  cpf: string
): Promise<ContractorDataExport | null> {
  const supabase = await createClient();
  
  // Sanitize CPF
  const sanitizedCPF = cpf.replace(/\D/g, '');
  
  // Fetch all contracts for this CPF
  const { data: contracts, error: contractsError } = await supabase
    .from('contracts')
    .select(`
      id,
      uuid,
      contractor_name,
      contractor_cpf,
      contractor_email,
      contractor_phone,
      address_cep,
      address_street,
      address_number,
      address_complement,
      address_neighborhood,
      address_city,
      address_state,
      location_latitude,
      location_longitude,
      project_kwp,
      installation_date,
      contract_value,
      payment_method,
      status,
      created_at,
      signed_at
    `)
    .eq('contractor_cpf', sanitizedCPF)
    .order('created_at', { ascending: false });

  if (contractsError || !contracts || contracts.length === 0) {
    return null;
  }

  // Get contract IDs for audit log lookup
  const contractIds = contracts.map(c => c.id);

  // Fetch audit logs for all contracts
  const { data: auditLogs } = await supabase
    .from('audit_logs')
    .select('contract_id, event_type, signature_method, created_at, ip_address')
    .in('contract_id', contractIds)
    .order('created_at', { ascending: false });

  // Build export data structure
  const exportData: ContractorDataExport = {
    personalInfo: {
      name: contracts[0].contractor_name,
      cpf: contracts[0].contractor_cpf,
      email: contracts[0].contractor_email || undefined,
      phone: contracts[0].contractor_phone || undefined,
    },
    contracts: contracts.map(contract => ({
      id: contract.id,
      uuid: contract.uuid,
      createdAt: contract.created_at,
      status: contract.status,
      address: {
        cep: contract.address_cep,
        street: contract.address_street,
        number: contract.address_number,
        complement: contract.address_complement || undefined,
        neighborhood: contract.address_neighborhood,
        city: contract.address_city,
        state: contract.address_state,
      },
      location: contract.location_latitude && contract.location_longitude
        ? {
            latitude: parseFloat(contract.location_latitude),
            longitude: parseFloat(contract.location_longitude),
          }
        : undefined,
      project: {
        kwp: parseFloat(contract.project_kwp),
        installationDate: contract.installation_date || undefined,
      },
      financial: {
        value: parseFloat(contract.contract_value),
        paymentMethod: contract.payment_method,
      },
      signedAt: contract.signed_at || undefined,
    })),
    auditLogs: (auditLogs || []).map(log => ({
      eventType: log.event_type,
      signatureMethod: log.signature_method,
      timestamp: log.created_at,
      ipAddress: log.ip_address,
    })),
    exportedAt: new Date().toISOString(),
  };

  return exportData;
}

/**
 * Generates a JSON file download for contractor data export
 * 
 * @param cpf - Contractor's CPF
 * @returns JSON string ready for download
 */
export async function generateDataExportJSON(cpf: string): Promise<string | null> {
  const data = await exportContractorData(cpf);
  
  if (!data) {
    return null;
  }
  
  return JSON.stringify(data, null, 2);
}
