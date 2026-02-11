/**
 * Individual WhatsApp Template API
 * Requirements: 5.4 - Template approval workflows and management
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/client';
import { getTenantContext } from '@/lib/utils/tenant-context';
import { requireAuth } from '@/lib/middleware/auth';

const UpdateTemplateSchema = z.object({
  name: z.string().optional(),
  category: z.enum(['MARKETING', 'UTILITY', 'AUTHENTICATION']).optional(),
  language: z.string().optional(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'DISABLED']).optional(),
  approval_status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
  rejection_reason: z.string().optional(),
  header: z.any().optional(),
  body: z.any().optional(),
  footer: z.any().optional(),
  buttons: z.array(z.any()).optional()
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate user
    const authResult = await requireAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }

    // Get tenant context
    const tenantContext = await getTenantContext(request);
    if (!tenantContext) {
      return NextResponse.json(
        { error: 'Tenant context not found' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Get template
    const { data: template, error } = await supabase
      .from('whatsapp_templates')
      .select(`
        *,
        created_by_user:auth.users!created_by(email),
        approved_by_user:auth.users!approved_by(email)
      `)
      .eq('id', params.id)
      .eq('tenant_id', tenantContext.tenant_id)
      .single();

    if (error || !template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ template });

  } catch (error) {
    console.error('Get template error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate user
    const authResult = await requireAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }

    // Get tenant context
    const tenantContext = await getTenantContext(request);
    if (!tenantContext) {
      return NextResponse.json(
        { error: 'Tenant context not found' },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = UpdateTemplateSchema.parse(body);

    const supabase = createClient();

    // Check if template exists and belongs to tenant
    const { data: existingTemplate, error: fetchError } = await supabase
      .from('whatsapp_templates')
      .select('*')
      .eq('id', params.id)
      .eq('tenant_id', tenantContext.tenant_id)
      .single();

    if (fetchError || !existingTemplate) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {
      ...validatedData,
      updated_at: new Date()
    };

    // Handle approval status changes
    if (validatedData.approval_status && validatedData.approval_status !== existingTemplate.approval_status) {
      if (validatedData.approval_status === 'APPROVED') {
        updateData.approved_by = tenantContext.user_id;
        updateData.approved_at = new Date();
        updateData.rejection_reason = null;
      } else if (validatedData.approval_status === 'REJECTED') {
        updateData.approved_by = null;
        updateData.approved_at = null;
        // rejection_reason should be provided in the request
      }
    }

    // Update template
    const { data: updatedTemplate, error: updateError } = await supabase
      .from('whatsapp_templates')
      .update(updateData)
      .eq('id', params.id)
      .eq('tenant_id', tenantContext.tenant_id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: `Failed to update template: ${updateError.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      template: updatedTemplate
    });

  } catch (error) {
    console.error('Update template error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation error',
          details: error.errors
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate user
    const authResult = await requireAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }

    // Get tenant context
    const tenantContext = await getTenantContext(request);
    if (!tenantContext) {
      return NextResponse.json(
        { error: 'Tenant context not found' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Check if template exists and belongs to tenant
    const { data: existingTemplate, error: fetchError } = await supabase
      .from('whatsapp_templates')
      .select('*')
      .eq('id', params.id)
      .eq('tenant_id', tenantContext.tenant_id)
      .single();

    if (fetchError || !existingTemplate) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Check if template is being used in any campaigns
    const { data: campaigns, error: campaignError } = await supabase
      .from('whatsapp_campaigns')
      .select('id')
      .eq('template_id', params.id)
      .eq('status', 'active');

    if (campaignError) {
      return NextResponse.json(
        { error: 'Failed to check template usage' },
        { status: 500 }
      );
    }

    if (campaigns && campaigns.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete template that is being used in active campaigns' },
        { status: 400 }
      );
    }

    // Soft delete by setting status to DISABLED
    const { error: deleteError } = await supabase
      .from('whatsapp_templates')
      .update({ 
        status: 'DISABLED',
        updated_at: new Date()
      })
      .eq('id', params.id)
      .eq('tenant_id', tenantContext.tenant_id);

    if (deleteError) {
      return NextResponse.json(
        { error: `Failed to delete template: ${deleteError.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Template deleted successfully'
    });

  } catch (error) {
    console.error('Delete template error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}