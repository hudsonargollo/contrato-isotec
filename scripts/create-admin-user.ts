#!/usr/bin/env tsx

/**
 * Create Admin User Script
 * 
 * Creates a super admin user for the SolarCRM Pro platform
 * Usage: npm run create-admin [email] [password] [name]
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

// Create Supabase admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

interface AdminUserData {
  email: string;
  password: string;
  fullName: string;
}

async function createAdminUser(userData: AdminUserData) {
  console.log('🚀 Creating admin user for SolarCRM Pro...\n');

  try {
    // Step 1: Create user in auth.users
    console.log('📝 Step 1: Creating authentication user...');
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: userData.fullName,
        role: 'super_admin'
      }
    });

    if (authError) {
      console.error('❌ Failed to create auth user:', authError.message);
      return false;
    }

    if (!authUser.user) {
      console.error('❌ No user returned from auth creation');
      return false;
    }

    console.log('✅ Auth user created:', authUser.user.id);

    // Step 2: Create profile in public.profiles
    console.log('📝 Step 2: Creating user profile...');
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authUser.user.id,
        email: userData.email,
        full_name: userData.fullName,
        role: 'super_admin',
        mfa_enabled: false
      });

    if (profileError) {
      console.error('❌ Failed to create profile:', profileError.message);
      
      // Try to clean up auth user
      await supabase.auth.admin.deleteUser(authUser.user.id);
      return false;
    }

    console.log('✅ User profile created');

    // Step 3: Verify the user was created correctly
    console.log('📝 Step 3: Verifying user setup...');
    const { data: profile, error: verifyError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.user.id)
      .single();

    if (verifyError || !profile) {
      console.error('❌ Failed to verify user:', verifyError?.message);
      return false;
    }

    console.log('✅ User verification successful');

    // Success summary
    console.log('\n🎉 Admin user created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📧 Email: ${userData.email}`);
    console.log(`🔑 Password: ${userData.password}`);
    console.log(`👤 Name: ${userData.fullName}`);
    console.log(`🛡️  Role: super_admin`);
    console.log(`🆔 User ID: ${authUser.user.id}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n🌐 Login URL: https://contratofacil.clubemkt.digital/login');
    console.log('\n🔐 Admin Capabilities:');
    console.log('  • Full platform administration');
    console.log('  • Multi-tenant management');
    console.log('  • User and role management');
    console.log('  • System configuration');
    console.log('  • Analytics and reporting');
    console.log('  • API access and documentation');
    console.log('\n⚠️  Security Notes:');
    console.log('  • Change password after first login');
    console.log('  • Enable MFA for additional security');
    console.log('  • Never share admin credentials');

    return true;

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  // Default values
  let email = 'admin@solarcrm.pro';
  let password = 'SolarCRM2024!';
  let fullName = 'SolarCRM Pro Admin';

  // Parse command line arguments
  if (args.length >= 1) email = args[0];
  if (args.length >= 2) password = args[1];
  if (args.length >= 3) fullName = args[2];

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    console.error('❌ Invalid email format');
    process.exit(1);
  }

  // Validate password strength
  if (password.length < 8) {
    console.error('❌ Password must be at least 8 characters long');
    process.exit(1);
  }

  console.log('🔧 SolarCRM Pro - Admin User Creation');
  console.log('═══════════════════════════════════════════════════');
  console.log(`📧 Email: ${email}`);
  console.log(`👤 Name: ${fullName}`);
  console.log(`🔑 Password: ${'*'.repeat(password.length)}`);
  console.log('═══════════════════════════════════════════════════\n');

  const success = await createAdminUser({ email, password, fullName });
  
  if (success) {
    console.log('\n✅ Admin user creation completed successfully!');
    process.exit(0);
  } else {
    console.log('\n❌ Admin user creation failed!');
    process.exit(1);
  }
}

// Handle script execution
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Script execution failed:', error);
    process.exit(1);
  });
}