import { useState, useEffect } from 'react';
import { useSearchLazyQuery } from '@vizteck/graphql-client';
import type { SearchQuery } from '@vizteck/graphql-client';

type SearchResultItem = NonNullable<SearchQuery['search']>[number];

export interface TimeGroup {
  label: string;
  items: SearchResultItem[];
}

function groupByTime(results: SearchResultItem[]): TimeGroup[] {
  const now = new Date();
  const buckets: Record<string, SearchResultItem[]> = {
    Today: [],
    Yesterday: [],
    'Past week': [],
    Older: [],
  };

  for (const r of results) {
    if (!r) continue;
    const diffDays = Math.floor(
      (now.getTime() - new Date(r.updatedAt).getTime()) / 86400000,
    );
    if (diffDays === 0) buckets['Today'].push(r);
    else if (diffDays === 1) buckets['Yesterday'].push(r);
    else if (diffDays <= 7) buckets['Past week'].push(r);
    else buckets['Older'].push(r);
  }

  return Object.entries(buckets)
    .filter(([, items]) => items.length > 0)
    .map(([label, items]) => ({ label, items }));
}

export function useSearch() {
  const [query, setQuery] = useState('');
  const [titleOnly, setTitleOnly] = useState(false);
  const [roadmapId, setRoadmapId] = useState<string | undefined>();
  const [search, { data, loading, error }] = useSearchLazyQuery();

  useEffect(() => {
    if (query.length < 2) return;
    const timer = setTimeout(() => {
      search({ variables: { q: query, titleOnly, roadmapId } });
    }, 300);
    return () => clearTimeout(timer);
  }, [query, titleOnly, roadmapId, search]);

  const grouped = groupByTime(data?.search ?? []);

  return {
    query, setQuery,
    titleOnly, setTitleOnly,
    roadmapId, setRoadmapId,
    grouped, loading, error,
  };
}
