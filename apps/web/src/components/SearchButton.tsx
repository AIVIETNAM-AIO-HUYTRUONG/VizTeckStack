'use client';

import { useSearchContext } from '../features/search/SearchContext';

export function SearchButton() {
  const { setOpen } = useSearchContext();

  return (
    <button
      type="button"
      aria-label="Search"
      onClick={() => setOpen(true)}
      className="sm:hidden flex items-center justify-center w-11 h-11 text-text-2 hover:text-text-1 transition-colors rounded-sm focus:outline-none focus:ring-2 focus:ring-indigo motion-reduce:transition-none"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
    </button>
  );
}
