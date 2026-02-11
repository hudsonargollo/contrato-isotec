/**
 * Forecasting Dashboard Component
 * Requirements: 6.4, 6.5 - Predictive analytics and forecasting
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Target,
  Calendar,
  BarChart3,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

interface ForecastingDashboardProps {
  tenantId: string;
}

interface ForecastResult {
  metric_name: string;
  current_value: number;
  predicted_values: Array<{
    date: string;
    predicted_value: number;
    confidence: number;
  }>;
  confidence_interval: {
    lower: number[];
    upper: number[];
  };
  trend: 'increasing' | 'decreasing' | 'stable';
  accuracy_score: number;
  model_type: string;
}

interface PerformanceForecast {
  user_growth: ForecastResult;
  revenue_projection: ForecastResult;
  churn_prediction: ForecastResult;
  engagement_trends: ForecastResult;
}

export function ForecastingDashboard({ tenantId }: ForecastingDashboardProps) {
  const [forecastType, setForecastType] = useState<'financial' | 'performance' | 'custom'>('financial');
  const [forecastPeriod, setForecastPeriod] = useState(30);
  const [confidenceLevel, setConfidenceLevel] = useState(0.95);
  const [financialForecast, setFinancialForecast] = useState<ForecastResult[]>([]);
  const [performanceForecast, setPerformanceForecast] = useState<PerformanceForecast | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    generateForecast();
  }, [forecastType, forecastPeriod, confidenceLevel]);

  const generateForecast = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/analytics/forecasting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          forecast_type: forecastType,
          forecast_period: forecastPeriod,
          confidence_level: confidenceLevel,
          metrics: forecastType === 'financial' ? [
            'revenue',
            'subscription_revenue',
            'usage_revenue',
            'churn_rate'
          ] : undefined
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate forecast');
      }

      const data = await response.json();

      if (forecastType === 'financial') {
        setFinancialForecast(data.forecast || []);
      } else if (forecastType === 'performance') {
        setPerformanceForecast(data.forecast || null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate forecast');
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'decreasing':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return 'bg-green-100 text-green-800';
      case 'decreasing':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatChartData = (forecast: ForecastResult) => {
    return forecast.predicted_values.map((point, index) => ({
      date: new Date(point.date).toLocaleDateString(),
      value: point.predicted_value,
      confidence: point.confidence * 100,
      lower: forecast.confidence_interval.lower[index] || 0,
      upper: forecast.confidence_interval.upper[index] || 0
    }));
  };

  const renderForecastCard = (forecast: ForecastResult, title?: string) => (
    <Card key={forecast.metric_name}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            {title || forecast.metric_name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </CardTitle>
          <div className="flex items-center space-x-2">
            {getTrendIcon(forecast.trend)}
            <Badge className={getTrendColor(forecast.trend)}>
              {forecast.trend}
            </Badge>
          </div>
        </div>
        <CardDescription>
          Current: {forecast.current_value.toLocaleString()} | 
          Accuracy: {Math.round(forecast.accuracy_score * 100)}%
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={formatChartData(forecast)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip 
                formatter={(value: any, name: string) => [
                  typeof value === 'number' ? value.toLocaleString() : value,
                  name === 'value' ? 'Predicted' : 
                  name === 'confidence' ? 'Confidence %' : name
                ]}
              />
              <Area
                type="monotone"
                dataKey="upper"
                stackId="1"
                stroke="none"
                fill="#e5e7eb"
                fillOpacity={0.3}
              />
              <Area
                type="monotone"
                dataKey="lower"
                stackId="1"
                stroke="none"
                fill="#ffffff"
                fillOpacity={1}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Model Type</p>
            <p className="font-medium">{forecast.model_type}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Forecast Period</p>
            <p className="font-medium">{forecastPeriod} days</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Forecast Configuration</CardTitle>
          <CardDescription>
            Configure forecasting parameters and generate predictions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Forecast Type</label>
              <Select value={forecastType} onValueChange={(value: any) => setForecastType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="financial">Financial</SelectItem>
                  <SelectItem value="performance">Performance</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Forecast Period</label>
              <Select value={forecastPeriod.toString()} onValueChange={(value) => setForecastPeriod(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="14">14 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="60">60 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Confidence Level</label>
              <Select value={confidenceLevel.toString()} onValueChange={(value) => setConfidenceLevel(parseFloat(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.90">90%</SelectItem>
                  <SelectItem value="0.95">95%</SelectItem>
                  <SelectItem value="0.99">99%</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button onClick={generateForecast} disabled={loading} className="w-full">
                {loading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Target className="h-4 w-4 mr-2" />
                )}
                Generate
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <p className="text-red-800">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Forecast Results */}
      {forecastType === 'financial' && financialForecast.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Financial Forecast</h3>
            <Badge variant="outline">
              <Calendar className="h-4 w-4 mr-1" />
              {forecastPeriod} days
            </Badge>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {financialForecast.map((forecast) => renderForecastCard(forecast))}
          </div>
        </div>
      )}

      {forecastType === 'performance' && performanceForecast && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Performance Forecast</h3>
            <Badge variant="outline">
              <BarChart3 className="h-4 w-4 mr-1" />
              Key Metrics
            </Badge>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {renderForecastCard(performanceForecast.user_growth, 'User Growth')}
            {renderForecastCard(performanceForecast.revenue_projection, 'Revenue Projection')}
            {renderForecastCard(performanceForecast.churn_prediction, 'Churn Prediction')}
            {renderForecastCard(performanceForecast.engagement_trends, 'Engagement Trends')}
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center space-x-2">
              <RefreshCw className="h-6 w-6 animate-spin" />
              <p>Generating forecast...</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}