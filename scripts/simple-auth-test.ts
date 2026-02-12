#!/usr/bin/env tsx

/**
 * Simple authentication test to debug signup issues
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

async function testBasicSignup() {
  console.log('🧪 Testing basic signup...\n');
  
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'testpassword123';
  
  console.log(`📧 Test email: ${testEmail}`);
  
  try {
    // Test basic signup without tenant creation
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    });
    
    console.log('📊 Signup response:');
    console.log('  Data:', JSON.stringify(data, null, 2));
    console.log('  Error:', JSON.stringify(error, null, 2));
    
    if (data?.user) {
      console.log('\n✅ User created successfully');
      console.log(`   User ID: ${data.user.id}`);
      console.log(`   Email: ${data.user.email}`);
      console.log(`   Confirmed: ${data.user.email_confirmed_at ? 'Yes' : 'No'}`);
      
      // Try to sign in immediately
      console.log('\n🔐 Testing immediate login...');
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      });
      
      console.log('📊 Login response:');
      console.log('  Data:', loginData?.session ? 'Session exists' : 'No session');
      console.log('  Error:', JSON.stringify(loginError, null, 2));
      
      // Cleanup
      if (data.user.id) {
        await supabaseAdmin.auth.admin.deleteUser(data.user.id);
        console.log('\n🧹 Test user deleted');
      }
    }
    
  } catch (err) {
    console.error('❌ Test failed:', err);
  }
}

async function checkAuthSettings() {
  console.log('⚙️ Checking auth settings...\n');
  
  try {
    // Try to get auth settings (this might not work with client)
    const { data, error } = await supabaseAdmin.auth.admin.listUsers();
    
    if (error) {
      console.log('❌ Cannot access admin functions:', error.message);
    } else {
      console.log(`👥 Total users in database: ${data.users.length}`);
    }
  } catch (err) {
    console.log('❌ Error checking auth settings:', err);
  }
}

async function testTenantCreation() {
  console.log('\n🏢 Testing tenant creation...\n');
  
  try {
    const testTenant = {
      name: 'Test Tenant',
      domain: 'test.solarcrm.clubemkt.digital',
      subdomain: 'test',
      status: 'active'
    };
    
    const { data, error } = await supabaseAdmin
      .from('tenants')
      .insert(testTenant)
      .select()
      .single();
    
    if (error) {
      console.log('❌ Tenant creation failed:', error.message);
      console.log('   Details:', error);
    } else {
      console.log('✅ Tenant created successfully');
      console.log(`   ID: ${data.id}`);
      
      // Cleanup
      await supabaseAdmin
        .from('tenants')
        .delete()
        .eq('id', data.id);
      console.log('🧹 Test tenant deleted');
    }
  } catch (err) {
    console.error('❌ Tenant test failed:', err);
  }
}

async function main() {
  console.log('🚀 SolarCRM Pro - Simple Auth Test\n');
  
  await checkAuthSettings();
  await testBasicSignup();
  await testTenantCreation();
  
  console.log('\n✨ Test complete!');
}

main().catch(console.error);