/**
 * Questionnaire Responses API Route
 * 
 * Public API endpoints for submitting questionnaire responses.
 * Handles response submission and screening result generation.
 * 
 * Requirements: 3.1 - Project Planning and Screening System
 */

import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory storage for demo purposes
// In production, this would use the database
const responses: Record<string, any> = {};

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    
    const { sessionId, responses: questionResponses, respondentInfo, utmParams } = body;
    
    if (!sessionId || !questionResponses) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Calculate a simple score based on responses
    const score = calculateScore(questionResponses);
    const screeningResult = generateScreeningResult(score, questionResponses);
    
    // Store response (in production, this would go to database)
    const responseId = `resp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    responses[responseId] = {
      id: responseId,
      template_id: id,
      session_id: sessionId,
      responses: questionResponses,
      respondent_email: respondentInfo?.email,
      respondent_name: respondentInfo?.name,
      respondent_phone: respondentInfo?.phone,
      calculated_score: score,
      screening_result: screeningResult,
      status: 'completed',
      utm_source: utmParams?.source,
      utm_medium: utmParams?.medium,
      utm_campaign: utmParams?.campaign,
      created_at: new Date().toISOString(),
      completed_at: new Date().toISOString()
    };
    
    return NextResponse.json({
      success: true,
      data: {
        response: responses[responseId],
        screeningResult
      }
    });
  } catch (error) {
    console.error('Error submitting response:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to submit response'
      },
      { status: 500 }
    );
  }
}

function calculateScore(questionResponses: Record<string, any>): number {
  let score = 0;
  
  // Monthly bill scoring (q1)
  const monthlyBill = parseFloat(questionResponses.q1) || 0;
  if (monthlyBill > 500) score += 20;
  else if (monthlyBill > 300) score += 15;
  else if (monthlyBill > 150) score += 10;
  else if (monthlyBill > 50) score += 5;
  
  // Property type scoring (q2)
  const propertyType = questionResponses.q2;
  if (propertyType === 'rural') score += 15;
  else if (propertyType === 'house' || propertyType === 'commercial') score += 12;
  else if (propertyType === 'apartment') score += 5;
  
  // Roof condition scoring (q3)
  const roofCondition = questionResponses.q3;
  if (roofCondition === 'excellent') score += 20;
  else if (roofCondition === 'good') score += 15;
  else if (roofCondition === 'fair') score += 8;
  else if (roofCondition === 'poor') score += 2;
  
  // Roof orientation scoring (q4)
  const roofOrientation = questionResponses.q4;
  if (roofOrientation === 'north') score += 15;
  else if (roofOrientation === 'northeast' || roofOrientation === 'northwest') score += 12;
  else if (roofOrientation === 'east' || roofOrientation === 'west') score += 8;
  else if (roofOrientation === 'unknown') score += 6;
  else if (roofOrientation === 'south') score += 3;
  
  // Shading scoring (q5) - inverted
  const hasShading = questionResponses.q5;
  if (hasShading === false) score += 10;
  else if (hasShading === true) score += 3;
  
  // Interest level scoring (q6)
  const interestLevel = parseInt(questionResponses.q6) || 0;
  score += interestLevel; // 1-10 points directly
  
  return Math.round(score);
}

function generateScreeningResult(score: number, responses: Record<string, any>) {
  const maxScore = 100; // Theoretical maximum
  const percentage = Math.min((score / maxScore) * 100, 100);
  
  let feasibilityRating: 'high' | 'medium' | 'low' | 'not_feasible';
  let qualificationLevel: 'qualified' | 'partially_qualified' | 'not_qualified';
  let followUpPriority: 'high' | 'medium' | 'low';
  
  if (percentage >= 70) {
    feasibilityRating = 'high';
    qualificationLevel = 'qualified';
    followUpPriority = 'high';
  } else if (percentage >= 50) {
    feasibilityRating = 'medium';
    qualificationLevel = 'partially_qualified';
    followUpPriority = 'medium';
  } else if (percentage >= 30) {
    feasibilityRating = 'low';
    qualificationLevel = 'partially_qualified';
    followUpPriority = 'low';
  } else {
    feasibilityRating = 'not_feasible';
    qualificationLevel = 'not_qualified';
    followUpPriority = 'low';
  }
  
  const recommendations: string[] = [];
  const riskFactors: string[] = [];
  const nextSteps: string[] = [];
  
  // Generate recommendations based on responses
  const monthlyBill = parseFloat(responses.q1) || 0;
  const roofCondition = responses.q3;
  const propertyType = responses.q2;
  const hasShading = responses.q5;
  
  if (monthlyBill > 400) {
    recommendations.push('Seu alto consumo de energia torna a energia solar muito vantajosa');
    recommendations.push('Potencial de economia de até 95% na conta de luz');
  } else if (monthlyBill > 200) {
    recommendations.push('Energia solar pode gerar economia significativa na sua conta');
    recommendations.push('Retorno do investimento estimado em 3-5 anos');
  } else if (monthlyBill > 100) {
    recommendations.push('Energia solar ainda pode ser vantajosa, mas com retorno mais longo');
  } else {
    recommendations.push('Para contas baixas, considere outras formas de economia de energia');
  }
  
  if (roofCondition === 'poor') {
    riskFactors.push('Telhado precisa de reforma antes da instalação');
    nextSteps.push('Avaliar custos de reforma do telhado');
  } else if (roofCondition === 'excellent') {
    recommendations.push('Telhado em excelentes condições para instalação');
  }
  
  if (hasShading) {
    riskFactors.push('Sombreamento pode reduzir a eficiência do sistema');
    nextSteps.push('Análise detalhada de sombreamento necessária');
  }
  
  if (propertyType === 'apartment') {
    riskFactors.push('Apartamentos têm limitações para instalação própria');
    nextSteps.push('Considerar energia solar compartilhada ou por assinatura');
  }
  
  // Add default next steps based on qualification
  if (qualificationLevel === 'qualified') {
    nextSteps.push('Agendar visita técnica gratuita');
    nextSteps.push('Solicitar proposta personalizada');
    nextSteps.push('Análise de viabilidade técnica completa');
  } else if (qualificationLevel === 'partially_qualified') {
    nextSteps.push('Análise mais detalhada necessária');
    nextSteps.push('Consultar especialista em energia solar');
    nextSteps.push('Avaliar melhorias na propriedade');
  } else {
    nextSteps.push('Considerar outras alternativas de economia de energia');
    nextSteps.push('Reavaliar no futuro com mudanças na propriedade');
  }
  
  // Estimate system size and investment
  const estimatedSystemSize = monthlyBill > 0 ? Math.round((monthlyBill * 12) / 1200) : 0;
  const estimatedInvestment = estimatedSystemSize > 0 ? {
    min: estimatedSystemSize * 3000,
    max: estimatedSystemSize * 5000,
    currency: 'BRL'
  } : undefined;
  
  return {
    score,
    maxScore,
    percentage: Math.round(percentage),
    feasibilityRating,
    recommendations,
    riskFactors,
    nextSteps,
    estimatedSystemSize: estimatedSystemSize > 0 ? {
      recommended: estimatedSystemSize,
      unit: 'kWp'
    } : undefined,
    estimatedInvestment,
    qualificationLevel,
    followUpPriority,
    metadata: {
      calculatedAt: new Date().toISOString(),
      version: '1.0'
    }
  };
}