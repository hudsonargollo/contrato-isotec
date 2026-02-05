/**
 * Test suite for Tailwind CSS color configuration
 * Validates: Requirements 1.6, 2.1, 2.4
 */

import { describe, it, expect } from '@jest/globals';
import resolveConfig from 'tailwindcss/resolveConfig';
import tailwindConfig from '../tailwind.config';

const fullConfig = resolveConfig(tailwindConfig);

describe('Tailwind Color Configuration', () => {
  describe('Solar Color Scale', () => {
    it('should have all solar color variants defined', () => {
      const solarColors = fullConfig.theme.colors.solar;
      
      expect(solarColors).toBeDefined();
      expect(solarColors['50']).toBe('#fffbeb');
      expect(solarColors['100']).toBe('#fef3c7');
      expect(solarColors['200']).toBe('#fde68a');
      expect(solarColors['300']).toBe('#fcd34d');
      expect(solarColors['400']).toBe('#fbbf24');
      expect(solarColors['500']).toBe('#f59e0b'); // Primary brand color
      expect(solarColors['600']).toBe('#d97706');
      expect(solarColors['700']).toBe('#b45309');
      expect(solarColors['800']).toBe('#92400e');
      expect(solarColors['900']).toBe('#78350f');
    });

    it('should use solar-500 as primary brand color', () => {
      const solarColors = fullConfig.theme.colors.solar;
      expect(solarColors['500']).toBe('#f59e0b');
    });
  });

  describe('Ocean Color Scale', () => {
    it('should have all ocean color variants defined', () => {
      const oceanColors = fullConfig.theme.colors.ocean;
      
      expect(oceanColors).toBeDefined();
      expect(oceanColors['50']).toBe('#eff6ff');
      expect(oceanColors['100']).toBe('#dbeafe');
      expect(oceanColors['200']).toBe('#bfdbfe');
      expect(oceanColors['300']).toBe('#93c5fd');
      expect(oceanColors['400']).toBe('#60a5fa');
      expect(oceanColors['500']).toBe('#3b82f6'); // Secondary brand color
      expect(oceanColors['600']).toBe('#2563eb');
      expect(oceanColors['700']).toBe('#1d4ed8');
      expect(oceanColors['800']).toBe('#1e40af');
      expect(oceanColors['900']).toBe('#1e3a8a');
    });

    it('should use ocean-500 as secondary brand color', () => {
      const oceanColors = fullConfig.theme.colors.ocean;
      expect(oceanColors['500']).toBe('#3b82f6');
    });
  });

  describe('Energy Color Scale', () => {
    it('should have all energy color variants defined', () => {
      const energyColors = fullConfig.theme.colors.energy;
      
      expect(energyColors).toBeDefined();
      expect(energyColors['50']).toBe('#f0fdf4');
      expect(energyColors['100']).toBe('#dcfce7');
      expect(energyColors['200']).toBe('#bbf7d0');
      expect(energyColors['300']).toBe('#86efac');
      expect(energyColors['400']).toBe('#4ade80');
      expect(energyColors['500']).toBe('#22c55e'); // Accent color
      expect(energyColors['600']).toBe('#16a34a');
      expect(energyColors['700']).toBe('#15803d');
      expect(energyColors['800']).toBe('#166534');
      expect(energyColors['900']).toBe('#14532d');
    });

    it('should use energy-500 as accent color', () => {
      const energyColors = fullConfig.theme.colors.energy;
      expect(energyColors['500']).toBe('#22c55e');
    });
  });

  describe('Neutral Color Scale', () => {
    it('should have all neutral color variants defined including 950', () => {
      const neutralColors = fullConfig.theme.colors.neutral;
      
      expect(neutralColors).toBeDefined();
      expect(neutralColors['50']).toBe('#fafafa');
      expect(neutralColors['100']).toBe('#f5f5f5');
      expect(neutralColors['200']).toBe('#e5e5e5');
      expect(neutralColors['300']).toBe('#d4d4d4');
      expect(neutralColors['400']).toBe('#a3a3a3');
      expect(neutralColors['500']).toBe('#737373');
      expect(neutralColors['600']).toBe('#525252');
      expect(neutralColors['700']).toBe('#404040');
      expect(neutralColors['800']).toBe('#262626');
      expect(neutralColors['900']).toBe('#171717');
      expect(neutralColors['950']).toBe('#0a0a0a');
    });
  });

  describe('Semantic Colors', () => {
    it('should have all semantic colors defined', () => {
      const colors = fullConfig.theme.colors;
      
      expect(colors.success).toBe('#22c55e'); // energy-500
      expect(colors.error).toBe('#ef4444');
      expect(colors.warning).toBe('#f59e0b'); // solar-500
      expect(colors.info).toBe('#3b82f6'); // ocean-500
    });

    it('should map semantic colors to appropriate brand colors', () => {
      const colors = fullConfig.theme.colors;
      
      // Success should use energy green
      expect(colors.success).toBe(colors.energy['500']);
      
      // Warning should use solar yellow/orange
      expect(colors.warning).toBe(colors.solar['500']);
      
      // Info should use ocean blue
      expect(colors.info).toBe(colors.ocean['500']);
    });
  });

  describe('CSS Variable-based Theme Colors', () => {
    it('should have theme-solar color variants with CSS variables', () => {
      const themeSolarColors = fullConfig.theme.colors['theme-solar'];
      
      expect(themeSolarColors).toBeDefined();
      expect(themeSolarColors['50']).toBe('hsl(var(--solar-50))');
      expect(themeSolarColors['500']).toBe('hsl(var(--solar-500))');
      expect(themeSolarColors['900']).toBe('hsl(var(--solar-900))');
    });

    it('should have theme-ocean color variants with CSS variables', () => {
      const themeOceanColors = fullConfig.theme.colors['theme-ocean'];
      
      expect(themeOceanColors).toBeDefined();
      expect(themeOceanColors['50']).toBe('hsl(var(--ocean-50))');
      expect(themeOceanColors['500']).toBe('hsl(var(--ocean-500))');
      expect(themeOceanColors['900']).toBe('hsl(var(--ocean-900))');
    });

    it('should have theme-energy color variants with CSS variables', () => {
      const themeEnergyColors = fullConfig.theme.colors['theme-energy'];
      
      expect(themeEnergyColors).toBeDefined();
      expect(themeEnergyColors['50']).toBe('hsl(var(--energy-50))');
      expect(themeEnergyColors['500']).toBe('hsl(var(--energy-500))');
      expect(themeEnergyColors['900']).toBe('hsl(var(--energy-900))');
    });

    it('should have theme-neutral color variants with CSS variables', () => {
      const themeNeutralColors = fullConfig.theme.colors['theme-neutral'];
      
      expect(themeNeutralColors).toBeDefined();
      expect(themeNeutralColors['50']).toBe('hsl(var(--neutral-50))');
      expect(themeNeutralColors['500']).toBe('hsl(var(--neutral-500))');
      expect(themeNeutralColors['950']).toBe('hsl(var(--neutral-950))');
    });

    it('should have semantic theme colors with CSS variables', () => {
      const colors = fullConfig.theme.colors;
      
      expect(colors['theme-success']).toBe('hsl(var(--success))');
      expect(colors['theme-error']).toBe('hsl(var(--error))');
      expect(colors['theme-warning']).toBe('hsl(var(--warning))');
      expect(colors['theme-info']).toBe('hsl(var(--info))');
    });
  });

  describe('shadcn/ui Integration', () => {
    it('should preserve existing shadcn/ui color variables', () => {
      const colors = fullConfig.theme.colors;
      
      expect(colors.background).toBe('hsl(var(--background))');
      expect(colors.foreground).toBe('hsl(var(--foreground))');
      expect(colors.primary).toBe('hsl(var(--primary))');
      expect(colors.secondary).toBe('hsl(var(--secondary))');
      expect(colors.muted).toBe('hsl(var(--muted))');
      expect(colors.accent).toBe('hsl(var(--accent))');
      expect(colors.destructive).toBe('hsl(var(--destructive))');
      expect(colors.border).toBe('hsl(var(--border))');
      expect(colors.input).toBe('hsl(var(--input))');
      expect(colors.ring).toBe('hsl(var(--ring))');
    });
  });
});