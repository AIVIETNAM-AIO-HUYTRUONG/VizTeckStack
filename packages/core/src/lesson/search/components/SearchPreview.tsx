import type { SearchQuery } from '@vizteck/graphql-client';

type Item = NonNullable<SearchQuery['search']>[number];

interface SearchPreviewProps {
  item: Item | null;
}

export function SearchPreview({ item }: SearchPreviewProps) {
  if (!item) {
    return (
      <div className="flex-1 flex items-center justify-center text-text-3 text-sm">
        Select a result to preview
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      {item.coverImage ? (
        <img
          src={item.coverImage}
          alt=""
          className="w-full h-32 object-cover"
        />
      ) : (
        <div className="w-full h-32 bg-bg-2 flex items-center justify-center text-4xl">
          {item.icon || '📄'}
        </div>
      )}
      <div className="p-4">
        <p className="text-xs text-text-3 mb-1">{item.breadcrumb.join(' › ')}</p>
        <h3 className="font-semibold text-text-1 text-base leading-tight">{item.title}</h3>
      </div>
    </div>
  );
}
