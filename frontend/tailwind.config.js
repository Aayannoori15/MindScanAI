/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        navy: "#0F1B2D",
        teal: "#00BFA6",
        amber: "#F59E0B",
        rose: "#FB7185",
        mist: "#F8FAFC",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["DM Serif Display", "serif"],
      },
    },
  },
  plugins: [],
};
