/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        page: '#f4f6f9',
        surface: '#ffffff',
        navy: '#1a365d',
        brand: '#2563eb',
        muted: '#64748b',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
