/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        aura: {
          navy: '#101828',
          indigo: '#5146E5',
          violet: '#7C3AED',
          white: '#FFFFFF',
          bg: '#F6F7FB',
          green: '#16A34A',
          amber: '#F59E0B',
          red: '#DC2626',
          textPrimary: '#182230',
          textSecondary: '#667085',
          surface: '#FFFFFF',
          border: '#E4E7EC',
          hoverBg: '#F2F4F7'
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(16, 24, 40, 0.06), 0 1px 2px 0 rgba(16, 24, 40, 0.04)',
        'premium': '0 4px 20px -2px rgba(16, 24, 40, 0.08), 0 2px 6px -1px rgba(16, 24, 40, 0.04)',
        'card-hover': '0 10px 25px -3px rgba(81, 70, 229, 0.12), 0 4px 10px -2px rgba(16, 24, 40, 0.04)',
        'modal': '0 20px 40px -4px rgba(16, 24, 40, 0.2)'
      }
    },
  },
  plugins: [],
}

