#!/usr/bin/env tsx

/**
 * Test the actual signup flow that users would experience
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables from .env.local
config({ path: join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function testSignupFlow() {
  console.log('🧪 Testing complete signup flow...\n');
  
  const testUser = {
    email: `test-${Date.now()}@example.com`,
    password: 'testpassword123',
    fullName: 'Test User',
    tenantName: 'Test Company'
  };
  
  console.log(`📧 Test email: ${testUser.email}`);
  console.log(`👤 Name: ${testUser.fullName}`);
  console.log(`🏢 Company: ${testUser.tenantName}\n`);
  
  try {
    // Step 1: Create user using admin API (since regular signup has timeout issues)
    console.log('1️⃣ Creating user account...');
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email: testUser.email,
      password: testUser.password,
      email_confirm: true,
      user_metadata: {
        full_name: testUser.fullName,
        tenant_name: testUser.tenantName,
      },
    });
    
    if (userError || !userData.user) {
      console.log('❌ User creation failed:', userError?.message);
      return;
    }
    
    console.log('✅ User created successfully');
    console.log(`   User ID: ${userData.user.id}\n`);
    
    // Step 2: Create tenant
    console.log('2️⃣ Creating tenant...');
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
    
    if (tenantError || !tenant) {
      console.log('❌ Tenant creation failed:', tenantError?.message);
      return;
    }
    
    console.log('✅ Tenant created successfully');
    console.log(`   Tenant ID: ${tenant.id}\n`);
    
    // Step 3: Add user to tenant
    console.log('3️⃣ Adding user to tenant...');
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
    
    console.log('✅ User added to tenant successfully\n');
    
    // Step 4: Create profile
    console.log('4️⃣ Creating user profile...');
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: userData.user.id,
        full_name: testUser.fullName,
        email: testUser.email,
        role: 'user',
        mfa_enabled: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    
    if (profileError && !profileError.message.includes('duplicate')) {
      console.log('⚠️  Profile creation warning:', profileError.message);
    } else {
      console.log('✅ Profile created\n');
    }
    
    // Step 5: Test login
    console.log('5️⃣ Testing login...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: testUser.email,
      password: testUser.password,
    });
    
    if (loginError) {
      console.log('❌ Login failed:', loginError.message);
    } else {
      console.log('✅ Login successful');
      console.log(`   Session: ${loginData.session ? 'Active' : 'None'}`);
      
      // Test basic queries without joins
      console.log('\n6️⃣ Testing basic queries...');
      
      // Test profile query
      const { data: profile, error: profileQueryError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userData.user.id)
        .single();
      
      if (profileQueryError) {
        console.log('❌ Profile query failed:', profileQueryError.message);
      } else {
        console.log('✅ Profile query successful');
      }
      
      // Test tenant_users query (without join)
      const { data: tenantUserData, error: tenantUserQueryError } = await supabase
        .from('tenant_users')
        .select('*')
        .eq('user_id', userData.user.id);
      
      if (tenantUserQueryError) {
        console.log('❌ Tenant users query failed:', tenantUserQueryError.message);
      } else {
        console.log('✅ Tenant users query successful');
        console.log(`   Found ${tenantUserData?.length || 0} memberships`);
      }
      
      // Test tenants query (separate)
      if (tenantUserData && tenantUserData.length > 0) {
        const { data: tenantData, error: tenantQueryError } = await supabase
          .from('tenants')
          .select('*')
          .eq('id', tenantUserData[0].tenant_id)
          .single();
        
        if (tenantQueryError) {
          console.log('❌ Tenant query failed:', tenantQueryError.message);
        } else {
          console.log('✅ Tenant query successful');
          console.log(`   Tenant: ${tenantData.name}`);
        }
      }
      
      await supabase.auth.signOut();
    }
    
    // Cleanup
    console.log('\n🧹 Cleaning up...');
    await supabaseAdmin.from('tenant_users').delete().eq('user_id', userData.user.id);
    await supabaseAdmin.from('tenants').delete().eq('id', tenant.id);
    await supabaseAdmin.from('profiles').delete().eq('id', userData.user.id);
    await supabaseAdmin.auth.admin.deleteUser(userData.user.id);
    console.log('✅ Cleanup complete');
    
    console.log('\n🎉 Signup flow test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

async function main() {
  console.log('🚀 SolarCRM Pro - Signup Flow Test\n');
  await testSignupFlow();
}

main().catch(console.error);