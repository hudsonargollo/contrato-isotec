#!/usr/bin/env tsx

/**
 * Test login with the created admin user
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables from .env.local
config({ path: join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLogin() {
  console.log('🔐 Testing admin login...\n');
  
  const credentials = {
    email: 'admin@solarcrm.pro',
    password: 'SolarCRM2024!'
  };
  
  console.log(`📧 Email: ${credentials.email}`);
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });
    
    if (error) {
      console.log('❌ Login failed:', error.message);
      console.log('   Details:', error);
      return;
    }
    
    if (!data.session) {
      console.log('❌ No session created');
      return;
    }
    
    console.log('✅ Login successful!');
    console.log(`   User ID: ${data.user?.id}`);
    console.log(`   Email: ${data.user?.email}`);
    console.log(`   Session expires: ${data.session.expires_at}`);
    
    // Test getting user profile
    console.log('\n👤 Getting user profile...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user?.id)
      .single();
    
    if (profileError) {
      console.log('⚠️  Profile error:', profileError.message);
    } else {
      console.log('✅ Profile found:');
      console.log(`   Name: ${profile.full_name}`);
      console.log(`   Role: ${profile.role}`);
    }
    
    // Test getting tenant membership
    console.log('\n🏢 Getting tenant membership...');
    const { data: tenantUsers, error: tenantError } = await supabase
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
      .eq('user_id', data.user?.id);
    
    if (tenantError) {
      console.log('⚠️  Tenant membership error:', tenantError.message);
    } else {
      console.log('✅ Tenant memberships:');
      tenantUsers?.forEach(membership => {
        console.log(`   - ${membership.tenants?.name} (${membership.role})`);
        console.log(`     Subdomain: ${membership.tenants?.subdomain}`);
        console.log(`     Status: ${membership.status}`);
      });
    }
    
    // Sign out
    await supabase.auth.signOut();
    console.log('\n🚪 Signed out successfully');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

async function main() {
  console.log('🚀 SolarCRM Pro - Login Test\n');
  await testLogin();
  console.log('\n✨ Test complete!');
}

main().catch(console.error);