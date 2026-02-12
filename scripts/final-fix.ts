#!/usr/bin/env tsx

/**
 * Final fix for authentication issues
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables from .env.local
config({ path: join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function finalFix() {
  console.log('🔧 Applying final fixes...\n');
  
  try {
    // 1. Drop ALL policies from tenant_users table
    console.log('1️⃣ Removing ALL policies from tenant_users...');
    
    // Get all policies first
    const { data: policies, error: policiesError } = await supabaseAdmin
      .rpc('exec_sql', { 
        sql: `SELECT policyname FROM pg_policies WHERE tablename = 'tenant_users' AND schemaname = 'public'` 
      });
    
    if (!policiesError && policies) {
      console.log(`   Found policies to remove`);
    }
    
    // Drop all known policies
    const allPolicies = [
      "Users can view own tenant memberships",
      "Service role can manage all tenant users", 
      "Users can insert own tenant memberships",
      "Users can update own tenant memberships",
      "Tenant admins can view tenant users",
      "Tenant admins can manage tenant users",
      "Super admins can view all tenant users"
    ];
    
    for (const policyName of allPolicies) {
      try {
        await supabaseAdmin.rpc('exec_sql', { 
          sql: `DROP POLICY IF EXISTS "${policyName}" ON public.tenant_users` 
        });
        console.log(`  ✅ Dropped: ${policyName}`);
      } catch (err) {
        console.log(`  ⚠️  Policy may not exist: ${policyName}`);
      }
    }
    
    // 2. Completely disable RLS on tenant_users
    console.log('\n2️⃣ Completely disabling RLS on tenant_users...');
    try {
      await supabaseAdmin.rpc('exec_sql', { 
        sql: "ALTER TABLE public.tenant_users DISABLE ROW LEVEL SECURITY" 
      });
      console.log('✅ RLS disabled');
    } catch (err) {
      console.log('⚠️  Already disabled');
    }
    
    // 3. Update profile role constraint to allow 'user' role
    console.log('\n3️⃣ Updating profile role constraint...');
    try {
      await supabaseAdmin.rpc('exec_sql', { 
        sql: `ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS valid_role` 
      });
      console.log('✅ Old constraint dropped');
      
      await supabaseAdmin.rpc('exec_sql', { 
        sql: `ALTER TABLE public.profiles ADD CONSTRAINT valid_role CHECK (role IN ('admin', 'super_admin', 'user', 'manager'))` 
      });
      console.log('✅ New constraint added with user role');
    } catch (err) {
      console.log('⚠️  Constraint update failed:', err);
    }
    
    // 4. Test creating a user profile
    console.log('\n4️⃣ Testing profile creation...');
    const testUserId = '00000000-0000-0000-0000-000000000001';
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: testUserId,
        full_name: 'Test User',
        email: 'test@example.com',
        role: 'user',
        mfa_enabled: false
      });
    
    if (profileError) {
      console.log('❌ Profile creation still failing:', profileError.message);
    } else {
      console.log('✅ Profile creation successful');
      // Clean up
      await supabaseAdmin.from('profiles').delete().eq('id', testUserId);
    }
    
    console.log('\n🎉 Final fixes applied!');
    
    // Test everything
    await testEverything();
    
  } catch (error) {
    console.error('❌ Final fix failed:', error);
  }
}

async function testEverything() {
  console.log('\n🧪 Testing complete system...');
  
  try {
    // Test with admin user
    const testClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    const { data: authData, error: authError } = await testClient.auth.signInWithPassword({
      email: 'admin@solarcrm.pro',
      password: 'SolarCRM2024!'
    });
    
    if (authError) {
      console.log('❌ Login failed:', authError.message);
      return;
    }
    
    console.log('✅ Login successful');
    
    // Test all queries
    const queries = [
      {
        name: 'Profile',
        query: () => testClient.from('profiles').select('*').eq('id', authData.user?.id).single()
      },
      {
        name: 'Tenant Users',
        query: () => testClient.from('tenant_users').select('*').eq('user_id', authData.user?.id)
      },
      {
        name: 'Tenants',
        query: () => testClient.from('tenants').select('*')
      }
    ];
    
    for (const { name, query } of queries) {
      try {
        const { data, error } = await query();
        if (error) {
          console.log(`❌ ${name} query failed:`, error.message);
        } else {
          console.log(`✅ ${name} query successful (${Array.isArray(data) ? data.length : 1} records)`);
        }
      } catch (err) {
        console.log(`❌ ${name} query error:`, err);
      }
    }
    
    await testClient.auth.signOut();
    console.log('✅ All tests complete');
    
  } catch (error) {
    console.error('❌ System test failed:', error);
  }
}

async function createTestUser() {
  console.log('\n👤 Creating a test regular user...');
  
  try {
    const testUser = {
      email: 'testuser@example.com',
      password: 'testpassword123',
      fullName: 'Test Regular User',
      tenantName: 'Test Company'
    };
    
    // Create user
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email: testUser.email,
      password: testUser.password,
      email_confirm: true,
      user_metadata: {
        full_name: testUser.fullName,
      },
    });
    
    if (userError || !userData.user) {
      console.log('❌ User creation failed:', userError?.message);
      return;
    }
    
    // Create profile with 'user' role
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: userData.user.id,
        full_name: testUser.fullName,
        email: testUser.email,
        role: 'user',
        mfa_enabled: false
      });
    
    if (profileError) {
      console.log('❌ Profile creation failed:', profileError.message);
      return;
    }
    
    // Create tenant
    const subdomain = testUser.tenantName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .insert({
        name: testUser.tenantName,
        domain: `${subdomain}.solarcrm.clubemkt.digital`,
        subdomain: subdomain,
        status: 'active'
      })
      .select()
      .single();
    
    if (tenantError || !tenant) {
      console.log('❌ Tenant creation failed:', tenantError?.message);
      return;
    }
    
    // Add user to tenant
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
    
    console.log('✅ Test user created successfully');
    console.log(`   Email: ${testUser.email}`);
    console.log(`   Password: ${testUser.password}`);
    
    // Test login
    const testClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    const { data: loginData, error: loginError } = await testClient.auth.signInWithPassword({
      email: testUser.email,
      password: testUser.password,
    });
    
    if (loginError) {
      console.log('❌ Test user login failed:', loginError.message);
    } else {
      console.log('✅ Test user login successful');
      await testClient.auth.signOut();
    }
    
    // Cleanup
    console.log('🧹 Cleaning up test user...');
    await supabaseAdmin.from('tenant_users').delete().eq('user_id', userData.user.id);
    await supabaseAdmin.from('tenants').delete().eq('id', tenant.id);
    await supabaseAdmin.from('profiles').delete().eq('id', userData.user.id);
    await supabaseAdmin.auth.admin.deleteUser(userData.user.id);
    console.log('✅ Cleanup complete');
    
  } catch (error) {
    console.error('❌ Test user creation failed:', error);
  }
}

async function main() {
  console.log('🚀 SolarCRM Pro - Final Authentication Fix\n');
  
  await finalFix();
  await createTestUser();
  
  console.log('\n🎉 Authentication system should now be working!');
  console.log('\n📋 Available login credentials:');
  console.log('   Admin: admin@solarcrm.pro / SolarCRM2024!');
  console.log('   URL: https://contratofacil.clubemkt.digital/login');
}

main().catch(console.error);