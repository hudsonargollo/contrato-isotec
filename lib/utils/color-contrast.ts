/**
 * Color Contrast Utilities
 * 
 * Utilities for calculating and verifying color contrast ratios
 * to ensure WCAG 2.1 AA compliance.
 * 
 * WCAG 2.1 AA Requirements:
 * - Normal text: minimum 4.5:1 contrast ratio
 * - Large text (18pt+ or 14pt+ bold): minimum 3:1 contrast ratio
 * - UI components and graphics: minimum 3:1 contrast ratio
 * 
 * Requirements: 10.2
 */

// Convert hex color to RGB
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

// Convert RGB to relative luminance
export function getLuminance(r: number, g: number, b: number): number {
  // Convert to sRGB
  const rsRGB = r / 255;
  const gsRGB = g / 255;
  const bsRGB = b / 255;

  // Apply gamma correction
  const rLinear = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
  const gLinear = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
  const bLinear = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

  // Calculate relative luminance
  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}

// Calculate contrast ratio between two colors
export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) {
    throw new Error('Invalid hex color format');
  }

  const luminance1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const luminance2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);

  const lighter = Math.max(luminance1, luminance2);
  const darker = Math.min(luminance1, luminance2);

  return (lighter + 0.05) / (darker + 0.05);
}

// Check if contrast ratio meets WCAG AA standards
export function meetsWCAGAA(
  foreground: string, 
  background: string, 
  textSize: 'normal' | 'large' = 'normal'
): boolean {
  const ratio = getContrastRatio(foreground, background);
  const minimumRatio = textSize === 'large' ? 3 : 4.5;
  return ratio >= minimumRatio;
}

// Check if contrast ratio meets WCAG AAA standards
export function meetsWCAGAAA(
  foreground: string, 
  background: string, 
  textSize: 'normal' | 'large' = 'normal'
): boolean {
  const ratio = getContrastRatio(foreground, background);
  const minimumRatio = textSize === 'large' ? 4.5 : 7;
  return ratio >= minimumRatio;
}

// Get contrast level description
export function getContrastLevel(foreground: string, background: string): {
  ratio: number;
  level: 'fail' | 'aa-large' | 'aa' | 'aaa';
  description: string;
} {
  const ratio = getContrastRatio(foreground, background);
  
  if (ratio >= 7) {
    return {
      ratio,
      level: 'aaa',
      description: 'Passes WCAG AAA for all text sizes'
    };
  } else if (ratio >= 4.5) {
    return {
      ratio,
      level: 'aa',
      description: 'Passes WCAG AA for all text sizes'
    };
  } else if (ratio >= 3) {
    return {
      ratio,
      level: 'aa-large',
      description: 'Passes WCAG AA for large text only'
    };
  } else {
    return {
      ratio,
      level: 'fail',
      description: 'Fails WCAG AA standards'
    };
  }
}

// ISOTEC color palette with contrast verification
export const isotecColors = {
  // Solar colors
  solar: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b', // Primary brand color
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  
  // Ocean colors
  ocean: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#2563eb', // Darker for better contrast - was #3b82f6
    600: '#1d4ed8',
    700: '#1e40af',
    800: '#1e3a8a',
    900: '#1e3a8a',
  },
  
  // Energy colors
  energy: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#16a34a', // Darker for better contrast - was #22c55e
    600: '#15803d',
    700: '#166534',
    800: '#14532d',
    900: '#14532d',
  },
  
  // Neutral colors
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
    950: '#0a0a0a',
  },
  
  // Semantic colors
  white: '#ffffff',
  black: '#000000',
  red: '#dc2626', // Darker for better contrast - was #ef4444
};

// Verify all color combinations used in the design system
export function verifyDesignSystemContrast(): {
  passed: Array<{ combination: string; ratio: number; level: string }>;
  failed: Array<{ combination: string; ratio: number; level: string; suggestion?: string }>;
} {
  const passed: Array<{ combination: string; ratio: number; level: string }> = [];
  const failed: Array<{ combination: string; ratio: number; level: string; suggestion?: string }> = [];

  // Common text/background combinations to test
  const combinations = [
    // Light backgrounds
    { fg: isotecColors.neutral[900], bg: isotecColors.white, name: 'Dark text on white' },
    { fg: isotecColors.neutral[700], bg: isotecColors.white, name: 'Medium text on white' },
    { fg: isotecColors.neutral[600], bg: isotecColors.neutral[50], name: 'Medium text on light gray' },
    { fg: isotecColors.solar[600], bg: isotecColors.white, name: 'Solar text on white' },
    { fg: isotecColors.ocean[600], bg: isotecColors.white, name: 'Ocean text on white' },
    { fg: isotecColors.energy[600], bg: isotecColors.white, name: 'Energy text on white' },
    { fg: isotecColors.red, bg: isotecColors.white, name: 'Error text on white' },
    
    // Dark backgrounds
    { fg: isotecColors.white, bg: isotecColors.neutral[900], name: 'White text on dark' },
    { fg: isotecColors.neutral[300], bg: isotecColors.neutral[900], name: 'Light text on dark' },
    { fg: isotecColors.neutral[400], bg: isotecColors.neutral[800], name: 'Medium text on dark gray' },
    { fg: isotecColors.solar[400], bg: isotecColors.neutral[900], name: 'Solar text on dark' },
    { fg: isotecColors.ocean[400], bg: isotecColors.neutral[900], name: 'Ocean text on dark' },
    { fg: isotecColors.energy[400], bg: isotecColors.neutral[900], name: 'Energy text on dark' },
    
    // Button combinations
    { fg: isotecColors.neutral[900], bg: isotecColors.solar[500], name: 'Primary button text' },
    { fg: isotecColors.white, bg: isotecColors.ocean[500], name: 'Secondary button text' },
    { fg: isotecColors.white, bg: isotecColors.energy[500], name: 'Success button text' },
    { fg: isotecColors.white, bg: isotecColors.red, name: 'Error button text' },
    
    // Form states
    { fg: isotecColors.red, bg: isotecColors.white, name: 'Error message text' },
    { fg: isotecColors.energy[600], bg: isotecColors.white, name: 'Success message text' },
    { fg: isotecColors.solar[600], bg: isotecColors.white, name: 'Warning message text' },
    { fg: isotecColors.ocean[600], bg: isotecColors.white, name: 'Info message text' },
  ];

  combinations.forEach(({ fg, bg, name }) => {
    const result = getContrastLevel(fg, bg);
    
    if (result.level === 'fail') {
      failed.push({
        combination: name,
        ratio: result.ratio,
        level: result.description,
        suggestion: getSuggestion(fg, bg, name),
      });
    } else {
      passed.push({
        combination: name,
        ratio: result.ratio,
        level: result.description,
      });
    }
  });

  return { passed, failed };
}

// Get suggestion for improving contrast
function getSuggestion(foreground: string, background: string, name: string): string {
  const ratio = getContrastRatio(foreground, background);
  
  if (name.includes('text on white')) {
    return 'Consider using a darker shade of the foreground color';
  } else if (name.includes('text on dark')) {
    return 'Consider using a lighter shade of the foreground color';
  } else if (name.includes('button')) {
    return 'Consider adjusting the button background color or using white text';
  } else {
    return `Current ratio: ${ratio.toFixed(2)}:1. Needs to be at least 4.5:1 for normal text or 3:1 for large text`;
  }
}

// Generate accessible color variations
export function generateAccessibleVariation(
  foreground: string,
  background: string,
  targetRatio: number = 4.5
): string {
  const bgRgb = hexToRgb(background);
  const fgRgb = hexToRgb(foreground);
  
  if (!bgRgb || !fgRgb) {
    throw new Error('Invalid hex color format');
  }

  const bgLuminance = getLuminance(bgRgb.r, bgRgb.g, bgRgb.b);
  
  // Determine if we need to make foreground lighter or darker
  const targetLuminance = bgLuminance > 0.5 
    ? (bgLuminance + 0.05) / targetRatio - 0.05  // Darker foreground
    : (bgLuminance + 0.05) * targetRatio - 0.05; // Lighter foreground
  
  // Clamp luminance to valid range
  const clampedLuminance = Math.max(0, Math.min(1, targetLuminance));
  
  // Convert back to RGB (simplified approach)
  const factor = Math.sqrt(clampedLuminance / getLuminance(fgRgb.r, fgRgb.g, fgRgb.b));
  
  const newR = Math.round(Math.min(255, fgRgb.r * factor));
  const newG = Math.round(Math.min(255, fgRgb.g * factor));
  const newB = Math.round(Math.min(255, fgRgb.b * factor));
  
  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
}

// Utility to check if a color is light or dark
export function isLightColor(color: string): boolean {
  const rgb = hexToRgb(color);
  if (!rgb) return false;
  
  const luminance = getLuminance(rgb.r, rgb.g, rgb.b);
  return luminance > 0.5;
}

// Get the best text color (black or white) for a given background
export function getBestTextColor(backgroundColor: string): string {
  const whiteRatio = getContrastRatio('#ffffff', backgroundColor);
  const blackRatio = getContrastRatio('#000000', backgroundColor);
  
  return whiteRatio > blackRatio ? '#ffffff' : '#000000';
}

// Export verification results for testing
export const contrastVerification = verifyDesignSystemContrast();