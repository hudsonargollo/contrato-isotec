/**
 * Branding Preview Component
 * 
 * Provides a real-time preview of branding changes before applying them.
 * Shows how the branding will look across different UI components.
 * 
 * Requirements: 1.3 - Tenant branding and customization system
 */

'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { TenantBranding } from '@/lib/types/tenant';
import { brandingService } from '@/lib/services/branding';

interface BrandingPreviewProps {
  branding: TenantBranding;
  className?: string;
}

export const BrandingPreview: React.FC<BrandingPreviewProps> = ({ branding, className = '' }) => {
  const theme = brandingService.generateTheme(branding);
  const cssVariables = brandingService.generateCSSVariables(branding);

  // Create inline styles for preview
  const previewStyles: React.CSSProperties = {
    '--color-primary': theme.primary,
    '--color-secondary': theme.secondary,
    '--color-accent': theme.accent,
    '--color-background': theme.background,
    '--color-text': theme.text,
  } as React.CSSProperties;

  return (
    <div 
      className={`p-6 rounded-lg border ${className}`}
      style={{
        ...previewStyles,
        backgroundColor: theme.background,
        color: theme.text,
      }}
    >
      <div className="space-y-6">
        {/* Header Preview */}
        <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: theme.secondary + '30' }}>
          <div className="flex items-center space-x-3">
            {theme.logo && (
              <img
                src={theme.logo}
                alt="Logo Preview"
                className="h-8 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            )}
            <h1 className="text-xl font-bold" style={{ color: theme.text }}>
              {branding.company_name || 'SolarCRM Pro'}
            </h1>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              style={{
                backgroundColor: theme.primary,
                borderColor: theme.primary,
                color: '#ffffff',
              }}
            >
              Botão Primário
            </Button>
            <Button
              size="sm"
              variant="outline"
              style={{
                borderColor: theme.secondary,
                color: theme.secondary,
              }}
            >
              Botão Secundário
            </Button>
          </div>
        </div>

        {/* Content Preview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card Preview */}
          <Card className="p-4" style={{ backgroundColor: theme.background, borderColor: theme.secondary + '30' }}>
            <h3 className="text-lg font-semibold mb-3" style={{ color: theme.text }}>
              Cartão de Exemplo
            </h3>
            <p className="text-sm mb-4" style={{ color: theme.text + 'CC' }}>
              Este é um exemplo de como os cartões aparecerão com sua marca personalizada.
            </p>
            <div className="flex items-center justify-between">
              <Badge style={{ backgroundColor: theme.accent + '20', color: theme.accent }}>
                Status Ativo
              </Badge>
              <Button
                size="sm"
                style={{
                  backgroundColor: theme.accent,
                  borderColor: theme.accent,
                  color: '#ffffff',
                }}
              >
                Ação
              </Button>
            </div>
          </Card>

          {/* Form Preview */}
          <Card className="p-4" style={{ backgroundColor: theme.background, borderColor: theme.secondary + '30' }}>
            <h3 className="text-lg font-semibold mb-3" style={{ color: theme.text }}>
              Formulário de Exemplo
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: theme.text }}>
                  Campo de Texto
                </label>
                <Input
                  placeholder="Digite aqui..."
                  style={{
                    borderColor: theme.secondary + '50',
                    color: theme.text,
                  }}
                />
              </div>
              <Button
                className="w-full"
                style={{
                  backgroundColor: theme.primary,
                  borderColor: theme.primary,
                  color: '#ffffff',
                }}
              >
                Enviar Formulário
              </Button>
            </div>
          </Card>
        </div>

        {/* Navigation Preview */}
        <div className="flex items-center space-x-6 py-3 border-t" style={{ borderColor: theme.secondary + '30' }}>
          <a
            href="#"
            className="text-sm font-medium hover:underline"
            style={{ color: theme.primary }}
          >
            Dashboard
          </a>
          <a
            href="#"
            className="text-sm hover:underline"
            style={{ color: theme.text + 'CC' }}
          >
            Leads
          </a>
          <a
            href="#"
            className="text-sm hover:underline"
            style={{ color: theme.text + 'CC' }}
          >
            Contratos
          </a>
          <a
            href="#"
            className="text-sm hover:underline"
            style={{ color: theme.text + 'CC' }}
          >
            Relatórios
          </a>
        </div>

        {/* Stats Preview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Leads Ativos', value: '124', color: theme.primary },
            { label: 'Contratos', value: '45', color: theme.accent },
            { label: 'Receita', value: 'R$ 89.5k', color: theme.secondary },
            { label: 'Conversão', value: '12.5%', color: theme.primary },
          ].map((stat, index) => (
            <div
              key={index}
              className="p-3 rounded-lg text-center"
              style={{ backgroundColor: stat.color + '10' }}
            >
              <div className="text-lg font-bold" style={{ color: stat.color }}>
                {stat.value}
              </div>
              <div className="text-xs" style={{ color: theme.text + 'AA' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Preview */}
        {branding.footer_text && (
          <div className="text-center py-4 border-t" style={{ borderColor: theme.secondary + '30' }}>
            <p className="text-xs" style={{ color: theme.text + '80' }}>
              {branding.footer_text}
            </p>
          </div>
        )}
      </div>

      {/* CSS Variables Display */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-semibold mb-2 text-gray-700">Variáveis CSS Geradas:</h4>
        <div className="grid grid-cols-2 gap-2 text-xs font-mono text-gray-600">
          {Object.entries(cssVariables).map(([property, value]) => (
            <div key={property} className="flex justify-between">
              <span>{property}:</span>
              <span>{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BrandingPreview;