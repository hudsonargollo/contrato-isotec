/**
 * Advanced Reporting Demo Page
 * Requirements: 6.3, 6.4, 6.5 - Advanced reporting and forecasting
 */

'use client';

import React from 'react';
import { AdvancedReporting } from '@/components/analytics/AdvancedReporting';

export default function AdvancedReportingDemoPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Advanced Reporting & Forecasting Demo</h1>
        <p className="text-lg text-muted-foreground">
          Demonstration of the advanced reporting and forecasting system with automated report generation,
          predictive analytics algorithms, and financial performance forecasting capabilities.
        </p>
      </div>

      <AdvancedReporting tenantId="demo-tenant" />
    </div>
  );
}