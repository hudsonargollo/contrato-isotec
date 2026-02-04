/**
 * Cloudflare Function: Send Email Verification Code
 */

import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  SMTP_HOST: string;
  SMTP_PORT: string;
  SMTP_USER: string;
  SMTP_PASS: string;
  SMTP_FROM: string;
  SMTP_FROM_NAME: string;
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  try {
    const { request, env } = context;
    const body = await request.json();
    const { contractId, email } = body;

    if (!contractId || !email) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

    // Verify contract exists
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select('id, contractor_name, contractor_email')
      .eq('id', contractId)
      .single();

    if (contractError || !contract) {
      return new Response(JSON.stringify({ error: 'Contract not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Store verification code
    const { error: codeError } = await supabase
      .from('verification_codes')
      .insert({
        contract_id: contractId,
        email,
        code,
        expires_at: expiresAt.toISOString(),
      });

    if (codeError) {
      return new Response(JSON.stringify({ error: codeError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Send email
    const transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: parseInt(env.SMTP_PORT),
      secure: false,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: `"${env.SMTP_FROM_NAME}" <${env.SMTP_FROM}>`,
      to: email,
      subject: 'Código de Verificação - ISOTEC',
      html: `
        <h2>Código de Verificação</h2>
        <p>Seu código de verificação é:</p>
        <h1 style="font-size: 32px; letter-spacing: 5px;">${code}</h1>
        <p>Este código expira em 15 minutos.</p>
      `,
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error sending verification code:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
