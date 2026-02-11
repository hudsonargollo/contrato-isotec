/**
 * CRM-Screening Integration Tests
 * Tests the integration between screening results and CRM pipeline
 * Requirements: 3.4 - Integrate screening with CRM pipeline
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CRMScreeningIntegrationService } from '@/lib/services/crm-screening-integration';
import { ScreeningIntegration } from '@/components/crm/ScreeningIntegration';
import { QualificationRulesManager } from '@/components/crm/QualificationRulesManager';
import type { LeadWithScreening, ScreeningQualificationRule } from '@/lib/services/crm-screening-integration';
import type { PipelineStage } from '@/lib/types/crm';

// Mock the Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
          order: jest.fn(() => ({
            limit: jest.fn(() => ({
              single: jest.fn()
            }))
          }))
        })),
        in: jest.fn(() => ({
          range: jest.fn(() => ({
            order: jest.fn()
          }))
        })),
        gte: jest.fn(),
        lte: jest.fn(),
        not: jest.fn()
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn()
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn()
          }))
        }))
      })),
      delete: jest.fn(() => ({
        eq: jest.fn()
      }))
    })),
    rpc: jest.fn(),
    auth: {
      getUser: jest.fn(() => Promise.resolve({
        data: { user: { id: 'test-user-id' } },
        error: null
      }))
    }
  })
}));

// Mock services
jest.mock('@/lib/services/crm', () => ({
  crmService: {
    createLead: jest.fn(),
    updateLead: jest.fn(),
    getLead: jest.fn(),
    getPipelineStages: jest.fn(),
    createInteraction: jest.fn(),
    calculateLeadScore: jest.fn()
  }
}));

jest.mock('@/lib/services/screening', () => ({
  screeningService: {
    processScreening: jest.fn()
  }
}));

describe('CRM-Screening Integration Service', () => {
  let service: CRMScreeningIntegrationService;
  const mockTenantId = 'test-tenant-id';

  beforeEach(() => {
    service = new CRMScreeningIntegrationService();
    jest.clearAllMocks();
  });

  describe('Lead Creation from Screening', () => {
    it('should create lead with screening data', async () => {
      const mockScreeningResult = {
        id: 'screening-result-id',
        tenant_id: mockTenantId,
        response_id: 'response-id',
        template_id: 'template-id',
        total_score: 85,
        max_possible_score: 100,
        percentage_score: 85,
        category_scores: {},
        feasibility_rating: 'high' as const,
        qualification_level: 'qualified' as const,
        risk_level: 'low' as const,
        follow_up_priority: 'high' as const,
        recommendations: [],
        risk_factors: [],
        next_steps: [],
        applied_rules: [],
        calculation_metadata: {
          version: '1.0',
          calculated_at: new Date(),
          calculation_time_ms: 100,
          rules_processed: 5,
          warnings: [],
          debug_info: {}
        },
        created_at: new Date(),
        updated_at: new Date()
      };

      const mockLeadData = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        phone: '+1234567890'
      };

      const mockCreatedLead = {
        id: 'lead-id',
        tenant_id: mockTenantId,
        ...mockLeadData,
        status: 'new' as const,
        score: 0,
        priority: 'medium' as const,
        tags: [],
        custom_fields: {},
        created_by: 'user-id',
        created_at: new Date(),
        updated_at: new Date()
      };

      // Mock CRM service
      const { crmService } = require('@/lib/services/crm');
      crmService.createLead.mockResolvedValue(mockCreatedLead);

      // Mock Supabase update
      const mockSupabase = require('@/lib/supabase/client').createClient();
      mockSupabase.from().update().eq().mockResolvedValue({ error: null });

      // Mock getLeadWithScreening
      const mockLeadWithScreening = {
        ...mockCreatedLead,
        screening_result_id: mockScreeningResult.id,
        screening_score: mockScreeningResult.percentage_score,
        screening_qualification: mockScreeningResult.qualification_level,
        screening_feasibility: mockScreeningResult.feasibility_rating,
        screening_risk_level: mockScreeningResult.risk_level,
        screening_completed_at: mockScreeningResult.created_at,
        screening_result: mockScreeningResult
      };

      jest.spyOn(service, 'getLeadWithScreening').mockResolvedValue(mockLeadWithScreening);

      const result = await service.createLeadFromScreening(
        mockTenantId,
        mockScreeningResult,
        mockLeadData
      );

      expect(crmService.createLead).toHaveBeenCalledWith(mockTenantId, mockLeadData);
      expect(mockSupabase.from).toHaveBeenCalledWith('screening_results');
      expect(result.screening_result_id).toBe(mockScreeningResult.id);
      expect(result.screening_score).toBe(85);
      expect(result.screening_qualification).toBe('qualified');
    });
  });

  describe('Qualification Rules', () => {
    it('should create qualification rule', async () => {
      const mockRuleData = {
        name: 'High Quality Leads',
        description: 'Automatically qualify high-scoring leads',
        min_screening_score: 80,
        required_feasibility: ['high'],
        max_risk_level: 'medium',
        auto_assign_status: 'qualified',
        auto_assign_priority: 'high',
        is_active: true,
        rule_order: 1
      };

      const mockCreatedRule = {
        id: 'rule-id',
        tenant_id: mockTenantId,
        ...mockRuleData,
        created_at: new Date(),
        updated_at: new Date()
      };

      const mockSupabase = require('@/lib/supabase/client').createClient();
      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: mockCreatedRule,
        error: null
      });

      const result = await service.createQualificationRule(mockTenantId, mockRuleData);

      expect(mockSupabase.from).toHaveBeenCalledWith('screening_lead_qualification_rules');
      expect(result.name).toBe(mockRuleData.name);
      expect(result.min_screening_score).toBe(80);
    });

    it('should get qualification rules', async () => {
      const mockRules = [
        {
          id: 'rule-1',
          tenant_id: mockTenantId,
          name: 'High Quality Leads',
          min_screening_score: 80,
          is_active: true,
          rule_order: 1,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 'rule-2',
          tenant_id: mockTenantId,
          name: 'Medium Quality Leads',
          min_screening_score: 60,
          is_active: true,
          rule_order: 2,
          created_at: new Date(),
          updated_at: new Date()
        }
      ];

      const mockSupabase = require('@/lib/supabase/client').createClient();
      mockSupabase.from().select().eq().order.mockResolvedValue({
        data: mockRules,
        error: null
      });

      const result = await service.getQualificationRules(mockTenantId);

      expect(mockSupabase.from).toHaveBeenCalledWith('screening_lead_qualification_rules');
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('High Quality Leads');
    });
  });

  describe('Lead Qualification', () => {
    it('should qualify lead from screening results', async () => {
      const mockLead = {
        id: 'lead-id',
        tenant_id: mockTenantId,
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        status: 'new' as const,
        screening_result_id: 'screening-result-id',
        screening_score: 85,
        screening_qualification: 'qualified' as const,
        screening_feasibility: 'high' as const,
        screening_risk_level: 'low' as const,
        screening_result: {
          id: 'screening-result-id',
          percentage_score: 85,
          qualification_level: 'qualified' as const,
          feasibility_rating: 'high' as const,
          risk_level: 'low' as const
        }
      } as LeadWithScreening;

      const mockStages = [
        {
          id: 'qualified-stage-id',
          name: 'Qualified',
          stage_order: 3
        }
      ] as PipelineStage[];

      jest.spyOn(service, 'getLeadWithScreening').mockResolvedValue(mockLead);

      const { crmService } = require('@/lib/services/crm');
      crmService.getPipelineStages.mockResolvedValue(mockStages);
      crmService.updateLead.mockResolvedValue(mockLead);
      crmService.createInteraction.mockResolvedValue({});

      const result = await service.qualifyLeadFromScreening('lead-id');

      expect(crmService.updateLead).toHaveBeenCalledWith('lead-id', {
        stage_id: 'qualified-stage-id',
        status: 'qualified',
        priority: 'high'
      });
      expect(crmService.createInteraction).toHaveBeenCalled();
    });
  });

  describe('Analytics Generation', () => {
    it('should generate screening-CRM analytics report', async () => {
      const mockReportData = {
        screening_metrics: {
          total_screenings: 100,
          avg_screening_score: 75,
          qualification_distribution: {
            qualified: 60,
            partially_qualified: 30,
            not_qualified: 10
          }
        },
        crm_metrics: {
          screened_leads_count: 100,
          avg_lead_score: 80,
          status_distribution: {
            qualified: 60,
            contacted: 25,
            closed_won: 15
          }
        },
        conversion_metrics: {
          screening_to_qualified_rate: 60,
          screening_to_closed_won_rate: 15
        }
      };

      const mockSupabase = require('@/lib/supabase/client').createClient();
      mockSupabase.rpc.mockResolvedValue({
        data: mockReportData,
        error: null
      });

      const mockSavedReport = {
        id: 'report-id',
        tenant_id: mockTenantId,
        report_name: 'Test Report',
        report_type: 'screening_performance',
        ...mockReportData,
        generated_at: new Date()
      };

      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: mockSavedReport,
        error: null
      });

      const result = await service.generateScreeningCRMReport(
        mockTenantId,
        'screening_performance',
        new Date('2024-01-01'),
        new Date('2024-01-31'),
        'Test Report'
      );

      expect(mockSupabase.rpc).toHaveBeenCalledWith('generate_screening_crm_analytics', {
        tenant_id_param: mockTenantId,
        start_date: '2024-01-01T00:00:00.000Z',
        end_date: '2024-01-31T00:00:00.000Z',
        report_type: 'screening_performance'
      });
      expect(result.report_name).toBe('Test Report');
    });
  });

  describe('Bulk Operations', () => {
    it('should bulk qualify screened leads', async () => {
      const mockLeads = [
        {
          id: 'lead-1',
          screening_qualification: 'qualified'
        },
        {
          id: 'lead-2',
          screening_qualification: 'partially_qualified'
        },
        {
          id: 'lead-3',
          screening_qualification: 'not_qualified'
        }
      ] as LeadWithScreening[];

      jest.spyOn(service, 'getLeadsWithScreening').mockResolvedValue({
        leads: mockLeads,
        total: 3,
        page: 1,
        limit: 1000,
        total_pages: 1
      });

      jest.spyOn(service, 'qualifyLeadFromScreening')
        .mockResolvedValueOnce({} as LeadWithScreening)
        .mockResolvedValueOnce({} as LeadWithScreening)
        .mockResolvedValueOnce({} as LeadWithScreening);

      const result = await service.bulkQualifyScreenedLeads(mockTenantId, {
        min_screening_score: 60
      });

      expect(result.qualified_count).toBe(1);
      expect(result.partially_qualified_count).toBe(1);
      expect(result.not_qualified_count).toBe(1);
      expect(result.errors).toHaveLength(0);
    });
  });
});

describe('ScreeningIntegration Component', () => {
  const mockLeads: LeadWithScreening[] = [
    {
      id: 'lead-1',
      tenant_id: 'tenant-1',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      status: 'qualified',
      score: 85,
      priority: 'high',
      tags: [],
      custom_fields: {},
      created_by: 'user-1',
      created_at: new Date(),
      updated_at: new Date(),
      screening_result_id: 'screening-1',
      screening_score: 85,
      screening_qualification: 'qualified',
      screening_feasibility: 'high',
      screening_risk_level: 'low',
      screening_completed_at: new Date()
    }
  ];

  it('should render screening integration overview', () => {
    render(
      <ScreeningIntegration
        tenantId="tenant-1"
        leads={mockLeads}
      />
    );

    expect(screen.getByText('Total Leads')).toBeInTheDocument();
    expect(screen.getByText('Qualified Leads')).toBeInTheDocument();
    expect(screen.getByText('Avg Screening Score')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument(); // Total leads count
  });

  it('should display qualification distribution', () => {
    render(
      <ScreeningIntegration
        tenantId="tenant-1"
        leads={mockLeads}
      />
    );

    expect(screen.getByText('Qualification Distribution')).toBeInTheDocument();
    expect(screen.getByText('Qualified')).toBeInTheDocument();
  });

  it('should handle lead selection', () => {
    const mockOnLeadSelect = jest.fn();

    render(
      <ScreeningIntegration
        tenantId="tenant-1"
        leads={mockLeads}
        onLeadSelect={mockOnLeadSelect}
      />
    );

    // Switch to leads tab
    fireEvent.click(screen.getByText('Screened Leads'));

    // Click on a lead
    const leadCard = screen.getByText('John Doe');
    fireEvent.click(leadCard);

    expect(mockOnLeadSelect).toHaveBeenCalledWith(mockLeads[0]);
  });

  it('should handle lead qualification', () => {
    const mockOnQualifyLead = jest.fn();

    const unqualifiedLead = {
      ...mockLeads[0],
      screening_qualification: 'partially_qualified' as const
    };

    render(
      <ScreeningIntegration
        tenantId="tenant-1"
        leads={[unqualifiedLead]}
        onQualifyLead={mockOnQualifyLead}
      />
    );

    // Switch to leads tab
    fireEvent.click(screen.getByText('Screened Leads'));

    // Click qualify button
    const qualifyButton = screen.getByText('Qualify');
    fireEvent.click(qualifyButton);

    expect(mockOnQualifyLead).toHaveBeenCalledWith(unqualifiedLead.id, 'qualified');
  });
});

describe('QualificationRulesManager Component', () => {
  const mockRules: ScreeningQualificationRule[] = [
    {
      id: 'rule-1',
      tenant_id: 'tenant-1',
      name: 'High Quality Leads',
      description: 'Automatically qualify high-scoring leads',
      min_screening_score: 80,
      required_feasibility: ['high'],
      max_risk_level: 'medium',
      auto_assign_status: 'qualified',
      auto_assign_priority: 'high',
      is_active: true,
      rule_order: 1,
      created_at: new Date(),
      updated_at: new Date()
    }
  ];

  const mockStages: PipelineStage[] = [
    {
      id: 'stage-1',
      tenant_id: 'tenant-1',
      name: 'Qualified',
      stage_order: 3,
      conversion_probability: 50,
      required_actions: [],
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    }
  ];

  it('should render qualification rules', () => {
    render(
      <QualificationRulesManager
        tenantId="tenant-1"
        rules={mockRules}
        pipelineStages={mockStages}
        onCreateRule={jest.fn()}
        onUpdateRule={jest.fn()}
        onDeleteRule={jest.fn()}
      />
    );

    expect(screen.getByText('Qualification Rules')).toBeInTheDocument();
    expect(screen.getByText('High Quality Leads')).toBeInTheDocument();
    expect(screen.getByText('Score ≥ 80%')).toBeInTheDocument();
  });

  it('should open create rule dialog', () => {
    render(
      <QualificationRulesManager
        tenantId="tenant-1"
        rules={mockRules}
        pipelineStages={mockStages}
        onCreateRule={jest.fn()}
        onUpdateRule={jest.fn()}
        onDeleteRule={jest.fn()}
      />
    );

    const createButton = screen.getByText('Create Rule');
    fireEvent.click(createButton);

    expect(screen.getByText('Create Qualification Rule')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('High Quality Leads')).toBeInTheDocument();
  });

  it('should handle rule creation', async () => {
    const mockOnCreateRule = jest.fn();

    render(
      <QualificationRulesManager
        tenantId="tenant-1"
        rules={[]}
        pipelineStages={mockStages}
        onCreateRule={mockOnCreateRule}
        onUpdateRule={jest.fn()}
        onDeleteRule={jest.fn()}
      />
    );

    // Open create dialog
    fireEvent.click(screen.getByText('Create First Rule'));

    // Fill form
    fireEvent.change(screen.getByPlaceholderText('High Quality Leads'), {
      target: { value: 'Test Rule' }
    });
    fireEvent.change(screen.getByPlaceholderText('80'), {
      target: { value: '75' }
    });

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: 'Create Rule' }));

    await waitFor(() => {
      expect(mockOnCreateRule).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Rule',
          min_screening_score: 75
        })
      );
    });
  });

  it('should show empty state when no rules exist', () => {
    render(
      <QualificationRulesManager
        tenantId="tenant-1"
        rules={[]}
        pipelineStages={mockStages}
        onCreateRule={jest.fn()}
        onUpdateRule={jest.fn()}
        onDeleteRule={jest.fn()}
      />
    );

    expect(screen.getByText('No qualification rules')).toBeInTheDocument();
    expect(screen.getByText('Create First Rule')).toBeInTheDocument();
  });
});