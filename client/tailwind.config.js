/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy:  { DEFAULT: '#2C3544', deep: '#1E2531', soft: '#3C4759' },
        slate: { DEFAULT: '#586272', light: '#8A93A1' },
        cream: { DEFAULT: '#F6F2EA', dark: '#EDE7DA', deep: '#E2D9C6' },
        mist:  '#D6D6D6',
        ink:   '#0F131A',
        sale:  '#B23A48',
      },
      fontFamily: {
        sans: ['Montserrat', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Montserrat', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        // Helvetica Neue ships with macOS and iOS only. Inter sits behind it so
        // Windows and Android get a neo-grotesque cut from the same cloth
        // rather than dropping all the way to Arial.
        heading: ['Helvetica Neue', 'Inter', 'Helvetica', 'Arial', 'sans-serif'],
      },
      letterSpacing: { brand: '0.28em', wider2: '0.18em' },
      maxWidth: { shell: '1440px' },
      keyframes: {
        'fade-up': { '0%': { opacity: 0, transform: 'translateY(14px)' }, '100%': { opacity: 1, transform: 'none' } },
        'fade-in': { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        'slide-in': { '0%': { transform: 'translateX(100%)' }, '100%': { transform: 'none' } },
        marquee: { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
        'hero-pan': { '0%': { transform: 'scale(1.08)' }, '100%': { transform: 'scale(1)' } },
      },
      animation: {
        'fade-up': 'fade-up .5s cubic-bezier(.2,.7,.3,1) both',
        'fade-in': 'fade-in .4s ease both',
        'slide-in': 'slide-in .32s cubic-bezier(.2,.7,.3,1) both',
        marquee: 'marquee 28s linear infinite',
        'hero-pan': 'hero-pan 14s cubic-bezier(.16,.6,.3,1) both',
      },
    },
  },
  plugins: [],
};
