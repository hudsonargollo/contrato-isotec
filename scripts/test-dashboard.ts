#!/usr/bin/env tsx

/**
 * Test dashboard functionality
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables from .env.local
config({ path: join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testDashboard() {
  console.log('🧪 Testing dashboard functionality...\n');
  
  try {
    // Test login
    console.log('1️⃣ Testing admin login...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'admin@solarcrm.pro',
      password: 'SolarCRM2024!'
    });
    
    if (authError) {
      console.log('❌ Login failed:', authError.message);
      return;
    }
    
    console.log('✅ Login successful\n');
    
    // Test dashboard stats API
    console.log('2️⃣ Testing dashboard stats API...');
    const statsResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/dashboard/stats`, {
      headers: {
        'Authorization': `Bearer ${authData.session?.access_token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!statsResponse.ok) {
      console.log('❌ Stats API failed:', statsResponse.status, statsResponse.statusText);
      const errorText = await statsResponse.text();
      console.log('   Error:', errorText);
    } else {
      const statsData = await statsResponse.json();
      console.log('✅ Stats API successful');
      console.log('   Data:', JSON.stringify(statsData, null, 2));
    }
    
    // Test dashboard activity API
    console.log('\n3️⃣ Testing dashboard activity API...');
    const activityResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/dashboard/activity`, {
      headers: {
        'Authorization': `Bearer ${authData.session?.access_token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!activityResponse.ok) {
      console.log('❌ Activity API failed:', activityResponse.status, activityResponse.statusText);
      const errorText = await activityResponse.text();
      console.log('   Error:', errorText);
    } else {
      const activityData = await activityResponse.json();
      console.log('✅ Activity API successful');
      console.log('   Data:', JSON.stringify(activityData, null, 2));
    }
    
    // Test database tables directly
    console.log('\n4️⃣ Testing database tables...');
    
    const tables = ['contracts', 'profiles', 'tenants', 'tenant_users'];
    
    for (const table of tables) {
      try {
        const { data, error, count } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.log(`❌ ${table}: ${error.message}`);
        } else {
          console.log(`✅ ${table}: ${count || 0} records`);
        }
      } catch (err) {
        console.log(`❌ ${table}: ${err}`);
      }
    }
    
    await supabase.auth.signOut();
    console.log('\n✅ Dashboard test complete');
    
  } catch (error) {
    console.error('❌ Dashboard test failed:', error);
  }
}

async function main() {
  console.log('🚀 SolarCRM Pro - Dashboard Test\n');
  await testDashboard();
}

main().catch(console.error);