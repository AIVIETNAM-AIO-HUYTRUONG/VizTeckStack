'use client';

import { SearchModal, useSearchModal } from '@vizteck/lesson';

export function SearchModalWrapper() {
  const { open, setOpen } = useSearchModal();

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
