import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    path.join(__dirname, 'index.html').replace(/\\/g, '/'),
    path.join(__dirname, 'src/**/*.{js,ts,jsx,tsx}').replace(/\\/g, '/'),
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    './frontend/index.html',
    './frontend/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        // Official primary & secondary palette tokens
        'brand-primary': '#355872',     // rgb(53, 88, 114)
        'brand-secondary': '#7aaace',   // rgb(122, 170, 206)
        'brand-accent': '#9cd5ff',      // rgb(156, 213, 255)
        'app-background': '#f7f8f0',    // rgb(247, 248, 240)

        // Card Glow Gradient tokens
        'glow-dark': '#194350',         // rgb(25, 67, 80)
        'glow-mid': '#355872',          // rgb(53, 88, 114)

        // Brand scale mapped directly to the official palette
        brand: {
          primary: '#355872',
          secondary: '#7aaace',
          accent: '#9cd5ff',
          glowDark: '#194350',
          50: '#f7f8f0',
          100: '#eaf2f8',
          200: '#9cd5ff',
          300: '#9cd5ff',
          400: '#7aaace',
          500: '#5684a6',
          600: '#355872',
          700: '#2c4a60',
          800: '#233b4e',
          900: '#1a2c3a',
          950: '#194350',
        },
      },
      backgroundImage: {
        'card-radial': 'radial-gradient(ellipse at 50% 50%, #f7f8f0 55%, rgba(247, 248, 240, 0.94) 72%, rgba(53, 88, 114, 0.035) 88%, rgba(25, 67, 80, 0.075) 100%)',
        'card-radial-hover': 'radial-gradient(ellipse at 50% 50%, #f7f8f0 52%, rgba(247, 248, 240, 0.90) 70%, rgba(53, 88, 114, 0.05) 86%, rgba(25, 67, 80, 0.10) 100%)',
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(53, 88, 114, 0.08), 0 1px 2px -1px rgba(53, 88, 114, 0.06)',
        'elevated': '0 4px 6px -1px rgba(53, 88, 114, 0.1), 0 2px 4px -2px rgba(53, 88, 114, 0.06)',
        'glow-primary': '0 0 15px -3px rgba(53, 88, 114, 0.18)',
        'glow-accent': '0 0 15px -3px rgba(156, 213, 255, 0.25)',
        'card-glow': '0 0 18px -2px rgba(25, 67, 80, 0.07), 0 0 8px 0px rgba(53, 88, 114, 0.05), 0 2px 8px -2px rgba(25, 67, 80, 0.035)',
        'card-glow-hover': '0 0 24px -2px rgba(25, 67, 80, 0.11), 0 0 12px 1px rgba(53, 88, 114, 0.09), 0 4px 12px -2px rgba(25, 67, 80, 0.06)',
      },
      keyframes: {
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        scaleUp: {
          from: { opacity: '0', transform: 'scale(0.96) translateY(4px)' },
          to: { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 180ms ease-out',
        scaleUp: 'scaleUp 200ms cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
};
