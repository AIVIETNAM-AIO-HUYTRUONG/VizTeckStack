import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{ts,tsx}',
    '../../packages/core/src/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
    '../../packages/graph/src/**/*.{ts,tsx}',
    '../../packages/lesson/src/**/*.{ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Semantic tokens backed by CSS variables — dark mode auto
        bg: { 0: 'var(--bg-0)', 1: 'var(--bg-1)', 2: 'var(--bg-2)' },
        border: 'var(--border)',
        text: { 1: 'var(--text-1)', 2: 'var(--text-2)', 3: 'var(--text-3)' },
        indigo: { DEFAULT: '#4F46E5', mid: '#6366F1', lt: '#EEF2FF' },
        emerald: { DEFAULT: '#059669', lt: '#ECFDF5' },
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
