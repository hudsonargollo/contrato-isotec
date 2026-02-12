/**
 * Setup API Route
 * 
 * Creates the questionnaire system tables if they don't exist.
 * This is a temporary setup endpoint for development.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // Check if tables exist
    const { data: existingTables, error: checkError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['questionnaire_templates', 'questionnaire_questions', 'questionnaire_responses']);

    if (checkError) {
      console.error('Error checking tables:', checkError);
    }

    const existingTableNames = existingTables?.map(t => t.table_name) || [];
    
    if (existingTableNames.includes('questionnaire_templates')) {
      return NextResponse.json({
        success: true,
        message: 'Tables already exist',
        tables: existingTableNames
      });
    }

    // Create tables using raw SQL
    const createTablesSQL = `
      -- Create questionnaire templates table
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

      -- Create questionnaire questions table
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

      -- Create questionnaire responses table
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

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_questionnaire_templates_active ON public.questionnaire_templates(is_active) WHERE is_active = TRUE;
      CREATE INDEX IF NOT EXISTS idx_questionnaire_templates_public ON public.questionnaire_templates(is_public) WHERE is_public = TRUE;
      CREATE INDEX IF NOT EXISTS idx_questionnaire_questions_template_id ON public.questionnaire_questions(template_id);
      CREATE INDEX IF NOT EXISTS idx_questionnaire_questions_sort_order ON public.questionnaire_questions(template_id, sort_order);
      CREATE INDEX IF NOT EXISTS idx_questionnaire_responses_template_id ON public.questionnaire_responses(template_id);
      CREATE INDEX IF NOT EXISTS idx_questionnaire_responses_session_id ON public.questionnaire_responses(session_id);
    `;

    // Execute the SQL using a direct query
    const { error: createError } = await supabase.rpc('exec', {
      sql: createTablesSQL
    });

    if (createError) {
      console.error('Error creating tables:', createError);
      return NextResponse.json(
        { error: 'Failed to create tables', details: createError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Tables created successfully'
    });

  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Use POST to setup tables'
  });
}