# Typography System Documentation

## Overview

The ISOTEC Photovoltaic Contract System uses a comprehensive typography system built with Inter font family and configured through Tailwind CSS. This system provides excellent readability, professional appearance, and consistent visual hierarchy across all pages and components.

## Font Family

### Primary Font: Inter
- **Usage**: All text content (headings, body text, UI elements)
- **Source**: Google Fonts via Next.js font optimization
- **Fallback**: system-ui, sans-serif
- **Benefits**: 
  - Excellent screen readability
  - Professional and modern appearance
  - Wide language support
  - Optimized for digital interfaces

### Secondary Font: JetBrains Mono
- **Usage**: Code snippets, technical content, monospace requirements
- **Fallback**: monospace
- **Class**: `font-mono`

## Font Size Scale

The typography system uses a carefully crafted scale that works across all device sizes:

| Class | Size | Line Height | Usage |
|-------|------|-------------|-------|
| `text-xs` | 12px | 16px | Captions, labels |
| `text-sm` | 14px | 20px | Small text, secondary info |
| `text-base` | 16px | 24px | Body text, default |
| `text-lg` | 18px | 28px | Large body text |
| `text-xl` | 20px | 28px | Small headings |
| `text-2xl` | 24px | 32px | Medium headings |
| `text-3xl` | 30px | 36px | Large headings |
| `text-4xl` | 36px | 40px | Extra large headings |
| `text-5xl` | 48px | 48px | Hero headings |

## Font Weights

| Class | Weight | Usage |
|-------|--------|-------|
| `font-light` | 300 | Light emphasis |
| `font-normal` | 400 | Body text, default |
| `font-medium` | 500 | Subtle emphasis |
| `font-semibold` | 600 | Headings, important text |
| `font-bold` | 700 | Strong emphasis, primary headings |

## Line Heights

| Class | Value | Usage |
|-------|-------|-------|
| `leading-tight` | 1.25 | Headings, compact text |
| `leading-normal` | 1.5 | Default body text |
| `leading-relaxed` | 1.625 | Comfortable reading |
| `leading-loose` | 2 | Spacious text |

## Heading Hierarchy

The system provides semantic HTML headings with consistent styling:

```tsx
<h1 className="text-5xl font-bold">Main Page Title</h1>
<h2 className="text-4xl font-semibold">Section Title</h2>
<h3 className="text-3xl font-semibold">Subsection Title</h3>
<h4 className="text-2xl font-medium">Component Title</h4>
<h5 className="text-xl font-medium">Small Section Title</h5>
<h6 className="text-lg font-medium">Minor Title</h6>
```

## Responsive Typography

The system includes responsive classes for optimal display across devices:

```tsx
// Responsive heading
<h1 className="text-4xl md:text-5xl lg:text-6xl font-bold">
  Responsive Title
</h1>

// Responsive body text
<p className="text-base md:text-lg">
  Responsive paragraph text
</p>
```

## Color Integration

Typography works seamlessly with the ISOTEC color system:

```tsx
// Solar theme
<h2 className="text-2xl font-semibold text-solar-700">Solar Heading</h2>
<p className="text-solar-600">Solar body text</p>

// Ocean theme
<h2 className="text-2xl font-semibold text-ocean-700">Ocean Heading</h2>
<p className="text-ocean-600">Ocean body text</p>

// Neutral theme
<h2 className="text-2xl font-semibold text-neutral-800">Neutral Heading</h2>
<p className="text-neutral-600">Neutral body text</p>
```

## Prose Content

For long-form content, use the `.prose` class for optimal reading experience:

```tsx
<div className="prose max-w-none">
  <h3>Article Title</h3>
  <p>Article content with optimized spacing and line length...</p>
</div>
```

## Accessibility Features

The typography system includes several accessibility improvements:

- **Font smoothing**: Antialiased rendering for better screen display
- **Contrast ratios**: All text/background combinations meet WCAG 2.1 AA standards
- **Semantic hierarchy**: Proper HTML heading structure for screen readers
- **Readable line lengths**: Prose content limited to 75 characters for optimal reading
- **Sufficient spacing**: Proper margins and padding for easy scanning

## Implementation Details

### Tailwind Configuration

The typography system is configured in `tailwind.config.ts`:

```typescript
fontFamily: {
  sans: ['Inter', 'system-ui', 'sans-serif'],
  mono: ['JetBrains Mono', 'monospace'],
},
fontSize: {
  // Complete size scale with line heights
},
fontWeight: {
  // Complete weight scale
},
```

### Global Styles

Base typography styles are defined in `app/globals.css`:

```css
/* Typography improvements */
h1, h2, h3, h4, h5, h6 {
  font-weight: 600;
  line-height: 1.25;
  letter-spacing: -0.025em;
}

/* Improved text rendering */
body {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}
```

### Font Loading

Inter font is loaded via Next.js font optimization in `app/layout.tsx`:

```typescript
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });
```

## Testing

The typography system includes comprehensive tests:

- **Unit tests**: Component rendering and class application
- **Visual tests**: Typography test page at `/test-typography`
- **Accessibility tests**: Contrast ratios and semantic structure

## Usage Guidelines

1. **Use semantic HTML**: Always use proper heading hierarchy (h1 → h2 → h3)
2. **Responsive design**: Include responsive classes for mobile optimization
3. **Color contrast**: Ensure sufficient contrast for accessibility
4. **Line length**: Limit prose content to 75 characters for readability
5. **Consistent spacing**: Use the defined spacing scale for margins and padding

## Browser Support

The typography system works across all modern browsers:
- Chrome/Edge (Chromium-based)
- Firefox
- Safari
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance

- **Font optimization**: Next.js automatically optimizes Google Fonts loading
- **Font display**: Uses `font-display: swap` for better loading performance
- **Subset loading**: Only loads Latin character subset for optimal file size