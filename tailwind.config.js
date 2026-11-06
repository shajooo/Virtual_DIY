/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cad: {
          bg: '#1a1a1a',
          panel: '#252525',
          panelDark: '#1e1e1e',
          panelBorder: '#333333',
          hover: '#333333',
          active: '#404040',
          accent: '#2563eb',
          accentHover: '#3b82f6',
          text: '#e0e0e0',
          textMuted: '#9ca3af',
        },
      },
    },
  },
  plugins: [],
};
