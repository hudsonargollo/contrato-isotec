/**
 * Supabase Edge Function: Send Email
 * 
 * This function sends emails using a third-party service (SendGrid, Resend, etc.)
 * Deploy this function to Supabase for production use.
 * 
 * Deploy command:
 * supabase functions deploy send-email
 * 
 * Set secrets:
 * supabase secrets set EMAIL_API_KEY=your_api_key
 * supabase secrets set EMAIL_FROM=noreply@isotec.com.br
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { to, subject, html, text }: EmailRequest = await req.json();

    // Validate inputs
    if (!to || !subject || !html) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, subject, html' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get environment variables
    const emailApiKey = Deno.env.get('EMAIL_API_KEY');
    const emailFrom = Deno.env.get('EMAIL_FROM') || 'noreply@isotec.com.br';
    const emailProvider = Deno.env.get('EMAIL_PROVIDER') || 'resend';

    if (!emailApiKey) {
      throw new Error('EMAIL_API_KEY not configured');
    }

    // Send email based on provider
    let response;

    if (emailProvider === 'resend') {
      // Resend API (recommended - simple and reliable)
      response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${emailApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: emailFrom,
          to: [to],
          subject,
          html,
          text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
        }),
      });
    } else if (emailProvider === 'sendgrid') {
      // SendGrid API
      response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${emailApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from: { email: emailFrom },
          subject,
          content: [
            { type: 'text/html', value: html },
            { type: 'text/plain', value: text || html.replace(/<[^>]*>/g, '') },
          ],
        }),
      });
    } else {
      throw new Error(`Unsupported email provider: ${emailProvider}`);
    }

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Email provider error:', errorData);
      throw new Error(`Failed to send email: ${response.statusText}`);
    }

    const data = await response.json();

    return new Response(
      JSON.stringify({ success: true, data }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error sending email:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to send email' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
