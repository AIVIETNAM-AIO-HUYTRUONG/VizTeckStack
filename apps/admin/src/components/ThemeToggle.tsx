'use client';

import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false); // SSR-safe default

  useEffect(() => {
    const stored = localStorage.getItem('theme');
    const dark = stored ? stored === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDark(dark);
    if (dark) document.documentElement.classList.add('dark');
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
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
      className="flex items-center gap-1 px-[10px] py-[6px] text-base leading-none rounded-sm border border-border bg-bg-1 text-text-2 hover:bg-bg-2 hover:text-text-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo transition-colors motion-reduce:transition-none"
    >
      {isDark ? '☀' : '🌙'}
    </button>
  );
}
