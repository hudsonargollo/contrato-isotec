/**
 * CRM System Tests
 * Tests for lead management, pipeline stages, and interactions
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5 - Enhanced CRM Pipeline Management
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import type {
  Lead,
  CreateLeadRequest,
  PipelineStage,
  CreatePipelineStageRequest,
  LeadSource,
  CreateLeadSourceRequest,
  LeadInteraction,
  CreateInteractionRequest,
  LeadScoringRule,
  CreateScoringRuleRequest
} from '@/lib/types/crm';

// Mock Supabase client
const mockSupabaseClient = {
  from: jest.fn(),
  rpc: jest.fn(),
  auth: {
    getUser: jest.fn()
  }
};

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabaseClient
}));

// Mock data
const mockTenantId = 'test-tenant-id';
const mockUserId = 'test-user-id';

const mockLeadSource: LeadSource = {
  id: 'source-1',
  tenant_id: mockTenantId,
  name: 'Website',
  description: 'Leads from company website',
  is_active: true,
  created_at: new Date(),
  updated_at: new Date()
};

const mockPipelineStage: PipelineStage = {
  id: 'stage-1',
  tenant_id: mockTenantId,
  name: 'New Lead',
  description: 'Newly captured leads',
  stage_order: 1,
  conversion_probability: 10.0,
  required_actions: ['Initial contact', 'Qualify interest'],
  is_active: true,
  created_at: new Date(),
  updated_at: new Date()
};

const mockLead: Lead = {
  id: 'lead-1',
  tenant_id: mockTenantId,
  first_name: 'John',
  last_name: 'Doe',
  email: 'john.doe@example.com',
  phone: '+5511999999999',
  company: 'Test Company',
  source_id: 'source-1',
  status: 'new',
  stage_id: 'stage-1',
  score: 50,
  priority: 'medium',
  assigned_to: mockUserId,
  created_by: mockUserId,
  notes: 'Test lead notes',
  tags: ['solar', 'residential'],
  custom_fields: { budget: '50000', timeline: '3 months' },
  created_at: new Date(),
  updated_at: new Date()
};

const mockInteraction: LeadInteraction = {
  id: 'interaction-1',
  tenant_id: mockTenantId,
  lead_id: 'lead-1',
  type_id: 'type-1',
  channel: 'email',
  subject: 'Initial Contact',
  content: 'Sent initial welcome email',
  direction: 'outbound',
  metadata: { email_id: 'email-123' },
  attachments: [],
  created_by: mockUserId,
  interaction_date: new Date(),
  created_at: new Date()
};

describe('CRM System', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock auth user
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: mockUserId } },
      error: null
    });
  });

  describe('Lead Sources Management', () => {
    it('should create a new lead source', async () => {
      const createRequest: CreateLeadSourceRequest = {
        name: 'Website',
        description: 'Leads from company website',
        is_active: true
      };

      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockLeadSource,
              error: null
            })
          })
        })
      });

      const { crmService } = await import('@/lib/services/crm');
      const result = await crmService.createLeadSource(mockTenantId, createRequest);

      expect(result).toEqual(mockLeadSource);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('lead_sources');
    });

    it('should fetch lead sources for tenant', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: [mockLeadSource],
                error: null
              })
            })
          })
        })
      });

      const { crmService } = await import('@/lib/services/crm');
      const result = await crmService.getLeadSources(mockTenantId);

      expect(result).toEqual([mockLeadSource]);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('lead_sources');
    });
  });

  describe('Pipeline Stages Management', () => {
    it('should create a new pipeline stage', async () => {
      const createRequest: CreatePipelineStageRequest = {
        name: 'New Lead',
        description: 'Newly captured leads',
        stage_order: 1,
        conversion_probability: 10.0,
        required_actions: ['Initial contact'],
        is_active: true
      };

      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockPipelineStage,
              error: null
            })
          })
        })
      });

      const { crmService } = await import('@/lib/services/crm');
      const result = await crmService.createPipelineStage(mockTenantId, createRequest);

      expect(result).toEqual(mockPipelineStage);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('pipeline_stages');
    });

    it('should fetch pipeline stages ordered by stage_order', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: [mockPipelineStage],
                error: null
              })
            })
          })
        })
      });

      const { crmService } = await import('@/lib/services/crm');
      const result = await crmService.getPipelineStages(mockTenantId);

      expect(result).toEqual([mockPipelineStage]);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('pipeline_stages');
    });
  });

  describe('Lead Management', () => {
    it('should create a new lead', async () => {
      const createRequest: CreateLeadRequest = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        phone: '+5511999999999',
        company: 'Test Company',
        source_id: 'source-1',
        priority: 'medium'
      };

      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockLead,
              error: null
            })
          })
        })
      });

      const { crmService } = await import('@/lib/services/crm');
      const result = await crmService.createLead(mockTenantId, createRequest);

      expect(result.first_name).toBe('John');
      expect(result.last_name).toBe('Doe');
      expect(result.email).toBe('john.doe@example.com');
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('leads');
    });

    it('should fetch leads with filters and pagination', async () => {
      const mockPaginatedResult = {
        data: [mockLead],
        error: null,
        count: 1
      };

      const mockQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              range: jest.fn().mockResolvedValue(mockPaginatedResult)
            })
          })
        })
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const { crmService } = await import('@/lib/services/crm');
      const result = await crmService.getLeads(mockTenantId, {}, { field: 'created_at', direction: 'desc' }, 1, 20);

      expect(result.leads).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('leads');
    });

    it('should update lead stage with history tracking', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({
        data: null,
        error: null
      });

      const { crmService } = await import('@/lib/services/crm');
      await crmService.updateLeadStage('lead-1', 'stage-2', 'Lead qualified', 'Customer showed strong interest');

      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('update_lead_stage', {
        lead_id_param: 'lead-1',
        new_stage_id_param: 'stage-2',
        reason_param: 'Lead qualified',
        notes_param: 'Customer showed strong interest'
      });
    });

    it('should calculate lead score', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({
        data: 75,
        error: null
      });

      const { crmService } = await import('@/lib/services/crm');
      const score = await crmService.calculateLeadScore('lead-1');

      expect(score).toBe(75);
      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('calculate_lead_score', {
        lead_id_param: 'lead-1'
      });
    });
  });

  describe('Lead Interactions', () => {
    it('should create a new interaction', async () => {
      const createRequest: CreateInteractionRequest = {
        lead_id: 'lead-1',
        type_id: 'type-1',
        channel: 'email',
        subject: 'Initial Contact',
        content: 'Sent initial welcome email',
        direction: 'outbound'
      };

      mockSupabaseClient.rpc.mockResolvedValue({
        data: 'interaction-1',
        error: null
      });

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockInteraction,
              error: null
            })
          })
        })
      });

      const { crmService } = await import('@/lib/services/crm');
      const result = await crmService.createInteraction(mockTenantId, createRequest);

      expect(result.subject).toBe('Initial Contact');
      expect(result.channel).toBe('email');
      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('create_lead_interaction', expect.any(Object));
    });

    it('should fetch lead interactions', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: [mockInteraction],
              error: null
            })
          })
        })
      });

      const { crmService } = await import('@/lib/services/crm');
      const result = await crmService.getLeadInteractions('lead-1');

      expect(result).toHaveLength(1);
      expect(result[0].subject).toBe('Initial Contact');
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('lead_interactions');
    });
  });

  describe('Lead Scoring Rules', () => {
    it('should create a new scoring rule', async () => {
      const createRequest: CreateScoringRuleRequest = {
        name: 'Has Email',
        description: 'Lead provided email address',
        field_name: 'email',
        operator: 'not_empty',
        value_criteria: {},
        score_points: 10,
        is_active: true,
        rule_order: 1
      };

      const mockScoringRule: LeadScoringRule = {
        id: 'rule-1',
        tenant_id: mockTenantId,
        ...createRequest,
        created_at: new Date(),
        updated_at: new Date()
      };

      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockScoringRule,
              error: null
            })
          })
        })
      });

      const { crmService } = await import('@/lib/services/crm');
      const result = await crmService.createScoringRule(mockTenantId, createRequest);

      expect(result.name).toBe('Has Email');
      expect(result.score_points).toBe(10);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('lead_scoring_rules');
    });
  });

  describe('Analytics and Reporting', () => {
    it('should generate pipeline analytics', async () => {
      // Mock total leads count
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            count: 100
          })
        })
      });

      // Mock leads by stage
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: [{
                  id: 'stage-1',
                  name: 'New Lead',
                  stage_order: 1,
                  conversion_probability: 10.0,
                  leads: [{ count: 25 }]
                }]
              })
            })
          })
        })
      });

      // Mock leads by source
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: [{
                id: 'source-1',
                name: 'Website',
                leads: [{ count: 50 }]
              }]
            })
          })
        })
      });

      // Mock leads by status
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: [
              { status: 'new' },
              { status: 'qualified' },
              { status: 'new' }
            ]
          })
        })
      });

      const { crmService } = await import('@/lib/services/crm');
      const result = await crmService.getPipelineAnalytics(mockTenantId);

      expect(result.total_leads).toBe(100);
      expect(result.leads_by_stage).toHaveLength(1);
      expect(result.leads_by_source).toHaveLength(1);
      expect(result.leads_by_status).toHaveLength(2);
    });
  });
});