/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#FF007A',
        secondary: '#1B1F38',
        neutral: '#A0AEC0',
      },
    },
  },
  plugins: [],
}
