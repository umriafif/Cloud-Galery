/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/views/**/*.ejs', './src/**/*.js', './public/js/**/*.js'],
  theme: {
    extend: {
      colors: {
        accent: {
          50: '#effcf8',
          100: '#d8f7ee',
          200: '#b4eedf',
          300: '#7fe0ca',
          400: '#46c8ae',
          500: '#20ab93',
          600: '#178a77',
          700: '#156f62',
          800: '#155951',
          900: '#154a44'
        },
        ink: '#0f172a',
        sand: '#f8fafc'
      },
      boxShadow: {
        soft: '0 20px 60px rgba(15, 23, 42, 0.12)'
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        sans: ['"Plus Jakarta Sans"', 'sans-serif']
      }
    }
  },
  plugins: []
};
