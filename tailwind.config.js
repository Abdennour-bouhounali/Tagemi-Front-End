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
      backgroundImage: {
        'banner': "url('/tagemi_consept.png')",
        'footer-texture': "url('/img/footer-texture.png')",
      },
      fontFamily: {
        'droid-arabic-kufi': ['Droid Arabic Kufi', 'serif'],
      },
      screens: {
        'custom': '1265px', // Change this value to your desired width in pixels
      },


    }
  },
  plugins: [],
}

