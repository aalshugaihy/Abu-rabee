/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Tajawal', 'system-ui', 'sans-serif'],
        arabic: ['Tajawal', 'Cairo', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#f0f7f4',
          100: '#dcebe1',
          200: '#bcd7c6',
          300: '#92bba3',
          400: '#669a7e',
          500: '#467e62',
          600: '#34634d',
          700: '#2a503f',
          800: '#244034',
          900: '#1f352c',
          950: '#0f1d18',
        },
        accent: {
          50: '#fdf8ee',
          100: '#faedd0',
          200: '#f4d99c',
          300: '#edbe5e',
          400: '#e7a435',
          500: '#df881e',
          600: '#c46917',
          700: '#a24d17',
          800: '#843d1a',
          900: '#6d3319',
        },
      },
      boxShadow: {
        'soft': '0 2px 12px -2px rgba(15, 29, 24, 0.08), 0 1px 3px -1px rgba(15, 29, 24, 0.04)',
        'card': '0 4px 20px -4px rgba(15, 29, 24, 0.08), 0 2px 6px -2px rgba(15, 29, 24, 0.04)',
        'glow': '0 0 0 4px rgba(70, 126, 98, 0.12)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
