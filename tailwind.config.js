/** @type {import('tailwindcss').Config} */

/* Husk Platinum — light theme.
 *
 * The app was authored dark, and its neutrals follow a strict convention:
 *   low  zinc numbers  = text      (text-zinc-100 … text-zinc-500)
 *   high zinc numbers  = surfaces  (bg-zinc-800/900, border-zinc-700/800)
 *
 * Rather than hand-editing ~250 utility strings, the zinc ramp itself is
 * inverted here and retuned to Apple's neutral scale. Every existing class
 * keeps its semantic meaning and flips to the light theme in one place.
 */
const platinum = {
  50:  '#FFFFFF',
  100: '#1D1D1F', // primary ink   (was lightest text)
  200: '#2C2C2E',
  300: '#48484A', // secondary ink
  400: '#6E6E73', // muted ink     (Apple secondary label)
  500: '#8E8E93', // faint ink     (Apple tertiary label)
  600: '#AEAEB2',
  700: '#D5D8DE', // hairline rule
  800: '#E4E7EC', // soft rule / chip surface
  900: '#F2F4F7', // panel chrome
  950: '#FCFDFE', // raised surface
};

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        zinc: platinum,
        gray: platinum,     // a handful of components reach for gray-*
        neutral: platinum,

        /* Brand tokens (Husk Platinum). */
        paper:          'var(--color-paper)',
        chrome:         'var(--color-chrome)',
        raised:         'var(--color-raised)',
        sunken:         'var(--color-sunken)',
        'paper-raised': 'var(--color-raised)',
        'paper-sunken': 'var(--color-sunken)',
        ink:            'var(--color-ink)',
        'ink-2':        'var(--color-ink-2)',
        'ink-muted':    'var(--color-ink-muted)',
        'ink-faint':    'var(--color-ink-faint)',
        rule:           'var(--color-rule)',
        'rule-soft':    'var(--color-rule-soft)',
        brand:          'var(--color-accent)',
        'brand-hover':  'var(--color-accent-hover)',
        'brand-wash':   'var(--color-accent-wash)',
        'brand-edge':   'var(--color-accent-edge)',

        /* shadcn/ui primitives. These names were used across the ui/
         * components but emitted NO css under Tailwind v3 (the @theme inline
         * block in index.css is v4-only syntax). Wiring them here is what
         * makes dialogs, popovers, selects and inputs actually themed. */
        background:   'var(--background)',
        foreground:   'var(--foreground)',
        card:         'var(--card)',
        'card-foreground':    'var(--card-foreground)',
        popover:      'var(--popover)',
        'popover-foreground': 'var(--popover-foreground)',
        primary:      'var(--primary)',
        'primary-foreground': 'var(--primary-foreground)',
        secondary:    'var(--secondary)',
        'secondary-foreground': 'var(--secondary-foreground)',
        muted:        'var(--muted)',
        'muted-foreground':   'var(--muted-foreground)',
        accent:       'var(--accent)',
        'accent-foreground':  'var(--accent-foreground)',
        destructive:  'var(--destructive)',
        'destructive-foreground': 'var(--destructive-foreground)',
        border:       'var(--border)',
        input:        'var(--input)',
        ring:         'var(--ring)',
      },
      fontFamily: {
        sans:    ['Geist', 'ui-sans-serif', '-apple-system', 'system-ui', 'sans-serif'],
        display: ['Geist', 'ui-sans-serif', '-apple-system', 'system-ui', 'sans-serif'],
        mono:    ['Departure Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      letterSpacing: {
        display: 'var(--tracking-display)',
        tightish: 'var(--tracking-tight)',
      },
      borderRadius: {
        pill: 'var(--radius-pill)',
        sm:   'var(--radius-sm)',
        md:   'var(--radius-md)',
        lg:   'var(--radius-lg)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
      },
      transitionTimingFunction: {
        'out-soft': 'var(--ease-out)',
        'in-soft':  'var(--ease-in)',
        'in-out-soft': 'var(--ease-in-out)',
      },
      animation: {
        grid: "grid 15s linear infinite",
      },
      keyframes: {
        grid: {
          "0%": { transform: "translateY(-50%)" },
          "100%": { transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
}
