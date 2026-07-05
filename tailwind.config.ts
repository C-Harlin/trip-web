import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        sydney: '#3B82F6',
        gor: '#10B981',
        melbourne: '#8B5CF6',
        bg: '#0D1117',
        card: '#161B22',
        muted: '#8B949E',
      },
    },
  },
  plugins: [],
} satisfies Config
