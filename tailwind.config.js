/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        vc: {
          50: '#f5f0ff',
          100: '#ede5ff',
          200: '#dccfff',
          300: '#c4a8ff',
          400: '#a87dff',
          500: '#8b4dff',
          600: '#7c2dff',
          700: '#6b21e8',
          800: '#5a1cbf',
          900: '#4a189c',
          950: '#2d0b6a',
        },
        surface: {
          0: '#ffffff',
          1: '#f9f8fc',
          2: '#f3f1f8',
          3: '#e8e5f0',
          4: '#d4d0de',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
