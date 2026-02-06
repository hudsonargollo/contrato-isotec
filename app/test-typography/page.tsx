'use client';

/**
 * Test page to verify typography system configuration
 * This page demonstrates the Inter font family, font sizes, weights, and line heights
 */

export default function TestTypographyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-12">
        
        {/* Header */}
        <div className="text-center">
          <h1 className="text-5xl font-bold text-solar-600 mb-4">
            Typography System Test
          </h1>
          <p className="text-lg text-neutral-600">
            Testing Inter font family with ISOTEC design system
          </p>
        </div>

        {/* Font Family Test */}
        <section className="space-y-4">
          <h2 className="text-3xl font-semibold text-ocean-700 border-b border-neutral-200 pb-2">
            Font Family
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-neutral-50 rounded-lg">
              <h3 className="text-xl font-medium mb-3">Sans Serif (Inter)</h3>
              <p className="font-sans text-base mb-2">
                The quick brown fox jumps over the lazy dog.
              </p>
              <p className="font-sans text-sm text-neutral-600">
                Inter font provides excellent readability and modern appearance.
              </p>
            </div>
            <div className="p-6 bg-neutral-50 rounded-lg">
              <h3 className="text-xl font-medium mb-3">Monospace (JetBrains Mono)</h3>
              <p className="font-mono text-base mb-2">
                The quick brown fox jumps over the lazy dog.
              </p>
              <p className="font-mono text-sm text-neutral-600">
                Perfect for code snippets and technical content.
              </p>
            </div>
          </div>
        </section>

        {/* Font Sizes */}
        <section className="space-y-4">
          <h2 className="text-3xl font-semibold text-ocean-700 border-b border-neutral-200 pb-2">
            Font Sizes
          </h2>
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <span className="text-xs text-neutral-500 w-16">text-xs</span>
              <span className="text-xs">Extra small text (12px)</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-neutral-500 w-16">text-sm</span>
              <span className="text-sm">Small text (14px)</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-neutral-500 w-16">text-base</span>
              <span className="text-base">Base text (16px)</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-neutral-500 w-16">text-lg</span>
              <span className="text-lg">Large text (18px)</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-neutral-500 w-16">text-xl</span>
              <span className="text-xl">Extra large text (20px)</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-neutral-500 w-16">text-2xl</span>
              <span className="text-2xl">2X large text (24px)</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-neutral-500 w-16">text-3xl</span>
              <span className="text-3xl">3X large text (30px)</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-neutral-500 w-16">text-4xl</span>
              <span className="text-4xl">4X large text (36px)</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-neutral-500 w-16">text-5xl</span>
              <span className="text-5xl">5X large text (48px)</span>
            </div>
          </div>
        </section>

        {/* Font Weights */}
        <section className="space-y-4">
          <h2 className="text-3xl font-semibold text-ocean-700 border-b border-neutral-200 pb-2">
            Font Weights
          </h2>
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <span className="text-xs text-neutral-500 w-20">font-light</span>
              <span className="text-lg font-light">Light weight (300)</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-neutral-500 w-20">font-normal</span>
              <span className="text-lg font-normal">Normal weight (400)</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-neutral-500 w-20">font-medium</span>
              <span className="text-lg font-medium">Medium weight (500)</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-neutral-500 w-20">font-semibold</span>
              <span className="text-lg font-semibold">Semibold weight (600)</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-neutral-500 w-20">font-bold</span>
              <span className="text-lg font-bold">Bold weight (700)</span>
            </div>
          </div>
        </section>

        {/* Heading Hierarchy */}
        <section className="space-y-4">
          <h2 className="text-3xl font-semibold text-ocean-700 border-b border-neutral-200 pb-2">
            Heading Hierarchy
          </h2>
          <div className="space-y-4">
            <h1 className="text-5xl font-bold text-neutral-900">
              H1 - Main Page Title
            </h1>
            <h2 className="text-4xl font-semibold text-neutral-800">
              H2 - Section Title
            </h2>
            <h3 className="text-3xl font-semibold text-neutral-700">
              H3 - Subsection Title
            </h3>
            <h4 className="text-2xl font-medium text-neutral-700">
              H4 - Component Title
            </h4>
            <h5 className="text-xl font-medium text-neutral-600">
              H5 - Small Section Title
            </h5>
            <h6 className="text-lg font-medium text-neutral-600">
              H6 - Minor Title
            </h6>
          </div>
        </section>

        {/* Line Heights */}
        <section className="space-y-4">
          <h2 className="text-3xl font-semibold text-ocean-700 border-b border-neutral-200 pb-2">
            Line Heights
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-neutral-50 rounded-lg">
              <h3 className="text-lg font-medium mb-3">Normal (leading-normal)</h3>
              <p className="text-base leading-normal">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.
              </p>
            </div>
            <div className="p-6 bg-neutral-50 rounded-lg">
              <h3 className="text-lg font-medium mb-3">Relaxed (leading-relaxed)</h3>
              <p className="text-base leading-relaxed">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.
              </p>
            </div>
          </div>
        </section>

        {/* Responsive Typography */}
        <section className="space-y-4">
          <h2 className="text-3xl font-semibold text-ocean-700 border-b border-neutral-200 pb-2">
            Responsive Typography
          </h2>
          <div className="space-y-4">
            <div className="p-6 bg-gradient-to-r from-solar-50 to-ocean-50 rounded-lg">
              <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold text-solar-700 mb-4">
                Responsive Heading
              </h3>
              <p className="text-base md:text-lg text-neutral-700">
                This heading and text scale appropriately across different screen sizes.
                Resize your browser to see the effect.
              </p>
            </div>
          </div>
        </section>

        {/* Readability Improvements Section */}
        <section className="space-y-4">
          <h2 className="text-3xl font-semibold text-ocean-700 border-b border-neutral-200 pb-2">
            Readability Improvements
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Optimal Line Length */}
            <div className="p-6 bg-neutral-50 rounded-lg">
              <h3 className="text-xl font-medium mb-4 text-neutral-900">
                Optimal Line Length (75ch)
              </h3>
              <div className="prose">
                <p className="text-base leading-relaxed text-neutral-700">
                  This paragraph demonstrates optimal line length for readability. Research shows that 
                  lines between 45-75 characters are easiest to read. This text is constrained to 
                  75 characters maximum width, which provides comfortable reading without requiring 
                  excessive eye movement. The line height is set to 1.7 for improved readability 
                  and better text flow.
                </p>
              </div>
            </div>
            
            {/* Enhanced Paragraph Spacing */}
            <div className="p-6 bg-neutral-50 rounded-lg">
              <h3 className="text-xl font-medium mb-4 text-neutral-900">
                Enhanced Paragraph Spacing
              </h3>
              <div className="space-y-5">
                <p className="text-base leading-relaxed text-neutral-700 max-w-[75ch]">
                  This section demonstrates improved paragraph spacing. Each paragraph has 
                  increased bottom margin for better visual separation and easier scanning.
                </p>
                <p className="text-base leading-relaxed text-neutral-700 max-w-[75ch]">
                  The spacing between paragraphs helps readers distinguish between different 
                  ideas and improves the overall reading experience. This is especially 
                  important for longer content.
                </p>
              </div>
            </div>
            
            {/* Mobile-Optimized Text */}
            <div className="p-6 bg-gradient-to-br from-solar-50 to-ocean-50 rounded-lg">
              <h3 className="text-xl font-medium mb-4 text-neutral-900">
                Mobile-Optimized Typography
              </h3>
              <p className="text-base md:text-lg leading-normal md:leading-relaxed text-neutral-700 max-w-[75ch]">
                This text adjusts for mobile devices with appropriate font sizes and line heights. 
                On mobile, the minimum font size is 16px to prevent zoom, and line height is 
                optimized for smaller screens while maintaining readability.
              </p>
            </div>
            
            {/* Contrast Ratios */}
            <div className="p-6 bg-white border border-neutral-200 rounded-lg">
              <h3 className="text-xl font-medium mb-4 text-neutral-900">
                Contrast Ratios (WCAG AA)
              </h3>
              <div className="space-y-3">
                <p className="text-neutral-900 text-base">
                  High contrast text (16.75:1 ratio) - Excellent readability
                </p>
                <p className="text-neutral-700 text-base">
                  Medium contrast text (7.8:1 ratio) - AAA compliant
                </p>
                <p className="text-neutral-600 text-base">
                  Lower contrast text (4.6:1 ratio) - AA compliant
                </p>
              </div>
            </div>
            
          </div>
        </section>

        {/* Enhanced Prose Content */}
        <section className="space-y-4">
          <h2 className="text-3xl font-semibold text-ocean-700 border-b border-neutral-200 pb-2">
            Enhanced Prose Content
          </h2>
          <div className="prose max-w-none">
            <h3>Optimized Reading Experience</h3>
            <p>
              This section demonstrates the enhanced prose styling for optimal reading experience. 
              The line length is constrained to 75 characters maximum to improve readability, 
              and proper spacing is applied between elements for better visual hierarchy.
            </p>
            <p>
              Inter font provides excellent legibility at all sizes, making it perfect 
              for both headings and body text. The font features proper letter spacing 
              and character shapes that work exceptionally well on screens. The enhanced 
              line height of 1.7 provides comfortable reading flow.
            </p>
            <h4>Key Readability Improvements</h4>
            <ul>
              <li>Optimal line length (75 characters maximum)</li>
              <li>Enhanced line height (1.7) for better text flow</li>
              <li>Increased paragraph spacing for visual separation</li>
              <li>Mobile-optimized font sizes (minimum 16px)</li>
              <li>WCAG AA compliant contrast ratios</li>
              <li>Professional typography hierarchy</li>
            </ul>
            <h4>Mobile Optimizations</h4>
            <p>
              On mobile devices, the typography system automatically adjusts font sizes 
              and line heights for optimal readability. The minimum font size is 16px 
              to prevent browser zoom, and spacing is optimized for touch interfaces.
            </p>
          </div>
        </section>
        <section className="space-y-4">
          <h2 className="text-3xl font-semibold text-ocean-700 border-b border-neutral-200 pb-2">
            Typography with ISOTEC Colors
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-solar-50 rounded-lg">
              <h3 className="text-xl font-semibold text-solar-800 mb-3">
                Solar Theme
              </h3>
              <p className="text-solar-700">
                Primary brand color for headings and important text.
              </p>
              <p className="text-solar-600 text-sm mt-2">
                Secondary solar text for supporting information.
              </p>
            </div>
            <div className="p-6 bg-ocean-50 rounded-lg">
              <h3 className="text-xl font-semibold text-ocean-800 mb-3">
                Ocean Theme
              </h3>
              <p className="text-ocean-700">
                Professional blue for technology and trust.
              </p>
              <p className="text-ocean-600 text-sm mt-2">
                Secondary ocean text for supporting information.
              </p>
            </div>
            <div className="p-6 bg-energy-50 rounded-lg">
              <h3 className="text-xl font-semibold text-energy-800 mb-3">
                Energy Theme
              </h3>
              <p className="text-energy-700">
                Green accent for sustainability and success.
              </p>
              <p className="text-energy-600 text-sm mt-2">
                Secondary energy text for supporting information.
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center py-8 border-t border-neutral-200">
          <p className="text-sm text-neutral-500">
            Typography system configured with Inter font family and ISOTEC design tokens
          </p>
        </footer>

      </div>
    </div>
  );
}