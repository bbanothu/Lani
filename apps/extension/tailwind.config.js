/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./sidepanel.html', './src/**/*.{ts,tsx}'],
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
    },
  },
  plugins: [],
};
