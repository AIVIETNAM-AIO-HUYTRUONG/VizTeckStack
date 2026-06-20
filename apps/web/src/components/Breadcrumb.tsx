import type React from 'react';

type BreadcrumbState = 'visited' | 'active' | 'none';

interface BreadcrumbItem {
  label: string;
  href: string;
  state: BreadcrumbState;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

const dotClass: Record<BreadcrumbState, string> = {
  visited: 'bg-bg-1 border-2 border-indigo text-indigo',
  active:  'bg-indigo border-2 border-indigo text-white',
  none:    'bg-text-3 border-2 border-text-3 text-white',
};

const labelClass: Record<BreadcrumbState, string> = {
  visited: 'text-indigo',
  active:  'text-indigo',
  none:    'text-text-3',
};

const connectorClass: Record<BreadcrumbState, string> = {
  visited: 'bg-indigo',
  active:  'bg-border',
  none:    'bg-text-2',
};

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center py-3">
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <span key={item.href} className="flex items-center">
            <a
              href={item.href}
              aria-current={item.state === 'active' ? 'page' : undefined}
              className="flex flex-col items-center gap-1 no-underline"
            >
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-mono font-bold ${dotClass[item.state]}`}
              >
                {idx + 1}
              </span>
              <span
                className={`text-[11px] font-body max-w-[96px] text-center leading-tight break-words ${labelClass[item.state]}`}
              >
                {item.label}
              </span>
            </a>
            {!isLast && (
              <span
                aria-hidden="true"
                className={`w-8 h-0.5 mb-4 shrink-0 ${connectorClass[item.state]}`}
              />
            )}
          </span>
        );
      })}
    </nav>
  );
}
