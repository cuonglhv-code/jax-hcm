/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        brand: {
          50: '#f0f4ff',
          100: '#dde6ff',
          200: '#c3d0ff',
          300: '#9ab1ff',
          400: '#6b87ff',
          500: '#4361ee',
          600: '#2f4ed4',
          700: '#263db8',
          800: '#243395',
          900: '#222d76',
          950: '#161c4a',
        },
        surface: {
          DEFAULT: '#ffffff',
          dark: '#0f1117',
          'dark-card': '#1a1d27',
          'dark-border': '#2a2d3e',
        },
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #4361ee 0%, #7b2ff7 100%)',
        'gradient-surface': 'linear-gradient(180deg, #f8f9ff 0%, #eef0ff 100%)',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.07), 0 4px 16px rgba(67,97,238,0.06)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.1), 0 8px 24px rgba(67,97,238,0.12)',
        glow: '0 0 20px rgba(67,97,238,0.3)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'slide-up': 'slideUp 0.25s ease-out',
        shimmer: 'shimmer 1.5s infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideIn: { '0%': { transform: 'translateX(-16px)', opacity: '0' }, '100%': { transform: 'translateX(0)', opacity: '1' } },
        slideUp: { '0%': { transform: 'translateY(16px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
    },
  },
  plugins: [],
};
