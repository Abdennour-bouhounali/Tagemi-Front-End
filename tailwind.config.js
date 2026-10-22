/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      zIndex: {
        '100': '100',
        '99': '99',

      },
      screens: {
        'custom': '768px',
        'xs': '320px',
      },
      fontFamily: {
        'droid-arabic-kufi': ['Droid Arabic Kufi', 'sans-serif'],
        // Staff app + visit pages: Kufi for headings and ticket numerals, Plex for UI text
        display: ['Droid Arabic Kufi', 'IBM Plex Sans Arabic', 'sans-serif'],
        ui: ['IBM Plex Sans Arabic', 'Tahoma', 'sans-serif'],
      },
      colors: {
        // Foundation brand, used by the staff app and the visit pages
        ink: { DEFAULT: '#101E58', soft: '#2A3A7A', faint: '#E7EAF4' },
        rose: { DEFAULT: '#E03A6F', soft: '#FBE4EC' }, // only: priority + active tab
        paper: '#F2F4F9',
        line: '#DCE1EC',
        muted: '#5E6987',
        // One colour per visit status (see utils/visitStatus.js)
        st: {
          queue: '#0F8A6C', 'queue-bg': '#E3F4EE',
          hold: '#4F5FA3', 'hold-bg': '#E8EBF7',
          pushed: '#B26B00', 'pushed-bg': '#FBF0DC',
          dil: '#0E7490', 'dil-bg': '#E0F2F6',
          done: '#5F6B7D', 'done-bg': '#ECEEF2',
          pending: '#8A93A8', 'pending-bg': '#F1F2F6',
        },
      },
      backgroundImage: {
        'banner': "url('/tagemi_consept.png')",
        'footer-texture': "url('/img/footer-texture.png')",
      },
      animation: {
        'fadeIn': 'fadeIn 0.5s ease-out',
        'slideIn': 'slideIn 0.3s ease-out',
        'bounceIn': 'bounceIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      }


    }
  },
  plugins: [],
}

