const token = (name) => `hsl(var(--${name}) / <alpha-value>)`

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    // Deliberately constrained: no large radii, no heavy shadows.
    borderRadius: { none: '0', sm: '3px', DEFAULT: '4px', md: '6px', lg: '8px', full: '9999px' },
    boxShadow: { none: 'none', sm: '0 1px 2px 0 rgb(0 0 0 / 0.04)' },
    // Strict, dense type scale: [size, { lineHeight }]
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }],
      sm: ['0.8125rem', { lineHeight: '1.25rem' }],
      base: ['0.875rem', { lineHeight: '1.25rem' }],
      lg: ['1rem', { lineHeight: '1.5rem' }],
      xl: ['1.25rem', { lineHeight: '1.75rem' }],
      '2xl': ['1.5rem', { lineHeight: '2rem' }],
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
      '4xl': ['2.5rem', { lineHeight: '2.75rem' }],
    },
    extend: {
      colors: {
        background: token('background'),
        surface: token('surface'),
        subtle: token('subtle'),
        foreground: token('foreground'),
        'muted-foreground': token('muted-foreground'),
        border: token('border'),
        'border-strong': token('border-strong'),
        primary: token('primary'),
        'primary-foreground': token('primary-foreground'),
        ring: token('ring'),
        positive: token('positive'),
        negative: token('negative'),
        warning: token('warning'),
        info: token('info'),
      },
      fontFamily: {
        sans: ['Geist', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"Geist Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
}
