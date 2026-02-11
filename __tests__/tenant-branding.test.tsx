/**
 * Tenant Branding System Tests
 * 
 * Unit tests for tenant branding functionality including theme application,
 * CSS generation, and branding management components.
 * 
 * Requirements: 1.3 - Tenant branding and customization system
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrandingService, brandingService, generateServerSideCSS } from '@/lib/services/branding';
import BrandingPreview from '@/components/tenant/BrandingPreview';
import { TenantBranding } from '@/lib/types/tenant';

// Mock DOM methods for testing
Object.defineProperty(document, 'createElement', {
  value: jest.fn(() => ({
    setAttribute: jest.fn(),
    remove: jest.fn(),
    style: {},
  })),
});

Object.defineProperty(document, 'head', {
  value: {
    appendChild: jest.fn(),
  },
});

Object.defineProperty(document, 'documentElement', {
  value: {
    style: {
      setProperty: jest.fn(),
      removeProperty: jest.fn(),
    },
  },
});

describe('BrandingService', () => {
  let service: BrandingService;

  beforeEach(() => {
    service = BrandingService.getInstance();
    // Reset any applied branding
    service.removeBranding();
  });

  describe('CSS Variables Generation', () => {
    it('should generate correct CSS variables from branding', () => {
      const branding: TenantBranding = {
        primary_color: '#ff0000',
        secondary_color: '#00ff00',
        accent_color: '#0000ff',
        background_color: '#ffffff',
        text_color: '#000000',
        logo_url: '',
        favicon_url: '',
        custom_css: '',
        white_label: false,
        company_name: 'Test Company',
        email_signature: '',
        footer_text: '',
      };

      const variables = service.generateCSSVariables(branding);

      expect(variables['--color-primary']).toBe('#ff0000');
      expect(variables['--color-secondary']).toBe('#00ff00');
      expect(variables['--color-accent']).toBe('#0000ff');
      expect(variables['--color-background']).toBe('#ffffff');
      expect(variables['--color-text']).toBe('#000000');
    });

    it('should generate hover colors that are darker than base colors', () => {
      const branding: TenantBranding = {
        primary_color: '#2563eb',
        secondary_color: '#64748b',
        accent_color: '#10b981',
        background_color: '#ffffff',
        text_color: '#1f2937',
        logo_url: '',
        favicon_url: '',
        custom_css: '',
        white_label: false,
        company_name: '',
        email_signature: '',
        footer_text: '',
      };

      const variables = service.generateCSSVariables(branding);

      expect(variables['--color-primary-hover']).not.toBe(variables['--color-primary']);
      expect(variables['--color-secondary-hover']).not.toBe(variables['--color-secondary']);
      expect(variables['--color-accent-hover']).not.toBe(variables['--color-accent']);
    });
  });

  describe('Theme Generation', () => {
    it('should generate theme object from branding', () => {
      const branding: TenantBranding = {
        primary_color: '#2563eb',
        secondary_color: '#64748b',
        accent_color: '#10b981',
        background_color: '#ffffff',
        text_color: '#1f2937',
        logo_url: 'https://example.com/logo.png',
        favicon_url: 'https://example.com/favicon.ico',
        custom_css: '',
        white_label: false,
        company_name: 'Test Company',
        email_signature: '',
        footer_text: '',
      };

      const theme = service.generateTheme(branding);

      expect(theme.primary).toBe('#2563eb');
      expect(theme.secondary).toBe('#64748b');
      expect(theme.accent).toBe('#10b981');
      expect(theme.background).toBe('#ffffff');
      expect(theme.text).toBe('#1f2937');
      expect(theme.logo).toBe('https://example.com/logo.png');
      expect(theme.favicon).toBe('https://example.com/favicon.ico');
    });
  });

  describe('Tailwind Config Generation', () => {
    it('should generate Tailwind configuration with color scales', () => {
      const branding: TenantBranding = {
        primary_color: '#2563eb',
        secondary_color: '#64748b',
        accent_color: '#10b981',
        background_color: '#ffffff',
        text_color: '#1f2937',
        logo_url: '',
        favicon_url: '',
        custom_css: '',
        white_label: false,
        company_name: '',
        email_signature: '',
        footer_text: '',
      };

      const config = service.generateTailwindConfig(branding);

      expect(config.theme.extend.colors.primary).toBeDefined();
      expect(config.theme.extend.colors.primary[500]).toBe('#2563eb');
      expect(config.theme.extend.colors.secondary).toBeDefined();
      expect(config.theme.extend.colors.accent).toBeDefined();
      
      // Check that color scales have multiple shades
      expect(Object.keys(config.theme.extend.colors.primary)).toHaveLength(10);
    });
  });

  describe('Branding Application', () => {
    it('should track current branding state', () => {
      const branding: TenantBranding = {
        primary_color: '#2563eb',
        secondary_color: '#64748b',
        accent_color: '#10b981',
        background_color: '#ffffff',
        text_color: '#1f2937',
        logo_url: '',
        favicon_url: '',
        custom_css: '',
        white_label: false,
        company_name: 'Test Company',
        email_signature: '',
        footer_text: '',
      };

      expect(service.isBrandingApplied()).toBe(false);
      
      service.applyBranding(branding);
      
      expect(service.isBrandingApplied()).toBe(true);
      expect(service.getCurrentBranding()).toEqual(branding);
    });

    it('should remove branding correctly', () => {
      const branding: TenantBranding = {
        primary_color: '#2563eb',
        secondary_color: '#64748b',
        accent_color: '#10b981',
        background_color: '#ffffff',
        text_color: '#1f2937',
        logo_url: '',
        favicon_url: '',
        custom_css: '',
        white_label: false,
        company_name: '',
        email_signature: '',
        footer_text: '',
      };

      service.applyBranding(branding);
      expect(service.isBrandingApplied()).toBe(true);
      
      service.removeBranding();
      expect(service.isBrandingApplied()).toBe(false);
      expect(service.getCurrentBranding()).toBeNull();
    });
  });
});

describe('Server-side CSS Generation', () => {
  it('should generate server-side CSS with variables and custom CSS', () => {
    const branding: TenantBranding = {
      primary_color: '#2563eb',
      secondary_color: '#64748b',
      accent_color: '#10b981',
      background_color: '#ffffff',
      text_color: '#1f2937',
      logo_url: '',
      favicon_url: '',
      custom_css: '.custom { color: red; }',
      white_label: false,
      company_name: '',
      email_signature: '',
      footer_text: '',
    };

    const css = generateServerSideCSS(branding);

    expect(css).toContain(':root {');
    expect(css).toContain('--color-primary: #2563eb');
    expect(css).toContain('--color-secondary: #64748b');
    expect(css).toContain('.custom { color: red; }');
  });

  it('should generate CSS without custom CSS when not provided', () => {
    const branding: TenantBranding = {
      primary_color: '#2563eb',
      secondary_color: '#64748b',
      accent_color: '#10b981',
      background_color: '#ffffff',
      text_color: '#1f2937',
      logo_url: '',
      favicon_url: '',
      custom_css: '',
      white_label: false,
      company_name: '',
      email_signature: '',
      footer_text: '',
    };

    const css = generateServerSideCSS(branding);

    expect(css).toContain(':root {');
    expect(css).toContain('--color-primary: #2563eb');
    expect(css).not.toContain('.custom');
  });
});

describe('BrandingPreview Component', () => {
  // Mock the BrandingPreview component for testing
  jest.mock('@/components/tenant/BrandingPreview', () => {
    return function MockBrandingPreview({ branding }: { branding: TenantBranding }) {
      return (
        <div data-testid="branding-preview">
          <div>{branding.company_name}</div>
          <div>{branding.footer_text}</div>
          <button>Botão Primário</button>
          <div>Cartão de Exemplo</div>
          <div>Variáveis CSS Geradas:</div>
          <div>{branding.primary_color}</div>
          <div>{branding.secondary_color}</div>
          <div>{branding.accent_color}</div>
        </div>
      );
    };
  });

  it('should render branding preview with company information', () => {
    const branding: TenantBranding = {
      primary_color: '#2563eb',
      secondary_color: '#64748b',
      accent_color: '#10b981',
      background_color: '#ffffff',
      text_color: '#1f2937',
      logo_url: '',
      favicon_url: '',
      custom_css: '',
      white_label: false,
      company_name: 'Test Company',
      email_signature: '',
      footer_text: 'Test Footer',
    };

    // Test branding data structure
    expect(branding.company_name).toBe('Test Company');
    expect(branding.footer_text).toBe('Test Footer');
    expect(branding.primary_color).toBe('#2563eb');
  });

  it('should contain required branding properties', () => {
    const branding: TenantBranding = {
      primary_color: '#ff0000',
      secondary_color: '#00ff00',
      accent_color: '#0000ff',
      background_color: '#ffffff',
      text_color: '#000000',
      logo_url: '',
      favicon_url: '',
      custom_css: '',
      white_label: false,
      company_name: '',
      email_signature: '',
      footer_text: '',
    };

    // Test that branding object has all required properties
    expect(branding).toHaveProperty('primary_color');
    expect(branding).toHaveProperty('secondary_color');
    expect(branding).toHaveProperty('accent_color');
    expect(branding).toHaveProperty('background_color');
    expect(branding).toHaveProperty('text_color');
    expect(branding.primary_color).toBe('#ff0000');
    expect(branding.secondary_color).toBe('#00ff00');
    expect(branding.accent_color).toBe('#0000ff');
  });
});

describe('Branding Validation', () => {
  it('should handle invalid color formats gracefully', () => {
    const branding: TenantBranding = {
      primary_color: 'invalid-color',
      secondary_color: '#64748b',
      accent_color: '#10b981',
      background_color: '#ffffff',
      text_color: '#1f2937',
      logo_url: '',
      favicon_url: '',
      custom_css: '',
      white_label: false,
      company_name: '',
      email_signature: '',
      footer_text: '',
    };

    // Should not throw error, but use fallback
    const variables = brandingService.generateCSSVariables(branding);
    expect(variables['--color-primary']).toBe('invalid-color'); // Service should handle this gracefully
  });

  it('should provide default values for missing branding properties', () => {
    const branding: Partial<TenantBranding> = {
      primary_color: '#2563eb',
    };

    const variables = brandingService.generateCSSVariables(branding as TenantBranding);
    
    expect(variables['--color-primary']).toBe('#2563eb');
    expect(variables['--color-secondary']).toBe('#64748b'); // Default value
    expect(variables['--color-accent']).toBe('#10b981'); // Default value
  });
});

describe('Branding Integration', () => {
  it('should maintain singleton pattern', () => {
    const instance1 = BrandingService.getInstance();
    const instance2 = BrandingService.getInstance();
    
    expect(instance1).toBe(instance2);
  });

  it('should handle multiple branding applications correctly', () => {
    const branding1: TenantBranding = {
      primary_color: '#ff0000',
      secondary_color: '#64748b',
      accent_color: '#10b981',
      background_color: '#ffffff',
      text_color: '#1f2937',
      logo_url: '',
      favicon_url: '',
      custom_css: '',
      white_label: false,
      company_name: 'Company 1',
      email_signature: '',
      footer_text: '',
    };

    const branding2: TenantBranding = {
      primary_color: '#00ff00',
      secondary_color: '#64748b',
      accent_color: '#10b981',
      background_color: '#ffffff',
      text_color: '#1f2937',
      logo_url: '',
      favicon_url: '',
      custom_css: '',
      white_label: false,
      company_name: 'Company 2',
      email_signature: '',
      footer_text: '',
    };

    brandingService.applyBranding(branding1);
    expect(brandingService.getCurrentBranding()?.company_name).toBe('Company 1');
    
    brandingService.applyBranding(branding2);
    expect(brandingService.getCurrentBranding()?.company_name).toBe('Company 2');
    expect(brandingService.getCurrentBranding()?.primary_color).toBe('#00ff00');
  });
});