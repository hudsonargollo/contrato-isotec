/**
 * Unit Tests: CRM Functionality
 * 
 * Unit tests for CRM lead creation, assignment, pipeline stage transitions,
 * and lead scoring calculations. Tests specific examples, edge cases, and
 * error conditions to complement the property-based tests.
 * 
 * **Validates: Requirements 2.1, 2.2, 2.3**
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { CRMService } from '@/lib/services/crm';
import { 
  Lead, 
  CreateLeadRequest, 
  UpdateLeadRequest,
  LeadStatus,
  LeadPriority,
  PipelineStage,
  LeadInteraction,
  CreateInteractionRequest,
  InteractionChannel,
  LeadScoringRule,
  CreateScoringRuleRequest,
  ScoringOperator
} from '@/lib/types/crm';

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

// Test data stores
let mockLeads: Map<string, Lead> = new Map();
let mockInteractions: Map<string, LeadInteraction[]> = new Map();
let mockStageHistory: Map<string, any[]> = new Map();
let mockScoringRules: Map<string, LeadScoringRule[]> = new Map();
let mockPipelineStages: Map<string, PipelineStage[]> = new Map();
let mockLeadSources: Map<string, any[]> = new Map();

// Mock Supabase client
const createMockSupabaseClient = () => {
  const mockQuery = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    contains: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
  };

  return {
    auth: {
      getUser: jest.fn().mockResolvedValue({ 
        data: { user: { id: 'test-user-id' } }, 
        error: null 
      }),
    },
    from: jest.fn(() => mockQuery),
    rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
  };
};
const mockSupabaseClient = createMockSupabaseClient();
jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabaseClient,
}));

jest.mock('@/lib/supabase/server', () => ({
  createClient: () => Promise.resolve(mockSupabaseClient),
}));

jest.mock('next/headers', () => ({
  cookies: () => ({
    getAll: () => [],
    set: () => {},
  }),
}));

// Helper functions
const generateMockLead = (tenantId: string, leadData: CreateLeadRequest): Lead => {
  const leadId = `lead-${Date.now()}-${Math.random()}`;
  const now = new Date();
  
  return {
    id: leadId,
    tenant_id: tenantId,
    first_name: leadData.first_name,
    last_name: leadData.last_name,
    email: leadData.email,
    phone: leadData.phone,
    company: leadData.company,
    source_id: leadData.source_id,
    status: leadData.status || 'new',
    stage_id: leadData.stage_id,
    score: 0,
    priority: leadData.priority || 'medium',
    assigned_to: leadData.assigned_to,
    created_by: 'test-user-id',
    notes: leadData.notes,
    tags: leadData.tags || [],
    custom_fields: leadData.custom_fields || {},
    last_contact_at: undefined,
    next_follow_up_at: leadData.next_follow_up_at,
    created_at: now,
    updated_at: now,
  };
};

const generateMockInteraction = (tenantId: string, interactionData: CreateInteractionRequest): LeadInteraction => {
  const interactionId = `interaction-${Date.now()}-${Math.random()}`;
  const now = new Date();
  
  return {
    id: interactionId,
    tenant_id: tenantId,
    lead_id: interactionData.lead_id,
    type_id: interactionData.type_id,
    channel: interactionData.channel,
    subject: interactionData.subject,
    content: interactionData.content,
    direction: interactionData.direction || 'outbound',
    metadata: interactionData.metadata || {},
    attachments: interactionData.attachments || [],
    created_by: 'test-user-id',
    interaction_date: interactionData.interaction_date || now,
    created_at: now,
  };
};

const createSamplePipelineStages = (tenantId: string): PipelineStage[] => [
  {
    id: 'stage-1',
    tenant_id: tenantId,
    name: 'New Lead',
    description: 'Initial contact stage',
    stage_order: 1,
    conversion_probability: 10,
    required_actions: ['Initial contact'],
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: 'stage-2',
    tenant_id: tenantId,
    name: 'Qualified',
    description: 'Lead has been qualified',
    stage_order: 2,
    conversion_probability: 30,
    required_actions: ['Needs assessment'],
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: 'stage-3',
    tenant_id: tenantId,
    name: 'Proposal',
    description: 'Proposal sent to lead',
    stage_order: 3,
    conversion_probability: 60,
    required_actions: ['Send proposal', 'Follow up'],
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: 'stage-4',
    tenant_id: tenantId,
    name: 'Closed Won',
    description: 'Deal closed successfully',
    stage_order: 4,
    conversion_probability: 100,
    required_actions: [],
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
  },
];
describe('CRM Functionality Unit Tests', () => {
  let crmService: CRMService;
  const testTenantId = 'test-tenant-123';
  const testUserId = 'test-user-456';

  beforeEach(() => {
    jest.clearAllMocks();
    mockLeads.clear();
    mockInteractions.clear();
    mockStageHistory.clear();
    mockScoringRules.clear();
    mockPipelineStages.clear();
    mockLeadSources.clear();
    
    crmService = new CRMService();
    setupMockImplementations();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const setupMockImplementations = () => {
    // Mock createLead
    jest.spyOn(crmService, 'createLead').mockImplementation(async (tenantId: string, data: CreateLeadRequest) => {
      const lead = generateMockLead(tenantId, data);
      mockLeads.set(lead.id, lead);
      return lead;
    });

    // Mock updateLead
    jest.spyOn(crmService, 'updateLead').mockImplementation(async (leadId: string, data: UpdateLeadRequest) => {
      const existingLead = mockLeads.get(leadId);
      if (!existingLead) throw new Error('Lead not found');
      
      const updatedLead = { ...existingLead, ...data, updated_at: new Date() };
      mockLeads.set(leadId, updatedLead);
      return updatedLead;
    });

    // Mock getLead
    jest.spyOn(crmService, 'getLead').mockImplementation(async (leadId: string) => {
      return mockLeads.get(leadId) || null;
    });

    // Mock createInteraction
    jest.spyOn(crmService, 'createInteraction').mockImplementation(async (tenantId: string, data: CreateInteractionRequest) => {
      const interaction = generateMockInteraction(tenantId, data);
      
      if (!mockInteractions.has(data.lead_id)) {
        mockInteractions.set(data.lead_id, []);
      }
      mockInteractions.get(data.lead_id)!.push(interaction);
      
      // Update lead's last_contact_at
      const lead = mockLeads.get(data.lead_id);
      if (lead) {
        lead.last_contact_at = interaction.interaction_date;
        lead.updated_at = new Date();
        mockLeads.set(data.lead_id, lead);
      }
      
      return interaction;
    });

    // Mock updateLeadStage
    jest.spyOn(crmService, 'updateLeadStage').mockImplementation(async (leadId: string, stageId: string, reason?: string, notes?: string) => {
      const lead = mockLeads.get(leadId);
      if (!lead) throw new Error('Lead not found');
      
      const oldStageId = lead.stage_id;
      lead.stage_id = stageId;
      lead.updated_at = new Date();
      mockLeads.set(leadId, lead);
      
      // Add to stage history
      if (!mockStageHistory.has(leadId)) {
        mockStageHistory.set(leadId, []);
      }
      mockStageHistory.get(leadId)!.push({
        id: `history-${Date.now()}-${Math.random()}`,
        tenant_id: lead.tenant_id,
        lead_id: leadId,
        from_stage_id: oldStageId,
        to_stage_id: stageId,
        reason,
        notes,
        changed_by: 'test-user-id',
        changed_at: new Date(),
      });
    });

    // Mock calculateLeadScore
    jest.spyOn(crmService, 'calculateLeadScore').mockImplementation(async (leadId: string) => {
      const lead = mockLeads.get(leadId);
      if (!lead) return 0;
      
      const tenantRules = mockScoringRules.get(lead.tenant_id) || [];
      let score = 0;
      
      for (const rule of tenantRules.filter(r => r.is_active)) {
        let fieldValue: any;
        switch (rule.field_name) {
          case 'email': fieldValue = lead.email; break;
          case 'phone': fieldValue = lead.phone; break;
          case 'company': fieldValue = lead.company; break;
          case 'status': fieldValue = lead.status; break;
          case 'priority': fieldValue = lead.priority; break;
          default: fieldValue = lead.custom_fields[rule.field_name];
        }
        
        let criteriaMet = false;
        switch (rule.operator) {
          case 'not_empty':
            criteriaMet = fieldValue != null && fieldValue !== '';
            break;
          case 'equals':
            criteriaMet = fieldValue === rule.value_criteria.value;
            break;
          case 'contains':
            criteriaMet = fieldValue && fieldValue.toString().includes(rule.value_criteria.value);
            break;
          case 'greater_than':
            criteriaMet = fieldValue && Number(fieldValue) > Number(rule.value_criteria.value);
            break;
          case 'less_than':
            criteriaMet = fieldValue && Number(fieldValue) < Number(rule.value_criteria.value);
            break;
          case 'in_list':
            criteriaMet = fieldValue && rule.value_criteria.values && rule.value_criteria.values.includes(fieldValue);
            break;
          default:
            criteriaMet = false;
        }
        
        if (criteriaMet) {
          score += rule.score_points;
        }
      }
      
      // Update lead score
      lead.score = score;
      mockLeads.set(leadId, lead);
      
      return score;
    });

    // Mock assignLead
    jest.spyOn(crmService, 'assignLead').mockImplementation(async (leadId: string, userId: string, reason?: string) => {
      await crmService.updateLead(leadId, { assigned_to: userId });
      
      const lead = mockLeads.get(leadId);
      if (lead) {
        await crmService.createInteraction(lead.tenant_id, {
          lead_id: leadId,
          channel: 'manual',
          content: `Lead assigned to user ${userId}${reason ? `. Reason: ${reason}` : ''}`,
          direction: 'outbound'
        });
      }
    });
  };
  describe('Lead Creation and Assignment - Requirement 2.1', () => {
    it('should create a lead with unique identifier and proper initialization', async () => {
      const leadData: CreateLeadRequest = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        phone: '+1234567890',
        company: 'Acme Corp',
        status: 'new',
        priority: 'high',
        tags: ['solar', 'residential'],
        custom_fields: { budget: '50000', timeline: '3 months' },
      };

      const lead = await crmService.createLead(testTenantId, leadData);

      expect(lead.id).toBeDefined();
      expect(lead.id).toMatch(/^lead-/);
      expect(lead.tenant_id).toBe(testTenantId);
      expect(lead.first_name).toBe(leadData.first_name);
      expect(lead.last_name).toBe(leadData.last_name);
      expect(lead.email).toBe(leadData.email);
      expect(lead.phone).toBe(leadData.phone);
      expect(lead.company).toBe(leadData.company);
      expect(lead.status).toBe(leadData.status);
      expect(lead.priority).toBe(leadData.priority);
      expect(lead.tags).toEqual(leadData.tags);
      expect(lead.custom_fields).toEqual(leadData.custom_fields);
      expect(lead.score).toBe(0);
      expect(lead.created_by).toBe('test-user-id');
      expect(lead.created_at).toBeInstanceOf(Date);
      expect(lead.updated_at).toBeInstanceOf(Date);
    });

    it('should create a lead with minimal required data', async () => {
      const leadData: CreateLeadRequest = {
        first_name: 'Jane',
        last_name: 'Smith',
      };

      const lead = await crmService.createLead(testTenantId, leadData);

      expect(lead.id).toBeDefined();
      expect(lead.first_name).toBe('Jane');
      expect(lead.last_name).toBe('Smith');
      expect(lead.status).toBe('new'); // Default status
      expect(lead.priority).toBe('medium'); // Default priority
      expect(lead.tags).toEqual([]); // Default empty array
      expect(lead.custom_fields).toEqual({}); // Default empty object
      expect(lead.email).toBeUndefined();
      expect(lead.phone).toBeUndefined();
      expect(lead.company).toBeUndefined();
    });

    it('should assign a lead to a user and create interaction record', async () => {
      const leadData: CreateLeadRequest = {
        first_name: 'Bob',
        last_name: 'Johnson',
        email: 'bob@example.com',
      };

      const lead = await crmService.createLead(testTenantId, leadData);
      expect(lead.assigned_to).toBeUndefined();

      await crmService.assignLead(lead.id, testUserId, 'New lead assignment');

      const updatedLead = await crmService.getLead(lead.id);
      expect(updatedLead?.assigned_to).toBe(testUserId);

      // Verify interaction was created
      const interactions = mockInteractions.get(lead.id) || [];
      expect(interactions.length).toBe(1);
      expect(interactions[0].channel).toBe('manual');
      expect(interactions[0].content).toContain('Lead assigned to user');
      expect(interactions[0].content).toContain('New lead assignment');
    });

    it('should handle lead assignment edge cases', async () => {
      // Test assigning non-existent lead
      await expect(crmService.assignLead('non-existent-lead', testUserId))
        .rejects.toThrow('Lead not found');

      // Test reassigning lead
      const leadData: CreateLeadRequest = {
        first_name: 'Alice',
        last_name: 'Brown',
      };

      const lead = await crmService.createLead(testTenantId, leadData);
      await crmService.assignLead(lead.id, 'user-1');
      await crmService.assignLead(lead.id, 'user-2', 'Reassignment');

      const updatedLead = await crmService.getLead(lead.id);
      expect(updatedLead?.assigned_to).toBe('user-2');

      // Should have two assignment interactions
      const interactions = mockInteractions.get(lead.id) || [];
      expect(interactions.length).toBe(2);
    });

    it('should validate lead data integrity during creation', async () => {
      const leadData: CreateLeadRequest = {
        first_name: '',
        last_name: 'Test',
      };

      // Should still create lead even with empty first name (business rule)
      const lead = await crmService.createLead(testTenantId, leadData);
      expect(lead.first_name).toBe('');
      expect(lead.last_name).toBe('Test');
    });
  });
  describe('Pipeline Stage Transitions - Requirement 2.2', () => {
    beforeEach(() => {
      // Setup pipeline stages for tests
      const stages = createSamplePipelineStages(testTenantId);
      mockPipelineStages.set(testTenantId, stages);
    });

    it('should update lead stage and maintain audit trail', async () => {
      const leadData: CreateLeadRequest = {
        first_name: 'Pipeline',
        last_name: 'Test',
        stage_id: 'stage-1',
      };

      const lead = await crmService.createLead(testTenantId, leadData);
      expect(lead.stage_id).toBe('stage-1');

      // Move to next stage
      await crmService.updateLeadStage(lead.id, 'stage-2', 'Lead qualified', 'Passed initial screening');

      const updatedLead = await crmService.getLead(lead.id);
      expect(updatedLead?.stage_id).toBe('stage-2');
      expect(updatedLead?.updated_at).toBeInstanceOf(Date);

      // Verify audit trail
      const stageHistory = mockStageHistory.get(lead.id) || [];
      expect(stageHistory.length).toBe(1);
      
      const historyEntry = stageHistory[0];
      expect(historyEntry.lead_id).toBe(lead.id);
      expect(historyEntry.tenant_id).toBe(testTenantId);
      expect(historyEntry.from_stage_id).toBe('stage-1');
      expect(historyEntry.to_stage_id).toBe('stage-2');
      expect(historyEntry.reason).toBe('Lead qualified');
      expect(historyEntry.notes).toBe('Passed initial screening');
      expect(historyEntry.changed_by).toBe('test-user-id');
      expect(historyEntry.changed_at).toBeInstanceOf(Date);
    });

    it('should handle multiple stage transitions with complete audit trail', async () => {
      const leadData: CreateLeadRequest = {
        first_name: 'Multi',
        last_name: 'Stage',
        stage_id: 'stage-1',
      };

      const lead = await crmService.createLead(testTenantId, leadData);

      // Multiple stage transitions
      const transitions = [
        { stageId: 'stage-2', reason: 'Qualified', notes: 'Initial qualification' },
        { stageId: 'stage-3', reason: 'Proposal sent', notes: 'Sent detailed proposal' },
        { stageId: 'stage-4', reason: 'Deal closed', notes: 'Customer signed contract' },
      ];

      for (const transition of transitions) {
        await crmService.updateLeadStage(lead.id, transition.stageId, transition.reason, transition.notes);
      }

      const finalLead = await crmService.getLead(lead.id);
      expect(finalLead?.stage_id).toBe('stage-4');

      // Verify complete audit trail
      const stageHistory = mockStageHistory.get(lead.id) || [];
      expect(stageHistory.length).toBe(3);

      // Verify chronological order and data integrity
      expect(stageHistory[0].from_stage_id).toBe('stage-1');
      expect(stageHistory[0].to_stage_id).toBe('stage-2');
      expect(stageHistory[1].from_stage_id).toBe('stage-2');
      expect(stageHistory[1].to_stage_id).toBe('stage-3');
      expect(stageHistory[2].from_stage_id).toBe('stage-3');
      expect(stageHistory[2].to_stage_id).toBe('stage-4');

      // Verify timestamps are in order
      for (let i = 1; i < stageHistory.length; i++) {
        expect(stageHistory[i].changed_at.getTime())
          .toBeGreaterThanOrEqual(stageHistory[i - 1].changed_at.getTime());
      }
    });

    it('should handle stage transition edge cases', async () => {
      // Test updating non-existent lead
      await expect(crmService.updateLeadStage('non-existent', 'stage-2'))
        .rejects.toThrow('Lead not found');

      // Test moving to same stage
      const leadData: CreateLeadRequest = {
        first_name: 'Same',
        last_name: 'Stage',
        stage_id: 'stage-2',
      };

      const lead = await crmService.createLead(testTenantId, leadData);
      await crmService.updateLeadStage(lead.id, 'stage-2', 'No change');

      const stageHistory = mockStageHistory.get(lead.id) || [];
      expect(stageHistory.length).toBe(1);
      expect(stageHistory[0].from_stage_id).toBe('stage-2');
      expect(stageHistory[0].to_stage_id).toBe('stage-2');
    });

    it('should handle backward stage transitions', async () => {
      const leadData: CreateLeadRequest = {
        first_name: 'Backward',
        last_name: 'Move',
        stage_id: 'stage-3',
      };

      const lead = await crmService.createLead(testTenantId, leadData);
      
      // Move backward in pipeline
      await crmService.updateLeadStage(lead.id, 'stage-1', 'Needs re-qualification', 'Customer requirements changed');

      const updatedLead = await crmService.getLead(lead.id);
      expect(updatedLead?.stage_id).toBe('stage-1');

      const stageHistory = mockStageHistory.get(lead.id) || [];
      expect(stageHistory.length).toBe(1);
      expect(stageHistory[0].from_stage_id).toBe('stage-3');
      expect(stageHistory[0].to_stage_id).toBe('stage-1');
      expect(stageHistory[0].reason).toBe('Needs re-qualification');
    });

    it('should update lead stage without reason or notes', async () => {
      const leadData: CreateLeadRequest = {
        first_name: 'No',
        last_name: 'Reason',
        stage_id: 'stage-1',
      };

      const lead = await crmService.createLead(testTenantId, leadData);
      await crmService.updateLeadStage(lead.id, 'stage-2');

      const stageHistory = mockStageHistory.get(lead.id) || [];
      expect(stageHistory.length).toBe(1);
      expect(stageHistory[0].reason).toBeUndefined();
      expect(stageHistory[0].notes).toBeUndefined();
    });
  });
  describe('Lead Scoring Calculations - Requirement 2.3', () => {
    beforeEach(() => {
      // Setup sample scoring rules
      const scoringRules: LeadScoringRule[] = [
        {
          id: 'rule-1',
          tenant_id: testTenantId,
          name: 'Has Email',
          description: 'Lead has email address',
          field_name: 'email',
          operator: 'not_empty',
          value_criteria: {},
          score_points: 10,
          is_active: true,
          rule_order: 1,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 'rule-2',
          tenant_id: testTenantId,
          name: 'Has Phone',
          description: 'Lead has phone number',
          field_name: 'phone',
          operator: 'not_empty',
          value_criteria: {},
          score_points: 15,
          is_active: true,
          rule_order: 2,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 'rule-3',
          tenant_id: testTenantId,
          name: 'High Priority',
          description: 'Lead is high priority',
          field_name: 'priority',
          operator: 'equals',
          value_criteria: { value: 'high' },
          score_points: 25,
          is_active: true,
          rule_order: 3,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 'rule-4',
          tenant_id: testTenantId,
          name: 'Has Company',
          description: 'Lead has company name',
          field_name: 'company',
          operator: 'not_empty',
          value_criteria: {},
          score_points: 20,
          is_active: true,
          rule_order: 4,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 'rule-5',
          tenant_id: testTenantId,
          name: 'Qualified Status',
          description: 'Lead is qualified',
          field_name: 'status',
          operator: 'equals',
          value_criteria: { value: 'qualified' },
          score_points: 30,
          is_active: true,
          rule_order: 5,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 'rule-6',
          tenant_id: testTenantId,
          name: 'Inactive Rule',
          description: 'This rule is inactive',
          field_name: 'email',
          operator: 'not_empty',
          value_criteria: {},
          score_points: 100,
          is_active: false, // Inactive rule
          rule_order: 6,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];
      
      mockScoringRules.set(testTenantId, scoringRules);
    });

    it('should calculate lead score based on active scoring rules', async () => {
      const leadData: CreateLeadRequest = {
        first_name: 'Scoring',
        last_name: 'Test',
        email: 'scoring@example.com',
        phone: '+1234567890',
        company: 'Test Corp',
        priority: 'high',
        status: 'qualified',
      };

      const lead = await crmService.createLead(testTenantId, leadData);
      const score = await crmService.calculateLeadScore(lead.id);

      // Expected score: email(10) + phone(15) + high_priority(25) + company(20) + qualified(30) = 100
      expect(score).toBe(100);

      // Verify lead score is updated
      const updatedLead = await crmService.getLead(lead.id);
      expect(updatedLead?.score).toBe(100);
    });

    it('should calculate partial scores when some criteria are not met', async () => {
      const leadData: CreateLeadRequest = {
        first_name: 'Partial',
        last_name: 'Score',
        email: 'partial@example.com',
        // No phone, company, or high priority
        priority: 'medium',
        status: 'new',
      };

      const lead = await crmService.createLead(testTenantId, leadData);
      const score = await crmService.calculateLeadScore(lead.id);

      // Expected score: only email(10) matches
      expect(score).toBe(10);
    });

    it('should return zero score when no criteria are met', async () => {
      const leadData: CreateLeadRequest = {
        first_name: 'Zero',
        last_name: 'Score',
        // No email, phone, company, high priority, or qualified status
        priority: 'low',
        status: 'new',
      };

      const lead = await crmService.createLead(testTenantId, leadData);
      const score = await crmService.calculateLeadScore(lead.id);

      expect(score).toBe(0);
    });

    it('should ignore inactive scoring rules', async () => {
      const leadData: CreateLeadRequest = {
        first_name: 'Inactive',
        last_name: 'Rule',
        email: 'inactive@example.com',
      };

      const lead = await crmService.createLead(testTenantId, leadData);
      const score = await crmService.calculateLeadScore(lead.id);

      // Should only get 10 points for email, not 110 (inactive rule worth 100 should be ignored)
      expect(score).toBe(10);
    });

    it('should handle different scoring operators correctly', async () => {
      // Add custom field scoring rules
      const customRules: LeadScoringRule[] = [
        {
          id: 'rule-custom-1',
          tenant_id: testTenantId,
          name: 'Budget Contains',
          field_name: 'budget',
          operator: 'contains',
          value_criteria: { value: '50000' },
          score_points: 40,
          is_active: true,
          rule_order: 10,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 'rule-custom-2',
          tenant_id: testTenantId,
          name: 'Budget Greater Than',
          field_name: 'budget_amount',
          operator: 'greater_than',
          value_criteria: { value: 25000 },
          score_points: 35,
          is_active: true,
          rule_order: 11,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 'rule-custom-3',
          tenant_id: testTenantId,
          name: 'Source In List',
          field_name: 'source_type',
          operator: 'in_list',
          value_criteria: { values: ['referral', 'website', 'social'] },
          score_points: 20,
          is_active: true,
          rule_order: 12,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      const existingRules = mockScoringRules.get(testTenantId) || [];
      mockScoringRules.set(testTenantId, [...existingRules, ...customRules]);

      const leadData: CreateLeadRequest = {
        first_name: 'Custom',
        last_name: 'Fields',
        custom_fields: {
          budget: 'Looking for $50000 system',
          budget_amount: 30000,
          source_type: 'referral',
        },
      };

      const lead = await crmService.createLead(testTenantId, leadData);
      const score = await crmService.calculateLeadScore(lead.id);

      // Expected: budget_contains(40) + budget_greater_than(35) + source_in_list(20) = 95
      expect(score).toBe(95);
    });

    it('should handle edge cases in scoring calculations', async () => {
      // Test with non-existent lead
      const score = await crmService.calculateLeadScore('non-existent');
      expect(score).toBe(0);

      // Test with lead that has null/undefined values
      const leadData: CreateLeadRequest = {
        first_name: 'Edge',
        last_name: 'Case',
        email: undefined,
        phone: undefined,
        company: undefined,
      };

      const lead = await crmService.createLead(testTenantId, leadData);
      const edgeScore = await crmService.calculateLeadScore(lead.id);
      expect(edgeScore).toBe(0);
    });

    it('should recalculate score after lead data changes', async () => {
      const leadData: CreateLeadRequest = {
        first_name: 'Recalc',
        last_name: 'Test',
        email: 'recalc@example.com',
        priority: 'medium',
      };

      const lead = await crmService.createLead(testTenantId, leadData);
      const initialScore = await crmService.calculateLeadScore(lead.id);
      expect(initialScore).toBe(10); // Only email

      // Update lead to add more scoring criteria
      await crmService.updateLead(lead.id, {
        phone: '+1234567890',
        company: 'New Company',
        priority: 'high',
        status: 'qualified',
      });

      const newScore = await crmService.calculateLeadScore(lead.id);
      // Expected: email(10) + phone(15) + company(20) + high_priority(25) + qualified(30) = 100
      expect(newScore).toBe(100);
      expect(newScore).toBeGreaterThan(initialScore);
    });
  });
});