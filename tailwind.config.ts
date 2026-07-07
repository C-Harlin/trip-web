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
        bg: '#EEF5F8',
        card: '#FAFCFC',
        muted: '#5F7180',
      },
    },
  },
  plugins: [],
} satisfies Config
