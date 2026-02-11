/**
 * Branding Provider Component
 * 
 * Provides branding context and automatically applies tenant branding throughout the application.
 * Handles server-side rendering, client-side hydration, and dynamic branding updates.
 * 
 * Requirements: 1.3 - Tenant branding and customization system
 */

'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { TenantBranding } from '@/lib/types/tenant';
import { brandingService, generateServerSideCSS, generateMetaTags } from '@/lib/services/branding';
import { useTenant } from '@/lib/contexts/tenant-context';

interface BrandingContextType {
  branding: TenantBranding | null;
  isLoading: boolean;
  error: string | null;
  applyBranding: (branding: TenantBranding) => void;
  removeBranding: () => void;
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

interface BrandingProviderProps {
  children: React.ReactNode;
  initialBranding?: TenantBranding;
}

export const BrandingProvider: React.FC<BrandingProviderProps> = ({ 
  children, 
  initialBranding 
}) => {
  const { tenant } = useTenant();
  const [branding, setBranding] = useState<TenantBranding | null>(initialBranding || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Apply branding when tenant changes
  useEffect(() => {
    if (tenant?.branding) {
      applyBranding(tenant.branding);
    }
  }, [tenant]);

  // Apply initial branding on mount
  useEffect(() => {
    if (initialBranding) {
      applyBranding(initialBranding);
    }
  }, [initialBranding]);

  const applyBranding = (newBranding: TenantBranding) => {
    try {
      setIsLoading(true);
      setError(null);
      
      setBranding(newBranding);
      
      // Apply branding on client side
      if (typeof window !== 'undefined') {
        brandingService.applyBranding(newBranding);
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply branding');
    } finally {
      setIsLoading(false);
    }
  };

  const removeBranding = () => {
    try {
      setError(null);
      setBranding(null);
      
      if (typeof window !== 'undefined') {
        brandingService.removeBranding();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove branding');
    }
  };

  const contextValue: BrandingContextType = {
    branding,
    isLoading,
    error,
    applyBranding,
    removeBranding,
  };

  return (
    <BrandingContext.Provider value={contextValue}>
      {branding && <BrandingStyles branding={branding} />}
      {children}
    </BrandingContext.Provider>
  );
};

/**
 * Component to inject branding styles into the document head
 */
const BrandingStyles: React.FC<{ branding: TenantBranding }> = ({ branding }) => {
  useEffect(() => {
    // Generate and inject CSS
    const css = generateServerSideCSS(branding);
    const styleId = 'tenant-branding-styles';
    
    // Remove existing styles
    const existingStyle = document.getElementById(styleId);
    if (existingStyle) {
      existingStyle.remove();
    }
    
    // Add new styles
    const styleElement = document.createElement('style');
    styleElement.id = styleId;
    styleElement.textContent = css;
    document.head.appendChild(styleElement);
    
    // Update meta tags
    const metaTags = generateMetaTags(branding);
    metaTags.forEach(tag => {
      if (tag.rel) {
        // Handle link tags (favicon, etc.)
        const existingLink = document.querySelector(`link[rel="${tag.rel}"]`);
        if (existingLink) {
          existingLink.remove();
        }
        
        const linkElement = document.createElement('link');
        linkElement.rel = tag.rel;
        linkElement.href = tag.href!;
        document.head.appendChild(linkElement);
      } else {
        // Handle meta tags
        const selector = tag.name ? `meta[name="${tag.name}"]` : `meta[property="${tag.property}"]`;
        const existingMeta = document.querySelector(selector);
        if (existingMeta) {
          existingMeta.setAttribute('content', tag.content);
        } else {
          const metaElement = document.createElement('meta');
          if (tag.name) metaElement.name = tag.name;
          if (tag.property) metaElement.setAttribute('property', tag.property);
          metaElement.content = tag.content;
          document.head.appendChild(metaElement);
        }
      }
    });
    
    // Cleanup function
    return () => {
      const style = document.getElementById(styleId);
      if (style) {
        style.remove();
      }
    };
  }, [branding]);

  return null;
};

/**
 * Hook to use branding context
 */
export const useBrandingContext = (): BrandingContextType => {
  const context = useContext(BrandingContext);
  if (context === undefined) {
    throw new Error('useBrandingContext must be used within a BrandingProvider');
  }
  return context;
};

/**
 * Server-side branding component for SSR
 */
export const ServerBrandingStyles: React.FC<{ branding: TenantBranding }> = ({ branding }) => {
  const css = generateServerSideCSS(branding);
  const metaTags = generateMetaTags(branding);

  return (
    <>
      <style
        id="tenant-branding-styles"
        dangerouslySetInnerHTML={{ __html: css }}
      />
      {metaTags.map((tag, index) => {
        if (tag.rel) {
          return (
            <link
              key={index}
              rel={tag.rel}
              href={tag.href}
            />
          );
        } else {
          return (
            <meta
              key={index}
              name={tag.name}
              property={tag.property}
              content={tag.content}
            />
          );
        }
      })}
    </>
  );
};

export default BrandingProvider;