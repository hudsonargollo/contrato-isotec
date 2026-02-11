/**
 * Branding Test Page
 * 
 * Test page for verifying tenant branding functionality.
 * Demonstrates branding application, theme switching, and custom CSS injection.
 * 
 * Requirements: 1.3 - Tenant branding and customization system
 */

'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import BrandingPreview from '@/components/tenant/BrandingPreview';
import { TenantBranding } from '@/lib/types/tenant';
import { brandingService } from '@/lib/services/branding';

const sampleBrandings: Record<string, TenantBranding> = {
  default: {
    logo_url: '',
    favicon_url: '',
    primary_color: '#2563eb',
    secondary_color: '#64748b',
    accent_color: '#10b981',
    background_color: '#ffffff',
    text_color: '#1f2937',
    custom_css: '',
    white_label: false,
    company_name: 'SolarCRM Pro',
    email_signature: '',
    footer_text: '© 2024 SolarCRM Pro. Todos os direitos reservados.',
  },
  isotec: {
    logo_url: '/isotec-logo.webp',
    favicon_url: '',
    primary_color: '#f59e0b',
    secondary_color: '#6b7280',
    accent_color: '#059669',
    background_color: '#fefefe',
    text_color: '#111827',
    custom_css: '.custom-isotec { border-left: 4px solid #f59e0b; }',
    white_label: true,
    company_name: 'ISOTEC Solar',
    email_signature: 'ISOTEC - Energia Solar Sustentável',
    footer_text: '© 2024 ISOTEC. Energia limpa para um futuro sustentável.',
  },
  green: {
    logo_url: '',
    favicon_url: '',
    primary_color: '#16a34a',
    secondary_color: '#4b5563',
    accent_color: '#0ea5e9',
    background_color: '#f8fafc',
    text_color: '#0f172a',
    custom_css: '.green-theme { background: linear-gradient(135deg, #16a34a, #059669); }',
    white_label: false,
    company_name: 'Green Energy Co',
    email_signature: 'Green Energy - Soluções Sustentáveis',
    footer_text: '© 2024 Green Energy Co. Energia verde para todos.',
  },
};

export default function BrandingTestPage() {
  const [currentBranding, setCurrentBranding] = useState<TenantBranding>(sampleBrandings.default);
  const [customColor, setCustomColor] = useState('#2563eb');

  const applyBranding = (brandingKey: string) => {
    const branding = sampleBrandings[brandingKey];
    setCurrentBranding(branding);
    brandingService.applyBranding(branding);
  };

  const applyCustomColor = () => {
    const customBranding = {
      ...currentBranding,
      primary_color: customColor,
    };
    setCurrentBranding(customBranding);
    brandingService.applyBranding(customBranding);
  };

  const removeBranding = () => {
    brandingService.removeBranding();
    setCurrentBranding(sampleBrandings.default);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Teste de Branding</h1>
        <p className="text-muted-foreground">
          Teste a funcionalidade de branding e personalização de tenant.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Controls */}
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Controles de Branding</h2>
            
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">Temas Predefinidos</Label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => applyBranding('default')}
                  >
                    Padrão
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => applyBranding('isotec')}
                  >
                    ISOTEC
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => applyBranding('green')}
                  >
                    Green Energy
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="custom-color" className="text-sm font-medium mb-2 block">
                  Cor Personalizada
                </Label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    id="custom-color"
                    value={customColor}
                    onChange={(e) => setCustomColor(e.target.value)}
                    className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={customColor}
                    onChange={(e) => setCustomColor(e.target.value)}
                    className="flex-1"
                  />
                  <Button size="sm" onClick={applyCustomColor}>
                    Aplicar
                  </Button>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={removeBranding}
                  className="text-red-600 border-red-600 hover:bg-red-50"
                >
                  Remover Branding
                </Button>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Informações Atuais</h2>
            <div className="space-y-2 text-sm">
              <div>
                <strong>Empresa:</strong> {currentBranding.company_name || 'N/A'}
              </div>
              <div>
                <strong>Cor Primária:</strong> 
                <span 
                  className="inline-block w-4 h-4 rounded ml-2 border"
                  style={{ backgroundColor: currentBranding.primary_color }}
                />
                {currentBranding.primary_color}
              </div>
              <div>
                <strong>White Label:</strong> {currentBranding.white_label ? 'Sim' : 'Não'}
              </div>
              <div>
                <strong>CSS Personalizado:</strong> {currentBranding.custom_css ? 'Sim' : 'Não'}
              </div>
            </div>
          </Card>
        </div>

        {/* Preview */}
        <div>
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Visualização</h2>
            <BrandingPreview branding={currentBranding} />
          </Card>
        </div>
      </div>

      {/* Sample Components */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Componentes de Exemplo</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Button className="w-full">Botão Primário</Button>
            <Button variant="outline" className="w-full">Botão Outline</Button>
            <Button variant="secondary" className="w-full">Botão Secundário</Button>
          </div>
          
          <div className="space-y-2">
            <Input placeholder="Campo de texto" />
            <Input type="email" placeholder="Email" />
            <Input type="password" placeholder="Senha" />
          </div>
          
          <div className="space-y-2">
            <div className="p-3 bg-primary/10 rounded text-primary text-sm">
              Mensagem de sucesso
            </div>
            <div className="p-3 bg-secondary/10 rounded text-secondary text-sm">
              Mensagem informativa
            </div>
            <div className="p-3 bg-accent/10 rounded text-accent text-sm">
              Mensagem de destaque
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}