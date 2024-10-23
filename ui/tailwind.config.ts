/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./index.html"],
  theme: {
    extend: {},
  },
  plugins: [],
  safelist: ["bg-blue-500", "bg-red-500", "bg-green-500", "bg-orange-500"],
};
