/* eslint-env node */
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      padding: {
        mobile: 'calc(1rem + 1.5vw)',
        desktop: 'calc(1rem + 3vw)',
      },
      gap: {
        mobile: 'calc(1rem + 1.5vw)',
        desktop: 'calc(1rem + 3vw)',
      },
    },
    screens: {
      xs: '441px',
      sm: '640px',
      md: '820px',
      lg: '1024px',
      xl: '1440px',
      '2xl': '1600px',
    },
  },
  plugins: [],
}
