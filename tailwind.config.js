/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        facebook: {
          DEFAULT: '#1877F2',
          hover: '#166FE5',
          dark: '#1554AF',
        }
      }
    },
  },
  plugins: [],
};