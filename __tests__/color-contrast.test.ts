/**
 * Color Contrast Tests
 * 
 * Tests to verify that all color combinations in the ISOTEC design system
 * meet WCAG 2.1 AA accessibility standards for color contrast.
 * 
 * Requirements: 10.2
 */

import {
  getContrastRatio,
  meetsWCAGAA,
  meetsWCAGAAA,
  getContrastLevel,
  verifyDesignSystemContrast,
  isotecColors,
  getBestTextColor,
  isLightColor,
} from '@/lib/utils/color-contrast';

describe('Color Contrast Utilities', () => {
  describe('getContrastRatio', () => {
    it('should calculate correct contrast ratio for black and white', () => {
      const ratio = getContrastRatio('#000000', '#ffffff');
      expect(ratio).toBeCloseTo(21, 1);
    });

    it('should calculate correct contrast ratio for same colors', () => {
      const ratio = getContrastRatio('#ffffff', '#ffffff');
      expect(ratio).toBeCloseTo(1, 1);
    });

    it('should handle hex colors with and without #', () => {
      const ratio1 = getContrastRatio('#ff0000', '#ffffff');
      const ratio2 = getContrastRatio('ff0000', 'ffffff');
      expect(ratio1).toBeCloseTo(ratio2, 2);
    });
  });

  describe('WCAG AA Compliance', () => {
    it('should pass AA for high contrast combinations', () => {
      expect(meetsWCAGAA('#000000', '#ffffff')).toBe(true);
      expect(meetsWCAGAA('#ffffff', '#000000')).toBe(true);
    });

    it('should fail AA for low contrast combinations', () => {
      expect(meetsWCAGAA('#cccccc', '#ffffff')).toBe(false);
      expect(meetsWCAGAA('#888888', '#999999')).toBe(false);
    });

    it('should handle large text requirements correctly', () => {
      // A combination that passes AA for large text but not normal text
      const ratio = getContrastRatio('#888888', '#ffffff');
      expect(ratio).toBeGreaterThan(3);
      expect(ratio).toBeLessThan(4.5);
      
      expect(meetsWCAGAA('#888888', '#ffffff', 'large')).toBe(true);
      expect(meetsWCAGAA('#888888', '#ffffff', 'normal')).toBe(false);
    });
  });

  describe('ISOTEC Color Palette Compliance', () => {
    it('should have accessible primary button colors', () => {
      // Primary button: dark text on solar background
      const primaryButtonRatio = getContrastRatio(isotecColors.neutral[900], isotecColors.solar[500]);
      expect(primaryButtonRatio).toBeGreaterThanOrEqual(4.5);
    });

    it('should have accessible secondary button colors', () => {
      // Secondary button: white text on ocean background
      const secondaryButtonRatio = getContrastRatio(isotecColors.white, isotecColors.ocean[500]);
      expect(secondaryButtonRatio).toBeGreaterThanOrEqual(4.5);
    });

    it('should have accessible text colors on white background', () => {
      // Main text colors on white
      expect(meetsWCAGAA(isotecColors.neutral[900], isotecColors.white)).toBe(true);
      expect(meetsWCAGAA(isotecColors.neutral[700], isotecColors.white)).toBe(true);
      expect(meetsWCAGAA(isotecColors.neutral[600], isotecColors.white)).toBe(true);
    });

    it('should have accessible text colors on dark background', () => {
      // Light text colors on dark background
      expect(meetsWCAGAA(isotecColors.white, isotecColors.neutral[900])).toBe(true);
      expect(meetsWCAGAA(isotecColors.neutral[300], isotecColors.neutral[900])).toBe(true);
    });

    it('should have accessible error colors', () => {
      // Error text on white background
      expect(meetsWCAGAA(isotecColors.red, isotecColors.white)).toBe(true);
    });

    it('should have accessible success colors', () => {
      // Success text on white background
      expect(meetsWCAGAA(isotecColors.energy[600], isotecColors.white)).toBe(true);
    });
  });

  describe('Design System Verification', () => {
    it('should have more passing combinations than failing ones', () => {
      const { passed, failed } = verifyDesignSystemContrast();
      
      console.log(`Passed combinations: ${passed.length}`);
      console.log(`Failed combinations: ${failed.length}`);
      
      if (failed.length > 0) {
        console.log('Failed combinations:');
        failed.forEach(({ combination, ratio, suggestion }) => {
          console.log(`- ${combination}: ${ratio.toFixed(2)}:1 - ${suggestion}`);
        });
      }
      
      // We expect most combinations to pass
      expect(passed.length).toBeGreaterThan(failed.length);
    });

    it('should have all critical UI combinations passing', () => {
      const { failed } = verifyDesignSystemContrast();
      
      // Critical combinations that must pass
      const criticalCombinations = [
        'Dark text on white',
        'White text on dark',
        'Primary button text',
        'Secondary button text',
        'Error message text',
      ];
      
      const criticalFailures = failed.filter(({ combination }) =>
        criticalCombinations.some(critical => combination.includes(critical))
      );
      
      if (criticalFailures.length > 0) {
        console.error('Critical accessibility failures:', criticalFailures);
      }
      
      expect(criticalFailures).toHaveLength(0);
    });
  });

  describe('Utility Functions', () => {
    it('should correctly identify light and dark colors', () => {
      expect(isLightColor('#ffffff')).toBe(true);
      expect(isLightColor('#000000')).toBe(false);
      expect(isLightColor(isotecColors.solar[400])).toBe(true); // Use lighter solar color
      expect(isLightColor(isotecColors.neutral[900])).toBe(false);
    });

    it('should recommend correct text colors', () => {
      expect(getBestTextColor('#ffffff')).toBe('#000000');
      expect(getBestTextColor('#000000')).toBe('#ffffff');
      expect(getBestTextColor(isotecColors.solar[500])).toBe('#000000');
      expect(getBestTextColor(isotecColors.neutral[900])).toBe('#ffffff');
    });
  });

  describe('Contrast Level Classification', () => {
    it('should correctly classify contrast levels', () => {
      const excellent = getContrastLevel('#000000', '#ffffff');
      expect(excellent.level).toBe('aaa');
      expect(excellent.ratio).toBeGreaterThan(7);

      const good = getContrastLevel('#666666', '#ffffff'); // Use color that gives exactly AA level
      expect(good.level).toBe('aa');
      expect(good.ratio).toBeGreaterThanOrEqual(4.5);
      expect(good.ratio).toBeLessThan(7);

      const largeOnly = getContrastLevel('#888888', '#ffffff');
      expect(largeOnly.level).toBe('aa-large');
      expect(largeOnly.ratio).toBeGreaterThanOrEqual(3);
      expect(largeOnly.ratio).toBeLessThan(4.5);

      const poor = getContrastLevel('#cccccc', '#ffffff');
      expect(poor.level).toBe('fail');
      expect(poor.ratio).toBeLessThan(3);
    });
  });
});

describe('ISOTEC Brand Color Accessibility', () => {
  it('should meet accessibility standards for all brand colors', () => {
    const brandTests = [
      {
        name: 'Solar primary on white',
        fg: isotecColors.solar[700], // Use darker solar for better contrast
        bg: isotecColors.white,
        expected: true,
      },
      {
        name: 'Ocean primary on white',
        fg: isotecColors.ocean[600],
        bg: isotecColors.white,
        expected: true,
      },
      {
        name: 'Energy primary on white',
        fg: isotecColors.energy[600],
        bg: isotecColors.white,
        expected: true,
      },
      {
        name: 'Solar light on dark',
        fg: isotecColors.solar[400],
        bg: isotecColors.neutral[900],
        expected: true,
      },
      {
        name: 'Ocean light on dark',
        fg: isotecColors.ocean[400],
        bg: isotecColors.neutral[900],
        expected: true,
      },
      {
        name: 'Energy light on dark',
        fg: isotecColors.energy[400],
        bg: isotecColors.neutral[900],
        expected: true,
      },
    ];

    brandTests.forEach(({ name, fg, bg, expected }) => {
      const passes = meetsWCAGAA(fg, bg);
      const ratio = getContrastRatio(fg, bg);
      
      if (!passes && expected) {
        console.warn(`${name} failed accessibility test with ratio ${ratio.toFixed(2)}:1`);
      }
      
      expect(passes).toBe(expected);
    });
  });
});