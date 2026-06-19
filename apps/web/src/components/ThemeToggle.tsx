'use client';

import { useState } from 'react';

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <button
      onClick={toggle}
      aria-label="Toggle dark mode"
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)',
        padding: '6px 10px',
        background: 'var(--bg-1)',
        color: 'var(--text-2)',
        cursor: 'pointer',
        fontSize: 16,
        lineHeight: 1,
        display: 'flex',
        alignItems: 'center',
        gap: 4,
      }}
    >
      {isDark ? '☀' : '🌙'}
    </button>
  );
}
