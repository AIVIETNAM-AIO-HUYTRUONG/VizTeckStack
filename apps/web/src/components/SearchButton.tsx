'use client';

import { useSearchContext } from '../features/search/SearchContext';
import { Button } from '@vizteck/ui';

export function SearchButton() {
  const { setOpen } = useSearchContext();

  return (
    <Button variant="ghost" size="icon" onClick={() => setOpen(true)} aria-label="Search">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
    </Button>
  );
}
