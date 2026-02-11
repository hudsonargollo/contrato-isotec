/**
 * Screening Templates API Routes
 * Handles CRUD operations for screening templates with version control
 * Requirements: 3.5 - Template version control
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { screeningService } from '@/lib/services/screening';
import { createScreeningTemplateSchema } from '@/lib/types/screening';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const tenantId = request.headers.get('x-tenant-id');

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const activeOnly = searchParams.get('active') === 'true';
    const includeHistory = searchParams.get('history') === 'true';

    const templates = await screeningService.getScreeningTemplates(tenantId, activeOnly);

    // If history is requested, get version history for each template
    if (includeHistory) {
      const templatesWithHistory = await Promise.all(
        templates.map(async (template) => {
          const history = await screeningService.getTemplateVersionHistory(template.id);
          return { ...template, version_history: history };
        })
      );
      return NextResponse.json(templatesWithHistory);
    }

    return NextResponse.json(templates);
  } catch (error) {
    console.error('Error fetching screening templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch screening templates' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const tenantId = request.headers.get('x-tenant-id');

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate request body
    const validationResult = createScreeningTemplateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid template data', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const template = await screeningService.createScreeningTemplate(tenantId, validationResult.data);
    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error('Error creating screening template:', error);
    return NextResponse.json(
      { error: 'Failed to create screening template' },
      { status: 500 }
    );
  }
}