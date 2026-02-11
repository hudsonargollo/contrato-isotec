/**
 * Tenant Branding Settings Page
 * 
 * Administrative interface for managing tenant branding and customization.
 * Provides comprehensive branding management with real-time preview.
 * 
 * Requirements: 1.3 - Tenant branding and customization system
 */

import React from 'react';
import { Metadata } from 'next';
import BrandingManager from '@/components/tenant/BrandingManager';
import BrandingPreview from '@/components/tenant/BrandingPreview';
import { Card } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Configurações de Marca | SolarCRM Pro',
  description: 'Gerencie a identidade visual e personalização da sua empresa',
};

export default function BrandingSettingsPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Configurações de Marca</h1>
        <p className="text-muted-foreground">
          Personalize a aparência da plataforma com as cores, logo e estilo da sua empresa.
        </p>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Branding Manager */}
        <div className="xl:col-span-2">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6">Personalização da Marca</h2>
            <BrandingManager />
          </Card>
        </div>

        {/* Preview Panel */}
        <div className="xl:col-span-1">
          <Card className="p-6 sticky top-6">
            <h2 className="text-xl font-semibold mb-6">Visualização</h2>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Veja como suas alterações aparecerão na plataforma em tempo real.
              </p>
              {/* Preview will be populated by the BrandingManager component */}
              <div id="branding-preview-container" className="min-h-[400px] border rounded-lg p-4">
                <div className="text-center text-muted-foreground py-8">
                  A visualização aparecerá aqui conforme você faz alterações
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Help Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Dicas de Personalização</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-2">
            <h3 className="font-medium">Cores da Marca</h3>
            <p className="text-sm text-muted-foreground">
              Use as cores oficiais da sua empresa para manter consistência visual. 
              A cor primária será usada em botões e links importantes.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-medium">Logo e Favicon</h3>
            <p className="text-sm text-muted-foreground">
              Recomendamos logos em formato PNG ou SVG com fundo transparente. 
              O favicon deve ser um arquivo ICO de 32x32 pixels.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-medium">CSS Personalizado</h3>
            <p className="text-sm text-muted-foreground">
              Use CSS personalizado para ajustes finos na aparência. 
              Evite modificar elementos estruturais da plataforma.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}