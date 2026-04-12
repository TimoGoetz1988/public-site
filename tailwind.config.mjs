/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg:     '#080808',
        'bg-2': '#0e0e0e',
        card:   '#131313',
        accent: '#7c6fff',
        green:  '#3ecf8e',
        amber:  '#f59e0b',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'wave-1': 'wave 1.1s ease-in-out infinite',
        'wave-2': 'wave 1.1s ease-in-out infinite 0.18s',
        'wave-3': 'wave 1.1s ease-in-out infinite 0.36s',
        'wave-4': 'wave 1.1s ease-in-out infinite 0.54s',
        'wave-5': 'wave 1.1s ease-in-out infinite 0.72s',
      },
      keyframes: {
        wave: {
          '0%, 100%': { transform: 'scaleY(0.3)' },
          '50%':      { transform: 'scaleY(1)' },
        },
      },
    },
  },
  plugins: [],
};
