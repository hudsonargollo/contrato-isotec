/**
 * Questionnaires API Route
 * 
 * Public API endpoints for questionnaire templates.
 * Supports listing public questionnaires for marketing funnels.
 * 
 * Requirements: 3.1 - Project Planning and Screening System
 */

import { NextRequest, NextResponse } from 'next/server';
import { questionnaireService } from '@/lib/services/questionnaire';
import { createQuestionnaireTemplateSchema } from '@/lib/types/questionnaire';

// GET /api/questionnaires - List public questionnaires
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const publicOnly = searchParams.get('public') === 'true';
    
    let templates;
    if (publicOnly) {
      templates = await questionnaireService.getPublicTemplates();
    } else {
      // For authenticated requests, would need to get tenant from auth
      templates = await questionnaireService.getPublicTemplates();
    }
    
    return NextResponse.json({
      success: true,
      data: templates
    });
  } catch (error) {
    console.error('Error fetching questionnaires:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch questionnaires'
      },
      { status: 500 }
    );
  }
}

// POST /api/questionnaires - Create new questionnaire (admin only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validatedData = createQuestionnaireTemplateSchema.parse(body);
    
    // TODO: Add authentication check for admin users
    // For now, allow creation for testing purposes
    
    const template = await questionnaireService.createTemplate(validatedData);
    
    return NextResponse.json({
      success: true,
      data: template
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating questionnaire:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid input data',
          details: error.message
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create questionnaire'
      },
      { status: 500 }
    );
  }
}