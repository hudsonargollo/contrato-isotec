/**
 * Run CRM Migration Script
 * 
 * Runs the CRM system migration directly using Supabase client.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load environment variables from .env.local
try {
  const envFile = readFileSync('.env.local', 'utf8');
  const envVars = envFile.split('\n').reduce((acc, line) => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
    return acc;
  }, {});
} catch (error) {
  console.log('No .env.local file found, using system environment variables');
}

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runCRMMigration() {
  try {
    console.log('🔄 Running CRM system migration...');

    // Read the migration file
    const migrationPath = join(process.cwd(), 'supabase/migrations/20240303000001_create_crm_system.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');

    // Execute the migration using raw SQL
    console.log('📝 Executing CRM migration SQL...');
    
    const { error } = await supabase.rpc('exec', {
      sql: migrationSQL
    });

    if (error) {
      console.error('❌ Error executing migration:', error);
      
      // Try alternative approach - split into smaller chunks
      console.log('🔄 Trying alternative approach...');
      
      // Split by CREATE TABLE statements
      const tableStatements = migrationSQL.split(/(?=CREATE TABLE)/g);
      
      for (let i = 0; i < tableStatements.length; i++) {
        const statement = tableStatements[i].trim();
        if (statement) {
          console.log(`⚡ Executing chunk ${i + 1}/${tableStatements.length}...`);
          
          const { error: chunkError } = await supabase.rpc('exec', {
            sql: statement
          });
          
          if (chunkError) {
            console.error(`❌ Error in chunk ${i + 1}:`, chunkError);
            console.error('Statement preview:', statement.substring(0, 200) + '...');
          } else {
            console.log(`✅ Chunk ${i + 1} executed successfully`);
          }
        }
      }
    } else {
      console.log('✅ Migration executed successfully');
    }

    // Verify tables were created
    console.log('🔍 Verifying CRM tables...');
    
    const tables = [
      'lead_sources',
      'pipeline_stages', 
      'leads',
      'interaction_types',
      'lead_interactions',
      'lead_stage_history',
      'lead_scoring_rules'
    ];

    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
        
      if (error) {
        console.error(`❌ Table ${table} not accessible:`, error.message);
      } else {
        console.log(`✅ Table ${table} verified`);
      }
    }

    console.log('🎉 CRM migration completed!');
    
  } catch (error) {
    console.error('❌ Error running CRM migration:', error);
    process.exit(1);
  }
}

// Run the migration
if (require.main === module) {
  runCRMMigration();
}

export { runCRMMigration };