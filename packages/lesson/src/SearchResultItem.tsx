import type { SearchQuery } from '@vizteck/graphql-client';

type Item = NonNullable<SearchQuery['search']>[number];

interface SearchResultItemProps {
  item: Item;
  isSelected: boolean;
  onMouseEnter: () => void;
  onClick: () => void;
}

export function SearchResultItem({ item, isSelected, onMouseEnter, onClick }: SearchResultItemProps) {
  if (!item) return null;
  const icon = item.icon || (item.type === 'LESSON' ? '📄' : '📁');

  return (
    <button
      type="button"
      role="option"
      aria-selected={isSelected}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      className={`w-full text-left px-3 py-2 flex items-center gap-2 rounded-md text-sm transition-colors ${
        isSelected ? 'bg-indigo/10 text-text-1' : 'text-text-2 hover:bg-bg-2'
      }`}
    >
      <span className="text-base shrink-0">{icon}</span>
      <span className="flex-1 min-w-0">
        <span className="block font-medium truncate">{item.title}</span>
        <span className="block text-xs text-text-3 truncate">
          {item.breadcrumb.join(' › ')}
        </span>
      </span>
    </button>
  );
}
