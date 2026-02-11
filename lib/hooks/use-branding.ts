/**
 * Branding Hook
 * 
 * React hook for managing tenant branding in components.
 * Provides access to current branding, theme application, and branding updates.
 * 
 * Requirements: 1.3 - Tenant branding and customization system
 */

import { useEffect, useState, useCallback } from 'react';
import { TenantBranding } from '@/lib/types/tenant';
import { brandingService, BrandingTheme } from '@/lib/services/branding';
import { useTenant } from '@/lib/contexts/tenant-context';

export interface UseBrandingReturn {
  branding: TenantBranding | null;
  theme: BrandingTheme | null;
  isLoading: boolean;
  error: string | null;
  applyBranding: (branding: TenantBranding) => void;
  removeBranding: () => void;
  updateBranding: (updates: Partial<TenantBranding>) => Promise<void>;
  generateCSS: () => string;
  isBrandingApplied: boolean;
}

/**
 * Hook for managing tenant branding
 */
export const useBranding = (): UseBrandingReturn => {
  const { tenant, updateTenant } = useTenant();
  const [branding, setBranding] = useState<TenantBranding | null>(null);
  const [theme, setTheme] = useState<BrandingTheme | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize branding from tenant context
  useEffect(() => {
    if (tenant?.branding) {
      setBranding(tenant.branding);
      setTheme(brandingService.generateTheme(tenant.branding));
      
      // Apply branding on client side
      if (typeof window !== 'undefined') {
        brandingService.applyBranding(tenant.branding);
      }
    }
  }, [tenant]);

  /**
   * Apply branding to the current page
   */
  const applyBranding = useCallback((newBranding: TenantBranding) => {
    try {
      setBranding(newBranding);
      setTheme(brandingService.generateTheme(newBranding));
      
      if (typeof window !== 'undefined') {
        brandingService.applyBranding(newBranding);
      }
      
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply branding');
    }
  }, []);

  /**
   * Remove current branding
   */
  const removeBranding = useCallback(() => {
    try {
      setBranding(null);
      setTheme(null);
      
      if (typeof window !== 'undefined') {
        brandingService.removeBranding();
      }
      
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove branding');
    }
  }, []);

  /**
   * Update tenant branding
   */
  const updateBranding = useCallback(async (updates: Partial<TenantBranding>) => {
    if (!tenant) {
      setError('No tenant context available');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const updatedBranding = { ...tenant.branding, ...updates };
      
      // Update tenant with new branding
      await updateTenant({
        branding: updatedBranding
      });

      // Apply the updated branding
      applyBranding(updatedBranding);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update branding');
    } finally {
      setIsLoading(false);
    }
  }, [tenant, updateTenant, applyBranding]);

  /**
   * Generate CSS for current branding
   */
  const generateCSS = useCallback((): string => {
    if (!branding) return '';
    
    const variables = brandingService.generateCSSVariables(branding);
    const cssVariables = Object.entries(variables)
      .map(([property, value]) => `${property}: ${value};`)
      .join('\n  ');

    return `:root {\n  ${cssVariables}\n}${branding.custom_css ? '\n\n' + branding.custom_css : ''}`;
  }, [branding]);

  /**
   * Check if branding is currently applied
   */
  const isBrandingApplied = typeof window !== 'undefined' ? brandingService.isBrandingApplied() : !!branding;

  return {
    branding,
    theme,
    isLoading,
    error,
    applyBranding,
    removeBranding,
    updateBranding,
    generateCSS,
    isBrandingApplied,
  };
};

/**
 * Hook for accessing branding theme values
 */
export const useBrandingTheme = () => {
  const { theme } = useBranding();
  
  return {
    colors: theme ? {
      primary: theme.primary,
      secondary: theme.secondary,
      accent: theme.accent,
      background: theme.background,
      text: theme.text,
    } : null,
    assets: theme ? {
      logo: theme.logo,
      favicon: theme.favicon,
    } : null,
  };
};

/**
 * Hook for branding CSS variables
 */
export const useBrandingCSS = () => {
  const { branding, generateCSS } = useBranding();
  
  return {
    css: generateCSS(),
    variables: branding ? brandingService.generateCSSVariables(branding) : null,
  };
};