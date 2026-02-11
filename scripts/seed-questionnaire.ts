/**
 * Seed Default Questionnaire Script
 * 
 * Creates a default solar screening questionnaire for testing and demonstration.
 * Run with: npx tsx scripts/seed-questionnaire.ts
 * 
 * Requirements: 3.1 - Project Planning and Screening System
 */

import { createClient } from '@supabase/supabase-js';
import { 
  DEFAULT_SOLAR_SCREENING_TEMPLATE,
  DEFAULT_SOLAR_SCREENING_QUESTIONS
} from '@/lib/types/questionnaire';

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

async function seedQuestionnaire() {
  try {
    console.log('🌱 Seeding default solar screening questionnaire...');

    // Check if questionnaire already exists
    const { data: existingTemplates } = await supabase
      .from('questionnaire_templates')
      .select('id')
      .eq('name', DEFAULT_SOLAR_SCREENING_TEMPLATE.name)
      .limit(1);

    if (existingTemplates && existingTemplates.length > 0) {
      console.log('✅ Default questionnaire already exists, skipping...');
      return;
    }

    // Create template
    const { data: template, error: templateError } = await supabase
      .from('questionnaire_templates')
      .insert({
        ...DEFAULT_SOLAR_SCREENING_TEMPLATE,
        tenant_id: null // Public template
      })
      .select()
      .single();

    if (templateError) {
      throw new Error(`Failed to create template: ${templateError.message}`);
    }

    console.log(`✅ Created template: ${template.name} (ID: ${template.id})`);

    // Create questions
    const questionsWithTemplateId = DEFAULT_SOLAR_SCREENING_QUESTIONS.map(question => ({
      ...question,
      template_id: template.id
    }));

    const { data: questions, error: questionsError } = await supabase
      .from('questionnaire_questions')
      .insert(questionsWithTemplateId)
      .select();

    if (questionsError) {
      throw new Error(`Failed to create questions: ${questionsError.message}`);
    }

    console.log(`✅ Created ${questions.length} questions`);

    // Update scoring rules with actual question IDs
    const updatedScoringRules = DEFAULT_SOLAR_SCREENING_TEMPLATE.scoring_rules.map(rule => {
      const updatedConditions = rule.conditions.map(condition => {
        // Find question by metadata category
        const question = questions.find(q => {
          const metadata = q.metadata as any;
          return metadata?.category === getQuestionCategory(condition.questionId);
        });
        
        return {
          ...condition,
          questionId: question?.id || condition.questionId
        };
      });
      
      return {
        ...rule,
        conditions: updatedConditions
      };
    });

    // Update template with correct scoring rules
    const { error: updateError } = await supabase
      .from('questionnaire_templates')
      .update({ scoring_rules: updatedScoringRules })
      .eq('id', template.id);

    if (updateError) {
      console.warn(`Warning: Failed to update scoring rules: ${updateError.message}`);
    } else {
      console.log('✅ Updated scoring rules with question IDs');
    }

    console.log('\n🎉 Successfully seeded default questionnaire!');
    console.log(`📋 Template ID: ${template.id}`);
    console.log(`🔗 Public URL: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/questionnaire/${template.id}`);
    
  } catch (error) {
    console.error('❌ Error seeding questionnaire:', error);
    process.exit(1);
  }
}

// Helper function to map question IDs to categories
function getQuestionCategory(questionId: string): string {
  // This is a mapping for the default template
  // In a real implementation, this would be more sophisticated
  const categoryMap: Record<string, string> = {
    'monthly_bill': 'consumption',
    'property_type': 'property_type',
    'roof_condition': 'roof_condition',
    'roof_orientation': 'roof_orientation',
    'shading': 'shading',
    'interest_level': 'interest_level',
    'email': 'lead_capture',
    'name': 'lead_capture',
    'phone': 'lead_capture'
  };
  
  return categoryMap[questionId] || questionId;
}

// Run the seeding function
if (require.main === module) {
  seedQuestionnaire();
}

export { seedQuestionnaire };