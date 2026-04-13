/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Text', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
      colors: {
        apple: {
          blue: '#0071E3',
          'blue-light': '#EBF5FF',
          green: '#34C759',
          'green-light': '#E8FAF0',
          red: '#FF3B30',
          gray: '#86868B',
          'gray-light': '#F5F5F7',
          text: '#1D1D1F',
          'text-sec': '#6E6E73',
          border: '#D2D2D7',
        },
      },
      borderRadius: {
        apple: '16px',
      },
    },
  },
  plugins: [],
}
