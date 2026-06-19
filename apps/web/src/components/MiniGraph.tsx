interface MiniGraphNode {
  id: string;
  x: number;
  y: number;
  type: 'ROADMAP' | 'LESSON';
}

interface MiniGraphEdge {
  sourceId: string;
  targetId: string;
}

interface MiniGraphProps {
  nodes: MiniGraphNode[];
  edges: MiniGraphEdge[];
  width?: number;
  height?: number;
}

function normalize(
  values: number[],
  targetMin: number,
  targetMax: number,
): Map<number, number> {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const result = new Map<number, number>();
  for (const v of values) {
    result.set(v, targetMin + ((v - min) / range) * (targetMax - targetMin));
  }
  return result;
}

export function MiniGraph({
  nodes,
  edges,
  width = 240,
  height = 120,
}: MiniGraphProps) {
  const padding = 16;
  const inner_w = width - padding * 2;
  const inner_h = height - padding * 2;

  // Normalize coordinates to fit viewBox
  const xs = nodes.map((n) => n.x);
  const ys = nodes.map((n) => n.y);
  const xMap =
    xs.length > 0
      ? normalize(xs, padding, padding + inner_w)
      : new Map<number, number>();
  const yMap =
    ys.length > 0
      ? normalize(ys, padding, padding + inner_h)
      : new Map<number, number>();

  const posById = new Map<string, { cx: number; cy: number }>();
  for (const n of nodes) {
    posById.set(n.id, {
      cx: xMap.get(n.x) ?? padding,
      cy: yMap.get(n.y) ?? padding,
    });
  }

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ background: '#F1F3F9', borderRadius: 8, display: 'block' }}
      aria-label="Mini graph preview"
    >
      {edges.map((e, i) => {
        const src = posById.get(e.sourceId);
        const tgt = posById.get(e.targetId);
        if (!src || !tgt) return null;
        return (
          <line
            key={i}
            x1={src.cx}
            y1={src.cy}
            x2={tgt.cx}
            y2={tgt.cy}
            stroke="#CBD5E1"
            strokeWidth={1.5}
          />
        );
      })}
      {nodes.map((n) => {
        const pos = posById.get(n.id);
        if (!pos) return null;
        const fill = n.type === 'ROADMAP' ? '#4F46E5' : '#059669';
        return (
          <circle
            key={n.id}
            cx={pos.cx}
            cy={pos.cy}
            r={6}
            fill={fill}
          />
        );
      })}
    </svg>
  );
}
