import type { Config } from 'tailwindcss';

// Palette salvaged from the previous SaveMoneyAI site: warm orange brand
// color, cream backgrounds, near-black text.
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#F36924',
          dark: '#E5540F',
          light: '#FFD16E',
        },
        cream: '#FFF9F3',
        ink: '#1C1B1A',
      },
      fontFamily: {
        nunito: ['var(--font-nunito)', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
