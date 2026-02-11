/**
 * WhatsApp Template Approval API
 * Requirements: 5.4 - Template approval workflows
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createWhatsAppService } from '@/lib/services/whatsapp';
import { getTenantContext } from '@/lib/utils/tenant-context';
import { requireAuth } from '@/lib/middleware/auth';

const ApprovalSchema = z.object({
  action: z.enum(['approve', 'reject']),
  reason: z.string().optional(),
  comment: z.string().optional()
});

export async function POST(
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

    // Check if user has approval permissions
    // In a real implementation, this would check RBAC permissions
    const userRole = authResult.user?.user_metadata?.role || 'user';
    if (!['admin', 'manager'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Insufficient permissions to approve templates' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = ApprovalSchema.parse(body);

    // Validate rejection reason
    if (validatedData.action === 'reject' && !validatedData.reason?.trim()) {
      return NextResponse.json(
        { error: 'Rejection reason is required' },
        { status: 400 }
      );
    }

    // Create WhatsApp service
    const whatsappService = createWhatsAppService(tenantContext.tenant_id);

    // Update template approval status
    const updatedTemplate = await whatsappService.updateTemplateApproval(
      params.id,
      validatedData.action === 'approve' ? 'APPROVED' : 'REJECTED',
      tenantContext,
      validatedData.reason,
      validatedData.comment
    );

    return NextResponse.json({
      success: true,
      template: updatedTemplate,
      message: `Template ${validatedData.action}d successfully`
    });

  } catch (error) {
    console.error('Template approval error:', error);

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

    // Create WhatsApp service
    const whatsappService = createWhatsAppService(tenantContext.tenant_id);

    // Get template compliance status
    const complianceStatus = await whatsappService.getTemplateComplianceStatus(
      params.id,
      tenantContext
    );

    return NextResponse.json({
      compliance: complianceStatus
    });

  } catch (error) {
    console.error('Get compliance status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}