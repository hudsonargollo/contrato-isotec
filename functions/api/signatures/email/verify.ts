/**
 * Cloudflare Function: Verify Email Code and Sign Contract
 */

import { createClient } from '@supabase/supabase-js';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  try {
    const { request, env } = context;
    const body = await request.json();
    const { contractId, email, code } = body;

    if (!contractId || !email || !code) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

    // Find verification code
    const { data: verification, error: verifyError } = await supabase
      .from('verification_codes')
      .select('*')
      .eq('contract_id', contractId)
      .eq('email', email)
      .eq('code', code)
      .eq('verified', false)
      .single();

    if (verifyError || !verification) {
      return new Response(JSON.stringify({ error: 'Invalid or expired code' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check expiration
    if (new Date(verification.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: 'Code has expired' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Mark as verified
    await supabase
      .from('verification_codes')
      .update({ verified: true, verified_at: new Date().toISOString() })
      .eq('id', verification.id);

    // Update contract status
    await supabase
      .from('contracts')
      .update({ 
        status: 'signed',
        contractor_signature_date: new Date().toISOString()
      })
      .eq('id', contractId);

    // Create audit log
    await supabase.from('audit_logs').insert({
      contract_id: contractId,
      action: 'contract_signed',
      details: { email, method: 'email_verification' },
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error verifying code:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
