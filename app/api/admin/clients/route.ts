/**
 * Admin Clients API Route
 * 
 * Provides client management endpoints for the admin panel
 * Aggregates client data from contracts
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { formatCPF } from '@/lib/validation/cpf';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Aggregate client data from contracts
    const { data: contracts, error } = await supabase
      .from('contracts')
      .select(`
        id,
        contractor_name,
        contractor_cpf,
        contractor_email,
        contractor_phone,
        address_city,
        address_state,
        contract_value,
        created_at,
        status
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch contracts' }, { status: 500 });
    }

    // Group contracts by CPF to create client records
    const clientMap = new Map();
    
    contracts?.forEach(contract => {
      const cpf = contract.contractor_cpf;
      
      if (!clientMap.has(cpf)) {
        clientMap.set(cpf, {
          id: contract.id, // Use first contract ID as client ID
          name: contract.contractor_name,
          cpf: formatCPF(cpf),
          email: contract.contractor_email,
          phone: contract.contractor_phone,
          city: contract.address_city,
          state: contract.address_state,
          contractsCount: 0,
          totalValue: 0,
          lastContractDate: contract.created_at,
          contracts: []
        });
      }
      
      const client = clientMap.get(cpf);
      client.contractsCount += 1;
      client.totalValue += contract.contract_value || 0;
      client.contracts.push(contract);
      
      // Update last contract date if this one is more recent
      if (new Date(contract.created_at) > new Date(client.lastContractDate)) {
        client.lastContractDate = contract.created_at;
      }
    });

    // Convert map to array and sort by last contract date
    const clients = Array.from(clientMap.values()).sort((a, b) => 
      new Date(b.lastContractDate).getTime() - new Date(a.lastContractDate).getTime()
    );

    return NextResponse.json({ 
      clients,
      total: clients.length 
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}