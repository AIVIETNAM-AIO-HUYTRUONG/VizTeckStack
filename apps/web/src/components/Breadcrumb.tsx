type BreadcrumbState = 'visited' | 'active' | 'none';

interface BreadcrumbItem {
  label: string;
  href: string;
  state: BreadcrumbState;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

const DOT_STYLES: Record<BreadcrumbState, React.CSSProperties> = {
  visited: {
    background: '#FFFFFF',
    border: '2px solid #4F46E5',
    color: '#4F46E5',
  },
  active: {
    background: '#4F46E5',
    border: '2px solid #4F46E5',
    color: '#FFFFFF',
  },
  none: {
    background: '#94A3B8',
    border: '2px solid #94A3B8',
    color: '#FFFFFF',
  },
};

const CONNECTOR_COLORS: Record<BreadcrumbState, string> = {
  visited: '#4F46E5',
  active: '#E2E8F0',
  none: '#CBD5E1',
};

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 0,
        padding: '12px 0',
      }}
    >
      {items.map((item, idx) => {
        const dotStyle = DOT_STYLES[item.state];
        const isLast = idx === items.length - 1;
        const connectorColor = CONNECTOR_COLORS[item.state];

        return (
          <span key={item.href} style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
            <a
              href={item.href}
              aria-current={item.state === 'active' ? 'page' : undefined}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                textDecoration: 'none',
              }}
            >
              <span
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 10,
                  fontFamily: 'JetBrains Mono, monospace',
                  fontWeight: 700,
                  ...dotStyle,
                }}
              >
                {idx + 1}
              </span>
              <span
                style={{
                  fontSize: 11,
                  color: item.state === 'active' ? '#4F46E5' : item.state === 'visited' ? '#4F46E5' : '#94A3B8',
                  fontFamily: 'Inter, sans-serif',
                  maxWidth: 72,
                  textAlign: 'center',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {item.label}
              </span>
            </a>
            {!isLast && (
              <span
                aria-hidden="true"
                style={{
                  width: 32,
                  height: 2,
                  background: connectorColor,
                  marginBottom: 16,
                  flexShrink: 0,
                }}
              />
            )}
          </span>
        );
      })}
    </nav>
  );
}
