#!/usr/bin/env tsx

/**
 * Create admin user directly using Supabase Admin API
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables from .env.local
config({ path: join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function createAdminUser() {
  console.log('👑 Creating admin user directly...\n');
  
  const adminData = {
    email: 'admin@solarcrm.pro',
    password: 'SolarCRM2024!',
    fullName: 'SolarCRM Admin',
    tenantName: 'SolarCRM Pro'
  };
  
  console.log(`📧 Admin email: ${adminData.email}`);
  console.log(`👤 Admin name: ${adminData.fullName}`);
  console.log(`🏢 Company: ${adminData.tenantName}\n`);
  
  try {
    // Step 1: Create user using admin API
    console.log('1️⃣ Creating user with admin API...');
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email: adminData.email,
      password: adminData.password,
      email_confirm: true, // Skip email confirmation
      user_metadata: {
        full_name: adminData.fullName,
        tenant_name: adminData.tenantName,
      },
    });
    
    if (userError) {
      console.log('❌ User creation failed:', userError.message);
      return;
    }
    
    if (!userData.user) {
      console.log('❌ No user returned from creation');
      return;
    }
    
    console.log('✅ User created successfully');
    console.log(`   User ID: ${userData.user.id}`);
    console.log(`   Email: ${userData.user.email}`);
    console.log(`   Confirmed: ${userData.user.email_confirmed_at ? 'Yes' : 'No'}\n`);
    
    // Step 2: Get or create ISOTEC tenant
    console.log('2️⃣ Getting ISOTEC tenant...');
    let { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .select('*')
      .eq('subdomain', 'isotec')
      .single();
    
    if (tenantError || !tenant) {
      console.log('   Creating ISOTEC tenant...');
      const { data: newTenant, error: createError } = await supabaseAdmin
        .from('tenants')
        .insert({
          name: 'ISOTEC Photovoltaic Systems',
          domain: 'isotec.solarcrm.clubemkt.digital',
          subdomain: 'isotec',
          status: 'active',
          subscription: {
            plan: 'enterprise',
            status: 'active',
            limits: {
              users: 50,
              leads: 10000,
              contracts: 1000,
              storage_gb: 100
            },
            features: ['crm', 'screening', 'invoices', 'whatsapp', 'analytics', 'contracts', 'api']
          },
          settings: {
            timezone: 'America/Sao_Paulo',
            currency: 'BRL',
            language: 'pt-BR',
            date_format: 'DD/MM/YYYY',
            notifications: {
              email: true,
              whatsapp: true,
              sms: false
            }
          },
          branding: {
            logo_url: '/isotec-logo.webp',
            primary_color: '#1e40af',
            secondary_color: '#64748b',
            custom_css: '',
            white_label: false
          }
        })
        .select()
        .single();
      
      if (createError) {
        console.log('❌ Tenant creation failed:', createError.message);
        return;
      }
      
      tenant = newTenant;
    }
    
    console.log('✅ ISOTEC tenant ready');
    console.log(`   Tenant ID: ${tenant.id}`);
    console.log(`   Name: ${tenant.name}\n`);
    
    // Step 3: Add user as tenant owner
    console.log('3️⃣ Adding user as tenant owner...');
    const { error: tenantUserError } = await supabaseAdmin
      .from('tenant_users')
      .insert({
        tenant_id: tenant.id,
        user_id: userData.user.id,
        role: 'owner',
        permissions: ['*'],
        status: 'active'
      });
    
    if (tenantUserError) {
      console.log('❌ Tenant user creation failed:', tenantUserError.message);
      return;
    }
    
    console.log('✅ User added as tenant owner\n');
    
    // Step 4: Create profile if needed
    console.log('4️⃣ Creating user profile...');
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: userData.user.id,
        full_name: adminData.fullName,
        email: adminData.email,
        role: 'admin',
        mfa_enabled: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    
    if (profileError && !profileError.message.includes('duplicate')) {
      console.log('⚠️  Profile creation warning:', profileError.message);
    } else {
      console.log('✅ Profile created or already exists\n');
    }
    
    console.log('🎉 Admin user created successfully!');
    console.log('\n📋 Login credentials:');
    console.log(`   Email: ${adminData.email}`);
    console.log(`   Password: ${adminData.password}`);
    console.log(`   URL: https://contratofacil.clubemkt.digital/login`);
    
  } catch (error) {
    console.error('❌ Creation failed:', error);
  }
}

async function checkExistingUsers() {
  console.log('👥 Checking existing users...\n');
  
  try {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers();
    
    if (error) {
      console.log('❌ Error listing users:', error.message);
      return;
    }
    
    console.log(`📊 Found ${data.users.length} users:`);
    data.users.forEach(user => {
      console.log(`  - ${user.email} (${user.id})`);
      console.log(`    Confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`);
      console.log(`    Created: ${user.created_at}`);
    });
    console.log();
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

async function main() {
  console.log('🚀 SolarCRM Pro - Direct Admin Creation\n');
  
  await checkExistingUsers();
  await createAdminUser();
}

main().catch(console.error);