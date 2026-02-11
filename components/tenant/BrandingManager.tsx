/**
 * Branding Manager Component
 * 
 * Provides a comprehensive interface for tenant administrators to manage branding and customization.
 * Includes color picker, logo upload, custom CSS editor, and real-time preview.
 * 
 * Requirements: 1.3 - Tenant branding and customization system
 */

'use client';

import React, { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useBranding } from '@/lib/hooks/use-branding';
import { TenantBranding } from '@/lib/types/tenant';

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  description?: string;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ label, value, onChange, description }) => (
  <div className="space-y-2">
    <Label htmlFor={label.toLowerCase().replace(' ', '-')}>{label}</Label>
    <div className="flex items-center space-x-3">
      <input
        type="color"
        id={label.toLowerCase().replace(' ', '-')}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-12 h-12 rounded border border-gray-300 cursor-pointer"
      />
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="#000000"
        className="flex-1"
        pattern="^#[0-9A-Fa-f]{6}$"
      />
    </div>
    {description && <p className="text-sm text-gray-500">{description}</p>}
  </div>
);

interface BrandingManagerProps {
  onSave?: (branding: TenantBranding) => void;
  onCancel?: () => void;
}

export const BrandingManager: React.FC<BrandingManagerProps> = ({ onSave, onCancel }) => {
  const { branding, updateBranding, isLoading, error } = useBranding();
  
  const [formData, setFormData] = useState<TenantBranding>({
    logo_url: branding?.logo_url || '',
    favicon_url: branding?.favicon_url || '',
    primary_color: branding?.primary_color || '#2563eb',
    secondary_color: branding?.secondary_color || '#64748b',
    accent_color: branding?.accent_color || '#10b981',
    background_color: branding?.background_color || '#ffffff',
    text_color: branding?.text_color || '#1f2937',
    custom_css: branding?.custom_css || '',
    white_label: branding?.white_label || false,
    custom_domain: branding?.custom_domain || '',
    company_name: branding?.company_name || '',
    email_signature: branding?.email_signature || '',
    footer_text: branding?.footer_text || '',
  });

  const [previewMode, setPreviewMode] = useState(false);

  const handleInputChange = useCallback((field: keyof TenantBranding, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSave = useCallback(async () => {
    try {
      await updateBranding(formData);
      onSave?.(formData);
    } catch (err) {
      console.error('Failed to save branding:', err);
    }
  }, [formData, updateBranding, onSave]);

  const handlePreview = useCallback(() => {
    setPreviewMode(!previewMode);
    // Apply preview branding temporarily
    // This would be implemented with a preview service
  }, [previewMode]);

  const handleReset = useCallback(() => {
    setFormData({
      logo_url: branding?.logo_url || '',
      favicon_url: branding?.favicon_url || '',
      primary_color: branding?.primary_color || '#2563eb',
      secondary_color: branding?.secondary_color || '#64748b',
      accent_color: branding?.accent_color || '#10b981',
      background_color: branding?.background_color || '#ffffff',
      text_color: branding?.text_color || '#1f2937',
      custom_css: branding?.custom_css || '',
      white_label: branding?.white_label || false,
      custom_domain: branding?.custom_domain || '',
      company_name: branding?.company_name || '',
      email_signature: branding?.email_signature || '',
      footer_text: branding?.footer_text || '',
    });
  }, [branding]);

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Company Information */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Informações da Empresa</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="company-name">Nome da Empresa</Label>
            <Input
              id="company-name"
              type="text"
              value={formData.company_name}
              onChange={(e) => handleInputChange('company_name', e.target.value)}
              placeholder="Nome da sua empresa"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="custom-domain">Domínio Personalizado</Label>
            <Input
              id="custom-domain"
              type="text"
              value={formData.custom_domain}
              onChange={(e) => handleInputChange('custom_domain', e.target.value)}
              placeholder="seudominio.com"
            />
          </div>
        </div>
      </Card>

      {/* Logo and Assets */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Logo e Recursos Visuais</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="logo-url">URL do Logo</Label>
            <Input
              id="logo-url"
              type="url"
              value={formData.logo_url}
              onChange={(e) => handleInputChange('logo_url', e.target.value)}
              placeholder="https://exemplo.com/logo.png"
            />
            {formData.logo_url && (
              <div className="mt-2">
                <img
                  src={formData.logo_url}
                  alt="Logo Preview"
                  className="max-h-16 object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="favicon-url">URL do Favicon</Label>
            <Input
              id="favicon-url"
              type="url"
              value={formData.favicon_url}
              onChange={(e) => handleInputChange('favicon_url', e.target.value)}
              placeholder="https://exemplo.com/favicon.ico"
            />
          </div>
        </div>
      </Card>

      {/* Color Scheme */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Esquema de Cores</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ColorPicker
            label="Cor Primária"
            value={formData.primary_color}
            onChange={(value) => handleInputChange('primary_color', value)}
            description="Cor principal da marca (botões, links)"
          />
          <ColorPicker
            label="Cor Secundária"
            value={formData.secondary_color}
            onChange={(value) => handleInputChange('secondary_color', value)}
            description="Cor secundária (elementos de apoio)"
          />
          <ColorPicker
            label="Cor de Destaque"
            value={formData.accent_color}
            onChange={(value) => handleInputChange('accent_color', value)}
            description="Cor para destacar elementos importantes"
          />
          <ColorPicker
            label="Cor de Fundo"
            value={formData.background_color}
            onChange={(value) => handleInputChange('background_color', value)}
            description="Cor de fundo principal"
          />
          <ColorPicker
            label="Cor do Texto"
            value={formData.text_color}
            onChange={(value) => handleInputChange('text_color', value)}
            description="Cor principal do texto"
          />
        </div>
      </Card>

      {/* Custom CSS */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">CSS Personalizado</h3>
        <div className="space-y-2">
          <Label htmlFor="custom-css">CSS Personalizado</Label>
          <textarea
            id="custom-css"
            value={formData.custom_css}
            onChange={(e) => handleInputChange('custom_css', e.target.value)}
            placeholder="/* Adicione seu CSS personalizado aqui */&#10;.custom-class {&#10;  /* suas regras CSS */&#10;}"
            className="w-full h-40 p-3 border border-gray-300 rounded-md font-mono text-sm"
          />
          <p className="text-sm text-gray-500">
            Adicione CSS personalizado para customizar ainda mais a aparência da plataforma.
          </p>
        </div>
      </Card>

      {/* Email and Footer */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Assinatura e Rodapé</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email-signature">Assinatura de Email</Label>
            <textarea
              id="email-signature"
              value={formData.email_signature}
              onChange={(e) => handleInputChange('email_signature', e.target.value)}
              placeholder="Sua assinatura de email personalizada"
              className="w-full h-24 p-3 border border-gray-300 rounded-md"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="footer-text">Texto do Rodapé</Label>
            <Input
              id="footer-text"
              type="text"
              value={formData.footer_text}
              onChange={(e) => handleInputChange('footer_text', e.target.value)}
              placeholder="© 2024 Sua Empresa. Todos os direitos reservados."
            />
          </div>
        </div>
      </Card>

      {/* White Label Option */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Opções Avançadas</h3>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="white-label"
            checked={formData.white_label}
            onChange={(e) => handleInputChange('white_label', e.target.checked)}
            className="rounded border-gray-300"
          />
          <Label htmlFor="white-label">Ativar White Label</Label>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Remove todas as referências à marca SolarCRM Pro da interface.
        </p>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <div className="space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={handlePreview}
          >
            {previewMode ? 'Sair da Visualização' : 'Visualizar'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
          >
            Resetar
          </Button>
        </div>
        <div className="space-x-2">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
            >
              Cancelar
            </Button>
          )}
          <Button
            type="button"
            onClick={handleSave}
            disabled={isLoading}
          >
            {isLoading ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BrandingManager;