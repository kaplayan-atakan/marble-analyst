import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        marble: {
          50: '#f8f7f4',
          100: '#e8e6e1',
          200: '#d3cfc7',
          300: '#b8b2a5',
          400: '#9c9385',
          500: '#857a6b',
          600: '#6f6459',
          700: '#5a524a',
          800: '#4c463f',
          900: '#423d38',
        },
      },
    },
  },
  plugins: [],
};

export default config;
