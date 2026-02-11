/**
 * Forecasting API Route
 * Requirements: 6.4, 6.5 - Predictive analytics and forecasting
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { advancedReportingService } from '@/lib/services/advanced-reporting';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = user.user_metadata?.tenant_id;
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 400 });
    }

    const body = await request.json();
    const { 
      forecast_type = 'financial',
      metrics = [],
      forecast_period = 30,
      confidence_level = 0.95,
      time_range
    } = body;

    const context = { tenant_id: tenantId, user_id: user.id };

    let forecastResult;

    switch (forecast_type) {
      case 'financial':
        const financialMetrics = metrics.length > 0 ? metrics : [
          'revenue',
          'subscription_revenue',
          'usage_revenue',
          'churn_rate'
        ];
        
        forecastResult = await advancedReportingService.generateFinancialForecast(
          context,
          financialMetrics,
          forecast_period,
          confidence_level
        );
        break;

      case 'performance':
        forecastResult = await advancedReportingService.generatePerformanceForecast(
          context,
          time_range || { type: 'relative', relative: { amount: 90, unit: 'days' } }
        );
        break;

      case 'custom':
        if (metrics.length === 0) {
          return NextResponse.json(
            { error: 'Metrics required for custom forecast' },
            { status: 400 }
          );
        }
        
        forecastResult = await advancedReportingService.generateFinancialForecast(
          context,
          metrics,
          forecast_period,
          confidence_level
        );
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid forecast type. Use: financial, performance, or custom' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      forecast: forecastResult,
      generated_at: new Date().toISOString(),
      forecast_type,
      parameters: {
        forecast_period,
        confidence_level,
        metrics: forecast_type === 'custom' ? metrics : undefined
      }
    });

  } catch (error) {
    console.error('Failed to generate forecast:', error);
    return NextResponse.json(
      { error: 'Failed to generate forecast' },
      { status: 500 }
    );
  }
}