/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: {
          dark: '#090A0F',
          card: '#12141C',
          elevated: '#1A1D27',
          light: '#F8F9FC',
          lightCard: '#FFFFFF',
        },
        brand: {
          primary: '#FF5E3A', // Calora Coral Orange
          secondary: '#38EF7D', // Vibrant Health Green
          accent: '#11998E',
          purple: '#8A2387',
          blue: '#00C6FF',
          yellow: '#F7B733',
        },
        macro: {
          calories: '#FF5E3A',
          protein: '#10B981',
          carbs: '#F59E0B',
          fat: '#8B5CF6',
          water: '#06B6D4',
        },
      },
    },
  },
  plugins: [],
};
