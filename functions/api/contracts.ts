/**
 * Cloudflare Function: Create Contract
 * Handles POST requests to create new contracts
 */

import { createClient } from '@supabase/supabase-js';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  try {
    const { request, env } = context;
    
    // Initialize Supabase client
    const supabase = createClient(
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Parse request body
    const body = await request.json();

    // Create contract in database
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .insert({
        contractor_name: body.contractor_name,
        contractor_cpf: body.contractor_cpf,
        contractor_email: body.contractor_email,
        contractor_phone: body.contractor_phone,
        installation_address: body.installation_address,
        installation_city: body.installation_city,
        installation_state: body.installation_state,
        installation_cep: body.installation_cep,
        installation_coordinates: body.installation_coordinates,
        system_power_kwp: body.system_power_kwp,
        estimated_generation_kwh_month: body.estimated_generation_kwh_month,
        panel_quantity: body.panel_quantity,
        panel_model: body.panel_model,
        inverter_quantity: body.inverter_quantity,
        inverter_model: body.inverter_model,
        installation_type: body.installation_type,
        structure_type: body.structure_type,
        total_value: body.total_value,
        payment_method: body.payment_method,
        installments: body.installments,
        down_payment: body.down_payment,
        monthly_installment: body.monthly_installment,
        installation_deadline_days: body.installation_deadline_days,
        warranty_years: body.warranty_years,
        includes_monitoring: body.includes_monitoring,
        includes_maintenance: body.includes_maintenance,
        status: 'pending_signature',
      })
      .select()
      .single();

    if (contractError) {
      return new Response(JSON.stringify({ error: contractError.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create contract items if provided
    if (body.items && body.items.length > 0) {
      const items = body.items.map((item: any) => ({
        contract_id: contract.id,
        ...item,
      }));

      const { error: itemsError } = await supabase
        .from('contract_items')
        .insert(items);

      if (itemsError) {
        console.error('Error creating contract items:', itemsError);
      }
    }

    // Create audit log
    await supabase.from('audit_logs').insert({
      contract_id: contract.id,
      action: 'contract_created',
      details: { contractor_name: body.contractor_name },
    });

    return new Response(JSON.stringify(contract), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error creating contract:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function onRequestGet(context: { request: Request; env: Env }) {
  try {
    const { env } = context;
    
    const supabase = createClient(
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: contracts, error } = await supabase
      .from('contracts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(contracts), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
