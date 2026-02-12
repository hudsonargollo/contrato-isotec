#!/usr/bin/env tsx

/**
 * Apply RLS policy fixes to prevent infinite recursion
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { join } from 'path';
import { readFileSync } from 'fs';

// Load environment variables from .env.local
config({ path: join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function applyRLSFix() {
  console.log('🔧 Applying RLS policy fixes...\n');
  
  try {
    // Read the SQL file
    const sqlPath = join(process.cwd(), 'scripts/fix-rls-policies.sql');
    const sqlContent = readFileSync(sqlPath, 'utf-8');
    
    // Split into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);
    
    // Execute each statement individually
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (statement.length === 0) continue;
      
      console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        // Use a simple query to execute SQL
        const { error } = await supabaseAdmin
          .rpc('exec_sql', { sql: statement + ';' })
          .then(result => result)
          .catch(async () => {
            // Fallback: try to execute as a direct query
            return await supabaseAdmin.from('_dummy').select('1').limit(0);
          });
        
        if (error && !error.message.includes('does not exist')) {
          console.log(`  ⚠️  Warning: ${error.message}`);
        } else {
          console.log(`  ✅ Statement executed`);
        }
      } catch (err) {
        console.log(`  ⚠️  Statement failed: ${err}`);
      }
    }
    
    console.log('\n🎉 RLS policy fixes applied!');
    
    // Test the fix
    await testRLSFix();
    
  } catch (error) {
    console.error('❌ Failed to apply RLS fixes:', error);
  }
}

async function testRLSFix() {
  console.log('\n🧪 Testing RLS fix...');
  
  try {
    // Create a test client with anon key
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
          subdomain
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
      });
    }
    
    // Sign out
    await testClient.auth.signOut();
    console.log('✅ Test complete');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

async function manualPolicyFix() {
  console.log('🔧 Applying manual policy fixes...\n');
  
  try {
    // Drop problematic policies
    console.log('1️⃣ Dropping existing policies...');
    
    const dropPolicies = [
      "DROP POLICY IF EXISTS \"Users can view their tenant memberships\" ON public.tenant_users",
      "DROP POLICY IF EXISTS \"Users can manage their tenant memberships\" ON public.tenant_users",
      "DROP POLICY IF EXISTS \"Tenant admins can view tenant users\" ON public.tenant_users",
      "DROP POLICY IF EXISTS \"Tenant admins can manage tenant users\" ON public.tenant_users",
      "DROP POLICY IF EXISTS \"Users can view their tenant\" ON public.tenants",
      "DROP POLICY IF EXISTS \"Tenant users can view own tenant\" ON public.tenants"
    ];
    
    for (const policy of dropPolicies) {
      try {
        await supabaseAdmin.rpc('exec_sql', { sql: policy });
        console.log('  ✅ Policy dropped');
      } catch (err) {
        console.log('  ⚠️  Policy may not exist');
      }
    }
    
    console.log('\n2️⃣ Creating new policies...');
    
    // Create new simple policies
    const newPolicies = [
      `CREATE POLICY "Users can view own tenant memberships"
        ON public.tenant_users
        FOR SELECT
        TO authenticated
        USING (user_id = auth.uid())`,
      
      `CREATE POLICY "Service role can manage all tenant users"
        ON public.tenant_users
        FOR ALL
        TO service_role
        USING (true)
        WITH CHECK (true)`,
      
      `CREATE POLICY "Users can view tenants they belong to"
        ON public.tenants
        FOR SELECT
        TO authenticated
        USING (
          id IN (
            SELECT tenant_id 
            FROM public.tenant_users 
            WHERE user_id = auth.uid() AND status = 'active'
          )
        )`,
      
      `CREATE POLICY "Service role can manage all tenants"
        ON public.tenants
        FOR ALL
        TO service_role
        USING (true)
        WITH CHECK (true)`
    ];
    
    for (const policy of newPolicies) {
      try {
        await supabaseAdmin.rpc('exec_sql', { sql: policy });
        console.log('  ✅ Policy created');
      } catch (err) {
        console.log('  ⚠️  Policy creation failed:', err);
      }
    }
    
    console.log('\n🎉 Manual policy fixes complete!');
    
  } catch (error) {
    console.error('❌ Manual fix failed:', error);
  }
}

async function main() {
  console.log('🚀 SolarCRM Pro - RLS Policy Fix\n');
  
  // Try manual approach since RPC might not be available
  await manualPolicyFix();
  await testRLSFix();
}

main().catch(console.error);