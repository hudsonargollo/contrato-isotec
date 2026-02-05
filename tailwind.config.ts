import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Typography system with Inter font
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem' }],      // 12px
        sm: ['0.875rem', { lineHeight: '1.25rem' }],  // 14px
        base: ['1rem', { lineHeight: '1.5rem' }],     // 16px
        lg: ['1.125rem', { lineHeight: '1.75rem' }],  // 18px
        xl: ['1.25rem', { lineHeight: '1.75rem' }],   // 20px
        '2xl': ['1.5rem', { lineHeight: '2rem' }],    // 24px
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],   // 36px
        '5xl': ['3rem', { lineHeight: '1' }],           // 48px
        '6xl': ['3.75rem', { lineHeight: '1' }],        // 60px
        '7xl': ['4.5rem', { lineHeight: '1' }],         // 72px
        '8xl': ['6rem', { lineHeight: '1' }],           // 96px
        '9xl': ['8rem', { lineHeight: '1' }],           // 128px
      },
      fontWeight: {
        thin: '100',
        extralight: '200',
        light: '300',
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800',
        black: '900',
      },
      lineHeight: {
        none: '1',
        tight: '1.25',
        snug: '1.375',
        normal: '1.5',
        relaxed: '1.625',
        loose: '2',
        3: '.75rem',
        4: '1rem',
        5: '1.25rem',
        6: '1.5rem',
        7: '1.75rem',
        8: '2rem',
        9: '2.25rem',
        10: '2.5rem',
      },
      colors: {
        // shadcn/ui CSS variables
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: 'hsl(var(--card))',
        'card-foreground': 'hsl(var(--card-foreground))',
        popover: 'hsl(var(--popover))',
        'popover-foreground': 'hsl(var(--popover-foreground))',
        primary: 'hsl(var(--primary))',
        'primary-foreground': 'hsl(var(--primary-foreground))',
        secondary: 'hsl(var(--secondary))',
        'secondary-foreground': 'hsl(var(--secondary-foreground))',
        muted: 'hsl(var(--muted))',
        'muted-foreground': 'hsl(var(--muted-foreground))',
        accent: 'hsl(var(--accent))',
        'accent-foreground': 'hsl(var(--accent-foreground))',
        destructive: 'hsl(var(--destructive))',
        'destructive-foreground': 'hsl(var(--destructive-foreground))',
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
        // Premium ISOTEC brand colors
        solar: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        ocean: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        energy: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        // Professional neutral grays
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
        // Semantic colors for consistent UI feedback
        success: '#22c55e', // energy-500
        error: '#ef4444',
        warning: '#f59e0b', // solar-500
        info: '#3b82f6', // ocean-500
        
        // CSS variable-based theme colors
        'theme-solar': {
          50: 'hsl(var(--solar-50))',
          100: 'hsl(var(--solar-100))',
          200: 'hsl(var(--solar-200))',
          300: 'hsl(var(--solar-300))',
          400: 'hsl(var(--solar-400))',
          500: 'hsl(var(--solar-500))',
          600: 'hsl(var(--solar-600))',
          700: 'hsl(var(--solar-700))',
          800: 'hsl(var(--solar-800))',
          900: 'hsl(var(--solar-900))',
        },
        'theme-ocean': {
          50: 'hsl(var(--ocean-50))',
          100: 'hsl(var(--ocean-100))',
          200: 'hsl(var(--ocean-200))',
          300: 'hsl(var(--ocean-300))',
          400: 'hsl(var(--ocean-400))',
          500: 'hsl(var(--ocean-500))',
          600: 'hsl(var(--ocean-600))',
          700: 'hsl(var(--ocean-700))',
          800: 'hsl(var(--ocean-800))',
          900: 'hsl(var(--ocean-900))',
        },
        'theme-energy': {
          50: 'hsl(var(--energy-50))',
          100: 'hsl(var(--energy-100))',
          200: 'hsl(var(--energy-200))',
          300: 'hsl(var(--energy-300))',
          400: 'hsl(var(--energy-400))',
          500: 'hsl(var(--energy-500))',
          600: 'hsl(var(--energy-600))',
          700: 'hsl(var(--energy-700))',
          800: 'hsl(var(--energy-800))',
          900: 'hsl(var(--energy-900))',
        },
        'theme-neutral': {
          50: 'hsl(var(--neutral-50))',
          100: 'hsl(var(--neutral-100))',
          200: 'hsl(var(--neutral-200))',
          300: 'hsl(var(--neutral-300))',
          400: 'hsl(var(--neutral-400))',
          500: 'hsl(var(--neutral-500))',
          600: 'hsl(var(--neutral-600))',
          700: 'hsl(var(--neutral-700))',
          800: 'hsl(var(--neutral-800))',
          900: 'hsl(var(--neutral-900))',
          950: 'hsl(var(--neutral-950))',
        },
        'theme-success': 'hsl(var(--success))',
        'theme-error': 'hsl(var(--error))',
        'theme-warning': 'hsl(var(--warning))',
        'theme-info': 'hsl(var(--info))',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      // Spacing system with 4px base unit
      spacing: {
        0: '0px',
        0.5: '2px',   // 0.5 * 4px
        1: '4px',     // 1 * 4px (base unit)
        1.5: '6px',   // 1.5 * 4px
        2: '8px',     // 2 * 4px
        2.5: '10px',  // 2.5 * 4px
        3: '12px',    // 3 * 4px
        3.5: '14px',  // 3.5 * 4px
        4: '16px',    // 4 * 4px
        5: '20px',    // 5 * 4px
        6: '24px',    // 6 * 4px
        7: '28px',    // 7 * 4px
        8: '32px',    // 8 * 4px
        9: '36px',    // 9 * 4px
        10: '40px',   // 10 * 4px
        11: '44px',   // 11 * 4px (minimum touch target)
        12: '48px',   // 12 * 4px
        14: '56px',   // 14 * 4px
        16: '64px',   // 16 * 4px
        20: '80px',   // 20 * 4px
        24: '96px',   // 24 * 4px
        28: '112px',  // 28 * 4px
        32: '128px',  // 32 * 4px
        36: '144px',  // 36 * 4px
        40: '160px',  // 40 * 4px
        44: '176px',  // 44 * 4px
        48: '192px',  // 48 * 4px
        52: '208px',  // 52 * 4px
        56: '224px',  // 56 * 4px
        60: '240px',  // 60 * 4px
        64: '256px',  // 64 * 4px
        72: '288px',  // 72 * 4px
        80: '320px',  // 80 * 4px
        96: '384px',  // 96 * 4px
      },
      // Enhanced animation system
      animation: {
        // Existing animations
        'float': 'float 3s ease-in-out infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        
        // Page transitions
        'fade-in': 'fadeIn 0.3s ease-out',
        'fade-out': 'fadeOut 0.3s ease-in',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'slide-left': 'slideLeft 0.3s ease-out',
        'slide-right': 'slideRight 0.3s ease-out',
        
        // Micro-interactions
        'bounce-gentle': 'bounceGentle 0.6s ease-in-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'scale-out': 'scaleOut 0.2s ease-in',
        'wiggle': 'wiggle 0.5s ease-in-out',
        
        // Loading states
        'spin-slow': 'spin 2s linear infinite',
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'skeleton': 'skeleton 1.5s ease-in-out infinite',
        
        // Progress and success
        'progress': 'progress 0.5s ease-in-out',
        'success-bounce': 'successBounce 0.8s ease-out',
        
        // Hover effects
        'hover-lift': 'hoverLift 0.2s ease-out',
        'hover-glow': 'hoverGlow 0.3s ease-out',
      },
      keyframes: {
        // Existing keyframes
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        
        // Page transitions
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideLeft: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideRight: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        
        // Micro-interactions
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        scaleOut: {
          '0%': { opacity: '1', transform: 'scale(1)' },
          '100%': { opacity: '0', transform: 'scale(0.95)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(-3deg)' },
          '75%': { transform: 'rotate(3deg)' },
        },
        
        // Loading states
        skeleton: {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '1' },
        },
        
        // Progress and success
        progress: {
          '0%': { width: '0%' },
          '100%': { width: '100%' },
        },
        successBounce: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '50%': { transform: 'scale(1.1)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        
        // Hover effects
        hoverLift: {
          '0%': { transform: 'translateY(0) scale(1)' },
          '100%': { transform: 'translateY(-4px) scale(1.02)' },
        },
        hoverGlow: {
          '0%': { boxShadow: '0 0 0 0 rgba(245, 158, 11, 0)' },
          '100%': { boxShadow: '0 0 20px 4px rgba(245, 158, 11, 0.3)' },
        },
      },
      // Transition timing functions
      transitionTimingFunction: {
        'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'bounce-out': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'smooth-in': 'cubic-bezier(0.4, 0, 1, 1)',
        'smooth-out': 'cubic-bezier(0, 0, 0.2, 1)',
        'smooth-in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'elastic': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'spring': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      },
      // Transition durations
      transitionDuration: {
        '0': '0ms',
        '75': '75ms',
        '100': '100ms',
        '150': '150ms',
        '200': '200ms',
        '300': '300ms',
        '500': '500ms',
        '700': '700ms',
        '1000': '1000ms',
        '1500': '1500ms',
        '2000': '2000ms',
        '3000': '3000ms',
      },
    },
  },
  plugins: [],
};

export default config;
