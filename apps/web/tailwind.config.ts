import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        indigo: { DEFAULT: '#4F46E5', mid: '#6366F1', lt: '#EEF2FF' },
        emerald: { DEFAULT: '#059669', lt: '#ECFDF5' },
        bg: { 0: '#F8F9FC', 1: '#FFFFFF', 2: '#F1F3F9' },
        border: '#E2E8F0',
        text: { 1: '#0F172A', 2: '#475569', 3: '#94A3B8' },
      },
      borderRadius: { sm: '6px', md: '10px', lg: '16px' },
      fontFamily: {
        display: ['Space Grotesk', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
