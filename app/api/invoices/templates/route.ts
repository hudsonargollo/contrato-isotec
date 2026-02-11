/**
 * Invoice Templates API Route
 * Handles invoice template management
 * Requirements: 4.1 - Invoice template system
 */

import { NextRequest, NextResponse } from 'next/server';
import { invoiceService } from '@/lib/services/invoice';
import { getTenantContext } from '@/lib/utils/tenant-context';
import { CreateInvoiceTemplateRequest } from '@/lib/types/invoice';
import { auditLogger } from '@/lib/services/audit-log';

export async function GET(request: NextRequest) {
  try {
    const context = await getTenantContext(request);
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const templates = await invoiceService.getTemplates(context);

    // Log the activity
    await auditLogger.log({
      tenant_id: context.tenant_id,
      user_id: context.user_id,
      action: 'templates.list',
      resource_type: 'template',
      details: {
        template_count: templates.length,
        template_type: 'invoice'
      }
    });

    return NextResponse.json(templates);
  } catch (error) {
    console.error('Error fetching invoice templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoice templates' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const context = await getTenantContext(request);
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: CreateInvoiceTemplateRequest = await request.json();

    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: 'Template name is required' },
        { status: 400 }
      );
    }

    if (!body.template_html) {
      return NextResponse.json(
        { error: 'Template HTML is required' },
        { status: 400 }
      );
    }

    // Validate template variables if provided
    if (body.template_variables) {
      for (const variable of body.template_variables) {
        if (!variable.name || !variable.label || !variable.type) {
          return NextResponse.json(
            { error: 'Template variables must have name, label, and type' },
            { status: 400 }
          );
        }
      }
    }

    const template = await invoiceService.createTemplate(body, context);

    // Log the activity
    await auditLogger.log({
      tenant_id: context.tenant_id,
      user_id: context.user_id,
      action: 'templates.create',
      resource_type: 'template',
      resource_id: template.id,
      details: {
        template_name: template.name,
        template_type: 'invoice',
        is_default: template.is_default,
        variables_count: template.template_variables?.length || 0
      }
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error('Error creating invoice template:', error);
    return NextResponse.json(
      { error: 'Failed to create invoice template' },
      { status: 500 }
    );
  }
}