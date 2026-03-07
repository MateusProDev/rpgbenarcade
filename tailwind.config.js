/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        parchment: {
          50:  '#fdf8f0',
          100: '#f8edd8',
          200: '#f0d9a8',
          300: '#e5bf71',
          400: '#d9a03d',
          500: '#c8881e',
          600: '#a86d15',
          700: '#875413',
          800: '#6f4315',
          900: '#5c3814',
        },
        castle: {
          dark:  '#1a1208',
          stone: '#3d3327',
          wall:  '#5c4d3a',
          gold:  '#d4a827',
        },
        forest: '#1e4d2b',
        mountain: '#4a3728',
        water: '#1a3a5c',
      },
      fontFamily: {
        medieval: ['"Cinzel"', 'serif'],
        body: ['"Crimson Text"', 'serif'],
      },
      backgroundImage: {
        'stone-texture': "url('/textures/stone.webp')",
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};
