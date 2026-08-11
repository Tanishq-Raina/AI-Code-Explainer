/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      boxShadow: {
        panel: "0 8px 32px rgba(2, 6, 23, 0.35)",
      },
    },
  },
  plugins: [],
};
