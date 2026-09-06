import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        moss: {
          50: '#f2f7f2',
          100: '#e0ebe0',
          200: '#c2d8c3',
          300: '#9bbe9d',
          400: '#6f9e74',
          500: '#4f8055',
          600: '#3c6642',
          700: '#325237',
          800: '#2b422f',
          900: '#243729',
        },
        sand: {
          50: '#faf8f4',
          100: '#f3ede1',
          200: '#e6d9c1',
          300: '#d6c19a',
        },
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      boxShadow: {
        card: '0 2px 16px rgba(20, 30, 20, 0.08)',
        sheet: '0 -4px 24px rgba(20, 30, 20, 0.12)',
      },
    },
  },
  plugins: [],
};

export default config;
