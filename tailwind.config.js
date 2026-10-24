/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        marine: {
          900: '#0c233c',
          800: '#0f2942',
          700: '#16385a',
          600: '#1e4871',
          500: '#2b5c8f',
          100: '#e1eaf3',
          50: '#f0f5fa'
        },
        sand: {
          50: '#fbfaf6',
          100: '#f5f1e8',
          200: '#ede5d5',
          300: '#e0d4be',
          400: '#cfbe9f',
          800: '#544936'
        },
        coral: {
          500: '#e05338',
          600: '#d04328',
          700: '#b8341d',
          100: '#fcece9',
          50: '#fff5f3'
        },
        forest: {
          700: '#235e40',
          600: '#2a724f',
          500: '#348e62',
          100: '#e5f3ec',
          50: '#f2f9f5'
        },
        charcoal: {
          900: '#15191e',
          800: '#1e242b',
          700: '#2d3748',
          600: '#4a5568',
          500: '#718096'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Outfit', 'Inter', 'sans-serif']
      }
    },
  },
  plugins: [],
}
