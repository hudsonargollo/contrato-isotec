/**
 * ISOTEC Data Migration API Routes
 * 
 * Handles migration job creation, execution, and monitoring.
 * Provides endpoints for managing data migration from legacy systems.
 * 
 * Requirements: 11.1, 11.3 - Data migration and validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/middleware/api-auth';
import { isotecMigrationService } from '@/lib/services/isotec-migration';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Request validation schemas
const createMigrationJobSchema = z.object({
  job_type: z.enum(['full', 'incremental', 'validation']),
  configuration: z.object({
    batch_size: z.number().int().min(1).max(1000).optional(),
    parallel_workers: z.number().int().min(1).max(10).optional(),
    validation_enabled: z.boolean().optional(),
    dry_run: z.boolean().optional()
  }).optional()
});

/**
 * GET /api/admin/migration
 * List migration jobs for the tenant
 */
export const GET = withApiAuth(async (request, context) => {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get migration jobs from database using centralized client
    const supabase = createClient();

    let query = supabase
      .from('migration_jobs')
      .select('*')
      .eq('tenant_id', context.tenant_id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: jobs, error, count } = await query;

    if (error) {
      throw new Error(`Failed to fetch migration jobs: ${error.message}`);
    }

    return NextResponse.json({
      jobs: jobs || [],
      total: count || 0,
      limit,
      offset
    });
  } catch (error) {
    console.error('Error fetching migration jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch migration jobs' },
      { status: 500 }
    );
  }
}, 'admin:all');

/**
 * POST /api/admin/migration
 * Create a new migration job
 */
export const POST = withApiAuth(async (request, context) => {
  try {
    const body = await request.json();
    const validatedData = createMigrationJobSchema.parse(body);

    const job = await isotecMigrationService.createMigrationJob(
      context.tenant_id,
      validatedData.job_type,
      validatedData.configuration
    );

    return NextResponse.json({
      message: 'Migration job created successfully',
      job
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating migration job:', error);
    return NextResponse.json(
      { error: 'Failed to create migration job' },
      { status: 500 }
    );
  }
}, 'admin:all');