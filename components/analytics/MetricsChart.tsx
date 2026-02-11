/**
 * Metrics Chart Component
 * Requirements: 6.1 - Analytics data collection system
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, TrendingUp, BarChart3 } from 'lucide-react';
import type { TimeRange } from '@/lib/types/analytics';

interface MetricsChartProps {
  type: 'line' | 'bar' | 'pie' | 'area' | 'scatter';
  metric: string;
  title?: string;
  groupBy?: string[];
  timeRange: TimeRange;
  height?: number;
}

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string;
    fill?: boolean;
  }[];
}

export function MetricsChart({ 
  type, 
  metric, 
  title, 
  groupBy = [], 
  timeRange, 
  height = 300 
}: MetricsChartProps) {
  const [data, setData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadChartData();
  }, [metric, type, groupBy, timeRange]);

  const loadChartData = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        metric,
        type,
        time_range: JSON.stringify(timeRange),
      });

      if (groupBy.length > 0) {
        params.append('group_by', groupBy.join(','));
      }

      const response = await fetch(`/api/analytics/metrics/chart?${params}`);
      if (!response.ok) {
        throw new Error('Failed to load chart data');
      }

      const chartData = await response.json();
      setData(chartData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load chart data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadChartData();
  };

  const renderChart = () => {
    if (!data) return null;

    // This is a simplified chart implementation
    // In a real application, you would use a charting library like Chart.js, Recharts, or D3.js
    
    switch (type) {
      case 'line':
      case 'area':
        return <LineChart data={data} type={type} height={height} />;
      case 'bar':
        return <BarChart data={data} height={height} />;
      case 'pie':
        return <PieChart data={data} height={height} />;
      default:
        return <SimpleChart data={data} height={height} />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title || `${metric} Chart`}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center" style={{ height }}>
          <RefreshCw className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {title || `${metric} Chart`}
          </CardTitle>
          <Button onClick={handleRefresh} variant="ghost" size="sm">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="flex items-center justify-center text-red-500" style={{ height }}>
            <p>{error}</p>
          </div>
        ) : (
          renderChart()
        )}
      </CardContent>
    </Card>
  );
}

// Simplified chart components (in a real app, use a proper charting library)
function LineChart({ data, type, height }: { data: ChartData; type: 'line' | 'area'; height: number }) {
  const maxValue = Math.max(...data.datasets.flatMap(d => d.data));
  const minValue = Math.min(...data.datasets.flatMap(d => d.data));
  const range = maxValue - minValue || 1;

  return (
    <div className="relative" style={{ height }}>
      <svg width="100%" height="100%" className="border rounded">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
          <line
            key={i}
            x1="0"
            y1={`${ratio * 100}%`}
            x2="100%"
            y2={`${ratio * 100}%`}
            stroke="#e5e7eb"
            strokeWidth="1"
          />
        ))}
        
        {/* Data lines */}
        {data.datasets.map((dataset, datasetIndex) => {
          const points = dataset.data.map((value, index) => {
            const x = (index / (data.labels.length - 1)) * 100;
            const y = 100 - ((value - minValue) / range) * 100;
            return `${x},${y}`;
          }).join(' ');

          return (
            <g key={datasetIndex}>
              {type === 'area' && (
                <polygon
                  points={`0,100 ${points} ${100},100`}
                  fill={dataset.backgroundColor || '#3b82f6'}
                  fillOpacity="0.3"
                />
              )}
              <polyline
                points={points}
                fill="none"
                stroke={dataset.borderColor || '#3b82f6'}
                strokeWidth="2"
              />
              {/* Data points */}
              {dataset.data.map((value, index) => {
                const x = (index / (data.labels.length - 1)) * 100;
                const y = 100 - ((value - minValue) / range) * 100;
                return (
                  <circle
                    key={index}
                    cx={`${x}%`}
                    cy={`${y}%`}
                    r="3"
                    fill={dataset.borderColor || '#3b82f6'}
                  />
                );
              })}
            </g>
          );
        })}
      </svg>
      
      {/* Labels */}
      <div className="flex justify-between mt-2 text-xs text-muted-foreground">
        {data.labels.map((label, index) => (
          <span key={index}>{label}</span>
        ))}
      </div>
    </div>
  );
}

function BarChart({ data, height }: { data: ChartData; height: number }) {
  const maxValue = Math.max(...data.datasets.flatMap(d => d.data));

  return (
    <div className="space-y-4" style={{ height }}>
      <div className="flex items-end justify-between h-full gap-2">
        {data.labels.map((label, index) => {
          const value = data.datasets[0]?.data[index] || 0;
          const barHeight = (value / maxValue) * 100;
          
          return (
            <div key={index} className="flex flex-col items-center flex-1">
              <div className="flex items-end h-full w-full">
                <div
                  className="bg-blue-500 w-full rounded-t"
                  style={{ height: `${barHeight}%` }}
                  title={`${label}: ${value}`}
                />
              </div>
              <span className="text-xs text-muted-foreground mt-2 text-center">
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PieChart({ data, height }: { data: ChartData; height: number }) {
  const total = data.datasets[0]?.data.reduce((sum, value) => sum + value, 0) || 1;
  const colors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
    '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6b7280'
  ];

  let currentAngle = 0;
  const radius = Math.min(height, 300) / 2 - 20;
  const centerX = radius + 20;
  const centerY = radius + 20;

  return (
    <div className="flex items-center gap-8" style={{ height }}>
      <svg width={radius * 2 + 40} height={radius * 2 + 40}>
        {data.datasets[0]?.data.map((value, index) => {
          const percentage = value / total;
          const angle = percentage * 360;
          const startAngle = currentAngle;
          const endAngle = currentAngle + angle;
          
          const x1 = centerX + radius * Math.cos((startAngle * Math.PI) / 180);
          const y1 = centerY + radius * Math.sin((startAngle * Math.PI) / 180);
          const x2 = centerX + radius * Math.cos((endAngle * Math.PI) / 180);
          const y2 = centerY + radius * Math.sin((endAngle * Math.PI) / 180);
          
          const largeArcFlag = angle > 180 ? 1 : 0;
          
          const pathData = [
            `M ${centerX} ${centerY}`,
            `L ${x1} ${y1}`,
            `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
            'Z'
          ].join(' ');
          
          currentAngle += angle;
          
          return (
            <path
              key={index}
              d={pathData}
              fill={colors[index % colors.length]}
              stroke="white"
              strokeWidth="2"
            />
          );
        })}
      </svg>
      
      <div className="space-y-2">
        {data.labels.map((label, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded"
              style={{ backgroundColor: colors[index % colors.length] }}
            />
            <span>{label}</span>
            <span className="text-muted-foreground">
              ({data.datasets[0]?.data[index] || 0})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SimpleChart({ data, height }: { data: ChartData; height: number }) {
  return (
    <div className="flex items-center justify-center text-muted-foreground" style={{ height }}>
      <div className="text-center">
        <TrendingUp className="h-12 w-12 mx-auto mb-4" />
        <p>Chart visualization would appear here</p>
        <p className="text-sm">Data points: {data.labels.length}</p>
      </div>
    </div>
  );
}