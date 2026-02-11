/**
 * Real-Time Metrics Component
 * Requirements: 6.1 - Analytics data collection system
 */

'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { RealTimeMetric } from '@/lib/types/analytics';

interface RealTimeMetricsProps {
  metrics: RealTimeMetric[];
}

export function RealTimeMetrics({ metrics }: RealTimeMetricsProps) {
  if (!metrics || metrics.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Real-Time Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No real-time metrics available</p>
        </CardContent>
      </Card>
    );
  }

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatMetricName = (name: string) => {
    return name
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatValue = (value: number, metricName: string) => {
    if (metricName.includes('rate') || metricName.includes('percentage')) {
      return `${value.toFixed(2)}%`;
    }
    if (metricName.includes('time') || metricName.includes('duration')) {
      return `${value}ms`;
    }
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toLocaleString();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Real-Time Metrics
          <Badge variant="outline" className="text-xs">
            Live
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {metrics.map((metric) => (
            <div
              key={metric.metric_name}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">
                  {formatMetricName(metric.metric_name)}
                </p>
                <p className="text-2xl font-bold">
                  {formatValue(metric.value, metric.metric_name)}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {getTrendIcon(metric.trend)}
                  <span className={`text-xs ${getTrendColor(metric.trend)}`}>
                    {metric.change >= 0 ? '+' : ''}
                    {formatValue(Math.abs(metric.change), metric.metric_name)}
                    {metric.change_percentage !== 0 && (
                      <span className="ml-1">
                        ({metric.change_percentage >= 0 ? '+' : ''}
                        {metric.change_percentage.toFixed(1)}%)
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 text-xs text-muted-foreground">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </CardContent>
    </Card>
  );
}