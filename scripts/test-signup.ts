#!/usr/bin/env tsx

/**
 * Test the signup process to debug authentication issues
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables from .env.local
config({ path: join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function testSignup() {
  console.log('🧪 Testing signup process...\n');
  
  const testUser = {
    email: 'test@example.com',
    password: 'testpassword123',
    fullName: 'Test User',
    tenantName: 'Test Company'
  };
  
  console.log('📝 Test user data:');
  console.log(`  Email: ${testUser.email}`);
  console.log(`  Name: ${testUser.fullName}`);
  console.log(`  Company: ${testUser.tenantName}\n`);
  
  try {
    // Step 1: Sign up the user
    console.log('1️⃣ Creating user account...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testUser.email,
      password: testUser.password,
      options: {
        data: {
          full_name: testUser.fullName,
          tenant_name: testUser.tenantName,
        },
      },
    });
    
    if (authError) {
      console.log('❌ Auth signup failed:', authError.message);
      return;
    }
    
    if (!authData.user) {
      console.log('❌ No user returned from signup');
      return;
    }
    
    console.log('✅ User created successfully');
    console.log(`   User ID: ${authData.user.id}`);
    console.log(`   Email: ${authData.user.email}`);
    console.log(`   Confirmed: ${authData.user.email_confirmed_at ? 'Yes' : 'No'}\n`);
    
    // Step 2: Create tenant organization
    console.log('2️⃣ Creating tenant organization...');
    const subdomain = testUser.tenantName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .insert({
        name: testUser.tenantName,
        domain: `${subdomain}.solarcrm.clubemkt.digital`,
        subdomain: subdomain,
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
      })
      .select()
      .single();
    
    if (tenantError) {
      console.log('❌ Tenant creation failed:', tenantError.message);
      console.log('   Details:', tenantError);
      return;
    }
    
    if (!tenant) {
      console.log('❌ No tenant returned from creation');
      return;
    }
    
    console.log('✅ Tenant created successfully');
    console.log(`   Tenant ID: ${tenant.id}`);
    console.log(`   Name: ${tenant.name}`);
    console.log(`   Domain: ${tenant.domain}`);
    console.log(`   Subdomain: ${tenant.subdomain}\n`);
    
    // Step 3: Add user as tenant owner
    console.log('3️⃣ Adding user to tenant...');
    const { error: tenantUserError } = await supabaseAdmin
      .from('tenant_users')
      .insert({
        tenant_id: tenant.id,
        user_id: authData.user.id,
        role: 'owner',
        permissions: ['*'],
        status: 'active'
      });
    
    if (tenantUserError) {
      console.log('❌ Tenant user creation failed:', tenantUserError.message);
      console.log('   Details:', tenantUserError);
      return;
    }
    
    console.log('✅ User added to tenant successfully\n');
    
    // Step 4: Test login
    console.log('4️⃣ Testing login...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: testUser.email,
      password: testUser.password,
    });
    
    if (loginError) {
      console.log('❌ Login failed:', loginError.message);
      return;
    }
    
    console.log('✅ Login successful');
    console.log(`   Session: ${loginData.session ? 'Active' : 'None'}\n`);
    
    // Cleanup
    console.log('🧹 Cleaning up test data...');
    
    // Delete tenant user
    await supabaseAdmin
      .from('tenant_users')
      .delete()
      .eq('user_id', authData.user.id);
    
    // Delete tenant
    await supabaseAdmin
      .from('tenants')
      .delete()
      .eq('id', tenant.id);
    
    // Delete user
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
    
    console.log('✅ Cleanup complete\n');
    
    console.log('🎉 Signup test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

async function checkExistingTenants() {
  console.log('🔍 Checking existing tenants...\n');
  
  try {
    const { data: tenants, error } = await supabaseAdmin
      .from('tenants')
      .select('*');
    
    if (error) {
      console.log('❌ Error fetching tenants:', error.message);
      return;
    }
    
    console.log(`📊 Found ${tenants?.length || 0} tenants:`);
    tenants?.forEach(tenant => {
      console.log(`  - ${tenant.name} (${tenant.subdomain})`);
      console.log(`    Domain: ${tenant.domain}`);
      console.log(`    Status: ${tenant.status}`);
    });
    console.log();
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

async function main() {
  console.log('🚀 SolarCRM Pro - Signup Test\n');
  
  await checkExistingTenants();
  await testSignup();
}

main().catch(console.error);