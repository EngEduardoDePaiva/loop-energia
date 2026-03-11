/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f7ff',
          100: '#e0efff',
          200: '#b8deff',
          300: '#7cc2ff',
          400: '#38a1ff',
          500: '#007bff',
          600: '#0062cc',
          700: '#004999',
          800: '#003d80',
          900: '#002b5c',
        },
        gold: {
          50: '#fbf9eb',
          100: '#f5f0c8',
          200: '#ede092',
          300: '#e4cd5a',
          400: '#dbb832',
          500: '#c69f18',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
