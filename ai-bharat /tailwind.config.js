/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'forest-green': '#2E7D32',
        'earth-brown': '#6D4C41',
        'sunlight-yellow': '#FDD835',
        'safety-red': '#D32F2F',
        'caution-yellow': '#FBC02D',
        'proceed-green': '#388E3C',
      },
    },
  },
  plugins: [],
}
