import type { BreadcrumbItem } from "../types";

export interface BreadcrumbDisplayProps {
  items: BreadcrumbItem[];
  variant?: "default" | "overlay";
  getLinkHref?: (item: BreadcrumbItem) => string | undefined;
}

export function BreadcrumbDisplay({
  items,
  variant = "default",
  getLinkHref,
}: BreadcrumbDisplayProps) {
  if (items.length === 0) return null;

  const isOverlay = variant === "overlay";
  const linkClass = isOverlay
    ? "text-white/60 hover:text-white/90 transition-colors"
    : "text-text-3 hover:text-text-2 transition-colors";
  const sepClass = isOverlay ? "text-white/40" : "text-text-3";
  const currentClass = isOverlay ? "text-white/90" : "text-text-1";

  return (
    <nav className="flex items-center flex-wrap gap-1 text-xs">
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        const href = !isLast && getLinkHref ? getLinkHref(item) : undefined;
        return (
          <span key={item.nodeId ?? item.slug ?? item.title ?? i} className="flex items-center gap-1">
            {i > 0 && <span className={sepClass}>›</span>}
            {isLast ? (
              <span className={currentClass}>{item.title}</span>
            ) : href ? (
              <a href={href} className={linkClass}>
                {item.title}
              </a>
            ) : (
              <span className={linkClass}>{item.title}</span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
