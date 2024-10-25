/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./index.html"],
  theme: {
    extend: {
      colors: {
        "ds-primary": "#7f3aa4",
        "ds-secondary": "#ac115f",
        "ds-tertiary": "#de2337",
        "ds-quaternary": "#ffca0b",
      },
    },
  },
  plugins: [],
  safelist: [
    "bg-ds-primary",
    "bg-ds-secondary",
    "bg-ds-tertiary",
    "bg-ds-quaternary",
  ],
};
