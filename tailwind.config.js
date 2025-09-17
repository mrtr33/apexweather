/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0D47A1', // Deep blue
        secondary: '#E53935', // Racing red
        accent: '#FFD600', // Racing yellow
        background: '#F5F5F5',
        darkBg: '#121212',
      },
    },
  },
  plugins: [],
} 