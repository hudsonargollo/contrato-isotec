/**
 * API Documentation Route
 * 
 * Serves OpenAPI/Swagger documentation for the SolarCRM Pro API.
 * Provides comprehensive documentation for all API endpoints with
 * authentication, rate limiting, and usage examples.
 * 
 * Requirements: 10.1, 10.3 - API-first architecture
 */

import { NextRequest, NextResponse } from 'next/server';

// OpenAPI specification for SolarCRM Pro API
const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'SolarCRM Pro API',
    description: 'Comprehensive REST API for SolarCRM Pro - Multi-tenant Solar Energy CRM Platform',
    version: '1.0.0',
    contact: {
      name: 'SolarCRM Pro Support',
      email: 'support@solarcrm.clubemkt.digital',
      url: 'https://solarcrm.clubemkt.digital'
    },
    license: {
      name: 'Proprietary',
      url: 'https://solarcrm.clubemkt.digital/license'
    }
  },
  servers: [
    {
      url: 'https://solarcrm.clubemkt.digital/api',
      description: 'Production server'
    },
    {
      url: 'http://localhost:3000/api',
      description: 'Development server'
    }
  ],
  security: [
    {
      ApiKeyAuth: []
    },
    {
      BearerAuth: []
    }
  ],
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
        description: 'API key for enterprise white-label access'
      },
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token from Supabase authentication'
      }
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'string',
            description: 'Error message'
          },
          details: {
            type: 'object',
            description: 'Additional error details'
          }
        },
        required: ['error']
      },
      Tenant: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'Unique tenant identifier'
          },
          name: {
            type: 'string',
            description: 'Tenant name'
          },
          domain: {
            type: 'string',
            description: 'Tenant domain'
          },
          subdomain: {
            type: 'string',
            description: 'Tenant subdomain'
          },
          branding: {
            $ref: '#/components/schemas/TenantBranding'
          },
          subscription: {
            $ref: '#/components/schemas/Subscription'
          },
          status: {
            type: 'string',
            enum: ['active', 'suspended', 'cancelled', 'trial']
          },
          created_at: {
            type: 'string',
            format: 'date-time'
          },
          updated_at: {
            type: 'string',
            format: 'date-time'
          }
        }
      },
      TenantBranding: {
        type: 'object',
        properties: {
          logo_url: {
            type: 'string',
            format: 'uri'
          },
          primary_color: {
            type: 'string',
            pattern: '^#[0-9A-Fa-f]{6}$'
          },
          secondary_color: {
            type: 'string',
            pattern: '^#[0-9A-Fa-f]{6}$'
          },
          custom_css: {
            type: 'string'
          },
          white_label: {
            type: 'boolean'
          }
        }
      },
      Subscription: {
        type: 'object',
        properties: {
          plan: {
            type: 'string',
            enum: ['starter', 'professional', 'enterprise']
          },
          status: {
            type: 'string',
            enum: ['active', 'cancelled', 'past_due', 'trialing']
          },
          limits: {
            $ref: '#/components/schemas/SubscriptionLimits'
          },
          features: {
            type: 'array',
            items: {
              type: 'string'
            }
          }
        }
      },
      SubscriptionLimits: {
        type: 'object',
        properties: {
          users: {
            type: 'integer',
            minimum: 1
          },
          leads: {
            type: 'integer',
            minimum: 1
          },
          contracts: {
            type: 'integer',
            minimum: 1
          },
          storage_gb: {
            type: 'integer',
            minimum: 1
          }
        }
      },
      Lead: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid'
          },
          tenant_id: {
            type: 'string',
            format: 'uuid'
          },
          contact_info: {
            $ref: '#/components/schemas/ContactInfo'
          },
          source: {
            type: 'string'
          },
          status: {
            type: 'string'
          },
          score: {
            type: 'integer',
            minimum: 0,
            maximum: 100
          },
          stage_id: {
            type: 'string',
            format: 'uuid'
          },
          assigned_to: {
            type: 'string',
            format: 'uuid'
          },
          created_at: {
            type: 'string',
            format: 'date-time'
          },
          updated_at: {
            type: 'string',
            format: 'date-time'
          }
        }
      },
      ContactInfo: {
        type: 'object',
        properties: {
          name: {
            type: 'string'
          },
          email: {
            type: 'string',
            format: 'email'
          },
          phone: {
            type: 'string'
          },
          address: {
            type: 'string'
          }
        },
        required: ['name', 'email']
      },
      Contract: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid'
          },
          tenant_id: {
            type: 'string',
            format: 'uuid'
          },
          customer_id: {
            type: 'string',
            format: 'uuid'
          },
          template_id: {
            type: 'string',
            format: 'uuid'
          },
          status: {
            type: 'string',
            enum: ['draft', 'pending_signature', 'signed', 'completed', 'cancelled']
          },
          contract_data: {
            type: 'object'
          },
          signature_status: {
            type: 'string',
            enum: ['pending', 'signed', 'declined']
          },
          created_at: {
            type: 'string',
            format: 'date-time'
          },
          signed_at: {
            type: 'string',
            format: 'date-time'
          }
        }
      },
      Invoice: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid'
          },
          tenant_id: {
            type: 'string',
            format: 'uuid'
          },
          customer_id: {
            type: 'string',
            format: 'uuid'
          },
          invoice_number: {
            type: 'string'
          },
          items: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/InvoiceItem'
            }
          },
          total_amount: {
            type: 'number',
            format: 'decimal'
          },
          status: {
            type: 'string',
            enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled']
          },
          due_date: {
            type: 'string',
            format: 'date'
          },
          created_at: {
            type: 'string',
            format: 'date-time'
          }
        }
      },
      InvoiceItem: {
        type: 'object',
        properties: {
          description: {
            type: 'string'
          },
          quantity: {
            type: 'number',
            minimum: 0
          },
          unit_price: {
            type: 'number',
            format: 'decimal',
            minimum: 0
          },
          total: {
            type: 'number',
            format: 'decimal',
            minimum: 0
          }
        },
        required: ['description', 'quantity', 'unit_price']
      }
    },
    parameters: {
      TenantId: {
        name: 'tenant_id',
        in: 'query',
        required: true,
        schema: {
          type: 'string',
          format: 'uuid'
        },
        description: 'Tenant identifier for multi-tenant operations'
      },
      Limit: {
        name: 'limit',
        in: 'query',
        schema: {
          type: 'integer',
          minimum: 1,
          maximum: 100,
          default: 20
        },
        description: 'Number of items to return'
      },
      Offset: {
        name: 'offset',
        in: 'query',
        schema: {
          type: 'integer',
          minimum: 0,
          default: 0
        },
        description: 'Number of items to skip'
      }
    },
    responses: {
      UnauthorizedError: {
        description: 'Authentication required',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error'
            }
          }
        }
      },
      ForbiddenError: {
        description: 'Insufficient permissions',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error'
            }
          }
        }
      },
      NotFoundError: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error'
            }
          }
        }
      },
      ValidationError: {
        description: 'Invalid request data',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error'
            }
          }
        }
      },
      RateLimitError: {
        description: 'Rate limit exceeded',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error'
            }
          }
        }
      }
    }
  },
  paths: {
    '/tenants': {
      get: {
        summary: 'List tenants',
        description: 'Get a list of all tenants (admin only)',
        tags: ['Tenants'],
        security: [{ BearerAuth: [] }],
        parameters: [
          { $ref: '#/components/parameters/Limit' },
          { $ref: '#/components/parameters/Offset' }
        ],
        responses: {
          '200': {
            description: 'List of tenants',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    tenants: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Tenant' }
                    },
                    total: { type: 'integer' },
                    limit: { type: 'integer' },
                    offset: { type: 'integer' }
                  }
                }
              }
            }
          },
          '401': { $ref: '#/components/responses/UnauthorizedError' },
          '403': { $ref: '#/components/responses/ForbiddenError' }
        }
      },
      post: {
        summary: 'Create tenant',
        description: 'Create a new tenant (admin only)',
        tags: ['Tenants'],
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  domain: { type: 'string' },
                  subdomain: { type: 'string' }
                },
                required: ['name', 'domain', 'subdomain']
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Tenant created successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Tenant' }
              }
            }
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/UnauthorizedError' },
          '403': { $ref: '#/components/responses/ForbiddenError' }
        }
      }
    },
    '/crm/leads': {
      get: {
        summary: 'List leads',
        description: 'Get a list of leads for the current tenant',
        tags: ['CRM'],
        security: [{ BearerAuth: [] }, { ApiKeyAuth: [] }],
        parameters: [
          { $ref: '#/components/parameters/TenantId' },
          { $ref: '#/components/parameters/Limit' },
          { $ref: '#/components/parameters/Offset' },
          {
            name: 'status',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter by lead status'
          },
          {
            name: 'assigned_to',
            in: 'query',
            schema: { type: 'string', format: 'uuid' },
            description: 'Filter by assigned user'
          }
        ],
        responses: {
          '200': {
            description: 'List of leads',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    leads: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Lead' }
                    },
                    total: { type: 'integer' },
                    limit: { type: 'integer' },
                    offset: { type: 'integer' }
                  }
                }
              }
            }
          },
          '401': { $ref: '#/components/responses/UnauthorizedError' },
          '403': { $ref: '#/components/responses/ForbiddenError' },
          '429': { $ref: '#/components/responses/RateLimitError' }
        }
      },
      post: {
        summary: 'Create lead',
        description: 'Create a new lead in the CRM system',
        tags: ['CRM'],
        security: [{ BearerAuth: [] }, { ApiKeyAuth: [] }],
        parameters: [
          { $ref: '#/components/parameters/TenantId' }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  contact_info: { $ref: '#/components/schemas/ContactInfo' },
                  source: { type: 'string' },
                  assigned_to: { type: 'string', format: 'uuid' }
                },
                required: ['contact_info', 'source']
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Lead created successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Lead' }
              }
            }
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/UnauthorizedError' },
          '403': { $ref: '#/components/responses/ForbiddenError' },
          '429': { $ref: '#/components/responses/RateLimitError' }
        }
      }
    },
    '/contracts': {
      get: {
        summary: 'List contracts',
        description: 'Get a list of contracts for the current tenant',
        tags: ['Contracts'],
        security: [{ BearerAuth: [] }, { ApiKeyAuth: [] }],
        parameters: [
          { $ref: '#/components/parameters/TenantId' },
          { $ref: '#/components/parameters/Limit' },
          { $ref: '#/components/parameters/Offset' },
          {
            name: 'status',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter by contract status'
          }
        ],
        responses: {
          '200': {
            description: 'List of contracts',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    contracts: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Contract' }
                    },
                    total: { type: 'integer' },
                    limit: { type: 'integer' },
                    offset: { type: 'integer' }
                  }
                }
              }
            }
          },
          '401': { $ref: '#/components/responses/UnauthorizedError' },
          '403': { $ref: '#/components/responses/ForbiddenError' },
          '429': { $ref: '#/components/responses/RateLimitError' }
        }
      }
    },
    '/invoices': {
      get: {
        summary: 'List invoices',
        description: 'Get a list of invoices for the current tenant',
        tags: ['Invoices'],
        security: [{ BearerAuth: [] }, { ApiKeyAuth: [] }],
        parameters: [
          { $ref: '#/components/parameters/TenantId' },
          { $ref: '#/components/parameters/Limit' },
          { $ref: '#/components/parameters/Offset' },
          {
            name: 'status',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter by invoice status'
          }
        ],
        responses: {
          '200': {
            description: 'List of invoices',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    invoices: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Invoice' }
                    },
                    total: { type: 'integer' },
                    limit: { type: 'integer' },
                    offset: { type: 'integer' }
                  }
                }
              }
            }
          },
          '401': { $ref: '#/components/responses/UnauthorizedError' },
          '403': { $ref: '#/components/responses/ForbiddenError' },
          '429': { $ref: '#/components/responses/RateLimitError' }
        }
      }
    }
  },
  tags: [
    {
      name: 'Tenants',
      description: 'Multi-tenant management operations'
    },
    {
      name: 'CRM',
      description: 'Customer Relationship Management operations'
    },
    {
      name: 'Contracts',
      description: 'Contract generation and management'
    },
    {
      name: 'Invoices',
      description: 'Invoice generation and payment tracking'
    },
    {
      name: 'Analytics',
      description: 'Analytics and reporting operations'
    },
    {
      name: 'WhatsApp',
      description: 'WhatsApp Business integration'
    },
    {
      name: 'White-Label',
      description: 'Enterprise white-label features'
    }
  ]
};

/**
 * GET /api/docs
 * Returns the OpenAPI specification for the SolarCRM Pro API
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get('format') || 'json';

  if (format === 'yaml') {
    // In a real implementation, you would convert to YAML
    return new NextResponse(JSON.stringify(openApiSpec, null, 2), {
      headers: {
        'Content-Type': 'application/x-yaml',
        'Content-Disposition': 'attachment; filename="solarcrm-api.yaml"'
      }
    });
  }

  return NextResponse.json(openApiSpec, {
    headers: {
      'Content-Type': 'application/json'
    }
  });
}