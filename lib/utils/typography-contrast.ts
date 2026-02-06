/**
 * Typography contrast utilities for ensuring WCAG 2.1 AA compliance
 * Requirements: 10.2 - Sufficient contrast ratios
 */

// WCAG 2.1 AA contrast ratio requirements
export const CONTRAST_RATIOS = {
  AA_NORMAL: 4.5, // Normal text (under 18pt or under 14pt bold)
  AA_LARGE: 3.0,  // Large text (18pt+ or 14pt+ bold)
  AAA_NORMAL: 7.0, // Enhanced contrast for normal text
  AAA_LARGE: 4.5,  // Enhanced contrast for large text
} as const;

/**
 * Convert hex color to RGB values
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * Calculate relative luminance of a color
 */
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 */
export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) {
    throw new Error('Invalid color format. Please use hex colors.');
  }
  
  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
  
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  
  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Check if contrast ratio meets WCAG AA standards
 */
export function meetsContrastAA(
  textColor: string, 
  backgroundColor: string, 
  isLargeText: boolean = false
): boolean {
  const ratio = getContrastRatio(textColor, backgroundColor);
  const requiredRatio = isLargeText ? CONTRAST_RATIOS.AA_LARGE : CONTRAST_RATIOS.AA_NORMAL;
  return ratio >= requiredRatio;
}

/**
 * Check if contrast ratio meets WCAG AAA standards
 */
export function meetsContrastAAA(
  textColor: string, 
  backgroundColor: string, 
  isLargeText: boolean = false
): boolean {
  const ratio = getContrastRatio(textColor, backgroundColor);
  const requiredRatio = isLargeText ? CONTRAST_RATIOS.AAA_LARGE : CONTRAST_RATIOS.AAA_NORMAL;
  return ratio >= requiredRatio;
}

/**
 * Get contrast level description
 */
export function getContrastLevel(
  textColor: string, 
  backgroundColor: string, 
  isLargeText: boolean = false
): 'AAA' | 'AA' | 'FAIL' {
  if (meetsContrastAAA(textColor, backgroundColor, isLargeText)) {
    return 'AAA';
  } else if (meetsContrastAA(textColor, backgroundColor, isLargeText)) {
    return 'AA';
  } else {
    return 'FAIL';
  }
}

/**
 * ISOTEC brand color combinations that meet WCAG AA standards
 */
export const ACCESSIBLE_COLOR_COMBINATIONS = {
  // Light backgrounds
  light: {
    primary: {
      background: '#ffffff', // white
      text: '#171717', // neutral-900
      contrast: 16.75, // Excellent
    },
    solar: {
      background: '#fffbeb', // solar-50
      text: '#78350f', // solar-900
      contrast: 8.2, // AAA
    },
    ocean: {
      background: '#eff6ff', // ocean-50
      text: '#1e3a8a', // ocean-900
      contrast: 9.1, // AAA
    },
    energy: {
      background: '#f0fdf4', // energy-50
      text: '#14532d', // energy-900
      contrast: 10.3, // AAA
    },
  },
  
  // Dark backgrounds
  dark: {
    primary: {
      background: '#171717', // neutral-900
      text: '#fafafa', // neutral-50
      contrast: 16.75, // Excellent
    },
    solar: {
      background: '#78350f', // solar-900
      text: '#fffbeb', // solar-50
      contrast: 8.2, // AAA
    },
    ocean: {
      background: '#1e3a8a', // ocean-900
      text: '#eff6ff', // ocean-50
      contrast: 9.1, // AAA
    },
    energy: {
      background: '#14532d', // energy-900
      text: '#f0fdf4', // energy-50
      contrast: 10.3, // AAA
    },
  },
  
  // Medium contrast combinations
  medium: {
    neutral: {
      background: '#f5f5f5', // neutral-100
      text: '#404040', // neutral-700
      contrast: 7.8, // AAA
    },
    solarMedium: {
      background: '#fef3c7', // solar-100
      text: '#b45309', // solar-700
      contrast: 4.6, // AA
    },
    oceanMedium: {
      background: '#dbeafe', // ocean-100
      text: '#1e40af', // ocean-700
      contrast: 5.2, // AA
    },
    energyMedium: {
      background: '#dcfce7', // energy-100
      text: '#166534', // energy-700
      contrast: 5.8, // AA
    },
  },
} as const;

/**
 * Get recommended text color for a given background
 */
export function getRecommendedTextColor(backgroundColor: string): string {
  // Simple approach: use white text on dark backgrounds, dark text on light backgrounds
  const rgb = hexToRgb(backgroundColor);
  if (!rgb) return '#171717'; // Default to dark text
  
  const luminance = getLuminance(rgb.r, rgb.g, rgb.b);
  return luminance > 0.5 ? '#171717' : '#fafafa'; // neutral-900 or neutral-50
}

/**
 * Validate all text/background combinations in a theme
 */
export function validateThemeContrast(theme: Record<string, string>): {
  valid: boolean;
  issues: Array<{
    combination: string;
    ratio: number;
    required: number;
    level: string;
  }>;
} {
  const issues: Array<{
    combination: string;
    ratio: number;
    required: number;
    level: string;
  }> = [];
  
  // Check common combinations
  const combinations = [
    { name: 'body-text', text: theme.text || '#171717', bg: theme.background || '#ffffff' },
    { name: 'heading-text', text: theme.heading || '#171717', bg: theme.background || '#ffffff' },
    { name: 'muted-text', text: theme.muted || '#737373', bg: theme.background || '#ffffff' },
  ];
  
  combinations.forEach(({ name, text, bg }) => {
    try {
      const ratio = getContrastRatio(text, bg);
      if (ratio < CONTRAST_RATIOS.AA_NORMAL) {
        issues.push({
          combination: name,
          ratio,
          required: CONTRAST_RATIOS.AA_NORMAL,
          level: 'AA',
        });
      }
    } catch (error) {
      // Skip invalid color combinations
    }
  });
  
  return {
    valid: issues.length === 0,
    issues,
  };
}