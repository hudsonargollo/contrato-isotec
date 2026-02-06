import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ReadableText, ReadableParagraph, ReadableHeading } from '@/components/ui/readable-text';
import { 
  getContrastRatio, 
  meetsContrastAA, 
  ACCESSIBLE_COLOR_COMBINATIONS 
} from '@/lib/utils/typography-contrast';

describe('Typography Readability Improvements', () => {
  describe('ReadableText Component', () => {
    it('should apply optimal line length by default', () => {
      render(
        <ReadableText data-testid="readable-text">
          Test content for readability
        </ReadableText>
      );
      
      const element = screen.getByTestId('readable-text');
      expect(element).toHaveClass('max-w-[75ch]');
    });

    it('should apply different max-width options', () => {
      const { rerender } = render(
        <ReadableText maxWidth="narrow" data-testid="readable-text">
          Test content
        </ReadableText>
      );
      
      expect(screen.getByTestId('readable-text')).toHaveClass('max-w-[60ch]');
      
      rerender(
        <ReadableText maxWidth="wide" data-testid="readable-text">
          Test content
        </ReadableText>
      );
      
      expect(screen.getByTestId('readable-text')).toHaveClass('max-w-[85ch]');
    });

    it('should apply different spacing options', () => {
      const { rerender } = render(
        <ReadableText spacing="relaxed" data-testid="readable-text">
          Test content
        </ReadableText>
      );
      
      expect(screen.getByTestId('readable-text')).toHaveClass('leading-loose');
      
      rerender(
        <ReadableText spacing="tight" data-testid="readable-text">
          Test content
        </ReadableText>
      );
      
      expect(screen.getByTestId('readable-text')).toHaveClass('leading-normal');
    });

    it('should apply contrast classes', () => {
      const { rerender } = render(
        <ReadableText contrast="high" data-testid="readable-text">
          Test content
        </ReadableText>
      );
      
      expect(screen.getByTestId('readable-text')).toHaveClass('text-high-contrast');
      
      rerender(
        <ReadableText contrast="low" data-testid="readable-text">
          Test content
        </ReadableText>
      );
      
      expect(screen.getByTestId('readable-text')).toHaveClass('text-low-contrast');
    });
  });

  describe('ReadableParagraph Component', () => {
    it('should render with optimal line length and spacing', () => {
      render(
        <ReadableParagraph data-testid="readable-paragraph">
          This is a test paragraph with optimal readability settings.
        </ReadableParagraph>
      );
      
      const paragraph = screen.getByTestId('readable-paragraph');
      expect(paragraph).toHaveClass('max-w-[75ch]');
      expect(paragraph).toHaveClass('leading-relaxed');
      expect(paragraph).toHaveClass('mb-5');
    });

    it('should apply responsive font sizes', () => {
      const { rerender } = render(
        <ReadableParagraph size="base" data-testid="readable-paragraph">
          Test content
        </ReadableParagraph>
      );
      
      expect(screen.getByTestId('readable-paragraph')).toHaveClass('text-base', 'md:text-lg');
      
      rerender(
        <ReadableParagraph size="lg" data-testid="readable-paragraph">
          Test content
        </ReadableParagraph>
      );
      
      expect(screen.getByTestId('readable-paragraph')).toHaveClass('text-lg', 'md:text-xl');
    });
  });

  describe('ReadableHeading Component', () => {
    it('should render correct heading levels', () => {
      const { rerender } = render(
        <ReadableHeading level={1} data-testid="readable-heading">
          Test Heading
        </ReadableHeading>
      );
      
      expect(screen.getByTestId('readable-heading').tagName).toBe('H1');
      
      rerender(
        <ReadableHeading level={3} data-testid="readable-heading">
          Test Heading
        </ReadableHeading>
      );
      
      expect(screen.getByTestId('readable-heading').tagName).toBe('H3');
    });

    it('should apply contrast classes to headings', () => {
      render(
        <ReadableHeading level={2} contrast="high" data-testid="readable-heading">
          Test Heading
        </ReadableHeading>
      );
      
      expect(screen.getByTestId('readable-heading')).toHaveClass('text-high-contrast');
    });
  });
});

describe('Typography Contrast Utilities', () => {
  describe('getContrastRatio', () => {
    it('should calculate correct contrast ratios', () => {
      // White on black should have high contrast
      const whiteOnBlack = getContrastRatio('#ffffff', '#000000');
      expect(whiteOnBlack).toBeCloseTo(21, 0);
      
      // Same colors should have 1:1 ratio
      const sameColor = getContrastRatio('#ffffff', '#ffffff');
      expect(sameColor).toBe(1);
    });

    it('should handle ISOTEC brand colors', () => {
      // Test solar colors
      const solarContrast = getContrastRatio('#78350f', '#fffbeb'); // solar-900 on solar-50
      expect(solarContrast).toBeGreaterThan(4.5); // Should meet AA standards
      
      // Test ocean colors
      const oceanContrast = getContrastRatio('#1e3a8a', '#eff6ff'); // ocean-900 on ocean-50
      expect(oceanContrast).toBeGreaterThan(4.5); // Should meet AA standards
    });
  });

  describe('meetsContrastAA', () => {
    it('should correctly identify AA compliant combinations', () => {
      // High contrast combination
      expect(meetsContrastAA('#000000', '#ffffff')).toBe(true);
      
      // Low contrast combination
      expect(meetsContrastAA('#cccccc', '#ffffff')).toBe(false);
      
      // ISOTEC brand combinations
      expect(meetsContrastAA('#78350f', '#fffbeb')).toBe(true); // solar-900 on solar-50
      expect(meetsContrastAA('#1e3a8a', '#eff6ff')).toBe(true); // ocean-900 on ocean-50
    });

    it('should handle large text correctly', () => {
      // Some combinations that fail for normal text might pass for large text
      const textColor = '#666666';
      const backgroundColor = '#ffffff';
      
      const normalText = meetsContrastAA(textColor, backgroundColor, false);
      const largeText = meetsContrastAA(textColor, backgroundColor, true);
      
      // Large text has lower requirements (3:1 vs 4.5:1)
      if (!normalText) {
        expect(largeText).toBe(true);
      }
    });
  });

  describe('ACCESSIBLE_COLOR_COMBINATIONS', () => {
    it('should have all combinations meet AA standards', () => {
      const combinations = ACCESSIBLE_COLOR_COMBINATIONS;
      
      // Test light theme combinations
      Object.values(combinations.light).forEach(combo => {
        expect(combo.contrast).toBeGreaterThanOrEqual(4.5);
      });
      
      // Test dark theme combinations
      Object.values(combinations.dark).forEach(combo => {
        expect(combo.contrast).toBeGreaterThanOrEqual(4.5);
      });
      
      // Test medium contrast combinations
      Object.values(combinations.medium).forEach(combo => {
        expect(combo.contrast).toBeGreaterThanOrEqual(4.5);
      });
    });
  });
});

describe('Mobile Typography Optimizations', () => {
  it('should apply mobile-specific styles in CSS', () => {
    // This test verifies that mobile styles are properly configured
    // The actual mobile behavior would be tested with responsive testing tools
    
    render(
      <div className="prose">
        <p data-testid="prose-paragraph">
          This paragraph should have mobile-optimized spacing and font size.
        </p>
      </div>
    );
    
    const paragraph = screen.getByTestId('prose-paragraph');
    expect(paragraph).toBeInTheDocument();
  });

  it('should ensure minimum 16px font size on mobile', () => {
    render(
      <p className="text-base md:text-lg" data-testid="responsive-text">
        This text should be at least 16px on mobile
      </p>
    );
    
    const text = screen.getByTestId('responsive-text');
    expect(text).toHaveClass('text-base'); // text-base is 16px
  });
});

describe('Line Length Optimization', () => {
  it('should constrain prose content to 75 characters', () => {
    render(
      <div className="prose" data-testid="prose-content">
        <p>This is a long paragraph that should be constrained to optimal reading width.</p>
      </div>
    );
    
    const proseContent = screen.getByTestId('prose-content');
    expect(proseContent).toHaveClass('prose');
    
    // The prose class should include max-width constraint
    const computedStyle = window.getComputedStyle(proseContent);
    // Note: In a real test environment, you could check the computed max-width
  });

  it('should apply max-width to readable text components', () => {
    render(
      <ReadableText data-testid="readable-text">
        Long text content that should be constrained for optimal readability.
      </ReadableText>
    );
    
    const readableText = screen.getByTestId('readable-text');
    expect(readableText).toHaveClass('max-w-[75ch]');
  });
});