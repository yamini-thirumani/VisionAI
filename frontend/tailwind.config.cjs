/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'system-ui', 'Segoe UI', 'sans-serif'],
        serif: ['"IBM Plex Serif"', 'Georgia', 'Times New Roman', 'serif']
      }
    }
  },
  plugins: []
};

