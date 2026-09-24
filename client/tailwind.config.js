export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7cc5fb',
          400: '#38a6f7',
          500: '#0e87eb',
          600: '#0269ca',
          700: '#0354a3',
          800: '#074786',
          900: '#0c3c6f',
        },
        hostel: {
          navy: '#0f172a',
          slateDark: '#1e293b',
          blueAccent: '#2563eb',
          amberWarm: '#d97706',
          emeraldSafe: '#059669',
          offWhite: '#f8fafc',
          cardWhite: '#ffffff',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['Merriweather', 'Georgia', 'serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(15, 23, 42, 0.06)',
        'glass-hover': '0 16px 40px 0 rgba(15, 23, 42, 0.12)',
      }
    },
  },
  plugins: [],
}

