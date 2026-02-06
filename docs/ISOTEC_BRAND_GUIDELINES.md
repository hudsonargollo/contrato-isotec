# ISOTEC Brand Guidelines
## Visual Identity System for Photovoltaic Contract System

### Table of Contents
1. [Brand Overview](#brand-overview)
2. [Color System](#color-system)
3. [Typography Guidelines](#typography-guidelines)
4. [Logo Usage Guidelines](#logo-usage-guidelines)
5. [Spacing and Layout Rules](#spacing-and-layout-rules)
6. [Component Guidelines](#component-guidelines)
7. [Mascot Usage Guidelines](#mascot-usage-guidelines)
8. [Implementation Examples](#implementation-examples)

---

## Brand Overview

### Brand Identity
ISOTEC is a professional solar energy company focused on photovoltaic installations. Our brand identity reflects:
- **Innovation**: Cutting-edge solar technology
- **Reliability**: Professional, trustworthy service
- **Sustainability**: Environmental consciousness
- **Accessibility**: User-friendly digital solutions

### Brand Personality
- Professional yet approachable
- Innovative and forward-thinking
- Environmentally conscious
- Trustworthy and reliable

### Visual Principles
1. **Solar-Inspired**: Colors and elements reflect solar energy themes
2. **Professional**: Clean, modern design that builds trust
3. **Accessible**: High contrast, readable typography
4. **Consistent**: Unified experience across all touchpoints

---

## Color System

### Primary Color Palette

#### Solar Colors (Primary Brand Colors)
```css
--solar-50: #fffbeb;   /* Lightest yellow - backgrounds */
--solar-100: #fef3c7;  /* Light yellow - subtle accents */
--solar-200: #fde68a;  /* Soft yellow - hover states */
--solar-300: #fcd34d;  /* Medium yellow - secondary actions */
--solar-400: #fbbf24;  /* Bright yellow - attention elements */
--solar-500: #f59e0b;  /* PRIMARY BRAND COLOR - main CTAs */
--solar-600: #d97706;  /* Dark yellow - hover states */
--solar-700: #b45309;  /* Darker yellow - active states */
--solar-800: #92400e;  /* Deep yellow - text on light */
--solar-900: #78350f;  /* Darkest yellow - emphasis */
```

#### Ocean Colors (Secondary Brand Colors)
```css
--ocean-50: #eff6ff;   /* Lightest blue - backgrounds */
--ocean-100: #dbeafe;  /* Light blue - subtle accents */
--ocean-200: #bfdbfe;  /* Soft blue - hover states */
--ocean-300: #93c5fd;  /* Medium blue - secondary elements */
--ocean-400: #60a5fa;  /* Bright blue - links */
--ocean-500: #2563eb;  /* SECONDARY BRAND COLOR - secondary CTAs */
--ocean-600: #1d4ed8;  /* Dark blue - hover states */
--ocean-700: #1e40af;  /* Darker blue - active states */
--ocean-800: #1e3a8a;  /* Deep blue - text */
--ocean-900: #1e3a8a;  /* Darkest blue - emphasis */
```
#### Energy Colors (Success/Accent Colors)
```css
--energy-50: #f0fdf4;   /* Lightest green - success backgrounds */
--energy-100: #dcfce7;  /* Light green - success states */
--energy-200: #bbf7d0;  /* Soft green - hover states */
--energy-300: #86efac;  /* Medium green - secondary success */
--energy-400: #4ade80;  /* Bright green - success elements */
--energy-500: #16a34a;  /* SUCCESS COLOR - completed states */
--energy-600: #15803d;  /* Dark green - hover states */
--energy-700: #166534;  /* Darker green - active states */
--energy-800: #14532d;  /* Deep green - text */
--energy-900: #14532d;  /* Darkest green - emphasis */
```

#### Neutral Colors (Professional Grays)
```css
--neutral-50: #fafafa;   /* Lightest gray - page backgrounds */
--neutral-100: #f5f5f5;  /* Light gray - card backgrounds */
--neutral-200: #e5e5e5;  /* Soft gray - borders */
--neutral-300: #d4d4d4;  /* Medium gray - dividers */
--neutral-400: #a3a3a3;  /* Gray - placeholder text */
--neutral-500: #737373;  /* Mid gray - secondary text */
--neutral-600: #525252;  /* Dark gray - body text */
--neutral-700: #404040;  /* Darker gray - headings */
--neutral-800: #262626;  /* Deep gray - emphasis */
--neutral-900: #171717;  /* Darkest gray - high contrast */
--neutral-950: #0a0a0a;  /* Black - maximum contrast */
```

#### Semantic Colors
```css
--success: #16a34a;  /* energy-500 - Success states */
--error: #dc2626;    /* Error states - improved contrast */
--warning: #f59e0b;  /* solar-500 - Warning states */
--info: #2563eb;     /* ocean-500 - Information states */
```

### Color Usage Rules

#### Primary Actions
- **Use solar-500 (#f59e0b)** for all primary call-to-action buttons
- **Use solar gradient** (from-solar-500 to-solar-600) for premium buttons
- **Add solar shadow** (shadow-solar-500/30) for depth

#### Secondary Actions
- **Use ocean-500 (#2563eb)** for secondary buttons
- **Use outline variant** with solar-500 border for tertiary actions
- **Use ghost variant** with neutral colors for minimal actions

#### Status Indicators
- **Success**: energy-500 (#16a34a) with CheckCircle icon
- **Error**: error (#dc2626) with AlertCircle icon
- **Warning**: warning (#f59e0b) with AlertTriangle icon
- **Info**: info (#2563eb) with Info icon

#### Backgrounds
- **Light theme**: neutral-50 (#fafafa) for page backgrounds
- **Dark theme**: gradient from ocean-900 to neutral-900
- **Cards**: neutral-800/50 with border-neutral-700 in dark theme
- **Overlays**: Use backdrop-blur-sm with appropriate opacity

---

## Typography Guidelines

### Font Family
```css
font-family: {
  sans: ['Inter', 'system-ui', 'sans-serif'],
  mono: ['JetBrains Mono', 'monospace'],
}
```

**Primary Font**: Inter - Modern, professional, excellent readability
**Monospace Font**: JetBrains Mono - For code, coordinates, technical data

### Typography Hierarchy

#### Headings
```css
/* H1 - Hero/Main page titles */
h1 {
  font-size: clamp(2.25rem, 5vw, 4rem); /* 36px - 64px */
  font-weight: 700; /* Bold */
  line-height: 1.1;
  letter-spacing: -0.04em;
  margin-bottom: 1rem;
}

/* H2 - Major section headings */
h2 {
  font-size: clamp(1.875rem, 4vw, 3rem); /* 30px - 48px */
  font-weight: 600; /* Semibold */
  line-height: 1.15;
  letter-spacing: -0.03em;
  margin-bottom: 0.75rem;
}

/* H3 - Subsection headings */
h3 {
  font-size: clamp(1.5rem, 3vw, 2.25rem); /* 24px - 36px */
  font-weight: 600; /* Semibold */
  line-height: 1.2;
  letter-spacing: -0.025em;
  margin-bottom: 0.5rem;
}

/* H4 - Component/card headings */
h4 {
  font-size: clamp(1.25rem, 2.5vw, 1.875rem); /* 20px - 30px */
  font-weight: 500; /* Medium */
  line-height: 1.25;
  letter-spacing: -0.02em;
  margin-bottom: 0.5rem;
}
```
#### Body Text
```css
/* Large body text - Descriptions, important content */
.text-lg {
  font-size: 1.125rem; /* 18px */
  line-height: 1.7;
  font-weight: 400;
}

/* Base body text - Standard content */
.text-base {
  font-size: 1rem; /* 16px */
  line-height: 1.7;
  font-weight: 400;
}

/* Small text - Captions, metadata */
.text-sm {
  font-size: 0.875rem; /* 14px */
  line-height: 1.6;
  font-weight: 400;
}

/* Extra small text - Fine print, labels */
.text-xs {
  font-size: 0.75rem; /* 12px */
  line-height: 1.5;
  font-weight: 400;
}
```

### Typography Usage Rules

#### Contrast Requirements
- **High contrast text**: neutral-900 on light backgrounds, neutral-50 on dark
- **Medium contrast text**: neutral-700 on light, neutral-200 on dark
- **Low contrast text**: neutral-600 on light, neutral-400 on dark
- **Minimum contrast ratio**: 4.5:1 for normal text, 3:1 for large text

#### Line Length
- **Optimal**: 45-75 characters per line (max-width: 75ch)
- **Mobile**: Allow full width but maintain readability
- **Long-form content**: Use prose classes with proper spacing

#### Responsive Typography
```css
/* Mobile-first approach */
.responsive-text {
  font-size: 1rem; /* 16px base */
}

@media (min-width: 768px) {
  .responsive-text {
    font-size: 1.125rem; /* 18px tablet+ */
  }
}

@media (min-width: 1024px) {
  .responsive-text {
    font-size: 1.25rem; /* 20px desktop+ */
  }
}
```

---

## Logo Usage Guidelines

### Logo Assets
- **Primary Logo**: `/isotec-logo.webp` (WebP format for optimization)
- **Fallback**: Provide PNG version for older browsers
- **Vector**: SVG version for scalability (if available)

### Logo Sizing Standards

#### Landing Page (Hero)
```tsx
<Image
  src="/isotec-logo.webp"
  alt="ISOTEC Logo"
  width={240}
  height={96}
  className="w-48 md:w-64" // 192px mobile, 256px desktop
  priority
/>
```

#### Header/Navigation
```tsx
<Image
  src="/isotec-logo.webp"
  alt="ISOTEC Logo"
  width={160}
  height={64}
  className="h-8 sm:h-10 lg:h-12 w-auto" // Height-based responsive
/>
```

#### Small/Compact Usage
```tsx
<Image
  src="/isotec-logo.webp"
  alt="ISOTEC Logo"
  width={120}
  height={48}
  className="w-32" // Fixed small size
/>
```

### Logo Placement Rules

#### Clear Space
- **Minimum clear space**: Equal to the height of the logo
- **Recommended clear space**: 1.5x the height of the logo
- **Never place logo**: Over busy backgrounds without proper contrast

#### Positioning Guidelines
- **Landing page**: Centered in hero section, prominent placement
- **Headers**: Left-aligned with proper spacing from navigation
- **Footers**: Centered or left-aligned based on layout
- **Documents**: Top-left corner with appropriate margins

#### Logo Don'ts
❌ Don't stretch or distort the logo proportions
❌ Don't use logo on backgrounds with insufficient contrast
❌ Don't make logo smaller than 80px width in digital applications
❌ Don't add effects, shadows, or modifications to the logo
❌ Don't use logo as a pattern or watermark

---

## Spacing and Layout Rules

### Spacing System (4px Base Unit)
```css
/* Base spacing scale */
--spacing-1: 4px;    /* 0.25rem */
--spacing-2: 8px;    /* 0.5rem */
--spacing-3: 12px;   /* 0.75rem */
--spacing-4: 16px;   /* 1rem */
--spacing-6: 24px;   /* 1.5rem */
--spacing-8: 32px;   /* 2rem */
--spacing-12: 48px;  /* 3rem */
--spacing-16: 64px;  /* 4rem */
--spacing-24: 96px;  /* 6rem */
```

### Layout Guidelines

#### Container Widths
```css
/* Page containers */
.container-sm { max-width: 640px; }   /* Small content */
.container-md { max-width: 768px; }   /* Medium content */
.container-lg { max-width: 1024px; }  /* Large content */
.container-xl { max-width: 1280px; }  /* Extra large content */
.container-2xl { max-width: 1536px; } /* Maximum width */
```

#### Grid System
```css
/* Responsive grid */
.grid-responsive {
  display: grid;
  gap: 1rem; /* 16px */
  grid-template-columns: 1fr; /* Mobile: 1 column */
}

@media (min-width: 768px) {
  .grid-responsive {
    grid-template-columns: repeat(2, 1fr); /* Tablet: 2 columns */
  }
}

@media (min-width: 1024px) {
  .grid-responsive {
    grid-template-columns: repeat(3, 1fr); /* Desktop: 3 columns */
  }
}
```
#### Spacing Rules
- **Section spacing**: 48px (spacing-12) between major sections
- **Component spacing**: 24px (spacing-6) between related components
- **Element spacing**: 16px (spacing-4) between related elements
- **Text spacing**: 8px (spacing-2) between related text elements
- **Tight spacing**: 4px (spacing-1) for closely related items

#### Touch Targets (Mobile)
- **Minimum size**: 44x44px for all interactive elements
- **Recommended size**: 48x48px for primary actions
- **Spacing**: Minimum 8px between adjacent touch targets

---

## Component Guidelines

### Button Components

#### Primary Button (Solar Gradient)
```tsx
<Button variant="primary" size="default">
  Primary Action
</Button>
```
**Styling**: Solar gradient background, white text, solar shadow
**Usage**: Main call-to-action, form submissions, primary navigation

#### Secondary Button (Ocean Blue)
```tsx
<Button variant="secondary" size="default">
  Secondary Action
</Button>
```
**Styling**: Ocean-500 background, white text, subtle shadow
**Usage**: Secondary actions, alternative options

#### Outline Button (Solar Border)
```tsx
<Button variant="outline" size="default">
  Tertiary Action
</Button>
```
**Styling**: Transparent background, solar-500 border and text
**Usage**: Tertiary actions, cancel buttons, subtle CTAs

#### Ghost Button (Minimal)
```tsx
<Button variant="ghost" size="default">
  Minimal Action
</Button>
```
**Styling**: Transparent background, neutral text, hover background
**Usage**: Navigation, minimal actions, close buttons

### Card Components

#### Standard Card
```tsx
<Card className="bg-neutral-800/50 border-neutral-700">
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description</CardDescription>
  </CardHeader>
  <CardContent>
    Card content
  </CardContent>
</Card>
```

#### Interactive Card
```tsx
<Card className="hover:bg-neutral-800/70 transition-all duration-200 cursor-pointer">
  Interactive content
</Card>
```

### Form Components

#### Input Fields
```tsx
<Input 
  className="focus:border-solar-500 focus:ring-solar-500/10"
  placeholder="Enter value"
/>
```
**Focus state**: Solar-500 border with subtle ring
**Error state**: Red-500 border with error message
**Success state**: Energy-500 border with success indicator

#### Form Layout
- **Label spacing**: 8px above input fields
- **Input spacing**: 16px between input groups
- **Error message**: 4px below input, red-500 color
- **Help text**: 4px below input, neutral-500 color

---

## Mascot Usage Guidelines

### Mascot Asset
- **File**: `/mascote.webp`
- **Format**: WebP for optimization
- **Dimensions**: Square aspect ratio recommended
- **Background**: Transparent

### Placement Guidelines

#### Landing Page
```tsx
<div className="fixed bottom-8 right-8 hidden lg:block animate-float">
  <Image
    src="/mascote.webp"
    alt="ISOTEC Mascot"
    width={120}
    height={120}
    className="drop-shadow-2xl"
  />
</div>
```
**Position**: Fixed bottom-right
**Animation**: Gentle float animation
**Visibility**: Hidden on mobile/tablet

#### Wizard Pages
```tsx
<motion.div
  initial={{ scale: 0, opacity: 0 }}
  animate={{ scale: 1, opacity: 1 }}
  transition={{ delay: 0.5, type: 'spring' }}
>
  <Image
    src="/mascote.webp"
    alt="ISOTEC Mascot"
    width={120}
    height={120}
  />
</motion.div>
```
**Animation**: Scale-in with spring transition
**Purpose**: Friendly guide through process

#### Contract View
```tsx
<Image
  src="/mascote.webp"
  alt="ISOTEC Mascot"
  width={80}
  height={80}
  className="h-16 sm:h-20 w-auto"
/>
```
**Position**: Header integration
**Size**: Smaller, professional context
**Purpose**: Brand recognition

### Mascot Usage Rules

#### Do's ✅
- Use as a friendly guide in user-facing interfaces
- Animate subtly to add personality
- Position where it won't interfere with content
- Hide on mobile to avoid clutter
- Use consistent sizing within contexts

#### Don'ts ❌
- Don't use mascot in serious/professional contexts (contracts, legal)
- Don't animate excessively or distractingly
- Don't place over important content
- Don't use different versions or modifications
- Don't make mascot the primary focus of any page
---

## Implementation Examples

### Landing Page Implementation
```tsx
// Hero section with proper brand implementation
<Hero>
  <HeroSection>
    <HeroContent>
      {/* Logo - Prominent placement */}
      <HeroLogo src="/isotec-logo.webp" alt="ISOTEC Logo" />
      
      {/* Heading - Solar energy focus */}
      <HeroHeading>
        Sistema de Contratos Fotovoltaicos
      </HeroHeading>
      
      {/* Description - Professional tone */}
      <HeroDescription>
        Gestão completa de contratos para instalação de energia solar
      </HeroDescription>
      
      {/* Actions - Primary solar CTA */}
      <HeroActions>
        <Button variant="primary" size="lg">
          Criar Novo Contrato
        </Button>
        <Button variant="secondary" size="lg">
          Login Admin
        </Button>
      </HeroActions>
    </HeroContent>
  </HeroSection>
  
  {/* Mascot - Friendly presence */}
  <HeroMascot src="/mascote.webp" alt="ISOTEC Mascot" />
</Hero>
```

### Wizard Implementation
```tsx
// Wizard with consistent branding
<div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-ocean-900">
  {/* Header with logo */}
  <div className="flex items-center gap-4">
    <Image src="/isotec-logo.webp" alt="ISOTEC Logo" className="w-32 md:w-40" />
    <div>
      <h1 className="text-2xl md:text-3xl font-bold text-white">Novo Contrato</h1>
      <p className="text-sm text-neutral-400">Sistema de Contratos Fotovoltaicos</p>
    </div>
  </div>
  
  {/* Progress indicator with solar colors */}
  <WizardProgress currentStep={currentStep} />
  
  {/* Content card */}
  <Card className="bg-neutral-800/50 border-neutral-700">
    <CardContent>
      {/* Step content */}
    </CardContent>
    
    {/* Navigation with brand colors */}
    <div className="flex justify-between">
      <Button variant="outline">Anterior</Button>
      <Button variant="primary">Próximo</Button>
    </div>
  </Card>
</div>
```

### Contract View Implementation
```tsx
// Contract view with professional branding
<div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
  {/* Header with logo and title */}
  <header className="bg-neutral-900 border-b border-neutral-700">
    <div className="flex items-center gap-4">
      <Image src="/isotec-logo.webp" alt="ISOTEC Logo" className="h-10" />
      <h1 className="text-xl font-semibold text-white">
        Contrato de Instalação Fotovoltaica
      </h1>
    </div>
  </header>
  
  {/* Status with brand colors */}
  <div className="flex items-center gap-3">
    <CheckCircle2 className="w-6 h-6 text-energy-500" />
    <span className="text-lg font-medium text-energy-400">
      Contrato Assinado
    </span>
  </div>
  
  {/* Content sections */}
  <section className="bg-neutral-800/50 border border-neutral-700 rounded-xl">
    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
      <Zap className="w-4 h-4 text-solar-500" />
      Especificações do Projeto
    </h2>
  </section>
</div>
```

### Admin Dashboard Implementation
```tsx
// Admin dashboard with professional branding
<div className="max-w-7xl mx-auto px-4 py-8">
  {/* Header */}
  <div className="flex items-center justify-between mb-8">
    <div>
      <h1 className="text-2xl font-bold text-white">Dashboard</h1>
      <p className="text-neutral-400">Visão geral do sistema</p>
    </div>
  </div>
  
  {/* Stats with brand colors */}
  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
    <StatCard
      title="Total de Contratos"
      value={stats.totalContracts}
      icon={FileText}
      iconColor="text-solar-400"
      iconBg="bg-solar-500/10"
    />
  </div>
  
  {/* Quick actions with brand buttons */}
  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
    <Button className="bg-gradient-to-r from-solar-500 to-solar-600">
      Criar Novo Contrato
    </Button>
    <Button className="bg-ocean-500">
      Ver Contratos
    </Button>
  </div>
</div>
```

---

## Brand Compliance Checklist

### Before Implementing New Components
- [ ] Uses approved color palette (solar, ocean, energy, neutral)
- [ ] Follows typography hierarchy and font family
- [ ] Implements proper spacing using 4px base unit
- [ ] Includes appropriate hover and focus states
- [ ] Meets accessibility contrast requirements (4.5:1 minimum)
- [ ] Uses consistent border radius (rounded-lg, rounded-xl)
- [ ] Implements proper responsive behavior
- [ ] Includes appropriate animations and transitions

### Before Adding New Pages
- [ ] Includes ISOTEC logo in appropriate size and position
- [ ] Uses consistent header/navigation structure
- [ ] Implements proper page background (gradient or solid)
- [ ] Follows grid system for layout
- [ ] Includes mascot where appropriate (user-facing pages)
- [ ] Uses semantic HTML structure
- [ ] Implements proper meta tags and accessibility features

### Before Deploying Changes
- [ ] Test on multiple screen sizes (mobile, tablet, desktop)
- [ ] Verify color contrast in both light and dark themes
- [ ] Check logo visibility and clarity at all sizes
- [ ] Validate typography hierarchy and readability
- [ ] Test interactive elements (hover, focus, active states)
- [ ] Verify mascot positioning and animations
- [ ] Run accessibility audit (axe-core or similar)
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)

---

## Maintenance and Updates

### Regular Reviews
- **Monthly**: Review new components for brand compliance
- **Quarterly**: Audit entire system for consistency
- **Annually**: Consider brand evolution and updates

### Version Control
- Document all brand guideline changes
- Maintain changelog for design system updates
- Communicate changes to development team

### Contact Information
For questions about brand implementation or guidelines:
- **Design System**: Reference this document
- **Technical Implementation**: Check component library
- **Brand Questions**: Consult brand audit document

---

*Last updated: $(date)*
*Version: 1.0*
*Next review: 3 months*