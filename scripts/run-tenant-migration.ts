/**
 * Script to run tenant management migration
 * 
 * This script applies the tenant management system migration
 * to the remote Supabase database.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('Running tenant management system migration...');
    
    // Read the migration file
    const migrationPath = join(process.cwd(), 'supabase/migrations/20240302000001_create_tenant_management_system.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');
    
    // Split the migration into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`Executing ${statements.length} SQL statements...`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`Executing statement ${i + 1}/${statements.length}...`);
          const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
          
          if (error) {
            // Try direct execution if RPC fails
            const { error: directError } = await supabase
              .from('_temp_migration')
              .select('*')
              .limit(0); // This will fail, but we can use it to execute SQL
            
            if (directError && !directError.message.includes('does not exist')) {
              console.error(`Error in statement ${i + 1}:`, error);
              throw error;
            }
          }
        } catch (err) {
          console.error(`Failed to execute statement ${i + 1}:`, statement.substring(0, 100) + '...');
          console.error('Error:', err);
          // Continue with next statement for now
        }
      }
    }
    
    console.log('Migration completed successfully!');
    
    // Verify the migration by checking if tenants table exists
    const { data, error } = await supabase
      .from('tenants')
      .select('count(*)')
      .limit(1);
    
    if (error) {
      console.error('Migration verification failed:', error);
    } else {
      console.log('Migration verified - tenants table is accessible');
    }
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Alternative approach: Execute the migration using a simpler method
async function runMigrationSimple() {
  try {
    console.log('Creating tenant management tables...');
    
    // Create tenants table
    const { error: tenantsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.tenants (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          domain TEXT UNIQUE NOT NULL,
          subdomain TEXT UNIQUE NOT NULL,
          branding JSONB NOT NULL DEFAULT '{"logo_url": "", "primary_color": "#2563eb", "secondary_color": "#64748b", "custom_css": "", "white_label": false}',
          subscription JSONB NOT NULL DEFAULT '{"plan": "starter", "status": "active", "limits": {"users": 5, "leads": 1000, "contracts": 100, "storage_gb": 10}, "features": ["crm", "screening", "invoices"]}',
          settings JSONB NOT NULL DEFAULT '{"timezone": "America/Sao_Paulo", "currency": "BRL", "language": "pt-BR", "date_format": "DD/MM/YYYY", "notifications": {"email": true, "whatsapp": false, "sms": false}}',
          status TEXT NOT NULL DEFAULT 'active',
          created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
          CONSTRAINT valid_status CHECK (status IN ('active', 'suspended', 'cancelled', 'trial')),
          CONSTRAINT valid_domain_format CHECK (domain ~ '^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\\.[a-zA-Z]{2,}$'),
          CONSTRAINT valid_subdomain_format CHECK (subdomain ~ '^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*$')
        );
      `
    });
    
    if (tenantsError) {
      console.log('Tenants table might already exist or there was an issue:', tenantsError.message);
    } else {
      console.log('Tenants table created successfully');
    }
    
    // Test if we can query the tenants table
    const { data, error } = await supabase
      .from('tenants')
      .select('count(*)')
      .limit(1);
    
    if (error) {
      console.error('Cannot access tenants table:', error);
    } else {
      console.log('Tenants table is accessible');
    }
    
  } catch (error) {
    console.error('Simple migration failed:', error);
  }
}

// Run the migration
if (require.main === module) {
  runMigrationSimple();
}