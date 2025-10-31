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

