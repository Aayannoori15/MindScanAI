/** @type {import('tailwindcss').Config} */

/*
 * Monochrome palette taken from the hero clip (public/assets/landing-bg.mp4):
 * a grey ring hovering in near-black, lit from above. The frame measures
 * ~2.7/255 mean saturation, so the UI stays greyscale — any hue would read as
 * a foreign element against it.
 *
 * The legacy `teal` / `amber` / `rose` names are kept as greys so existing
 * utility classes keep resolving; new work should prefer the `ink` scale.
 * Keep these in step with the CSS custom properties in index.css.
 */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#060606", // page ground, darkest part of the frame
          900: "#0a0a0a",
          800: "#121212",
          700: "#1c1c1c",
          600: "#303030",
          500: "#454545", // ring body
          400: "#6e6e6e",
          300: "#9e9e9e",
          200: "#c8c8c8",
          100: "#e6e6e6",
          50: "#f4f4f5", // specular highlight on the ring's lit edge
        },
        navy: "#060606",
        mist: "#f4f4f5",
        // Semantic aliases, deliberately greyscale.
        teal: "#e8e8e8", // primary accent -> the lit edge
        amber: "#9a9a9a", // caution -> mid grey
        rose: "#c4c4c4", // alert -> light grey
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["DM Serif Display", "serif"],
      },
    },
  },
  plugins: [],
};
