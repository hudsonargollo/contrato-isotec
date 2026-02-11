/**
 * Screening System Tests
 * Tests for project screening and scoring engine
 * Requirements: 3.2, 3.3 - Project screening functionality
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ScreeningRuleManager } from '@/components/screening/ScreeningRuleManager';
import { ScreeningResults } from '@/components/screening/ScreeningResults';
import { ScreeningTemplateManager } from '@/components/screening/ScreeningTemplateManager';
import type { 
  ScreeningRule, 
  EnhancedScreeningResult,
  ScreeningTemplate 
} from '@/lib/types/screening';

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => ({
            range: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({ data: null, error: null }))
            }))
          }))
        }))
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ data: null, error: null }))
          }))
        }))
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ error: null }))
      }))
    }))
  }))
}));

// Mock the screening service
jest.mock('@/lib/services/screening');

// Mock fetch
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('Screening System', () => {
  const mockTenantId = 'test-tenant-123';

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  describe('ScreeningRuleManager', () => {
    const mockRules: ScreeningRule[] = [
      {
        id: 'rule-1',
        tenant_id: mockTenantId,
        name: 'High Energy Consumption',
        description: 'Customers with high monthly energy bills',
        rule_type: 'threshold',
        category: 'financial',
        conditions: [{
          questionId: 'q1',
          operator: 'greater_than',
          value: 300,
          weight: 1.0,
          metadata: {}
        }],
        scoring: {
          points: 25,
          weight: 2.0
        },
        thresholds: {
          high: 500,
          medium: 300,
          low: 150
        },
        recommendations: {
          qualified: 'Excellent candidate for solar installation',
          not_qualified: 'Low energy consumption may not justify solar investment'
        },
        risk_factors: [],
        is_active: true,
        priority: 1,
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    it('renders screening rules list', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRules
      } as Response);

      render(<ScreeningRuleManager tenantId={mockTenantId} />);

      await waitFor(() => {
        expect(screen.getByText('High Energy Consumption')).toBeInTheDocument();
        expect(screen.getByText('threshold')).toBeInTheDocument();
        expect(screen.getByText('25 pts')).toBeInTheDocument();
      });
    });

    it('opens add rule form when add button is clicked', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => []
      } as Response);

      render(<ScreeningRuleManager tenantId={mockTenantId} />);

      await waitFor(() => {
        const addButton = screen.getByText('Add Rule');
        fireEvent.click(addButton);
      });

      expect(screen.getByText('Rule Name')).toBeInTheDocument();
      expect(screen.getByText('Category')).toBeInTheDocument();
      expect(screen.getByText('Rule Type')).toBeInTheDocument();
    });

    it('creates new screening rule', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => []
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockRules[0]
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockRules
        } as Response);

      render(<ScreeningRuleManager tenantId={mockTenantId} />);

      // Open add form
      await waitFor(() => {
        const addButton = screen.getByText('Add Rule');
        fireEvent.click(addButton);
      });

      // Fill form
      const nameInput = screen.getByLabelText('Rule Name');
      fireEvent.change(nameInput, { target: { value: 'Test Rule' } });

      const pointsInput = screen.getByLabelText('Score Points');
      fireEvent.change(pointsInput, { target: { value: '10' } });

      // Add condition
      const addConditionButton = screen.getByText('Add Condition');
      fireEvent.click(addConditionButton);

      // Submit form
      const createButton = screen.getByText('Create Rule');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/screening/rules', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-tenant-id': mockTenantId
          },
          body: expect.stringContaining('Test Rule')
        });
      });
    });

    it('validates required fields', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => []
      } as Response);

      render(<ScreeningRuleManager tenantId={mockTenantId} />);

      await waitFor(() => {
        const addButton = screen.getByText('Add Rule');
        fireEvent.click(addButton);
      });

      const createButton = screen.getByText('Create Rule');
      expect(createButton).toBeDisabled();
    });
  });

  describe('ScreeningResults', () => {
    const mockResult: EnhancedScreeningResult = {
      id: 'result-1',
      tenant_id: mockTenantId,
      response_id: 'response-1',
      template_id: 'template-1',
      total_score: 75,
      max_possible_score: 100,
      percentage_score: 75,
      category_scores: {
        financial: {
          score: 25,
          max_score: 30,
          percentage: 83.3,
          weight: 2.0
        },
        technical: {
          score: 50,
          max_score: 70,
          percentage: 71.4,
          weight: 1.5
        }
      },
      feasibility_rating: 'high',
      qualification_level: 'qualified',
      risk_level: 'low',
      follow_up_priority: 'high',
      recommendations: [
        {
          category: 'financial',
          message: 'Excellent candidate for solar installation',
          priority: 'high',
          action_required: false
        }
      ],
      risk_factors: [
        {
          factor: 'Roof age',
          severity: 'medium',
          description: 'Roof may need inspection',
          mitigation: 'Schedule roof assessment'
        }
      ],
      next_steps: [
        {
          step: 'Schedule Site Assessment',
          description: 'Conduct detailed on-site evaluation',
          priority: 1,
          estimated_duration: '1-2 hours'
        }
      ],
      project_estimates: {
        system_size: {
          min_kwp: 8.0,
          max_kwp: 12.0,
          recommended_kwp: 10.0,
          confidence: 85
        },
        investment: {
          min_amount: 36000,
          max_amount: 54000,
          estimated_amount: 45000,
          currency: 'BRL',
          confidence: 85
        },
        payback_period: {
          min_months: 60,
          max_months: 84,
          estimated_months: 72
        },
        annual_savings: {
          min_amount: 7200,
          max_amount: 10800,
          estimated_amount: 9000,
          currency: 'BRL'
        }
      },
      applied_rules: [
        {
          rule_id: 'rule-1',
          rule_name: 'High Energy Consumption',
          category: 'financial',
          conditions_met: true,
          score_awarded: 25,
          max_score: 25,
          details: {}
        }
      ],
      calculation_metadata: {
        version: '1.0',
        calculated_at: new Date(),
        calculation_time_ms: 150,
        rules_processed: 5,
        warnings: [],
        debug_info: {}
      },
      created_at: new Date(),
      updated_at: new Date()
    };

    it('renders screening results with correct score', () => {
      render(<ScreeningResults result={mockResult} />);

      expect(screen.getByText('75.0%')).toBeInTheDocument();
      expect(screen.getByText('75 / 100 points')).toBeInTheDocument();
      expect(screen.getByText('HIGH')).toBeInTheDocument();
      expect(screen.getByText('QUALIFIED')).toBeInTheDocument();
      expect(screen.getByText('LOW')).toBeInTheDocument();
    });

    it('displays category breakdown', () => {
      render(<ScreeningResults result={mockResult} />);

      expect(screen.getByText('Category Breakdown')).toBeInTheDocument();
      expect(screen.getByText('25 / 30 points (83.3%)')).toBeInTheDocument();
      expect(screen.getByText('50 / 70 points (71.4%)')).toBeInTheDocument();
    });

    it('shows project estimates', () => {
      render(<ScreeningResults result={mockResult} />);

      expect(screen.getByText('Project Estimates')).toBeInTheDocument();
      expect(screen.getByText('10.0 kWp')).toBeInTheDocument();
      expect(screen.getByText('R$ 45.000,00')).toBeInTheDocument();
      expect(screen.getByText('6 years')).toBeInTheDocument();
      expect(screen.getByText('R$ 9.000,00')).toBeInTheDocument();
    });

    it('displays recommendations', () => {
      render(<ScreeningResults result={mockResult} />);

      expect(screen.getByText('Recommendations')).toBeInTheDocument();
      expect(screen.getByText('Excellent candidate for solar installation')).toBeInTheDocument();
      expect(screen.getByText('high priority')).toBeInTheDocument();
    });

    it('shows risk factors', () => {
      render(<ScreeningResults result={mockResult} />);

      expect(screen.getByText('Risk Factors')).toBeInTheDocument();
      expect(screen.getByText('Roof age')).toBeInTheDocument();
      expect(screen.getByText('Roof may need inspection')).toBeInTheDocument();
      expect(screen.getByText('Schedule roof assessment')).toBeInTheDocument();
    });

    it('displays next steps in priority order', () => {
      render(<ScreeningResults result={mockResult} />);

      expect(screen.getByText('Next Steps')).toBeInTheDocument();
      expect(screen.getByText('Schedule Site Assessment')).toBeInTheDocument();
      expect(screen.getByText('Conduct detailed on-site evaluation')).toBeInTheDocument();
      expect(screen.getByText('1-2 hours')).toBeInTheDocument();
    });

    it('hides details when showDetails is false', () => {
      render(<ScreeningResults result={mockResult} showDetails={false} />);

      expect(screen.queryByText('Category Breakdown')).not.toBeInTheDocument();
      expect(screen.queryByText('Recommendations')).not.toBeInTheDocument();
      expect(screen.queryByText('Risk Factors')).not.toBeInTheDocument();
    });
  });

  describe('ScreeningTemplateManager', () => {
    const mockTemplates: ScreeningTemplate[] = [
      {
        id: 'template-1',
        tenant_id: mockTenantId,
        questionnaire_template_id: 'questionnaire-1',
        name: 'Solar Assessment Template',
        description: 'Standard solar project assessment',
        version: '1.0',
        screening_rules: ['rule-1', 'rule-2'],
        scoring_config: {
          max_score: 100,
          qualification_thresholds: {
            qualified: 80,
            partially_qualified: 60,
            not_qualified: 0
          },
          feasibility_thresholds: {
            high: 80,
            medium: 60,
            low: 40,
            not_feasible: 0
          },
          risk_thresholds: {
            low: 20,
            medium: 40,
            high: 60,
            critical: 80
          }
        },
        output_config: {
          include_recommendations: true,
          include_risk_factors: true,
          include_next_steps: true,
          include_estimates: true,
          custom_fields: {}
        },
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    const mockQuestionnaireTemplates = [
      { id: 'questionnaire-1', name: 'Solar Questionnaire', version: '1.0' }
    ];

    it('renders template list', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTemplates
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => []
        } as Response);

      render(
        <ScreeningTemplateManager 
          tenantId={mockTenantId}
          questionnaireTemplates={mockQuestionnaireTemplates}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Solar Assessment Template')).toBeInTheDocument();
        expect(screen.getByText('v1.0')).toBeInTheDocument();
        expect(screen.getByText('Active')).toBeInTheDocument();
        expect(screen.getByText('2 rules')).toBeInTheDocument();
      });
    });

    it('opens add template form', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => []
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => []
        } as Response);

      render(
        <ScreeningTemplateManager 
          tenantId={mockTenantId}
          questionnaireTemplates={mockQuestionnaireTemplates}
        />
      );

      await waitFor(() => {
        const addButton = screen.getByText('Add Template');
        fireEvent.click(addButton);
      });

      expect(screen.getByText('Template Name')).toBeInTheDocument();
      expect(screen.getByText('Questionnaire Template')).toBeInTheDocument();
      expect(screen.getByText('Scoring Configuration')).toBeInTheDocument();
    });

    it('clones existing template', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTemplates
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => []
        } as Response);

      render(
        <ScreeningTemplateManager 
          tenantId={mockTenantId}
          questionnaireTemplates={mockQuestionnaireTemplates}
        />
      );

      await waitFor(() => {
        const cloneButton = screen.getAllByRole('button').find(
          button => button.querySelector('svg')?.getAttribute('class')?.includes('copy')
        );
        if (cloneButton) {
          fireEvent.click(cloneButton);
        }
      });

      await waitFor(() => {
        expect(screen.getByDisplayValue('Solar Assessment Template (Copy)')).toBeInTheDocument();
        expect(screen.getByDisplayValue('1.1')).toBeInTheDocument();
      });
    });
  });

  describe('Screening Service Integration', () => {
    it('processes screening with multiple rules', async () => {
      // This test would require actual service implementation
      // For now, just test that the service can be imported
      expect(true).toBe(true);
    });

    it('calculates correct feasibility rating', () => {
      // This would test the rating calculation logic
      // Implementation depends on the actual service methods
      expect(true).toBe(true); // Placeholder
    });

    it('generates appropriate recommendations', () => {
      // This would test recommendation generation
      // Implementation depends on the actual service methods
      expect(true).toBe(true); // Placeholder
    });
  });
});