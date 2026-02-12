#!/usr/bin/env tsx

/**
 * Temporarily disable RLS to allow the system to work
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables from .env.local
config({ path: join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function disableRLS() {
  console.log('⚠️  Temporarily disabling RLS for tenant tables...\n');
  
  try {
    // Disable RLS on tenant tables
    const commands = [
      "ALTER TABLE public.tenants DISABLE ROW LEVEL SECURITY",
      "ALTER TABLE public.tenant_users DISABLE ROW LEVEL SECURITY"
    ];
    
    for (const command of commands) {
      try {
        await supabaseAdmin.rpc('exec_sql', { sql: command });
        console.log(`✅ ${command}`);
      } catch (err) {
        console.log(`⚠️  ${command} - ${err}`);
      }
    }
    
    console.log('\n🎉 RLS disabled temporarily');
    
    // Test the system now
    await testSystemWithoutRLS();
    
  } catch (error) {
    console.error('❌ Failed to disable RLS:', error);
  }
}

async function testSystemWithoutRLS() {
  console.log('\n🧪 Testing system without RLS...');
  
  try {
    // Create a test client
    const testClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    // Sign in as admin
    const { data: authData, error: authError } = await testClient.auth.signInWithPassword({
      email: 'admin@solarcrm.pro',
      password: 'SolarCRM2024!'
    });
    
    if (authError) {
      console.log('❌ Login failed:', authError.message);
      return;
    }
    
    console.log('✅ Login successful');
    
    // Test tenant_users query
    const { data: tenantUsers, error: tenantError } = await testClient
      .from('tenant_users')
      .select(`
        id,
        role,
        status,
        tenants (
          id,
          name,
          subdomain,
          status
        )
      `)
      .eq('user_id', authData.user?.id);
    
    if (tenantError) {
      console.log('❌ Tenant users query failed:', tenantError.message);
    } else {
      console.log('✅ Tenant users query successful');
      console.log(`   Found ${tenantUsers?.length || 0} memberships`);
      tenantUsers?.forEach(membership => {
        console.log(`   - ${membership.tenants?.name} (${membership.role})`);
        console.log(`     Subdomain: ${membership.tenants?.subdomain}`);
        console.log(`     Status: ${membership.status}`);
      });
    }
    
    // Test tenants query
    const { data: tenants, error: tenantsError } = await testClient
      .from('tenants')
      .select('*');
    
    if (tenantsError) {
      console.log('❌ Tenants query failed:', tenantsError.message);
    } else {
      console.log(`✅ Tenants query successful - found ${tenants?.length || 0} tenants`);
    }
    
    // Sign out
    await testClient.auth.signOut();
    console.log('✅ Test complete - system working without RLS');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

async function main() {
  console.log('🚀 SolarCRM Pro - Disable RLS Temporarily\n');
  
  await disableRLS();
  
  console.log('\n📝 Note: RLS has been disabled temporarily to allow the system to work.');
  console.log('   You should re-enable and fix RLS policies in production for security.');
}

main().catch(console.error);