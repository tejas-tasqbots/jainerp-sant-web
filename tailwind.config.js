/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#1e2a4a',
          50: '#f0f2f8',
          100: '#d6dcee',
          200: '#adb9dd',
          300: '#8496cc',
          400: '#5b73bb',
          500: '#3a56a8',
          600: '#2e4490',
          700: '#253778',
          800: '#1e2a4a',
          900: '#141c32',
        },
        accent: {
          DEFAULT: '#f59e0b',
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        },
        brand: {
          DEFAULT: '#d62828',
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          500: '#d62828',
          600: '#b91c1c',
          700: '#991b1b',
        },
        cta: {
          DEFAULT: '#16a34a',
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#16a34a',
          600: '#15803d',
          700: '#166534',
        },
        danger: {
          DEFAULT: '#dc2626',
          500: '#dc2626',
          600: '#b91c1c',
        },
      },
    },
  },
  plugins: [],
};
