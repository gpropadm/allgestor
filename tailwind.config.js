/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontSize: {
        'xs': '0.65rem',     // 10.4px (era 12px)
        'sm': '0.8rem',      // 12.8px (era 14px)
        'base': '0.85rem',   // 13.6px (era 16px)
        'lg': '1rem',        // 16px (era 18px)
        'xl': '1.15rem',     // 18.4px (era 20px)
        '2xl': '1.35rem',    // 21.6px (era 24px)
        '3xl': '1.7rem',     // 27.2px (era 30px)
        '4xl': '2rem',       // 32px (era 36px)
        '5xl': '2.5rem',     // 40px (era 48px)
        '6xl': '3rem',       // 48px (era 60px)
      }
    },
  },
  plugins: [],
}