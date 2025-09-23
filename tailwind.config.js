/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#00d4ff',
          dark: '#0ea5e9',
        },
        secondary: {
          DEFAULT: '#10b981',
          light: '#22c55e',
        },
        warning: '#f59e0b',
        danger: '#ef4444',
        success: '#10b981',
        red: '#ef4444',
        purple: {
          DEFAULT: '#8b5cf6',
          light: '#a78bfa',
          dark: '#7c3aed',
        },
        dark: {
          bg: '#0a0e27',
          card: '#1e293b',
          surface: '#334155',
          text: '#f8fafc',
          textSecondary: '#e2e8f0',
          border: '#334155',
          borderHover: '#475569',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Roboto', 'sans-serif'],
        serif: {
          'lora': ['Lora', 'serif'],
          'roboto-serif': ['Roboto Serif', 'serif'],
          'roboto-slab': ['Roboto Slab', 'serif'],
          'young-serif': ['Young Serif', 'serif'],
        },
        'heading': ['Young Serif', 'serif'],
        'body': ['Lora', 'serif'],
        'display': ['Roboto Serif', 'serif'],
        'accent': ['Roboto Slab', 'serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
