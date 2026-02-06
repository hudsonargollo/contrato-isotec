/**
 * Contract API Routes
 * POST /api/contracts - Create new contract
 * GET /api/contracts - List contracts with filtering
 * 
 * Requirements: 1.9, 1.10, 9.1, 9.2, 9.3, 9.4
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { contractDraftSchema, contractFiltersSchema } from '@/lib/types/schemas';
import { sanitizeCPF } from '@/lib/validation/cpf';
import { sanitizeCEP } from '@/lib/validation/cep';

/**
 * POST /api/contracts
 * Create a new contract with equipment items
 * Validates: Requirements 1.9, 1.10
 */
export async function POST(request: NextRequest) {
  try {
    // Get Supabase client
    const supabase = await createClient();

    // Get user if authenticated (optional for public contract creation)
    const { data: { user } } = await supabase.auth.getUser();
    
    // Parse and validate request body
    const body = await request.json();
    
    // Convert installationDate string to Date if present
    if (body.installationDate && typeof body.installationDate === 'string') {
      body.installationDate = new Date(body.installationDate);
    }
    
    const validationResult = contractDraftSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: validationResult.error.errors 
        },
        { status: 400 }
      );
    }

    const contractData = validationResult.data;

    // Sanitize CPF and CEP (remove formatting)
    const sanitizedCPF = sanitizeCPF(contractData.contractorCPF);
    const sanitizedCEP = sanitizeCEP(contractData.addressCEP);

    // Extract items and services from contract data
    const { items, services, ...contractFields } = contractData;

    // Create contract record
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .insert({
        contractor_name: contractFields.contractorName,
        contractor_cpf: sanitizedCPF,
        contractor_email: contractFields.contractorEmail || null,
        contractor_phone: contractFields.contractorPhone || null,
        address_cep: sanitizedCEP,
        address_street: contractFields.addressStreet,
        address_number: contractFields.addressNumber,
        address_complement: contractFields.addressComplement || null,
        address_neighborhood: contractFields.addressNeighborhood,
        address_city: contractFields.addressCity,
        address_state: contractFields.addressState,
        location_latitude: contractFields.locationLatitude || null,
        location_longitude: contractFields.locationLongitude || null,
        project_kwp: contractFields.projectKWp,
        installation_date: contractFields.installationDate || null,
        services: services,
        contract_value: contractFields.contractValue,
        payment_method: contractFields.paymentMethod,
        status: 'pending_signature',
        contract_hash: null,
        created_by: user?.id || null
      })
      .select('id, uuid, created_at')
      .single();

    if (contractError) {
      console.error('Contract creation error:', contractError);
      return NextResponse.json(
        { error: 'Failed to create contract', details: contractError.message },
        { status: 500 }
      );
    }

    // Create contract items
    const itemsToInsert = items.map((item, index) => ({
      contract_id: contract.id,
      item_name: item.itemName,
      quantity: item.quantity,
      unit: item.unit,
      sort_order: item.sortOrder ?? index
    }));

    const { error: itemsError } = await supabase
      .from('contract_items')
      .insert(itemsToInsert);

    if (itemsError) {
      console.error('Contract items creation error:', itemsError);
      // Rollback: delete the contract
      await supabase.from('contracts').delete().eq('id', contract.id);
      
      return NextResponse.json(
        { error: 'Failed to create contract items', details: itemsError.message },
        { status: 500 }
      );
    }

    // Return success response with UUID
    return NextResponse.json(
      {
        success: true,
        contract: {
          id: contract.id,
          uuid: contract.uuid,
          createdAt: contract.created_at,
          status: 'pending_signature'
        }
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Unexpected error in POST /api/contracts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/contracts
 * List contracts with filtering and pagination
 * Validates: Requirements 9.1, 9.2, 9.3, 9.4
 */
export async function GET(request: NextRequest) {
  try {
    // Get Supabase client
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check admin role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || !['admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const filters = {
      status: searchParams.get('status') || undefined,
      searchQuery: searchParams.get('search') || undefined,
      searchField: searchParams.get('searchField') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '10'),
      sortBy: searchParams.get('sortBy') || 'created_at',
      sortOrder: searchParams.get('sortOrder') || 'desc'
    };

    // Validate filters
    const validationResult = contractFiltersSchema.safeParse(filters);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid filters', 
          details: validationResult.error.errors 
        },
        { status: 400 }
      );
    }

    const validFilters = validationResult.data;

    // Build query
    let query = supabase
      .from('contracts')
      .select('*, contract_items(*)', { count: 'exact' });

    // Apply status filter
    if (validFilters.status) {
      query = query.eq('status', validFilters.status);
    }

    // Apply search filter
    if (validFilters.searchQuery && validFilters.searchField) {
      if (validFilters.searchField === 'name') {
        query = query.ilike('contractor_name', `%${validFilters.searchQuery}%`);
      } else if (validFilters.searchField === 'cpf') {
        // Sanitize search query for CPF
        const sanitizedSearch = sanitizeCPF(validFilters.searchQuery);
        query = query.eq('contractor_cpf', sanitizedSearch);
      }
    }

    // Apply pagination and sorting
    const offset = (validFilters.page - 1) * validFilters.limit;
    
    // Validate sort field and apply sorting
    const validSortFields = ['created_at', 'contractor_name', 'contract_value', 'status'];
    const sortField = validSortFields.includes(validFilters.sortBy) ? validFilters.sortBy : 'created_at';
    const ascending = validFilters.sortOrder === 'asc';
    
    query = query
      .order(sortField, { ascending })
      .range(offset, offset + validFilters.limit - 1);

    // Execute query
    const { data: contracts, error: queryError, count } = await query;

    if (queryError) {
      console.error('Contract query error:', queryError);
      return NextResponse.json(
        { error: 'Failed to fetch contracts', details: queryError.message },
        { status: 500 }
      );
    }

    // Return paginated results
    return NextResponse.json({
      success: true,
      contracts: contracts || [],
      pagination: {
        currentPage: validFilters.page,
        totalPages: Math.ceil((count || 0) / validFilters.limit),
        totalItems: count || 0,
        itemsPerPage: validFilters.limit
      }
    });

  } catch (error) {
    console.error('Unexpected error in GET /api/contracts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
