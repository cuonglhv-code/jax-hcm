import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary:        'var(--color-primary)',
        'primary-hover':'var(--color-primary-hover)',
        surface:        'var(--color-surface)',
        'surface-2':    'var(--color-surface-2)',
        'surface-offset':'var(--color-surface-offset)',
        border:         'var(--color-border)',
        divider:        'var(--color-divider)',
        'text-base':    'var(--color-text)',
        'text-muted':   'var(--color-text-muted)',
        'text-faint':   'var(--color-text-faint)',
        success:        'var(--color-success)',
        error:          'var(--color-error)',
        warning:        'var(--color-warning)',
      },
      fontFamily: {
        display: ['Cabinet Grotesk', 'sans-serif'],
        body:    ['Satoshi', 'sans-serif'],
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },
    },
  },
  plugins: [],
} satisfies Config
