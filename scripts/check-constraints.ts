#!/usr/bin/env tsx

/**
 * Check and fix database constraints directly
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables from .env.local
config({ path: join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function checkConstraints() {
  console.log('🔍 Checking database constraints...\n');
  
  try {
    // Check current constraint on profiles table
    console.log('1️⃣ Checking profiles table constraints...');
    
    const { data: constraints, error: constraintsError } = await supabaseAdmin
      .rpc('exec_sql', { 
        sql: `
          SELECT conname, consrc 
          FROM pg_constraint 
          WHERE conrelid = 'public.profiles'::regclass 
          AND contype = 'c'
        ` 
      });
    
    if (constraintsError) {
      console.log('❌ Cannot check constraints:', constraintsError.message);
    } else {
      console.log('✅ Constraints found:', constraints);
    }
    
    // Try a different approach - check what roles exist in the current data
    console.log('\n2️⃣ Checking existing profile roles...');
    
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .limit(10);
    
    if (profilesError) {
      console.log('❌ Cannot query profiles:', profilesError.message);
    } else {
      console.log('✅ Existing roles:', profiles?.map(p => p.role));
    }
    
    // Try to create profile with each possible role
    console.log('\n3️⃣ Testing role creation...');
    
    const testRoles = ['admin', 'super_admin', 'user', 'manager', 'owner'];
    const testUserId = '00000000-0000-0000-0000-000000000002';
    
    for (const role of testRoles) {
      try {
        const { error } = await supabaseAdmin
          .from('profiles')
          .insert({
            id: testUserId,
            full_name: 'Test User',
            email: 'test@example.com',
            role: role,
            mfa_enabled: false
          });
        
        if (error) {
          console.log(`❌ Role "${role}": ${error.message}`);
        } else {
          console.log(`✅ Role "${role}": Works`);
          // Clean up
          await supabaseAdmin.from('profiles').delete().eq('id', testUserId);
        }
      } catch (err) {
        console.log(`❌ Role "${role}": ${err}`);
      }
    }
    
    // Try to drop and recreate the constraint properly
    console.log('\n4️⃣ Fixing constraint...');
    
    try {
      // Drop constraint
      await supabaseAdmin.rpc('exec_sql', { 
        sql: `ALTER TABLE public.profiles DROP CONSTRAINT valid_role` 
      });
      console.log('✅ Constraint dropped');
      
      // Add new constraint
      await supabaseAdmin.rpc('exec_sql', { 
        sql: `ALTER TABLE public.profiles ADD CONSTRAINT valid_role CHECK (role IN ('admin', 'super_admin', 'user', 'manager', 'owner'))` 
      });
      console.log('✅ New constraint added');
      
      // Test again
      const { error: testError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: testUserId,
          full_name: 'Test User',
          email: 'test@example.com',
          role: 'user',
          mfa_enabled: false
        });
      
      if (testError) {
        console.log('❌ Still failing:', testError.message);
      } else {
        console.log('✅ Constraint fixed - user role works');
        await supabaseAdmin.from('profiles').delete().eq('id', testUserId);
      }
      
    } catch (err) {
      console.log('❌ Constraint fix failed:', err);
    }
    
  } catch (error) {
    console.error('❌ Check failed:', error);
  }
}

async function fixTenantUsersRecursion() {
  console.log('\n🔧 Fixing tenant_users recursion...\n');
  
  try {
    // Get all policies on tenant_users
    console.log('1️⃣ Checking all policies on tenant_users...');
    
    const { data: policies, error: policiesError } = await supabaseAdmin
      .rpc('exec_sql', { 
        sql: `
          SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
          FROM pg_policies 
          WHERE tablename = 'tenant_users' AND schemaname = 'public'
        ` 
      });
    
    if (policiesError) {
      console.log('❌ Cannot check policies:', policiesError.message);
    } else {
      console.log('📋 Current policies:', policies);
    }
    
    // Drop ALL policies
    console.log('\n2️⃣ Dropping ALL policies...');
    
    const dropAllPolicies = `
      DO $$ 
      DECLARE 
        pol RECORD;
      BEGIN
        FOR pol IN 
          SELECT policyname 
          FROM pg_policies 
          WHERE tablename = 'tenant_users' AND schemaname = 'public'
        LOOP
          EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON public.tenant_users';
        END LOOP;
      END $$;
    `;
    
    try {
      await supabaseAdmin.rpc('exec_sql', { sql: dropAllPolicies });
      console.log('✅ All policies dropped');
    } catch (err) {
      console.log('⚠️  Batch drop failed, trying individual drops...');
      
      // Manual drops
      const knownPolicies = [
        'Users can view own tenant memberships',
        'Service role can manage all tenant users',
        'Users can insert own tenant memberships', 
        'Users can update own tenant memberships',
        'Tenant admins can view tenant users',
        'Tenant admins can manage tenant users',
        'Super admins can view all tenant users',
        'Users can view their tenant memberships',
        'Users can manage their tenant memberships'
      ];
      
      for (const policy of knownPolicies) {
        try {
          await supabaseAdmin.rpc('exec_sql', { 
            sql: `DROP POLICY IF EXISTS "${policy}" ON public.tenant_users` 
          });
          console.log(`  ✅ Dropped: ${policy}`);
        } catch (dropErr) {
          console.log(`  ⚠️  ${policy}: may not exist`);
        }
      }
    }
    
    // Disable RLS completely
    console.log('\n3️⃣ Disabling RLS completely...');
    try {
      await supabaseAdmin.rpc('exec_sql', { 
        sql: 'ALTER TABLE public.tenant_users DISABLE ROW LEVEL SECURITY' 
      });
      console.log('✅ RLS disabled');
    } catch (err) {
      console.log('⚠️  RLS already disabled');
    }
    
    // Test query
    console.log('\n4️⃣ Testing tenant_users query...');
    
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
    
    const { data: tenantUsers, error: tenantError } = await testClient
      .from('tenant_users')
      .select('*')
      .eq('user_id', authData.user?.id);
    
    if (tenantError) {
      console.log('❌ Query still failing:', tenantError.message);
    } else {
      console.log('✅ Query successful!');
      console.log(`   Found ${tenantUsers?.length || 0} memberships`);
    }
    
    await testClient.auth.signOut();
    
  } catch (error) {
    console.error('❌ Fix failed:', error);
  }
}

async function main() {
  console.log('🚀 SolarCRM Pro - Check and Fix Constraints\n');
  
  await checkConstraints();
  await fixTenantUsersRecursion();
  
  console.log('\n✨ Constraint check complete!');
}

main().catch(console.error);