/**
 * Responsive Testing Utilities
 * 
 * Utilities for testing responsive breakpoints and mobile optimization
 * Validates: Requirements 3.1, 3.2, 3.3, 3.6
 */

/**
 * Standard test breakpoints as specified in requirements
 */
export const TEST_BREAKPOINTS = {
  MOBILE_SMALL: 320,    // Small mobile (iPhone SE) - Requirement 3.1
  MOBILE_STANDARD: 375, // Standard mobile (iPhone) - Requirement 3.2
  TABLET: 768,          // Tablet - Requirement 3.3
  DESKTOP: 1024,        // Desktop - Requirement 3.6
  DESKTOP_LARGE: 1920,  // Large desktop - Requirement 3.6
} as const;

/**
 * Device presets for testing
 */
export const DEVICE_PRESETS = {
  // Mobile devices
  'iPhone SE': { width: 320, height: 568, userAgent: 'iPhone' },
  'iPhone 12': { width: 375, height: 812, userAgent: 'iPhone' },
  'iPhone 12 Pro Max': { width: 428, height: 926, userAgent: 'iPhone' },
  'Samsung Galaxy S21': { width: 360, height: 800, userAgent: 'Android' },
  'Google Pixel 5': { width: 393, height: 851, userAgent: 'Android' },
  
  // Tablets
  'iPad': { width: 768, height: 1024, userAgent: 'iPad' },
  'iPad Pro': { width: 1024, height: 1366, userAgent: 'iPad' },
  'Samsung Galaxy Tab': { width: 800, height: 1280, userAgent: 'Android' },
  
  // Desktop
  'Desktop Small': { width: 1024, height: 768, userAgent: 'Desktop' },
  'Desktop Standard': { width: 1440, height: 900, userAgent: 'Desktop' },
  'Desktop Large': { width: 1920, height: 1080, userAgent: 'Desktop' },
  'Desktop 4K': { width: 3840, height: 2160, userAgent: 'Desktop' },
} as const;

/**
 * Touch target validation
 */
export const TOUCH_TARGET_REQUIREMENTS = {
  MIN_SIZE: 44,        // Minimum 44x44px
  RECOMMENDED_SIZE: 48, // Recommended 48x48px
  MIN_SPACING: 8,      // Minimum 8px spacing between targets
} as const;

/**
 * Responsive testing interface
 */
export interface ResponsiveTestResult {
  breakpoint: keyof typeof TEST_BREAKPOINTS;
  width: number;
  passed: boolean;
  issues: string[];
  touchTargets: TouchTargetResult[];
  layout: LayoutResult;
  performance: PerformanceResult;
}

export interface TouchTargetResult {
  element: string;
  width: number;
  height: number;
  passed: boolean;
  issues: string[];
}

export interface LayoutResult {
  hasHorizontalScroll: boolean;
  contentFitsViewport: boolean;
  textReadable: boolean;
  imagesScaled: boolean;
  issues: string[];
}

export interface PerformanceResult {
  loadTime: number;
  renderTime: number;
  interactionReady: number;
  issues: string[];
}

/**
 * Responsive testing class
 */
export class ResponsiveTestRunner {
  private viewport: { width: number; height: number } = { width: 1024, height: 768 };
  
  /**
   * Set viewport size for testing
   */
  setViewport(width: number, height: number): void {
    this.viewport = { width, height };
    
    if (typeof window !== 'undefined') {
      // In browser environment, we can't actually resize the window
      // but we can simulate it for testing purposes
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: width,
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: height,
      });
      
      // Trigger resize event
      window.dispatchEvent(new Event('resize'));
    }
  }
  
  /**
   * Test all required breakpoints
   */
  async testAllBreakpoints(): Promise<ResponsiveTestResult[]> {
    const results: ResponsiveTestResult[] = [];
    
    for (const [name, width] of Object.entries(TEST_BREAKPOINTS)) {
      const result = await this.testBreakpoint(name as keyof typeof TEST_BREAKPOINTS, width);
      results.push(result);
    }
    
    return results;
  }
  
  /**
   * Test specific breakpoint
   */
  async testBreakpoint(
    breakpoint: keyof typeof TEST_BREAKPOINTS,
    width: number
  ): Promise<ResponsiveTestResult> {
    // Set viewport
    this.setViewport(width, 768);
    
    // Wait for layout to settle
    await this.waitForLayout();
    
    const issues: string[] = [];
    
    // Test touch targets
    const touchTargets = this.testTouchTargets();
    if (touchTargets.some(t => !t.passed)) {
      issues.push('Touch target size requirements not met');
    }
    
    // Test layout
    const layout = this.testLayout();
    if (layout.issues.length > 0) {
      issues.push(...layout.issues);
    }
    
    // Test performance
    const performance = await this.testPerformance();
    if (performance.issues.length > 0) {
      issues.push(...performance.issues);
    }
    
    return {
      breakpoint,
      width,
      passed: issues.length === 0,
      issues,
      touchTargets,
      layout,
      performance,
    };
  }
  
  /**
   * Test touch target sizes
   */
  testTouchTargets(): TouchTargetResult[] {
    if (typeof document === 'undefined') {
      return [];
    }
    
    const results: TouchTargetResult[] = [];
    
    // Find all interactive elements
    const interactiveSelectors = [
      'button',
      'a',
      'input[type="button"]',
      'input[type="submit"]',
      'input[type="reset"]',
      '[role="button"]',
      '[tabindex="0"]',
      '.cursor-pointer',
    ];
    
    const elements = document.querySelectorAll(interactiveSelectors.join(', '));
    
    elements.forEach((element, index) => {
      const rect = element.getBoundingClientRect();
      const computedStyle = window.getComputedStyle(element);
      
      // Get actual touch target size (including padding)
      const width = rect.width;
      const height = rect.height;
      
      const issues: string[] = [];
      
      // Check minimum size requirements
      if (width < TOUCH_TARGET_REQUIREMENTS.MIN_SIZE) {
        issues.push(`Width ${width}px is below minimum ${TOUCH_TARGET_REQUIREMENTS.MIN_SIZE}px`);
      }
      
      if (height < TOUCH_TARGET_REQUIREMENTS.MIN_SIZE) {
        issues.push(`Height ${height}px is below minimum ${TOUCH_TARGET_REQUIREMENTS.MIN_SIZE}px`);
      }
      
      // Check spacing (simplified - would need more complex logic for full implementation)
      const marginTop = parseInt(computedStyle.marginTop) || 0;
      const marginBottom = parseInt(computedStyle.marginBottom) || 0;
      const marginLeft = parseInt(computedStyle.marginLeft) || 0;
      const marginRight = parseInt(computedStyle.marginRight) || 0;
      
      const minSpacing = TOUCH_TARGET_REQUIREMENTS.MIN_SPACING;
      if (marginTop < minSpacing && marginBottom < minSpacing && 
          marginLeft < minSpacing && marginRight < minSpacing) {
        issues.push(`Insufficient spacing around touch target`);
      }
      
      results.push({
        element: `${element.tagName.toLowerCase()}[${index}]`,
        width,
        height,
        passed: issues.length === 0,
        issues,
      });
    });
    
    return results;
  }
  
  /**
   * Test layout responsiveness
   */
  testLayout(): LayoutResult {
    if (typeof document === 'undefined') {
      return {
        hasHorizontalScroll: false,
        contentFitsViewport: true,
        textReadable: true,
        imagesScaled: true,
        issues: [],
      };
    }
    
    const issues: string[] = [];
    
    // Check for horizontal scroll
    const hasHorizontalScroll = document.documentElement.scrollWidth > this.viewport.width;
    if (hasHorizontalScroll) {
      issues.push('Horizontal scrolling detected');
    }
    
    // Check if content fits viewport
    const body = document.body;
    const contentFitsViewport = body.scrollWidth <= this.viewport.width;
    if (!contentFitsViewport) {
      issues.push('Content exceeds viewport width');
    }
    
    // Check text readability (simplified)
    const textElements = document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6');
    let textReadable = true;
    
    textElements.forEach(element => {
      const computedStyle = window.getComputedStyle(element);
      const fontSize = parseInt(computedStyle.fontSize);
      
      // Minimum font size for mobile readability
      const minFontSize = this.viewport.width < 768 ? 14 : 12;
      if (fontSize < minFontSize) {
        textReadable = false;
        issues.push(`Text too small: ${fontSize}px (minimum: ${minFontSize}px)`);
      }
    });
    
    // Check image scaling
    const images = document.querySelectorAll('img');
    let imagesScaled = true;
    
    images.forEach(img => {
      const rect = img.getBoundingClientRect();
      if (rect.width > this.viewport.width) {
        imagesScaled = false;
        issues.push(`Image exceeds viewport width: ${rect.width}px`);
      }
    });
    
    return {
      hasHorizontalScroll,
      contentFitsViewport,
      textReadable,
      imagesScaled,
      issues,
    };
  }
  
  /**
   * Test performance metrics
   */
  async testPerformance(): Promise<PerformanceResult> {
    const issues: string[] = [];
    
    // Simplified performance testing
    const loadTime = performance.now();
    const renderTime = loadTime; // Would measure actual render time in real implementation
    const interactionReady = loadTime; // Would measure time to interactive
    
    // Check performance thresholds
    if (loadTime > 3000) {
      issues.push(`Load time too slow: ${loadTime}ms`);
    }
    
    if (renderTime > 1000) {
      issues.push(`Render time too slow: ${renderTime}ms`);
    }
    
    return {
      loadTime,
      renderTime,
      interactionReady,
      issues,
    };
  }
  
  /**
   * Wait for layout to settle
   */
  private async waitForLayout(): Promise<void> {
    return new Promise(resolve => {
      if (typeof requestAnimationFrame !== 'undefined') {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => resolve());
        });
      } else {
        setTimeout(resolve, 16);
      }
    });
  }
  
  /**
   * Generate test report
   */
  generateReport(results: ResponsiveTestResult[]): string {
    let report = '# Responsive Design Test Report\n\n';
    
    const passedTests = results.filter(r => r.passed).length;
    const totalTests = results.length;
    
    report += `## Summary\n`;
    report += `- **Passed**: ${passedTests}/${totalTests} breakpoints\n`;
    report += `- **Success Rate**: ${Math.round((passedTests / totalTests) * 100)}%\n\n`;
    
    report += `## Breakpoint Results\n\n`;
    
    results.forEach(result => {
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      report += `### ${result.breakpoint} (${result.width}px) ${status}\n\n`;
      
      if (result.issues.length > 0) {
        report += `**Issues:**\n`;
        result.issues.forEach(issue => {
          report += `- ${issue}\n`;
        });
        report += '\n';
      }
      
      // Touch targets summary
      const failedTouchTargets = result.touchTargets.filter(t => !t.passed);
      if (failedTouchTargets.length > 0) {
        report += `**Touch Target Issues:**\n`;
        failedTouchTargets.forEach(target => {
          report += `- ${target.element}: ${target.issues.join(', ')}\n`;
        });
        report += '\n';
      }
      
      // Layout issues
      if (result.layout.issues.length > 0) {
        report += `**Layout Issues:**\n`;
        result.layout.issues.forEach(issue => {
          report += `- ${issue}\n`;
        });
        report += '\n';
      }
      
      // Performance issues
      if (result.performance.issues.length > 0) {
        report += `**Performance Issues:**\n`;
        result.performance.issues.forEach(issue => {
          report += `- ${issue}\n`;
        });
        report += '\n';
      }
    });
    
    return report;
  }
}

/**
 * Convenience function to run responsive tests
 */
export async function runResponsiveTests(): Promise<ResponsiveTestResult[]> {
  const runner = new ResponsiveTestRunner();
  return await runner.testAllBreakpoints();
}

/**
 * Convenience function to test specific device
 */
export async function testDevice(deviceName: keyof typeof DEVICE_PRESETS): Promise<ResponsiveTestResult> {
  const device = DEVICE_PRESETS[deviceName];
  const runner = new ResponsiveTestRunner();
  
  // Determine breakpoint category
  let breakpoint: keyof typeof TEST_BREAKPOINTS;
  if (device.width <= 375) breakpoint = 'MOBILE_STANDARD';
  else if (device.width <= 768) breakpoint = 'TABLET';
  else if (device.width <= 1024) breakpoint = 'DESKTOP';
  else breakpoint = 'DESKTOP_LARGE';
  
  return await runner.testBreakpoint(breakpoint, device.width);
}

// Export the test runner and utilities
export default ResponsiveTestRunner;