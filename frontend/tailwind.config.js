/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4648d4',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        primary: {
          DEFAULT: '#4648d4',
          hover: '#3738b8',
          container: '#6063ee',
          light: '#e1e0ff',
          dim: '#c0c1ff',
          dark: '#2f2ebe',
        },
        secondary: {
          DEFAULT: '#6b38d4',
          hover: '#572cb0',
          container: '#8455ef',
          light: '#e9ddff',
          dim: '#d0bcff',
        },
        tertiary: {
          DEFAULT: '#006c49',
          container: '#00885d',
          light: '#6ffbbe',
          dim: '#4edea3',
        },
        academic: {
          navy: '#0f172a',
          slate: '#1e293b',
          light: '#f8fafc',
          canvas: '#faf8ff',
          accent: '#4648d4',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        heading: ['"Hanken Grotesk"', 'Outfit', 'Inter', 'system-ui', 'sans-serif'],
        display: ['"Hanken Grotesk"', 'Outfit', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'soft-lg': '0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
        'glass-sm': '0 2px 8px -2px rgba(15, 23, 42, 0.04), 0 1px 4px -1px rgba(15, 23, 42, 0.02)',
        'glass': '0 10px 30px -5px rgba(15, 23, 42, 0.06), 0 4px 12px -2px rgba(15, 23, 42, 0.03)',
        'glass-lg': '0 20px 40px -12px rgba(15, 23, 42, 0.08), 0 8px 16px -4px rgba(15, 23, 42, 0.03)',
      },
      borderRadius: {
        'sm': '0.375rem',
        'md': '0.5rem',
        'lg': '0.75rem',
        'xl': '1rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
      }
    },
  },
  plugins: [],
}
