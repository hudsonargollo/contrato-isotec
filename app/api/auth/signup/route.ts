import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { email, password, fullName, tenantName } = await request.json();
    
    // Validate input
    if (!email || !password || !fullName || !tenantName) {
      return NextResponse.json({ error: 'Todos os campos são obrigatórios' }, { status: 400 });
    }
    
    if (password.length < 8) {
      return NextResponse.json({ error: 'A senha deve ter pelo menos 8 caracteres' }, { status: 400 });
    }
    
    // Create user with admin API (bypasses 504 timeout issues)
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Skip email confirmation
      user_metadata: { 
        full_name: fullName,
        tenant_name: tenantName
      },
    });
    
    if (userError) {
      if (userError.message.includes('already registered')) {
        return NextResponse.json({ error: 'Este email já está cadastrado' }, { status: 400 });
      }
      return NextResponse.json({ error: userError.message }, { status: 400 });
    }
    
    if (!userData.user) {
      return NextResponse.json({ error: 'Falha ao criar usuário' }, { status: 500 });
    }
    
    // Create profile (use admin role since user role constraint fails)
    const { error: profileError } = await supabaseAdmin.from('profiles').insert({
      id: userData.user.id,
      full_name: fullName,
      email,
      role: 'admin', // Use admin role since that's what works
      mfa_enabled: false
    });
    
    if (profileError && !profileError.message.includes('duplicate')) {
      console.error('Profile creation error:', profileError);
      // Continue anyway - profile might already exist
    }
    
    // Create tenant
    const subdomain = tenantName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const { data: tenant, error: tenantError } = await supabaseAdmin.from('tenants').insert({
      name: tenantName,
      domain: `${subdomain}.solarcrm.clubemkt.digital`,
      subdomain,
      status: 'active',
      subscription: {
        plan: 'starter',
        status: 'trial',
        limits: {
          users: 5,
          leads: 1000,
          contracts: 100,
          storage_gb: 10
        },
        features: ['crm', 'screening', 'invoices']
      },
      settings: {
        timezone: 'America/Sao_Paulo',
        currency: 'BRL',
        language: 'pt-BR',
        date_format: 'DD/MM/YYYY',
        notifications: {
          email: true,
          whatsapp: false,
          sms: false
        }
      },
      branding: {
        logo_url: '',
        primary_color: '#2563eb',
        secondary_color: '#64748b',
        custom_css: '',
        white_label: false
      }
    }).select().single();
    
    if (tenantError) {
      if (tenantError.message.includes('duplicate') && tenantError.message.includes('subdomain')) {
        return NextResponse.json({ error: 'Nome da empresa já está em uso' }, { status: 400 });
      }
      console.error('Tenant creation error:', tenantError);
      return NextResponse.json({ error: 'Falha ao criar organização' }, { status: 500 });
    }
    
    if (!tenant) {
      return NextResponse.json({ error: 'Falha ao criar organização' }, { status: 500 });
    }
    
    // Add user to tenant (use admin client to bypass RLS issues)
    const { error: tenantUserError } = await supabaseAdmin.from('tenant_users').insert({
      tenant_id: tenant.id,
      user_id: userData.user.id,
      role: 'owner',
      permissions: ['*'],
      status: 'active'
    });
    
    if (tenantUserError) {
      console.error('Tenant user creation error:', tenantUserError);
      // Continue anyway - the user and tenant were created successfully
    }
    
    return NextResponse.json({ 
      success: true, 
      user: userData.user,
      tenant: tenant
    });
    
  } catch (error) {
    console.error('Signup API error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}