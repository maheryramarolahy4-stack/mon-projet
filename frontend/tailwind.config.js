/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        display: ['Manrope', 'sans-serif']
      },
      colors: {
        ink: '#17233c',
        muted: '#7d899f',
        brand: { DEFAULT: '#2864e8', dark: '#1749b6', light: '#eaf1ff' },
        canvas: '#f6f8fc'
      },
      boxShadow: {
        soft: '0 12px 35px rgba(26, 48, 88, .07)',
        card: '0 4px 18px rgba(26, 48, 88, .055)'
      }
    }
  },
  plugins: []
}