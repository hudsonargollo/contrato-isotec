/**
 * Individual Questionnaire API Route
 * 
 * Public API endpoints for individual questionnaire templates.
 * Supports fetching questionnaire with questions for public access.
 * 
 * Requirements: 3.1 - Project Planning and Screening System
 */

import { NextRequest, NextResponse } from 'next/server';

// For now, return a hardcoded sample questionnaire for testing
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Sample questionnaire data for testing
    const sampleQuestionnaire = {
      id: id,
      name: 'Avaliação de Viabilidade Solar',
      description: 'Questionário para avaliar a viabilidade de instalação de sistema fotovoltaico',
      version: '1.0',
      is_active: true,
      is_public: true,
      scoring_rules: [],
      metadata: {
        category: 'solar_screening',
        target_audience: 'residential',
        estimated_duration: '5-10 minutes'
      },
      questions: [
        {
          id: 'q1',
          template_id: id,
          question_type: 'number',
          question_text: 'Qual é o valor médio da sua conta de energia elétrica mensal (em R$)?',
          question_options: [],
          weight: 2.0,
          is_required: true,
          sort_order: 1,
          conditional_logic: {},
          validation_rules: {
            required: true,
            min: 0,
            customMessage: 'Por favor, informe um valor válido para sua conta de energia'
          },
          metadata: {
            category: 'consumption',
            unit: 'BRL'
          }
        },
        {
          id: 'q2',
          template_id: id,
          question_type: 'single_choice',
          question_text: 'Qual é o tipo da sua propriedade?',
          question_options: [
            { value: 'house', label: 'Casa', score: 2 },
            { value: 'apartment', label: 'Apartamento', score: 1 },
            { value: 'commercial', label: 'Estabelecimento comercial', score: 2 },
            { value: 'rural', label: 'Propriedade rural', score: 3 }
          ],
          weight: 1.5,
          is_required: true,
          sort_order: 2,
          conditional_logic: {},
          validation_rules: {},
          metadata: {
            category: 'property_type'
          }
        },
        {
          id: 'q3',
          template_id: id,
          question_type: 'single_choice',
          question_text: 'Como você avalia as condições do seu telhado?',
          question_options: [
            { value: 'excellent', label: 'Excelente - novo ou reformado recentemente', score: 3 },
            { value: 'good', label: 'Bom - em boas condições', score: 2 },
            { value: 'fair', label: 'Regular - precisa de pequenos reparos', score: 1 },
            { value: 'poor', label: 'Ruim - precisa de reforma', score: 0 }
          ],
          weight: 2.0,
          is_required: true,
          sort_order: 3,
          conditional_logic: {},
          validation_rules: {},
          metadata: {
            category: 'roof_condition'
          }
        },
        {
          id: 'q4',
          template_id: id,
          question_type: 'single_choice',
          question_text: 'Qual é a orientação principal do seu telhado?',
          question_options: [
            { value: 'north', label: 'Norte', score: 3 },
            { value: 'northeast', label: 'Nordeste', score: 2.5 },
            { value: 'northwest', label: 'Noroeste', score: 2.5 },
            { value: 'east', label: 'Leste', score: 2 },
            { value: 'west', label: 'Oeste', score: 2 },
            { value: 'south', label: 'Sul', score: 1 },
            { value: 'unknown', label: 'Não sei', score: 1.5 }
          ],
          weight: 1.5,
          is_required: true,
          sort_order: 4,
          conditional_logic: {},
          validation_rules: {},
          metadata: {
            category: 'roof_orientation'
          }
        },
        {
          id: 'q5',
          template_id: id,
          question_type: 'boolean',
          question_text: 'Há sombreamento significativo no seu telhado (árvores, prédios, etc.)?',
          question_options: [],
          weight: 1.0,
          is_required: true,
          sort_order: 5,
          conditional_logic: {},
          validation_rules: {},
          metadata: {
            category: 'shading',
            scoring: 'inverted'
          }
        },
        {
          id: 'q6',
          template_id: id,
          question_type: 'scale',
          question_text: 'Em uma escala de 1 a 10, qual é seu interesse em energia solar?',
          question_options: {
            min: 1,
            max: 10,
            step: 1,
            minLabel: 'Pouco interessado',
            maxLabel: 'Muito interessado'
          },
          weight: 1.0,
          is_required: true,
          sort_order: 6,
          conditional_logic: {},
          validation_rules: {},
          metadata: {
            category: 'interest_level'
          }
        },
        {
          id: 'q7',
          template_id: id,
          question_type: 'email',
          question_text: 'Deixe seu e-mail para receber o resultado da avaliação:',
          question_options: [],
          weight: 0,
          is_required: false,
          sort_order: 7,
          conditional_logic: {},
          validation_rules: {
            pattern: '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$',
            customMessage: 'Por favor, digite um e-mail válido'
          },
          metadata: {
            category: 'lead_capture'
          }
        },
        {
          id: 'q8',
          template_id: id,
          question_type: 'text',
          question_text: 'Nome (opcional):',
          question_options: [],
          weight: 0,
          is_required: false,
          sort_order: 8,
          conditional_logic: {},
          validation_rules: {
            maxLength: 200
          },
          metadata: {
            category: 'lead_capture'
          }
        },
        {
          id: 'q9',
          template_id: id,
          question_type: 'phone',
          question_text: 'Telefone para contato (opcional):',
          question_options: [],
          weight: 0,
          is_required: false,
          sort_order: 9,
          conditional_logic: {},
          validation_rules: {
            pattern: '^(\\+55\\s?)?(\\(?\\d{2}\\)?\\s?)?\\d{4,5}-?\\d{4}$',
            customMessage: 'Digite um telefone válido'
          },
          metadata: {
            category: 'lead_capture'
          }
        }
      ]
    };
    
    return NextResponse.json({
      success: true,
      data: sampleQuestionnaire
    });
  } catch (error) {
    console.error('Error fetching questionnaire:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch questionnaire'
      },
      { status: 500 }
    );
  }
}