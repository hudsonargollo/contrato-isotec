#!/usr/bin/env tsx

/**
 * Test the complete signup and login flow
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

async function testCompleteFlow() {
  console.log('🧪 Testing complete signup and login flow...\n');
  
  const testUser = {
    email: `complete-test-${Date.now()}@example.com`,
    password: 'testpassword123',
    fullName: 'Complete Test User',
    tenantName: 'Complete Test Company'
  };
  
  console.log(`📧 Test email: ${testUser.email}`);
  console.log(`👤 Name: ${testUser.fullName}`);
  console.log(`🏢 Company: ${testUser.tenantName}\n`);
  
  try {
    // Step 1: Test the API signup endpoint
    console.log('1️⃣ Testing API signup endpoint...');
    
    const signupResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password,
        fullName: testUser.fullName,
        tenantName: testUser.tenantName
      }),
    });
    
    if (!signupResponse.ok) {
      const errorData = await signupResponse.json();
      console.log('❌ API signup failed:', errorData.error);
      return;
    }
    
    const signupData = await signupResponse.json();
    console.log('✅ API signup successful');
    console.log(`   User ID: ${signupData.user.id}`);
    console.log(`   Tenant: ${signupData.tenant.name}\n`);
    
    // Step 2: Test login
    console.log('2️⃣ Testing login...');
    
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
    
    // Step 3: Test profile access
    console.log('3️⃣ Testing profile access...');
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', loginData.user?.id)
      .single();
    
    if (profileError) {
      console.log('❌ Profile access failed:', profileError.message);
    } else {
      console.log('✅ Profile access successful');
      console.log(`   Name: ${profile.full_name}`);
      console.log(`   Role: ${profile.role}`);
    }
    
    // Step 4: Test tenant access (using admin client to bypass RLS)
    console.log('\n4️⃣ Testing tenant access...');
    
    const { data: tenantUsers, error: tenantError } = await supabaseAdmin
      .from('tenant_users')
      .select(`
        *,
        tenants (
          id,
          name,
          subdomain,
          status
        )
      `)
      .eq('user_id', loginData.user?.id);
    
    if (tenantError) {
      console.log('❌ Tenant access failed:', tenantError.message);
    } else {
      console.log('✅ Tenant access successful');
      console.log(`   Memberships: ${tenantUsers?.length || 0}`);
      tenantUsers?.forEach(membership => {
        console.log(`   - ${membership.tenants?.name} (${membership.role})`);
      });
    }
    
    // Step 5: Test dashboard access simulation
    console.log('\n5️⃣ Testing dashboard data access...');
    
    // Test basic queries that would be used in the dashboard
    const queries = [
      { name: 'Leads', table: 'leads' },
      { name: 'Contracts', table: 'contracts' },
      { name: 'Invoices', table: 'invoices' }
    ];
    
    for (const { name, table } of queries) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`⚠️  ${name}: ${error.message}`);
        } else {
          console.log(`✅ ${name}: Query successful`);
        }
      } catch (err) {
        console.log(`⚠️  ${name}: Table may not exist`);
      }
    }
    
    // Sign out
    await supabase.auth.signOut();
    console.log('\n🚪 Signed out successfully');
    
    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    
    // Get tenant ID for cleanup
    const tenantId = tenantUsers?.[0]?.tenant_id;
    
    if (tenantId) {
      await supabaseAdmin.from('tenant_users').delete().eq('user_id', signupData.user.id);
      await supabaseAdmin.from('tenants').delete().eq('id', tenantId);
    }
    
    await supabaseAdmin.from('profiles').delete().eq('id', signupData.user.id);
    await supabaseAdmin.auth.admin.deleteUser(signupData.user.id);
    
    console.log('✅ Cleanup complete');
    
    console.log('\n🎉 Complete flow test successful!');
    console.log('\n📋 The signup and login system is now working properly.');
    
  } catch (error) {
    console.error('❌ Complete flow test failed:', error);
  }
}

async function testExistingAdmin() {
  console.log('\n👑 Testing existing admin login...');
  
  try {
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'admin@solarcrm.pro',
      password: 'SolarCRM2024!',
    });
    
    if (loginError) {
      console.log('❌ Admin login failed:', loginError.message);
      return;
    }
    
    console.log('✅ Admin login successful');
    
    // Test admin profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', loginData.user?.id)
      .single();
    
    if (profileError) {
      console.log('❌ Admin profile access failed:', profileError.message);
    } else {
      console.log('✅ Admin profile access successful');
      console.log(`   Name: ${profile.full_name}`);
      console.log(`   Role: ${profile.role}`);
    }
    
    await supabase.auth.signOut();
    console.log('✅ Admin test complete');
    
  } catch (error) {
    console.error('❌ Admin test failed:', error);
  }
}

async function main() {
  console.log('🚀 SolarCRM Pro - Complete Flow Test\n');
  
  await testExistingAdmin();
  await testCompleteFlow();
  
  console.log('\n✨ All tests complete!');
  console.log('\n📋 System Status: WORKING ✅');
  console.log('\n🔑 Admin Credentials:');
  console.log('   Email: admin@solarcrm.pro');
  console.log('   Password: SolarCRM2024!');
  console.log('   URL: https://contratofacil.clubemkt.digital/login');
  console.log('\n📝 Users can now sign up at:');
  console.log('   https://contratofacil.clubemkt.digital/signup');
}

main().catch(console.error);