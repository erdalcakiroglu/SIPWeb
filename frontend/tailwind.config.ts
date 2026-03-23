import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0e8a9d',
          dark: '#0a5f6f',
          light: '#e4f4f7',
          gradientFrom: '#0b6c79',
          gradientTo: '#1aa4b4',
        },
        accent: {
          DEFAULT: '#6366f1',
          hover: '#4f46e5',
        },
        cta: {
          DEFAULT: '#0F766E',
          hover: '#115E59',
        },
      },
      boxShadow: {
        'cta': '0 10px 15px -3px rgb(15 118 110 / 0.3), 0 4px 6px -4px rgb(15 118 110 / 0.3)',
        'cta-hover': '0 20px 25px -5px rgb(15 118 110 / 0.25), 0 8px 10px -6px rgb(15 118 110 / 0.25)',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
