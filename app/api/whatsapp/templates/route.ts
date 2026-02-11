/**
 * WhatsApp Templates API
 * Requirements: 5.4 - Template message management with approval workflows
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createWhatsAppService } from '@/lib/services/whatsapp';
import { getTenantContext } from '@/lib/utils/tenant-context';
import { requireAuth } from '@/lib/middleware/auth';
import { 
  WhatsAppTemplateCategory,
  WhatsAppTemplateComponent,
  WhatsAppTemplateButton
} from '@/lib/types/whatsapp';

// Template creation schema
const CreateTemplateSchema = z.object({
  name: z.string()
    .min(1, 'Template name is required')
    .max(512, 'Template name too long')
    .regex(/^[a-z0-9_]+$/, 'Template name must contain only lowercase letters, numbers, and underscores'),
  category: z.enum(['MARKETING', 'UTILITY', 'AUTHENTICATION']),
  language: z.string().default('en_US'),
  
  // Template components
  header: z.object({
    type: z.literal('HEADER'),
    format: z.enum(['TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT']).optional(),
    text: z.string().optional(),
    example: z.object({
      header_text: z.array(z.string()).optional()
    }).optional()
  }).optional(),
  
  body: z.object({
    type: z.literal('BODY'),
    text: z.string().min(1, 'Body text is required'),
    example: z.object({
      body_text: z.array(z.array(z.string())).optional()
    }).optional()
  }),
  
  footer: z.object({
    type: z.literal('FOOTER'),
    text: z.string().optional()
  }).optional(),
  
  buttons: z.array(z.object({
    type: z.enum(['QUICK_REPLY', 'URL', 'PHONE_NUMBER']),
    text: z.string(),
    url: z.string().optional(),
    phone_number: z.string().optional()
  })).optional()
});

const UpdateTemplateSchema = CreateTemplateSchema.partial().extend({
  approval_status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
  rejection_reason: z.string().optional()
});

export async function POST(request: NextRequest) {
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
    const validatedData = CreateTemplateSchema.parse(body);

    // Create WhatsApp service
    const whatsappService = createWhatsAppService(tenantContext.tenant_id);

    // Create template
    const template = await whatsappService.createTemplate({
      name: validatedData.name,
      category: validatedData.category as WhatsAppTemplateCategory,
      language: validatedData.language,
      status: 'PENDING',
      header: validatedData.header as WhatsAppTemplateComponent,
      body: validatedData.body as WhatsAppTemplateComponent,
      footer: validatedData.footer as WhatsAppTemplateComponent,
      buttons: validatedData.buttons as WhatsAppTemplateButton[],
      approval_status: 'PENDING',
      created_by: tenantContext.user_id,
      tenant_id: tenantContext.tenant_id
    }, tenantContext);

    return NextResponse.json({
      success: true,
      template
    }, { status: 201 });

  } catch (error) {
    console.error('Create template error:', error);

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

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const approvalStatus = searchParams.get('approval_status');

    // Create WhatsApp service
    const whatsappService = createWhatsAppService(tenantContext.tenant_id);

    // Get templates with optional filtering
    let templates = await whatsappService.getTemplates(tenantContext, status || undefined);

    // Apply additional filters
    if (category) {
      templates = templates.filter(t => t.category === category);
    }

    if (approvalStatus) {
      templates = templates.filter(t => t.approval_status === approvalStatus);
    }

    return NextResponse.json({
      templates,
      total: templates.length
    });

  } catch (error) {
    console.error('Get templates error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}