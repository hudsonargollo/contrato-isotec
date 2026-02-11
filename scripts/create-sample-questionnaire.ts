/**
 * Create Sample Questionnaire Script
 * 
 * Creates a sample questionnaire directly using INSERT statements.
 * This bypasses the need for complex migrations.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createSampleQuestionnaire() {
  try {
    console.log('🌱 Creating sample questionnaire...');

    // First, let's try to create a simple template using direct insert
    const templateData = {
      name: 'Avaliação de Viabilidade Solar',
      description: 'Questionário para avaliar a viabilidade de instalação de sistema fotovoltaico',
      version: '1.0',
      is_active: true,
      is_public: true,
      scoring_rules: [],
      metadata: {
        category: 'solar_screening',
        target_audience: 'residential'
      }
    };

    // Try to insert directly
    const { data: template, error: templateError } = await supabase
      .from('questionnaire_templates')
      .insert(templateData)
      .select()
      .single();

    if (templateError) {
      console.error('❌ Error creating template:', templateError);
      return;
    }

    console.log('✅ Created template:', template.name);
    console.log('📋 Template ID:', template.id);
    console.log(`🔗 URL: http://localhost:3000/questionnaire/${template.id}`);

    // Create sample questions
    const questions = [
      {
        template_id: template.id,
        question_type: 'number',
        question_text: 'Qual é o valor médio da sua conta de energia elétrica mensal?',
        weight: 2.0,
        is_required: true,
        sort_order: 1,
        validation_rules: { required: true, min: 0 },
        metadata: { category: 'consumption', unit: 'BRL' }
      },
      {
        template_id: template.id,
        question_type: 'single_choice',
        question_text: 'Qual é o tipo da sua residência?',
        question_options: [
          { value: 'house', label: 'Casa', score: 2 },
          { value: 'apartment', label: 'Apartamento', score: 1 },
          { value: 'commercial', label: 'Estabelecimento comercial', score: 2 }
        ],
        weight: 1.5,
        is_required: true,
        sort_order: 2,
        metadata: { category: 'property_type' }
      },
      {
        template_id: template.id,
        question_type: 'email',
        question_text: 'Deixe seu e-mail para receber o resultado:',
        weight: 0,
        is_required: false,
        sort_order: 3,
        validation_rules: { pattern: '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$' },
        metadata: { category: 'lead_capture' }
      }
    ];

    const { data: createdQuestions, error: questionsError } = await supabase
      .from('questionnaire_questions')
      .insert(questions)
      .select();

    if (questionsError) {
      console.error('❌ Error creating questions:', questionsError);
      return;
    }

    console.log(`✅ Created ${createdQuestions.length} questions`);
    console.log('🎉 Sample questionnaire ready!');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

if (require.main === module) {
  createSampleQuestionnaire();
}

export { createSampleQuestionnaire };