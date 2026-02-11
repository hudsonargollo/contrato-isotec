/**
 * Individual Screening Template API Routes
 * Handles operations for specific screening templates including version control
 * Requirements: 3.5 - Template version control
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { screeningService } from '@/lib/services/screening';
import { updateScreeningTemplateSchema } from '@/lib/types/screening';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const template = await screeningService.getScreeningTemplate(params.id);
    
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Verify tenant access
    if (template.tenant_id !== tenantId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error('Error fetching screening template:', error);
    return NextResponse.json(
      { error: 'Failed to fetch screening template' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const validationResult = updateScreeningTemplateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid template data', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const template = await screeningService.updateScreeningTemplate(params.id, validationResult.data);
    return NextResponse.json(template);
  } catch (error) {
    console.error('Error updating screening template:', error);
    return NextResponse.json(
      { error: 'Failed to update screening template' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    await screeningService.deleteScreeningTemplate(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting screening template:', error);
    return NextResponse.json(
      { error: 'Failed to delete screening template' },
      { status: 500 }
    );
  }
}