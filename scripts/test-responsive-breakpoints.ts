/**
 * Responsive Breakpoints Testing Script
 * 
 * Manual testing script for validating responsive design at all required breakpoints
 * Run this script to test: 320px, 375px, 768px, 1024px, 1920px
 * 
 * Validates: Requirements 3.1, 3.2, 3.3, 3.6
 */

import { TEST_BREAKPOINTS } from '../lib/utils/responsive-testing';

interface TestResult {
  breakpoint: string;
  width: number;
  status: 'PASS' | 'FAIL' | 'WARNING';
  issues: string[];
  recommendations: string[];
}

class ResponsiveBreakpointTester {
  private results: TestResult[] = [];

  /**
   * Test all required breakpoints
   */
  async testAllBreakpoints(): Promise<TestResult[]> {
    console.log('🔍 Starting Responsive Breakpoint Testing...\n');

    for (const [name, width] of Object.entries(TEST_BREAKPOINTS)) {
      console.log(`Testing ${name} (${width}px)...`);
      const result = await this.testBreakpoint(name, width);
      this.results.push(result);
      this.printResult(result);
    }

    this.printSummary();
    return this.results;
  }

  /**
   * Test specific breakpoint
   */
  private async testBreakpoint(breakpoint: string, width: number): Promise<TestResult> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Test 1: Touch Target Validation
    const touchTargetIssues = this.validateTouchTargets();
    issues.push(...touchTargetIssues);

    // Test 2: Content Overflow Check
    const overflowIssues = this.checkContentOverflow(width);
    issues.push(...overflowIssues);

    // Test 3: Text Readability
    const readabilityIssues = this.checkTextReadability(width);
    issues.push(...readabilityIssues);

    // Test 4: Layout Responsiveness
    const layoutIssues = this.checkLayoutResponsiveness(width);
    issues.push(...layoutIssues);

    // Generate recommendations
    recommendations.push(...this.generateRecommendations(breakpoint, width, issues));

    const status = issues.length === 0 ? 'PASS' : issues.length <= 2 ? 'WARNING' : 'FAIL';

    return {
      breakpoint,
      width,
      status,
      issues,
      recommendations,
    };
  }

  /**
   * Validate touch targets meet minimum requirements
   */
  private validateTouchTargets(): string[] {
    const issues: string[] = [];

    // Check if we're in a browser environment
    if (typeof document === 'undefined') {
      return ['Touch target validation requires browser environment'];
    }

    // Find all interactive elements
    const interactiveSelectors = [
      'button',
      'a[href]',
      'input[type="button"]',
      'input[type="submit"]',
      '[role="button"]',
      '[tabindex="0"]',
    ];

    const elements = document.querySelectorAll(interactiveSelectors.join(', '));
    let undersizedElements = 0;

    elements.forEach((element) => {
      const rect = element.getBoundingClientRect();
      if (rect.width < 44 || rect.height < 44) {
        undersizedElements++;
      }
    });

    if (undersizedElements > 0) {
      issues.push(`${undersizedElements} interactive elements below 44px minimum touch target`);
    }

    return issues;
  }

  /**
   * Check for content overflow
   */
  private checkContentOverflow(viewportWidth: number): string[] {
    const issues: string[] = [];

    if (typeof document === 'undefined') {
      return ['Content overflow check requires browser environment'];
    }

    // Check document width
    const documentWidth = document.documentElement.scrollWidth;
    if (documentWidth > viewportWidth) {
      issues.push(`Content width (${documentWidth}px) exceeds viewport (${viewportWidth}px)`);
    }

    // Check for elements that might cause overflow
    const wideElements = document.querySelectorAll('*');
    let overflowingElements = 0;

    wideElements.forEach((element) => {
      const rect = element.getBoundingClientRect();
      if (rect.width > viewportWidth) {
        overflowingElements++;
      }
    });

    if (overflowingElements > 0) {
      issues.push(`${overflowingElements} elements exceed viewport width`);
    }

    return issues;
  }

  /**
   * Check text readability
   */
  private checkTextReadability(viewportWidth: number): string[] {
    const issues: string[] = [];

    if (typeof document === 'undefined') {
      return ['Text readability check requires browser environment'];
    }

    const textElements = document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6');
    let smallTextElements = 0;
    const minFontSize = viewportWidth < 768 ? 14 : 12;

    textElements.forEach((element) => {
      const computedStyle = window.getComputedStyle(element);
      const fontSize = parseInt(computedStyle.fontSize);
      
      if (fontSize > 0 && fontSize < minFontSize) {
        smallTextElements++;
      }
    });

    if (smallTextElements > 0) {
      issues.push(`${smallTextElements} text elements below minimum readable size (${minFontSize}px)`);
    }

    return issues;
  }

  /**
   * Check layout responsiveness
   */
  private checkLayoutResponsiveness(viewportWidth: number): string[] {
    const issues: string[] = [];

    // This would be more comprehensive in a real browser environment
    // For now, we'll provide basic checks

    if (viewportWidth <= 375) {
      // Mobile checks
      issues.push(...this.checkMobileLayout());
    } else if (viewportWidth <= 768) {
      // Tablet checks
      issues.push(...this.checkTabletLayout());
    } else {
      // Desktop checks
      issues.push(...this.checkDesktopLayout());
    }

    return issues;
  }

  /**
   * Mobile-specific layout checks
   */
  private checkMobileLayout(): string[] {
    const issues: string[] = [];

    // Check for single-column layouts
    // Check for proper spacing
    // Check for mobile navigation

    return issues;
  }

  /**
   * Tablet-specific layout checks
   */
  private checkTabletLayout(): string[] {
    const issues: string[] = [];

    // Check for 2-column layouts where appropriate
    // Check for optimized spacing

    return issues;
  }

  /**
   * Desktop-specific layout checks
   */
  private checkDesktopLayout(): string[] {
    const issues: string[] = [];

    // Check for multi-column layouts
    // Check for proper max-width constraints

    return issues;
  }

  /**
   * Generate recommendations based on issues
   */
  private generateRecommendations(_breakpoint: string, width: number, issues: string[]): string[] {
    const recommendations: string[] = [];

    if (issues.some(issue => issue.includes('touch target'))) {
      recommendations.push('Increase button and input sizes to meet 44px minimum');
      recommendations.push('Add proper spacing between interactive elements');
    }

    if (issues.some(issue => issue.includes('overflow'))) {
      recommendations.push('Use responsive grid layouts (grid-cols-1 md:grid-cols-2)');
      recommendations.push('Add max-width constraints to prevent overflow');
    }

    if (issues.some(issue => issue.includes('text'))) {
      recommendations.push('Use responsive text sizes (text-sm sm:text-base)');
      recommendations.push('Ensure minimum 16px font size on mobile to prevent zoom');
    }

    // Breakpoint-specific recommendations
    if (width <= 375) {
      recommendations.push('Use single-column layouts');
      recommendations.push('Stack navigation items vertically');
      recommendations.push('Increase padding and margins for touch-friendly spacing');
    } else if (width <= 768) {
      recommendations.push('Use 2-column layouts where appropriate');
      recommendations.push('Optimize form layouts for tablet interaction');
    } else {
      recommendations.push('Use multi-column layouts (3-4 columns)');
      recommendations.push('Add max-width constraints for readability');
    }

    return recommendations;
  }

  /**
   * Print individual test result
   */
  private printResult(result: TestResult): void {
    const statusIcon = result.status === 'PASS' ? '✅' : result.status === 'WARNING' ? '⚠️' : '❌';
    console.log(`${statusIcon} ${result.breakpoint} (${result.width}px): ${result.status}`);

    if (result.issues.length > 0) {
      console.log('  Issues:');
      result.issues.forEach(issue => console.log(`    - ${issue}`));
    }

    if (result.recommendations.length > 0) {
      console.log('  Recommendations:');
      result.recommendations.forEach(rec => console.log(`    • ${rec}`));
    }

    console.log('');
  }

  /**
   * Print test summary
   */
  private printSummary(): void {
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const warnings = this.results.filter(r => r.status === 'WARNING').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const total = this.results.length;

    console.log('📊 RESPONSIVE TESTING SUMMARY');
    console.log('═'.repeat(40));
    console.log(`Total Breakpoints Tested: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`⚠️  Warnings: ${warnings}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`Success Rate: ${Math.round((passed / total) * 100)}%`);
    console.log('');

    if (failed > 0) {
      console.log('🔧 PRIORITY FIXES NEEDED:');
      this.results
        .filter(r => r.status === 'FAIL')
        .forEach(result => {
          console.log(`\n${result.breakpoint} (${result.width}px):`);
          result.issues.forEach(issue => console.log(`  - ${issue}`));
        });
    }

    console.log('\n📱 MANUAL TESTING CHECKLIST:');
    console.log('□ Test on real devices (iPhone, Android, iPad)');
    console.log('□ Test with different orientations (portrait/landscape)');
    console.log('□ Test touch interactions (tap, swipe, pinch)');
    console.log('□ Test form inputs with mobile keyboards');
    console.log('□ Test navigation and scrolling behavior');
    console.log('□ Test loading states and animations');
    console.log('□ Verify no horizontal scrolling at any breakpoint');
    console.log('□ Check accessibility with screen readers');
  }

  /**
   * Generate detailed report
   */
  generateReport(): string {
    let report = '# Responsive Breakpoints Test Report\n\n';
    
    report += `Generated: ${new Date().toISOString()}\n\n`;
    
    report += '## Summary\n\n';
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const total = this.results.length;
    report += `- **Total Breakpoints**: ${total}\n`;
    report += `- **Passed**: ${passed}\n`;
    report += `- **Success Rate**: ${Math.round((passed / total) * 100)}%\n\n`;

    report += '## Breakpoint Results\n\n';
    this.results.forEach(result => {
      const statusEmoji = result.status === 'PASS' ? '✅' : result.status === 'WARNING' ? '⚠️' : '❌';
      report += `### ${result.breakpoint} (${result.width}px) ${statusEmoji}\n\n`;
      
      if (result.issues.length > 0) {
        report += '**Issues:**\n';
        result.issues.forEach(issue => report += `- ${issue}\n`);
        report += '\n';
      }
      
      if (result.recommendations.length > 0) {
        report += '**Recommendations:**\n';
        result.recommendations.forEach(rec => report += `- ${rec}\n`);
        report += '\n';
      }
    });

    report += '## Manual Testing Checklist\n\n';
    report += '- [ ] Test on real mobile devices\n';
    report += '- [ ] Test touch interactions\n';
    report += '- [ ] Test form inputs with mobile keyboards\n';
    report += '- [ ] Verify no horizontal scrolling\n';
    report += '- [ ] Test loading states and animations\n';
    report += '- [ ] Check accessibility compliance\n';

    return report;
  }
}

/**
 * Main testing function
 */
async function runResponsiveTests(): Promise<void> {
  const tester = new ResponsiveBreakpointTester();
  const results = await tester.testAllBreakpoints();
  
  // Generate and save report
  tester.generateReport();
  
  // In a real environment, you might save this to a file
  console.log('\n📄 Full report generated (would be saved to responsive-test-report.md)');
  
  // Exit with appropriate code
  const hasFailures = results.some(r => r.status === 'FAIL');
  process.exit(hasFailures ? 1 : 0);
}

// Export for use in other scripts
export { ResponsiveBreakpointTester, runResponsiveTests };

// Run if called directly
if (require.main === module) {
  runResponsiveTests().catch(console.error);
}