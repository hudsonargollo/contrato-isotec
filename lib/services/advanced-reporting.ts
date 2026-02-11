/**
 * Advanced Reporting Service
 * Requirements: 6.3, 6.4, 6.5 - Advanced reporting and forecasting
 * Handles automated report generation, predictive analytics, and forecasting
 */

import { createClient } from '@/lib/supabase/client';
import { TenantContext } from '@/lib/types/tenant';
import { analyticsService } from './analytics';
import type {
  AnalyticsReport,
  ReportConfig,
  ScheduleConfig,
  TimeRange,
  AnalyticsMetric,
  AnalyticsEvent
} from '@/lib/types/analytics';

export interface ForecastResult {
  metric_name: string;
  current_value: number;
  predicted_values: ForecastPoint[];
  confidence_interval: {
    lower: number[];
    upper: number[];
  };
  trend: 'increasing' | 'decreasing' | 'stable';
  accuracy_score: number;
  model_type: 'linear' | 'exponential' | 'seasonal';
}

export interface ForecastPoint {
  date: Date;
  predicted_value: number;
  confidence: number;
}

export interface ReportTemplate {
  id: string;
  tenant_id: string;
  name: string;
  description: string;
  report_type: 'financial' | 'performance' | 'user_engagement' | 'operational' | 'custom';
  config: ReportConfig;
  template_data: ReportTemplateData;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ReportTemplateData {
  sections: ReportSection[];
  styling: ReportStyling;
  export_formats: ('pdf' | 'csv' | 'excel' | 'json')[];
}

export interface ReportSection {
  id: string;
  type: 'summary' | 'chart' | 'table' | 'forecast' | 'kpi' | 'text';
  title: string;
  config: any;
  order: number;
}

export interface ReportStyling {
  theme: 'light' | 'dark' | 'corporate';
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
}

export class AdvancedReportingService {
  private supabase = createClient();

  /**
   * Generate automated report
   */
  async generateReport(
    context: TenantContext,
    reportId: string,
    timeRange?: TimeRange
  ): Promise<AnalyticsReport> {
    try {
      // Get report template
      const { data: reportTemplate, error } = await this.supabase
        .from('report_templates')
        .select('*')
        .eq('tenant_id', context.tenant_id)
        .eq('id', reportId)
        .single();

      if (error || !reportTemplate) {
        throw new Error('Report template not found');
      }

      // Generate report data
      const reportData = await this.generateReportData(
        context,
        reportTemplate,
        timeRange
      );

      // Create report record
      const { data: report, error: reportError } = await this.supabase
        .from('analytics_reports')
        .insert({
          tenant_id: context.tenant_id,
          user_id: context.user_id,
          name: reportTemplate.name,
          description: reportTemplate.description,
          report_type: 'custom',
          config: reportTemplate.config,
          data: reportData,
          status: 'active',
          last_generated_at: new Date()
        })
        .select()
        .single();

      if (reportError) {
        throw new Error(`Failed to create report: ${reportError.message}`);
      }

      return report;
    } catch (error) {
      console.error('Failed to generate report:', error);
      throw error;
    }
  }

  /**
   * Generate financial forecast
   */
  async generateFinancialForecast(
    context: TenantContext,
    metrics: string[],
    forecastPeriod: number = 30, // days
    confidenceLevel: number = 0.95
  ): Promise<ForecastResult[]> {
    try {
      const forecasts: ForecastResult[] = [];

      for (const metricName of metrics) {
        // Get historical data
        const historicalData = await this.getHistoricalMetricData(
          context,
          metricName,
          90 // 90 days of history
        );

        if (historicalData.length < 7) {
          console.warn(`Insufficient data for forecasting ${metricName}`);
          continue;
        }

        // Generate forecast
        const forecast = await this.generateMetricForecast(
          historicalData,
          metricName,
          forecastPeriod,
          confidenceLevel
        );

        forecasts.push(forecast);
      }

      return forecasts;
    } catch (error) {
      console.error('Failed to generate financial forecast:', error);
      throw error;
    }
  }

  /**
   * Generate performance forecast
   */
  async generatePerformanceForecast(
    context: TenantContext,
    timeRange: TimeRange
  ): Promise<{
    user_growth: ForecastResult;
    revenue_projection: ForecastResult;
    churn_prediction: ForecastResult;
    engagement_trends: ForecastResult;
  }> {
    try {
      const [userGrowth, revenueProjection, churnPrediction, engagementTrends] = 
        await Promise.all([
          this.generateFinancialForecast(context, ['daily_active_users'], 30),
          this.generateFinancialForecast(context, ['revenue'], 30),
          this.generateFinancialForecast(context, ['churn_rate'], 30),
          this.generateFinancialForecast(context, ['engagement_score'], 30)
        ]);

      return {
        user_growth: userGrowth[0] || this.createEmptyForecast('daily_active_users'),
        revenue_projection: revenueProjection[0] || this.createEmptyForecast('revenue'),
        churn_prediction: churnPrediction[0] || this.createEmptyForecast('churn_rate'),
        engagement_trends: engagementTrends[0] || this.createEmptyForecast('engagement_score')
      };
    } catch (error) {
      console.error('Failed to generate performance forecast:', error);
      throw error;
    }
  }

  /**
   * Create scheduled report
   */
  async createScheduledReport(
    context: TenantContext,
    reportTemplate: Omit<ReportTemplate, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>,
    schedule: ScheduleConfig
  ): Promise<string> {
    try {
      const { data: template, error } = await this.supabase
        .from('report_templates')
        .insert({
          ...reportTemplate,
          tenant_id: context.tenant_id
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create report template: ${error.message}`);
      }

      // Create scheduled report
      const { data: scheduledReport, error: scheduleError } = await this.supabase
        .from('analytics_reports')
        .insert({
          tenant_id: context.tenant_id,
          user_id: context.user_id,
          name: reportTemplate.name,
          description: reportTemplate.description,
          report_type: 'scheduled',
          config: reportTemplate.config,
          schedule_config: schedule,
          status: 'active',
          next_generation_at: this.calculateNextGeneration(schedule)
        })
        .select()
        .single();

      if (scheduleError) {
        throw new Error(`Failed to create scheduled report: ${scheduleError.message}`);
      }

      return scheduledReport.id;
    } catch (error) {
      console.error('Failed to create scheduled report:', error);
      throw error;
    }
  }

  /**
   * Get report insights and recommendations
   */
  async generateReportInsights(
    context: TenantContext,
    reportData: any
  ): Promise<{
    insights: string[];
    recommendations: string[];
    alerts: string[];
    trends: { metric: string; trend: 'up' | 'down' | 'stable'; significance: number }[];
  }> {
    try {
      const insights: string[] = [];
      const recommendations: string[] = [];
      const alerts: string[] = [];
      const trends: any[] = [];

      // Analyze key metrics for insights
      if (reportData.metrics) {
        for (const metric of reportData.metrics) {
          const trend = this.analyzeTrend(metric.historical_values);
          trends.push({
            metric: metric.name,
            trend: trend.direction,
            significance: trend.significance
          });

          // Generate insights based on trends
          if (trend.significance > 0.7) {
            if (trend.direction === 'up' && metric.name.includes('revenue')) {
              insights.push(`Strong revenue growth detected: ${Math.round(trend.change_percentage)}% increase`);
              recommendations.push('Consider scaling marketing efforts to capitalize on growth momentum');
            } else if (trend.direction === 'down' && metric.name.includes('user')) {
              alerts.push(`User engagement declining: ${Math.round(Math.abs(trend.change_percentage))}% decrease`);
              recommendations.push('Review user experience and implement retention strategies');
            }
          }
        }
      }

      // Add general insights
      if (insights.length === 0) {
        insights.push('System performance is stable with no significant anomalies detected');
      }

      if (recommendations.length === 0) {
        recommendations.push('Continue monitoring key metrics for optimization opportunities');
      }

      return { insights, recommendations, alerts, trends };
    } catch (error) {
      console.error('Failed to generate report insights:', error);
      return { insights: [], recommendations: [], alerts: [], trends: [] };
    }
  }

  /**
   * Private helper methods
   */
  private async generateReportData(
    context: TenantContext,
    template: ReportTemplate,
    timeRange?: TimeRange
  ): Promise<any> {
    const reportData: any = {
      generated_at: new Date(),
      time_range: timeRange || { type: 'relative', relative: { amount: 30, unit: 'days' } },
      sections: []
    };

    for (const section of template.template_data.sections) {
      let sectionData: any = {
        id: section.id,
        type: section.type,
        title: section.title
      };

      switch (section.type) {
        case 'summary':
          sectionData.data = await this.generateSummaryData(context, section.config, timeRange);
          break;
        case 'chart':
          sectionData.data = await this.generateChartData(context, section.config, timeRange);
          break;
        case 'table':
          sectionData.data = await this.generateTableData(context, section.config, timeRange);
          break;
        case 'forecast':
          sectionData.data = await this.generateForecastData(context, section.config);
          break;
        case 'kpi':
          sectionData.data = await this.generateKPIData(context, section.config, timeRange);
          break;
        default:
          sectionData.data = {};
      }

      reportData.sections.push(sectionData);
    }

    return reportData;
  }

  private async getHistoricalMetricData(
    context: TenantContext,
    metricName: string,
    days: number
  ): Promise<{ date: Date; value: number }[]> {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

      const metrics = await analyticsService.getMetrics(
        context,
        {
          metric_name: metricName,
          time_range: {
            type: 'absolute',
            absolute: { start: startDate, end: endDate }
          }
        },
        1000
      );

      return metrics.map(metric => ({
        date: new Date(metric.period_start),
        value: metric.value
      })).sort((a, b) => a.date.getTime() - b.date.getTime());
    } catch (error) {
      console.error('Failed to get historical metric data:', error);
      return [];
    }
  }

  private async generateMetricForecast(
    historicalData: { date: Date; value: number }[],
    metricName: string,
    forecastPeriod: number,
    confidenceLevel: number
  ): Promise<ForecastResult> {
    try {
      // Simple linear regression for forecasting
      const values = historicalData.map(d => d.value);
      const n = values.length;
      
      if (n < 2) {
        return this.createEmptyForecast(metricName);
      }

      // Calculate trend
      const xValues = Array.from({ length: n }, (_, i) => i);
      const sumX = xValues.reduce((a, b) => a + b, 0);
      const sumY = values.reduce((a, b) => a + b, 0);
      const sumXY = xValues.reduce((sum, x, i) => sum + x * values[i], 0);
      const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);

      const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;

      // Generate predictions
      const predictions: ForecastPoint[] = [];
      const lastDate = historicalData[historicalData.length - 1].date;
      
      for (let i = 1; i <= forecastPeriod; i++) {
        const predictedValue = intercept + slope * (n + i - 1);
        const confidence = Math.max(0.5, 1 - (i / forecastPeriod) * 0.5); // Decreasing confidence
        
        predictions.push({
          date: new Date(lastDate.getTime() + i * 24 * 60 * 60 * 1000),
          predicted_value: Math.max(0, predictedValue),
          confidence
        });
      }

      // Calculate confidence intervals (simplified)
      const stdDev = this.calculateStandardDeviation(values);
      const confidenceMultiplier = confidenceLevel === 0.95 ? 1.96 : 1.645;
      
      const lowerBound = predictions.map(p => Math.max(0, p.predicted_value - confidenceMultiplier * stdDev));
      const upperBound = predictions.map(p => p.predicted_value + confidenceMultiplier * stdDev);

      // Determine trend
      let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
      if (Math.abs(slope) > stdDev * 0.1) {
        trend = slope > 0 ? 'increasing' : 'decreasing';
      }

      // Calculate accuracy score (R-squared approximation)
      const meanY = sumY / n;
      const totalSumSquares = values.reduce((sum, y) => sum + Math.pow(y - meanY, 2), 0);
      const residualSumSquares = values.reduce((sum, y, i) => {
        const predicted = intercept + slope * i;
        return sum + Math.pow(y - predicted, 2);
      }, 0);
      
      const accuracyScore = Math.max(0, 1 - (residualSumSquares / totalSumSquares));

      return {
        metric_name: metricName,
        current_value: values[values.length - 1],
        predicted_values: predictions,
        confidence_interval: {
          lower: lowerBound,
          upper: upperBound
        },
        trend,
        accuracy_score: Math.round(accuracyScore * 100) / 100,
        model_type: 'linear'
      };
    } catch (error) {
      console.error('Failed to generate metric forecast:', error);
      return this.createEmptyForecast(metricName);
    }
  }

  private createEmptyForecast(metricName: string): ForecastResult {
    return {
      metric_name: metricName,
      current_value: 0,
      predicted_values: [],
      confidence_interval: { lower: [], upper: [] },
      trend: 'stable',
      accuracy_score: 0,
      model_type: 'linear'
    };
  }

  private calculateStandardDeviation(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
    return Math.sqrt(avgSquaredDiff);
  }

  private calculateNextGeneration(schedule: ScheduleConfig): Date {
    const now = new Date();
    const [hours, minutes] = schedule.time.split(':').map(Number);
    
    const nextRun = new Date(now);
    nextRun.setHours(hours, minutes, 0, 0);
    
    switch (schedule.frequency) {
      case 'daily':
        if (nextRun <= now) {
          nextRun.setDate(nextRun.getDate() + 1);
        }
        break;
      case 'weekly':
        nextRun.setDate(nextRun.getDate() + (7 - nextRun.getDay()));
        if (nextRun <= now) {
          nextRun.setDate(nextRun.getDate() + 7);
        }
        break;
      case 'monthly':
        nextRun.setMonth(nextRun.getMonth() + 1, 1);
        if (nextRun <= now) {
          nextRun.setMonth(nextRun.getMonth() + 1);
        }
        break;
    }
    
    return nextRun;
  }

  private analyzeTrend(values: number[]): {
    direction: 'up' | 'down' | 'stable';
    significance: number;
    change_percentage: number;
  } {
    if (values.length < 2) {
      return { direction: 'stable', significance: 0, change_percentage: 0 };
    }

    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    const changePercentage = firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0;
    const significance = Math.min(1, Math.abs(changePercentage) / 10); // Normalize to 0-1
    
    let direction: 'up' | 'down' | 'stable' = 'stable';
    if (Math.abs(changePercentage) > 5) {
      direction = changePercentage > 0 ? 'up' : 'down';
    }

    return {
      direction,
      significance,
      change_percentage: changePercentage
    };
  }

  private async generateSummaryData(context: TenantContext, config: any, timeRange?: TimeRange): Promise<any> {
    // Implementation for summary data generation
    return { summary: 'Generated summary data' };
  }

  private async generateChartData(context: TenantContext, config: any, timeRange?: TimeRange): Promise<any> {
    // Implementation for chart data generation
    return { chart: 'Generated chart data' };
  }

  private async generateTableData(context: TenantContext, config: any, timeRange?: TimeRange): Promise<any> {
    // Implementation for table data generation
    return { table: 'Generated table data' };
  }

  private async generateForecastData(context: TenantContext, config: any): Promise<any> {
    // Implementation for forecast data generation
    return { forecast: 'Generated forecast data' };
  }

  private async generateKPIData(context: TenantContext, config: any, timeRange?: TimeRange): Promise<any> {
    // Implementation for KPI data generation
    return { kpi: 'Generated KPI data' };
  }
}

// Export singleton instance
export const advancedReportingService = new AdvancedReportingService();