'use client';

import { SearchModal } from '@vizteck/core';
import { useSearchContext } from './SearchContext';

export function SearchModalWrapper() {
  const { open, setOpen } = useSearchContext();

  return (
    <SearchModal
      open={open}
      onClose={() => setOpen(false)}
      getLessonHref={(roadmapSlug, nodeId, _roadmapId) =>
        `/roadmap/${roadmapSlug}/node/${nodeId}`
      }
      getRoadmapHref={(roadmapSlug) => `/roadmap/${roadmapSlug}`}
    />
  );
}
