/**
 * Tenant Branding Service
 * 
 * Handles tenant-specific branding application, theme management, and custom CSS injection.
 * Supports dynamic theme switching, custom domain handling, and white-label configurations.
 * 
 * Requirements: 1.3 - Tenant branding and customization system
 */

import { TenantBranding } from '@/lib/types/tenant';

export interface BrandingTheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  logo?: string;
  favicon?: string;
}

export interface CustomCSSVariables {
  '--color-primary': string;
  '--color-secondary': string;
  '--color-accent': string;
  '--color-background': string;
  '--color-text': string;
  '--color-primary-hover': string;
  '--color-secondary-hover': string;
  '--color-accent-hover': string;
}

/**
 * Branding Service Class
 * Manages tenant branding application and theme customization
 */
export class BrandingService {
  private static instance: BrandingService;
  private currentBranding: TenantBranding | null = null;
  private styleElement: HTMLStyleElement | null = null;

  private constructor() {}

  public static getInstance(): BrandingService {
    if (!BrandingService.instance) {
      BrandingService.instance = new BrandingService();
    }
    return BrandingService.instance;
  }

  /**
   * Apply tenant branding to the current page
   */
  public applyBranding(branding: TenantBranding): void {
    this.currentBranding = branding;
    
    // Apply CSS variables
    this.applyCSSVariables(branding);
    
    // Apply custom CSS
    if (branding.custom_css) {
      this.applyCustomCSS(branding.custom_css);
    }
    
    // Update favicon
    if (branding.favicon_url) {
      this.updateFavicon(branding.favicon_url);
    }
    
    // Update document title if company name is provided
    if (branding.company_name) {
      this.updateDocumentTitle(branding.company_name);
    }
  }

  /**
   * Generate CSS variables from branding configuration
   */
  public generateCSSVariables(branding: TenantBranding): CustomCSSVariables {
    return {
      '--color-primary': branding.primary_color || '#2563eb',
      '--color-secondary': branding.secondary_color || '#64748b',
      '--color-accent': branding.accent_color || '#10b981',
      '--color-background': branding.background_color || '#ffffff',
      '--color-text': branding.text_color || '#1f2937',
      '--color-primary-hover': this.darkenColor(branding.primary_color || '#2563eb', 10),
      '--color-secondary-hover': this.darkenColor(branding.secondary_color || '#64748b', 10),
      '--color-accent-hover': this.darkenColor(branding.accent_color || '#10b981', 10),
    };
  }

  /**
   * Apply CSS variables to document root
   */
  private applyCSSVariables(branding: TenantBranding): void {
    const variables = this.generateCSSVariables(branding);
    const root = document.documentElement;
    
    Object.entries(variables).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });
  }

  /**
   * Apply custom CSS to the document
   */
  private applyCustomCSS(customCSS: string): void {
    // Remove existing custom styles
    if (this.styleElement) {
      this.styleElement.remove();
    }

    // Create new style element
    this.styleElement = document.createElement('style');
    this.styleElement.setAttribute('data-tenant-custom-css', 'true');
    this.styleElement.textContent = this.sanitizeCSS(customCSS);
    
    // Append to head
    document.head.appendChild(this.styleElement);
  }

  /**
   * Update favicon
   */
  private updateFavicon(faviconUrl: string): void {
    // Remove existing favicon
    const existingFavicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    if (existingFavicon) {
      existingFavicon.remove();
    }

    // Add new favicon
    const favicon = document.createElement('link');
    favicon.rel = 'icon';
    favicon.type = 'image/x-icon';
    favicon.href = faviconUrl;
    document.head.appendChild(favicon);
  }

  /**
   * Update document title with company name
   */
  private updateDocumentTitle(companyName: string): void {
    const currentTitle = document.title;
    const separator = ' | ';
    
    // Check if company name is already in title
    if (!currentTitle.includes(companyName)) {
      document.title = `${currentTitle}${separator}${companyName}`;
    }
  }

  /**
   * Generate theme object from branding
   */
  public generateTheme(branding: TenantBranding): BrandingTheme {
    return {
      primary: branding.primary_color || '#2563eb',
      secondary: branding.secondary_color || '#64748b',
      accent: branding.accent_color || '#10b981',
      background: branding.background_color || '#ffffff',
      text: branding.text_color || '#1f2937',
      logo: branding.logo_url || undefined,
      favicon: branding.favicon_url || undefined,
    };
  }

  /**
   * Generate Tailwind CSS configuration from branding
   */
  public generateTailwindConfig(branding: TenantBranding): Record<string, any> {
    return {
      theme: {
        extend: {
          colors: {
            primary: {
              50: this.lightenColor(branding.primary_color || '#2563eb', 40),
              100: this.lightenColor(branding.primary_color || '#2563eb', 30),
              200: this.lightenColor(branding.primary_color || '#2563eb', 20),
              300: this.lightenColor(branding.primary_color || '#2563eb', 10),
              400: this.lightenColor(branding.primary_color || '#2563eb', 5),
              500: branding.primary_color || '#2563eb',
              600: this.darkenColor(branding.primary_color || '#2563eb', 5),
              700: this.darkenColor(branding.primary_color || '#2563eb', 10),
              800: this.darkenColor(branding.primary_color || '#2563eb', 20),
              900: this.darkenColor(branding.primary_color || '#2563eb', 30),
            },
            secondary: {
              50: this.lightenColor(branding.secondary_color || '#64748b', 40),
              100: this.lightenColor(branding.secondary_color || '#64748b', 30),
              200: this.lightenColor(branding.secondary_color || '#64748b', 20),
              300: this.lightenColor(branding.secondary_color || '#64748b', 10),
              400: this.lightenColor(branding.secondary_color || '#64748b', 5),
              500: branding.secondary_color || '#64748b',
              600: this.darkenColor(branding.secondary_color || '#64748b', 5),
              700: this.darkenColor(branding.secondary_color || '#64748b', 10),
              800: this.darkenColor(branding.secondary_color || '#64748b', 20),
              900: this.darkenColor(branding.secondary_color || '#64748b', 30),
            },
            accent: {
              50: this.lightenColor(branding.accent_color || '#10b981', 40),
              100: this.lightenColor(branding.accent_color || '#10b981', 30),
              200: this.lightenColor(branding.accent_color || '#10b981', 20),
              300: this.lightenColor(branding.accent_color || '#10b981', 10),
              400: this.lightenColor(branding.accent_color || '#10b981', 5),
              500: branding.accent_color || '#10b981',
              600: this.darkenColor(branding.accent_color || '#10b981', 5),
              700: this.darkenColor(branding.accent_color || '#10b981', 10),
              800: this.darkenColor(branding.accent_color || '#10b981', 20),
              900: this.darkenColor(branding.accent_color || '#10b981', 30),
            },
          },
        },
      },
    };
  }

  /**
   * Validate custom CSS for security
   */
  private sanitizeCSS(css: string): string {
    // Remove potentially dangerous CSS
    const dangerousPatterns = [
      /javascript:/gi,
      /expression\s*\(/gi,
      /behavior\s*:/gi,
      /binding\s*:/gi,
      /@import/gi,
      /url\s*\(\s*["']?javascript:/gi,
    ];

    let sanitized = css;
    dangerousPatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '');
    });

    return sanitized;
  }

  /**
   * Lighten a hex color by a percentage
   */
  private lightenColor(hex: string, percent: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255))
      .toString(16)
      .slice(1);
  }

  /**
   * Darken a hex color by a percentage
   */
  private darkenColor(hex: string, percent: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) - amt;
    const G = (num >> 8 & 0x00FF) - amt;
    const B = (num & 0x0000FF) - amt;
    
    return '#' + (0x1000000 + (R > 255 ? 255 : R < 0 ? 0 : R) * 0x10000 +
      (G > 255 ? 255 : G < 0 ? 0 : G) * 0x100 +
      (B > 255 ? 255 : B < 0 ? 0 : B))
      .toString(16)
      .slice(1);
  }

  /**
   * Remove all applied branding
   */
  public removeBranding(): void {
    // Remove CSS variables
    const root = document.documentElement;
    const variables = this.generateCSSVariables(this.currentBranding || {});
    Object.keys(variables).forEach(property => {
      root.style.removeProperty(property);
    });

    // Remove custom CSS
    if (this.styleElement) {
      this.styleElement.remove();
      this.styleElement = null;
    }

    this.currentBranding = null;
  }

  /**
   * Get current applied branding
   */
  public getCurrentBranding(): TenantBranding | null {
    return this.currentBranding;
  }

  /**
   * Check if branding is currently applied
   */
  public isBrandingApplied(): boolean {
    return this.currentBranding !== null;
  }
}

// Export singleton instance
export const brandingService = BrandingService.getInstance();

// Utility functions for server-side rendering
export const generateServerSideCSS = (branding: TenantBranding): string => {
  const service = new BrandingService();
  const variables = service.generateCSSVariables(branding);
  
  const cssVariables = Object.entries(variables)
    .map(([property, value]) => `${property}: ${value};`)
    .join('\n  ');

  return `:root {\n  ${cssVariables}\n}${branding.custom_css ? '\n\n' + branding.custom_css : ''}`;
};

export const generateMetaTags = (branding: TenantBranding): Array<{ name?: string; property?: string; content: string; rel?: string; href?: string }> => {
  const tags: Array<{ name?: string; property?: string; content: string; rel?: string; href?: string }> = [];

  if (branding.company_name) {
    tags.push({ property: 'og:site_name', content: branding.company_name });
  }

  if (branding.primary_color) {
    tags.push({ name: 'theme-color', content: branding.primary_color });
    tags.push({ name: 'msapplication-TileColor', content: branding.primary_color });
  }

  if (branding.favicon_url) {
    tags.push({ rel: 'icon', href: branding.favicon_url, content: '' });
    tags.push({ rel: 'apple-touch-icon', href: branding.favicon_url, content: '' });
  }

  return tags;
};