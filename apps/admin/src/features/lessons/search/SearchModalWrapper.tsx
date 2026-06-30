'use client';

import { SearchModal, useSearchModal } from '@vizteck/core';

export function SearchModalWrapper() {
  const { open, setOpen } = useSearchModal();

  return (
    <SearchModal
      open={open}
      onClose={() => setOpen(false)}
      getLessonHref={(roadmapSlug, nodeId, roadmapId) =>
        `/roadmaps/${roadmapId}/nodes/${nodeId}`
      }
      getRoadmapHref={(roadmapSlug) => `/roadmaps`}
    />
  );
}
