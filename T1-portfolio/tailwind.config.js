/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './src/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    // Force all breakpoints to apply immediately (desktop view on all devices)
    screens: {
      sm: '0px',
      md: '0px',
      lg: '0px',
      xl: '0px',
      '2xl': '0px',
    },
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        brand: {
          50: '#f5f9ff',
          100: '#e0ecff',
          200: '#b9d6ff',
          300: '#89bbff',
          400: '#549aff',
          500: '#1e75ff',
          600: '#0c5de6',
          700: '#0846b3',
          800: '#063482',
          900: '#03204f',
        },
      },
      backgroundImage: {
        'grid-radial': 'radial-gradient(circle at center, rgba(255,255,255,0.08) 0, rgba(255,255,255,0.02) 40%, transparent 70%)',
      },
      boxShadow: {
        glow: '0 0 20px -5px rgba(99,102,241,0.6)',
      },
    },
  },
  plugins: [],
};
