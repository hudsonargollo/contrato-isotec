/**
 * Check Tables Script
 * 
 * Checks if questionnaire tables exist and creates them if needed.
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTables() {
  try {
    console.log('🔍 Checking if questionnaire tables exist...');

    // Try to query the questionnaire_templates table
    const { data, error } = await supabase
      .from('questionnaire_templates')
      .select('id')
      .limit(1);

    if (error) {
      console.log('❌ Tables do not exist:', error.message);
      console.log('🔧 Creating tables manually...');
      
      // Create tables using individual SQL commands
      await createTables();
    } else {
      console.log('✅ Tables already exist!');
      console.log(`📊 Found ${data?.length || 0} templates`);
    }
    
  } catch (error) {
    console.error('❌ Error checking tables:', error);
    process.exit(1);
  }
}

async function createTables() {
  // Create questionnaire_templates table
  const createTemplatesTable = `
    CREATE TABLE IF NOT EXISTS public.questionnaire_templates (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID,
      name TEXT NOT NULL,
      description TEXT,
      version TEXT NOT NULL DEFAULT '1.0',
      is_active BOOLEAN DEFAULT TRUE,
      is_public BOOLEAN DEFAULT TRUE,
      scoring_rules JSONB NOT NULL DEFAULT '[]',
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );
  `;

  const createQuestionsTable = `
    CREATE TABLE IF NOT EXISTS public.questionnaire_questions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      template_id UUID REFERENCES public.questionnaire_templates(id) ON DELETE CASCADE NOT NULL,
      question_type TEXT NOT NULL,
      question_text TEXT NOT NULL,
      question_options JSONB DEFAULT '[]',
      weight DECIMAL(5,2) DEFAULT 1.0,
      is_required BOOLEAN DEFAULT TRUE,
      sort_order INTEGER NOT NULL DEFAULT 0,
      conditional_logic JSONB DEFAULT '{}',
      validation_rules JSONB DEFAULT '{}',
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );
  `;

  const createResponsesTable = `
    CREATE TABLE IF NOT EXISTS public.questionnaire_responses (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      template_id UUID REFERENCES public.questionnaire_templates(id) ON DELETE CASCADE NOT NULL,
      session_id TEXT NOT NULL,
      respondent_email TEXT,
      respondent_name TEXT,
      respondent_phone TEXT,
      responses JSONB NOT NULL DEFAULT '{}',
      calculated_score DECIMAL(10,2) DEFAULT 0,
      screening_result JSONB DEFAULT '{}',
      status TEXT DEFAULT 'in_progress',
      ip_address INET,
      user_agent TEXT,
      referrer TEXT,
      utm_source TEXT,
      utm_medium TEXT,
      utm_campaign TEXT,
      started_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      completed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );
  `;

  try {
    console.log('📝 Creating questionnaire_templates table...');
    const { error: error1 } = await supabase.rpc('exec_sql', { sql: createTemplatesTable });
    if (error1) console.log('Note:', error1.message);

    console.log('📝 Creating questionnaire_questions table...');
    const { error: error2 } = await supabase.rpc('exec_sql', { sql: createQuestionsTable });
    if (error2) console.log('Note:', error2.message);

    console.log('📝 Creating questionnaire_responses table...');
    const { error: error3 } = await supabase.rpc('exec_sql', { sql: createResponsesTable });
    if (error3) console.log('Note:', error3.message);

    console.log('✅ Tables created successfully!');
  } catch (error) {
    console.error('❌ Error creating tables:', error);
  }
}

// Run the check
if (require.main === module) {
  checkTables();
}

export { checkTables };