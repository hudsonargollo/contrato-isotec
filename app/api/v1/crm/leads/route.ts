/**
 * Versioned CRM Leads API Routes (v1.x)
 * Handles CRUD operations for leads with version-specific transformations
 * Requirements: 2.1 - Lead capture and creation workflows, 10.5 - API versioning
 */

import { NextRequest } from 'next/server';
import { 
  withApiVersioning,
  createVersionedResponse,
  ApiVersion
} from '@/lib/middleware/api-versioning';
import { 
  withApiAuth,
  AuthContext,
  RateLimitStatus
} from '@/lib/middleware/api-auth';
import { crmService } from '@/lib/services/crm';
import { apiVersionManagementService } from '@/lib/services/api-version-management';
import { trackCustomEvent, recordCustomMetric } from '@/lib/middleware/analytics';
import type { CreateLeadRequest, LeadFilters, LeadSortOptions } from '@/lib/types/crm';

/**
 * Handler for API v1.0 - Legacy format
 */
async function handleV1_0_GET(
  request: NextRequest,
  context: AuthContext,
  rateLimitStatus: RateLimitStatus
) {
  const version: ApiVersion = '1.0';
  
  try {
    // Track version usage
    await apiVersionManagementService.trackVersionUsage(
      context.tenant_id,
      version,
      '/api/v1/crm/leads',
      request.headers.get('user-agent') || undefined
    );

    // Parse query parameters with v1.0 format
    const { searchParams } = new URL(request.url);
    
    const filters: LeadFilters = {};
    if (searchParams.get('status')) {
      filters.status = searchParams.get('status')!.split(',') as any[];
    }
    if (searchParams.get('search')) {
      filters.search_query = searchParams.get('search')!;
    }

    const sort: LeadSortOptions = {
      field: (searchParams.get('sort') as any) || 'created_at',
      direction: (searchParams.get('order') as any) || 'desc' // v1.0 uses 'order' instead of 'direction'
    };

    // v1.0 pagination format
    const page = parseInt(searchParams.get('page') || '1');
    const per_page = parseInt(searchParams.get('per_page') || '20'); // v1.0 uses 'per_page'

    const result = await crmService.getLeads(context.tenant_id, filters, sort, page, per_page);

    // Transform to v1.0 format
    const v1_0_result = {
      leads: result.data,
      pagination: {
        page: result.pagination.current_page,
        per_page: result.pagination.items_per_page,
        total: result.pagination.total_items
      }
    };

    // Track analytics
    await trackCustomEvent(
      request,
      'leads_viewed',
      'crm',
      'view',
      {
        api_version: version,
        filters_applied: Object.keys(filters).length,
        page,
        per_page,
        total_results: result.pagination.total_items
      },
      'lead'
    );

    return createVersionedResponse(v1_0_result, version, 200, {
      'X-RateLimit-Limit': rateLimitStatus.limit.toString(),
      'X-RateLimit-Remaining': rateLimitStatus.remaining.toString()
    });
  } catch (error) {
    console.error('Error in v1.0 leads GET:', error);
    return createVersionedResponse(
      { error: 'Failed to fetch leads' },
      version,
      500
    );
  }
}

/**
 * Handler for API v1.1 - Enhanced format
 */
async function handleV1_1_GET(
  request: NextRequest,
  context: AuthContext,
  rateLimitStatus: RateLimitStatus
) {
  const version: ApiVersion = '1.1';
  
  try {
    // Track version usage
    await apiVersionManagementService.trackVersionUsage(
      context.tenant_id,
      version,
      '/api/v1/crm/leads',
      request.headers.get('user-agent') || undefined
    );

    // Parse query parameters with v1.1 enhancements
    const { searchParams } = new URL(request.url);
    
    const filters: LeadFilters = {};
    if (searchParams.get('status')) {
      filters.status = searchParams.get('status')!.split(',') as any[];
    }
    if (searchParams.get('stage_id')) {
      filters.stage_id = searchParams.get('stage_id')!.split(',');
    }
    if (searchParams.get('search_query')) {
      filters.search_query = searchParams.get('search_query')!;
    }
    if (searchParams.get('score_min')) {
      filters.score_min = parseInt(searchParams.get('score_min')!);
    }
    if (searchParams.get('score_max')) {
      filters.score_max = parseInt(searchParams.get('score_max')!);
    }

    const sort: LeadSortOptions = {
      field: (searchParams.get('sort_field') as any) || 'created_at',
      direction: (searchParams.get('sort_direction') as any) || 'desc'
    };

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const result = await crmService.getLeads(context.tenant_id, filters, sort, page, limit);

    // v1.1 includes enhanced analytics
    const v1_1_result = {
      ...result,
      enhanced_analytics: {
        total_leads: result.pagination.total_items,
        filters_applied: Object.keys(filters).length,
        average_score: 0 // Would be calculated from actual data
      }
    };

    // Track analytics
    await trackCustomEvent(
      request,
      'leads_viewed',
      'crm',
      'view',
      {
        api_version: version,
        filters_applied: Object.keys(filters).length,
        page,
        limit,
        total_results: result.pagination.total_items
      },
      'lead'
    );

    return createVersionedResponse(v1_1_result, version, 200, {
      'X-RateLimit-Limit': rateLimitStatus.limit.toString(),
      'X-RateLimit-Remaining': rateLimitStatus.remaining.toString()
    });
  } catch (error) {
    console.error('Error in v1.1 leads GET:', error);
    return createVersionedResponse(
      { error: 'Failed to fetch leads' },
      version,
      500
    );
  }
}

/**
 * Handler for API v2.0 - Latest format
 */
async function handleV2_0_GET(
  request: NextRequest,
  context: AuthContext,
  rateLimitStatus: RateLimitStatus
) {
  const version: ApiVersion = '2.0';
  
  try {
    // Track version usage
    await apiVersionManagementService.trackVersionUsage(
      context.tenant_id,
      version,
      '/api/v1/crm/leads',
      request.headers.get('user-agent') || undefined
    );

    // Parse query parameters with v2.0 enhancements
    const { searchParams } = new URL(request.url);
    
    const filters: LeadFilters = {};
    if (searchParams.get('status')) {
      filters.status = searchParams.get('status')!.split(',') as any[];
    }
    if (searchParams.get('stage_id')) {
      filters.stage_id = searchParams.get('stage_id')!.split(',');
    }
    if (searchParams.get('source_id')) {
      filters.source_id = searchParams.get('source_id')!.split(',');
    }
    if (searchParams.get('assigned_to')) {
      filters.assigned_to = searchParams.get('assigned_to')!.split(',');
    }
    if (searchParams.get('priority')) {
      filters.priority = searchParams.get('priority')!.split(',') as any[];
    }
    if (searchParams.get('tags')) {
      filters.tags = searchParams.get('tags')!.split(',');
    }
    if (searchParams.get('score_min')) {
      filters.score_min = parseInt(searchParams.get('score_min')!);
    }
    if (searchParams.get('score_max')) {
      filters.score_max = parseInt(searchParams.get('score_max')!);
    }
    if (searchParams.get('created_after')) {
      filters.created_after = new Date(searchParams.get('created_after')!);
    }
    if (searchParams.get('created_before')) {
      filters.created_before = new Date(searchParams.get('created_before')!);
    }
    if (searchParams.get('search_query')) {
      filters.search_query = searchParams.get('search_query')!;
    }
    if (searchParams.get('search_fields')) {
      filters.search_fields = searchParams.get('search_fields')!.split(',') as any[];
    }

    const sort: LeadSortOptions = {
      field: (searchParams.get('sort_field') as any) || 'created_at',
      direction: (searchParams.get('sort_direction') as any) || 'desc'
    };

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const result = await crmService.getLeads(context.tenant_id, filters, sort, page, limit);

    // v2.0 includes comprehensive metadata and analytics
    const v2_0_result = {
      data: result.data,
      pagination: {
        current_page: result.pagination.current_page,
        total_pages: result.pagination.total_pages,
        total_items: result.pagination.total_items,
        items_per_page: result.pagination.items_per_page,
        has_next: result.pagination.current_page < result.pagination.total_pages,
        has_previous: result.pagination.current_page > 1
      },
      metadata: {
        request_id: crypto.randomUUID(),
        processing_time_ms: Date.now() % 1000, // Simplified for example
        filters_applied: filters,
        sort_applied: sort
      },
      analytics: {
        total_leads: result.pagination.total_items,
        filtered_count: result.data.length,
        average_score: result.data.reduce((sum, lead) => sum + (lead.score || 0), 0) / result.data.length || 0,
        status_distribution: {} // Would be calculated from actual data
      }
    };

    // Track analytics
    await trackCustomEvent(
      request,
      'leads_viewed',
      'crm',
      'view',
      {
        api_version: version,
        filters_applied: Object.keys(filters).length,
        page,
        limit,
        total_results: result.pagination.total_items
      },
      'lead'
    );

    return createVersionedResponse(v2_0_result, version, 200, {
      'X-RateLimit-Limit': rateLimitStatus.limit.toString(),
      'X-RateLimit-Remaining': rateLimitStatus.remaining.toString(),
      'X-Request-ID': v2_0_result.metadata.request_id
    });
  } catch (error) {
    console.error('Error in v2.0 leads GET:', error);
    return createVersionedResponse(
      { 
        error: 'Failed to fetch leads',
        error_code: 'LEADS_FETCH_ERROR',
        error_details: {
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }
      },
      version,
      500
    );
  }
}

/**
 * POST handlers for different versions
 */
async function handleV1_0_POST(
  request: NextRequest,
  context: AuthContext,
  rateLimitStatus: RateLimitStatus
) {
  const version: ApiVersion = '1.0';
  
  try {
    await apiVersionManagementService.trackVersionUsage(
      context.tenant_id,
      version,
      '/api/v1/crm/leads',
      request.headers.get('user-agent') || undefined
    );

    const data: CreateLeadRequest = await request.json();

    // v1.0 validation - basic fields only
    if (!data.first_name || !data.last_name) {
      return createVersionedResponse(
        { error: 'First name and last name are required' },
        version,
        400
      );
    }

    const lead = await crmService.createLead(context.tenant_id, data);

    // Track analytics
    await trackCustomEvent(
      request,
      'lead_created',
      'crm',
      'create',
      {
        api_version: version,
        source: data.source_id || 'direct',
        has_phone: !!data.phone,
        has_email: !!data.email
      },
      'lead',
      lead.id
    );

    // v1.0 response format
    return createVersionedResponse(
      {
        lead: {
          id: lead.id,
          name: `${lead.first_name} ${lead.last_name}`,
          email: lead.email,
          phone: lead.phone,
          status: lead.status,
          created_at: lead.created_at
        }
      },
      version,
      201
    );
  } catch (error) {
    console.error('Error in v1.0 leads POST:', error);
    return createVersionedResponse(
      { error: 'Failed to create lead' },
      version,
      500
    );
  }
}

async function handleV1_1_POST(
  request: NextRequest,
  context: AuthContext,
  rateLimitStatus: RateLimitStatus
) {
  const version: ApiVersion = '1.1';
  
  try {
    await apiVersionManagementService.trackVersionUsage(
      context.tenant_id,
      version,
      '/api/v1/crm/leads',
      request.headers.get('user-agent') || undefined
    );

    const data: CreateLeadRequest = await request.json();

    // v1.1 validation - enhanced fields
    if (!data.first_name || !data.last_name) {
      return createVersionedResponse(
        { error: 'First name and last name are required' },
        version,
        400
      );
    }

    const lead = await crmService.createLead(context.tenant_id, data);

    // Track analytics
    await trackCustomEvent(
      request,
      'lead_created',
      'crm',
      'create',
      {
        api_version: version,
        source: data.source_id || 'direct',
        priority: data.priority || 'medium',
        has_phone: !!data.phone,
        has_email: !!data.email
      },
      'lead',
      lead.id
    );

    // v1.1 response format with enhanced data
    return createVersionedResponse(
      {
        lead,
        enhanced_analytics: {
          initial_score: lead.score || 0,
          source_quality: 'unknown', // Would be calculated
          conversion_probability: 0.5 // Would be calculated
        }
      },
      version,
      201
    );
  } catch (error) {
    console.error('Error in v1.1 leads POST:', error);
    return createVersionedResponse(
      { error: 'Failed to create lead' },
      version,
      500
    );
  }
}

async function handleV2_0_POST(
  request: NextRequest,
  context: AuthContext,
  rateLimitStatus: RateLimitStatus
) {
  const version: ApiVersion = '2.0';
  
  try {
    await apiVersionManagementService.trackVersionUsage(
      context.tenant_id,
      version,
      '/api/v1/crm/leads',
      request.headers.get('user-agent') || undefined
    );

    const data: CreateLeadRequest = await request.json();

    // v2.0 validation - comprehensive
    if (!data.first_name || !data.last_name) {
      return createVersionedResponse(
        { 
          error: 'Validation failed',
          error_code: 'VALIDATION_ERROR',
          error_details: {
            message: 'First name and last name are required',
            missing_fields: ['first_name', 'last_name'].filter(field => !data[field as keyof CreateLeadRequest]),
            timestamp: new Date().toISOString()
          }
        },
        version,
        400
      );
    }

    const lead = await crmService.createLead(context.tenant_id, data);

    // Track analytics
    await trackCustomEvent(
      request,
      'lead_created',
      'crm',
      'create',
      {
        api_version: version,
        source: data.source_id || 'direct',
        priority: data.priority || 'medium',
        has_phone: !!data.phone,
        has_email: !!data.email
      },
      'lead',
      lead.id
    );

    const requestId = crypto.randomUUID();

    // v2.0 response format with comprehensive metadata
    return createVersionedResponse(
      {
        data: lead,
        metadata: {
          request_id: requestId,
          processing_time_ms: Date.now() % 1000,
          created_at: new Date().toISOString(),
          tenant_id: context.tenant_id
        },
        analytics: {
          initial_score: lead.score || 0,
          source_quality: 'unknown', // Would be calculated
          conversion_probability: 0.5, // Would be calculated
          similar_leads_count: 0 // Would be calculated
        },
        actions: {
          view_url: `/crm/leads/${lead.id}`,
          edit_url: `/crm/leads/${lead.id}/edit`,
          delete_url: `/api/v2/crm/leads/${lead.id}`
        }
      },
      version,
      201,
      {
        'X-Request-ID': requestId,
        'Location': `/api/v2/crm/leads/${lead.id}`
      }
    );
  } catch (error) {
    console.error('Error in v2.0 leads POST:', error);
    return createVersionedResponse(
      { 
        error: 'Failed to create lead',
        error_code: 'LEAD_CREATION_ERROR',
        error_details: {
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }
      },
      version,
      500
    );
  }
}

/**
 * GET /api/v1/crm/leads
 * Versioned endpoint that supports multiple API versions
 */
export const GET = withApiVersioning({
  '1.0': withApiAuth(handleV1_0_GET, 'leads.view'),
  '1.1': withApiAuth(handleV1_1_GET, 'leads.view'),
  '2.0': withApiAuth(handleV2_0_GET, 'leads.view')
});

/**
 * POST /api/v1/crm/leads
 * Versioned endpoint for creating leads
 */
export const POST = withApiVersioning({
  '1.0': withApiAuth(handleV1_0_POST, 'leads.create'),
  '1.1': withApiAuth(handleV1_1_POST, 'leads.create'),
  '2.0': withApiAuth(handleV2_0_POST, 'leads.create')
});