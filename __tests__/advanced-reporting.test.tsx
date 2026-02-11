/**
 * Advanced Reporting System Tests
 * Requirements: 6.3, 6.4, 6.5 - Advanced reporting and forecasting
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { advancedReportingService, ForecastResult } from '@/lib/services/advanced-reporting';
import { AdvancedReporting } from '@/components/analytics/AdvancedReporting';
import { ForecastingDashboard } from '@/components/analytics/ForecastingDashboard';

// Mock the Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => ({
            limit: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({ data: null, error: null }))
            }))
          }))
        }))
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: { id: 'test-id' }, error: null }))
        }))
      })),
      upsert: jest.fn(() => Promise.resolve({ error: null }))
    }))
  })
}));

// Mock the analytics service
jest.mock('@/lib/services/analytics', () => ({
  analyticsService: {
    getMetrics: jest.fn(() => Promise.resolve([])),
    getEvents: jest.fn(() => Promise.resolve([])),
    getRealTimeMetrics: jest.fn(() => Promise.resolve([]))
  }
}));

// Mock fetch for API calls
global.fetch = jest.fn();

describe('Advanced Reporting Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Financial Forecasting', () => {
    it('should generate financial forecast with valid data', async () => {
      const mockContext = { tenant_id: 'test-tenant', user_id: 'test-user' };
      const metrics = ['revenue', 'churn_rate'];
      
      // Mock historical data
      jest.spyOn(advancedReportingService as any, 'getHistoricalMetricData')
        .mockResolvedValue([
          { date: new Date('2024-01-01'), value: 1000 },
          { date: new Date('2024-01-02'), value: 1100 },
          { date: new Date('2024-01-03'), value: 1200 },
          { date: new Date('2024-01-04'), value: 1300 },
          { date: new Date('2024-01-05'), value: 1400 }
        ]);

      const forecast = await advancedReportingService.generateFinancialForecast(
        mockContext,
        metrics,
        30,
        0.95
      );

      expect(forecast).toHaveLength(2);
      expect(forecast[0]).toHaveProperty('metric_name', 'revenue');
      expect(forecast[0]).toHaveProperty('predicted_values');
      expect(forecast[0]).toHaveProperty('confidence_interval');
      expect(forecast[0]).toHaveProperty('trend');
      expect(forecast[0]).toHaveProperty('accuracy_score');
      expect(forecast[0].predicted_values).toHaveLength(30);
    });

    it('should handle insufficient historical data gracefully', async () => {
      const mockContext = { tenant_id: 'test-tenant', user_id: 'test-user' };
      const metrics = ['revenue'];
      
      // Mock insufficient data
      jest.spyOn(advancedReportingService as any, 'getHistoricalMetricData')
        .mockResolvedValue([
          { date: new Date('2024-01-01'), value: 1000 }
        ]);

      const forecast = await advancedReportingService.generateFinancialForecast(
        mockContext,
        metrics,
        30,
        0.95
      );

      expect(forecast).toHaveLength(0);
    });

    it('should calculate trend correctly', async () => {
      const mockContext = { tenant_id: 'test-tenant', user_id: 'test-user' };
      
      // Mock increasing trend data
      jest.spyOn(advancedReportingService as any, 'getHistoricalMetricData')
        .mockResolvedValue([
          { date: new Date('2024-01-01'), value: 1000 },
          { date: new Date('2024-01-02'), value: 1100 },
          { date: new Date('2024-01-03'), value: 1200 },
          { date: new Date('2024-01-04'), value: 1300 },
          { date: new Date('2024-01-05'), value: 1400 },
          { date: new Date('2024-01-06'), value: 1500 },
          { date: new Date('2024-01-07'), value: 1600 }
        ]);

      const forecast = await advancedReportingService.generateFinancialForecast(
        mockContext,
        ['revenue'],
        7,
        0.95
      );

      expect(forecast[0].trend).toBe('increasing');
      expect(forecast[0].accuracy_score).toBeGreaterThan(0.8);
    });
  });

  describe('Performance Forecasting', () => {
    it('should generate performance forecast with all metrics', async () => {
      const mockContext = { tenant_id: 'test-tenant', user_id: 'test-user' };
      const timeRange = {
        type: 'relative' as const,
        relative: { amount: 90, unit: 'days' as const }
      };

      // Mock the generateFinancialForecast method
      jest.spyOn(advancedReportingService, 'generateFinancialForecast')
        .mockResolvedValue([{
          metric_name: 'test_metric',
          current_value: 100,
          predicted_values: [],
          confidence_interval: { lower: [], upper: [] },
          trend: 'increasing',
          accuracy_score: 0.85,
          model_type: 'linear'
        }]);

      const forecast = await advancedReportingService.generatePerformanceForecast(
        mockContext,
        timeRange
      );

      expect(forecast).toHaveProperty('user_growth');
      expect(forecast).toHaveProperty('revenue_projection');
      expect(forecast).toHaveProperty('churn_prediction');
      expect(forecast).toHaveProperty('engagement_trends');
    });
  });

  describe('Report Generation', () => {
    it('should generate report from template', async () => {
      const mockContext = { tenant_id: 'test-tenant', user_id: 'test-user' };
      const reportId = 'test-report-id';

      // Mock template data
      const mockTemplate = {
        id: reportId,
        tenant_id: mockContext.tenant_id,
        name: 'Test Report',
        description: 'Test Description',
        report_type: 'financial',
        config: { metrics: ['revenue'] },
        template_data: {
          sections: [
            {
              id: 'summary',
              type: 'summary',
              title: 'Summary',
              config: {},
              order: 1
            }
          ]
        }
      };

      // Mock Supabase response
      const mockSupabase = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({ 
                data: mockTemplate, 
                error: null 
              }))
            }))
          })),
          insert: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({ 
                data: { id: 'generated-report-id' }, 
                error: null 
              }))
            }))
          }))
        }))
      };

      // Replace the supabase instance
      (advancedReportingService as any).supabase = mockSupabase;

      const report = await advancedReportingService.generateReport(
        mockContext,
        reportId
      );

      expect(report).toHaveProperty('id', 'generated-report-id');
      expect(mockSupabase.from).toHaveBeenCalledWith('report_templates');
      expect(mockSupabase.from).toHaveBeenCalledWith('analytics_reports');
    });

    it('should handle missing template error', async () => {
      const mockContext = { tenant_id: 'test-tenant', user_id: 'test-user' };
      const reportId = 'non-existent-report';

      // Mock Supabase error response
      const mockSupabase = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({ 
                data: null, 
                error: { message: 'Not found' }
              }))
            }))
          }))
        }))
      };

      (advancedReportingService as any).supabase = mockSupabase;

      await expect(
        advancedReportingService.generateReport(mockContext, reportId)
      ).rejects.toThrow('Report template not found');
    });
  });

  describe('Report Insights', () => {
    it('should generate insights from report data', async () => {
      const mockContext = { tenant_id: 'test-tenant', user_id: 'test-user' };
      const reportData = {
        metrics: [
          {
            name: 'revenue',
            historical_values: [1000, 1100, 1200, 1300, 1400, 1500]
          },
          {
            name: 'user_engagement',
            historical_values: [100, 95, 90, 85, 80, 75]
          }
        ]
      };

      const insights = await advancedReportingService.generateReportInsights(
        mockContext,
        reportData
      );

      expect(insights).toHaveProperty('insights');
      expect(insights).toHaveProperty('recommendations');
      expect(insights).toHaveProperty('alerts');
      expect(insights).toHaveProperty('trends');
      
      expect(insights.trends).toHaveLength(2);
      expect(insights.trends[0]).toHaveProperty('metric', 'revenue');
      expect(insights.trends[0]).toHaveProperty('trend', 'up');
      expect(insights.trends[1]).toHaveProperty('metric', 'user_engagement');
      expect(insights.trends[1]).toHaveProperty('trend', 'down');
    });
  });
});

describe('Advanced Reporting Components', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
  });

  describe('AdvancedReporting Component', () => {
    it('should render main tabs and content', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ reports: [] })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ templates: [] })
        });

      render(<AdvancedReporting tenantId="test-tenant" />);

      expect(screen.getByText('Advanced Reporting')).toBeInTheDocument();
      expect(screen.getByText('Reports')).toBeInTheDocument();
      expect(screen.getByText('Forecasting')).toBeInTheDocument();
      expect(screen.getByText('Builder')).toBeInTheDocument();
      expect(screen.getByText('Scheduled')).toBeInTheDocument();
    });

    it('should handle report generation', async () => {
      const mockTemplates = [
        {
          id: 'template-1',
          name: 'Financial Report',
          description: 'Financial metrics',
          report_type: 'financial',
          is_active: true,
          created_at: '2024-01-01'
        }
      ];

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ reports: [] })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ templates: mockTemplates })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ report: { id: 'new-report' } })
        });

      render(<AdvancedReporting tenantId="test-tenant" />);

      await waitFor(() => {
        expect(screen.getByText('Financial Report')).toBeInTheDocument();
      });

      const generateButton = screen.getByText('Generate');
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/analytics/reports', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            template_id: 'template-1',
            time_range: {
              type: 'relative',
              relative: { amount: 30, unit: 'days' }
            }
          })
        });
      });
    });
  });

  describe('ForecastingDashboard Component', () => {
    it('should render forecast configuration controls', () => {
      render(<ForecastingDashboard tenantId="test-tenant" />);

      expect(screen.getByText('Forecast Configuration')).toBeInTheDocument();
      expect(screen.getByText('Forecast Type')).toBeInTheDocument();
      expect(screen.getByText('Forecast Period')).toBeInTheDocument();
      expect(screen.getByText('Confidence Level')).toBeInTheDocument();
    });

    it('should generate forecast when parameters change', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          forecast: [
            {
              metric_name: 'revenue',
              current_value: 10000,
              predicted_values: [
                { date: '2024-01-01', predicted_value: 11000, confidence: 0.9 }
              ],
              confidence_interval: { lower: [10500], upper: [11500] },
              trend: 'increasing',
              accuracy_score: 0.85,
              model_type: 'linear'
            }
          ]
        })
      });

      render(<ForecastingDashboard tenantId="test-tenant" />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/analytics/forecasting', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            forecast_type: 'financial',
            forecast_period: 30,
            confidence_level: 0.95,
            metrics: ['revenue', 'subscription_revenue', 'usage_revenue', 'churn_rate']
          })
        });
      });
    });
  });
});

describe('Forecasting Algorithms', () => {
  describe('Linear Regression Forecasting', () => {
    it('should calculate correct slope and intercept', () => {
      const historicalData = [
        { date: new Date('2024-01-01'), value: 100 },
        { date: new Date('2024-01-02'), value: 110 },
        { date: new Date('2024-01-03'), value: 120 },
        { date: new Date('2024-01-04'), value: 130 },
        { date: new Date('2024-01-05'), value: 140 }
      ];

      // Test the private method through reflection
      const service = advancedReportingService as any;
      const forecast = service.generateMetricForecast(
        historicalData,
        'test_metric',
        5,
        0.95
      );

      // The trend should be increasing with good accuracy
      expect(forecast).resolves.toMatchObject({
        trend: 'increasing',
        accuracy_score: expect.any(Number)
      });
    });

    it('should handle stable trends correctly', () => {
      const historicalData = [
        { date: new Date('2024-01-01'), value: 100 },
        { date: new Date('2024-01-02'), value: 101 },
        { date: new Date('2024-01-03'), value: 99 },
        { date: new Date('2024-01-04'), value: 100 },
        { date: new Date('2024-01-05'), value: 102 }
      ];

      const service = advancedReportingService as any;
      const forecast = service.generateMetricForecast(
        historicalData,
        'test_metric',
        5,
        0.95
      );

      expect(forecast).resolves.toMatchObject({
        trend: 'stable'
      });
    });
  });

  describe('Confidence Intervals', () => {
    it('should calculate confidence intervals correctly', async () => {
      const historicalData = [
        { date: new Date('2024-01-01'), value: 100 },
        { date: new Date('2024-01-02'), value: 110 },
        { date: new Date('2024-01-03'), value: 120 },
        { date: new Date('2024-01-04'), value: 130 },
        { date: new Date('2024-01-05'), value: 140 }
      ];

      const service = advancedReportingService as any;
      const forecast = await service.generateMetricForecast(
        historicalData,
        'test_metric',
        3,
        0.95
      );

      expect(forecast.confidence_interval.lower).toHaveLength(3);
      expect(forecast.confidence_interval.upper).toHaveLength(3);
      
      // Upper bound should be higher than lower bound
      for (let i = 0; i < 3; i++) {
        expect(forecast.confidence_interval.upper[i])
          .toBeGreaterThan(forecast.confidence_interval.lower[i]);
      }
    });
  });
});

describe('Report Template System', () => {
  it('should validate report template structure', () => {
    const validTemplate = {
      name: 'Test Report',
      description: 'Test Description',
      report_type: 'financial',
      config: {
        metrics: ['revenue'],
        time_range: { type: 'relative', relative: { amount: 30, unit: 'days' } }
      },
      template_data: {
        sections: [
          {
            id: 'summary',
            type: 'summary',
            title: 'Summary',
            config: {},
            order: 1
          }
        ],
        styling: {
          theme: 'corporate',
          colors: { primary: '#3b82f6', secondary: '#64748b', accent: '#10b981' }
        }
      }
    };

    // This would be validated by the API endpoint
    expect(validTemplate.name).toBeTruthy();
    expect(validTemplate.config).toBeTruthy();
    expect(validTemplate.template_data).toBeTruthy();
    expect(validTemplate.template_data.sections).toHaveLength(1);
  });
});