/** @type {import('tailwindcss').Config} */
/**
 * Palette is the SAME as mandiradmin-web and devotee-web so the three portals
 * read as one product. It previously had its own navy scale, an amber accent
 * and a green CTA, which made the Sadhu-Sadhvi portal look like a different
 * application.
 *
 * `DEFAULT` and the extra 400/800 steps are kept because this app's components
 * reference `accent-500/600`, `cta-600` and bare `navy` — dropping them would
 * silently render those elements unstyled.
 *
 * If you change a colour here, change it in the other two configs too.
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0D1B2E',
          50:  '#f0f3f8',
          100: '#d9e0ec',
          200: '#b0c0d9',
          300: '#7895c1',
          400: '#4d6fa8',
          500: '#2d5599',
          600: '#1f4289',
          700: '#1b2f4a',
          800: '#13233a',
          900: '#0D1B2E',
        },
        accent: {
          DEFAULT: '#1e4e8c',
          50:  '#eef4fd',
          100: '#d0dff5',
          200: '#a8c4ec',
          300: '#7aa9df',
          400: '#4e89cc',
          500: '#1e4e8c',
          600: '#1a4478',
          700: '#163a65',
          800: '#103060',
          900: '#0a1f40',
        },
        brand: {
          DEFAULT:       '#d62828',
          red:           '#d62828',
          'red-light':   '#f5b8b8',
          'red-dark':    '#9e1c1c',
          gold:          '#f4c542',
          'gold-light':  '#fdf0bc',
          'gold-dark':   '#b89010',
          green:         '#2e7d32',
          'green-light': '#c8e6c9',
          'green-dark':  '#1b5e20',
          blue:          '#1e4e8c',
          'blue-light':  '#d0dff5',
          'blue-dark':   '#103060',
          // Numeric steps kept for existing badge/button classes in this app.
          50:  '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          500: '#d62828',
          600: '#b91c1c',
          700: '#991b1b',
        },
        cta: {
          DEFAULT: '#c2410c',
          hover:   '#ea580c',
          50:  '#fff7ed',
          100: '#ffedd5',
          500: '#c2410c',
          600: '#ea580c',
          700: '#9a3412',
        },
        danger: {
          DEFAULT: '#d94f3d',
          dark:    '#9f2f22',
          bg:      '#fdf2f2',
          500: '#d94f3d',
          600: '#9f2f22',
        },
      },
      fontFamily: {
        sans: ['Noto Sans', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
