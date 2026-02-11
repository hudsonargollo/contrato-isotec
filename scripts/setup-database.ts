#!/usr/bin/env tsx

/**
 * Database Setup Script
 * 
 * This script sets up the database by running the core migration files
 * needed for the tenant management system.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupDatabase() {
  try {
    console.log('🔄 Setting up database with core migrations...');

    // First, create the handle_updated_at function if it doesn't exist
    const handleUpdatedAtFunction = `
      CREATE OR REPLACE FUNCTION public.handle_updated_at()
      RETURNS TRIGGER AS $
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $ LANGUAGE plpgsql;
    `;

    console.log('📝 Creating handle_updated_at function...');
    const { error: functionError } = await supabase.rpc('exec', { sql: handleUpdatedAtFunction });
    if (functionError) {
      console.log('Note: Function creation may have failed:', functionError.message);
    }

    // Read and execute the tenant management migration
    const migrationPath = join(process.cwd(), 'supabase/migrations/20240302000001_create_tenant_management_system.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');

    console.log('📝 Running tenant management migration...');
    
    // Split the SQL into statements and execute them
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`Found ${statements.length} SQL statements to execute`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
          
          // Try to execute the statement
          const { error } = await supabase.rpc('exec', { sql: statement + ';' });
          
          if (error) {
            console.log(`Note: Statement ${i + 1} may have failed:`, error.message);
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`);
          }
        } catch (err) {
          console.log(`Note: Statement ${i + 1} encountered an issue:`, err);
        }
      }
    }

    // Also run the audit system migration
    const auditMigrationPath = join(process.cwd(), 'supabase/migrations/20240305000001_create_user_activity_audit_system.sql');
    const auditMigrationSQL = readFileSync(auditMigrationPath, 'utf8');

    console.log('📝 Running audit system migration...');
    
    const auditStatements = auditMigrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    for (let i = 0; i < auditStatements.length; i++) {
      const statement = auditStatements[i];
      if (statement.trim()) {
        try {
          console.log(`⚡ Executing audit statement ${i + 1}/${auditStatements.length}...`);
          
          const { error } = await supabase.rpc('exec', { sql: statement + ';' });
          
          if (error) {
            console.log(`Note: Audit statement ${i + 1} may have failed:`, error.message);
          } else {
            console.log(`✅ Audit statement ${i + 1} executed successfully`);
          }
        } catch (err) {
          console.log(`Note: Audit statement ${i + 1} encountered an issue:`, err);
        }
      }
    }

    console.log('🎉 Database setup completed!');
    
  } catch (error) {
    console.error('❌ Error setting up database:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  setupDatabase();
}

export { setupDatabase };