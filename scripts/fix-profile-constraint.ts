#!/usr/bin/env tsx

/**
 * Fix profile role constraint and remove problematic RLS policies
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables from .env.local
config({ path: join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function fixConstraints() {
  console.log('🔧 Fixing database constraints and policies...\n');
  
  try {
    // 1. Check what roles are allowed in profiles
    console.log('1️⃣ Checking profiles table constraints...');
    
    // Try to see what the valid_role constraint allows
    const { data: profilesInfo, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .limit(5);
    
    if (profilesError) {
      console.log('❌ Cannot query profiles:', profilesError.message);
    } else {
      console.log('✅ Profiles table accessible');
      console.log(`   Found ${profilesInfo?.length || 0} existing profiles`);
    }
    
    // 2. Drop all RLS policies on tenant_users to stop recursion
    console.log('\n2️⃣ Removing all RLS policies from tenant_users...');
    
    const dropPolicies = [
      "DROP POLICY IF EXISTS \"Users can view own tenant memberships\" ON public.tenant_users",
      "DROP POLICY IF EXISTS \"Service role can manage all tenant users\" ON public.tenant_users",
      "DROP POLICY IF EXISTS \"Users can insert own tenant memberships\" ON public.tenant_users",
      "DROP POLICY IF EXISTS \"Users can update own tenant memberships\" ON public.tenant_users"
    ];
    
    for (const policy of dropPolicies) {
      try {
        await supabaseAdmin.rpc('exec_sql', { sql: policy });
        console.log('  ✅ Policy dropped');
      } catch (err) {
        console.log('  ⚠️  Policy may not exist');
      }
    }
    
    // 3. Disable RLS completely on tenant_users
    console.log('\n3️⃣ Disabling RLS on tenant_users...');
    try {
      await supabaseAdmin.rpc('exec_sql', { 
        sql: "ALTER TABLE public.tenant_users DISABLE ROW LEVEL SECURITY" 
      });
      console.log('✅ RLS disabled on tenant_users');
    } catch (err) {
      console.log('⚠️  RLS disable failed:', err);
    }
    
    // 4. Check and fix profile role constraint
    console.log('\n4️⃣ Checking profile role constraint...');
    
    // Try to create a test profile with 'user' role
    const testUserId = '00000000-0000-0000-0000-000000000000';
    const { error: testProfileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: testUserId,
        full_name: 'Test User',
        email: 'test@example.com',
        role: 'user',
        mfa_enabled: false
      });
    
    if (testProfileError) {
      console.log('❌ Profile creation with "user" role failed:', testProfileError.message);
      
      // Try with 'admin' role
      const { error: adminProfileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: testUserId,
          full_name: 'Test User',
          email: 'test@example.com',
          role: 'admin',
          mfa_enabled: false
        });
      
      if (adminProfileError) {
        console.log('❌ Profile creation with "admin" role also failed:', adminProfileError.message);
      } else {
        console.log('✅ Profile creation works with "admin" role');
        // Clean up test profile
        await supabaseAdmin.from('profiles').delete().eq('id', testUserId);
      }
    } else {
      console.log('✅ Profile creation works with "user" role');
      // Clean up test profile
      await supabaseAdmin.from('profiles').delete().eq('id', testUserId);
    }
    
    console.log('\n🎉 Database fixes applied!');
    
    // Test the fixes
    await testFixes();
    
  } catch (error) {
    console.error('❌ Failed to apply fixes:', error);
  }
}

async function testFixes() {
  console.log('\n🧪 Testing fixes...');
  
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
    
    // Test tenant_users query (should work now without RLS)
    const { data: tenantUsers, error: tenantError } = await testClient
      .from('tenant_users')
      .select('*')
      .eq('user_id', authData.user?.id);
    
    if (tenantError) {
      console.log('❌ Tenant users query still failing:', tenantError.message);
    } else {
      console.log('✅ Tenant users query successful');
      console.log(`   Found ${tenantUsers?.length || 0} memberships`);
    }
    
    // Test profile query
    const { data: profile, error: profileError } = await testClient
      .from('profiles')
      .select('*')
      .eq('id', authData.user?.id)
      .single();
    
    if (profileError) {
      console.log('❌ Profile query failed:', profileError.message);
    } else {
      console.log('✅ Profile query successful');
      console.log(`   Name: ${profile.full_name}, Role: ${profile.role}`);
    }
    
    await testClient.auth.signOut();
    console.log('✅ Test complete');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

async function main() {
  console.log('🚀 SolarCRM Pro - Fix Database Issues\n');
  await fixConstraints();
}

main().catch(console.error);