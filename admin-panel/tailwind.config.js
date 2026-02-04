/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#00D9FF",
        background: "#0a0a0a",
        card: "#141414",
        border: "#262626",
      },
    },
  },
  plugins: [],
}
