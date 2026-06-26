/** @type {import('tailwindcss').Config} */
// Clockout "Signature" palette — carried over from the landing brand.
// Keep these values in sync with theme/colors.ts (used for native APIs).
module.exports = {
  content: ['./app/**/*.{js,ts,tsx}', './components/**/*.{js,ts,tsx}'],

  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: '#0A0A0A', // app canvas (near-black)
        card: '#171717', // cards / sheets
        elevated: '#1F1F1F', // raised surfaces
        border: '#262626', // hairlines
        foreground: '#FAFAFA', // primary text
        muted: '#A3A3A3', // secondary text
        subtle: '#525252', // tertiary / disabled text
        primary: {
          DEFAULT: '#F97316', // orange — CTAs, active state
          foreground: '#0A0A0A', // text/icon on top of primary
          pressed: '#EA580C', // pressed/hover
        },
        success: '#4ADE80', // "reclaimed", streaks, clocked-out
        warning: '#F59E0B', // work-hours / amber
        destructive: '#EF4444', // "open anyway" / strict-mode warnings
      },
    },
  },
  plugins: [],
};
