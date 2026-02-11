/**
 * WhatsApp Templates Pending Approval API
 * Requirements: 5.4 - Template approval workflows
 */

import { NextRequest, NextResponse } from 'next/server';
import { createWhatsAppService } from '@/lib/services/whatsapp';
import { getTenantContext } from '@/lib/utils/tenant-context';
import { requireAuth } from '@/lib/middleware/auth';

export async function GET(request: NextRequest) {
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
    const userRole = authResult.user?.user_metadata?.role || 'user';
    if (!['admin', 'manager'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Insufficient permissions to view pending approvals' },
        { status: 403 }
      );
    }

    // Create WhatsApp service
    const whatsappService = createWhatsAppService(tenantContext.tenant_id);

    // Get templates pending approval
    const pendingTemplates = await whatsappService.getTemplatesPendingApproval(tenantContext);

    // Get compliance status for each template
    const templatesWithCompliance = await Promise.all(
      pendingTemplates.map(async (template) => {
        try {
          const compliance = await whatsappService.getTemplateComplianceStatus(
            template.id,
            tenantContext
          );
          return {
            ...template,
            compliance
          };
        } catch (error) {
          console.error(`Failed to get compliance for template ${template.id}:`, error);
          return {
            ...template,
            compliance: {
              overallScore: 0,
              issues: [{ type: 'error' as const, message: 'Failed to analyze compliance' }]
            }
          };
        }
      })
    );

    return NextResponse.json({
      templates: templatesWithCompliance,
      total: templatesWithCompliance.length
    });

  } catch (error) {
    console.error('Get pending approvals error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}