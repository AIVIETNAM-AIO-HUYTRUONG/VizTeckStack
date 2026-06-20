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

function normalizePositions(
  nodes: MiniGraphNode[],
  padding: number,
  innerW: number,
  innerH: number,
): Map<string, { cx: number; cy: number }> {
  const xs = nodes.map((n) => n.x);
  const ys = nodes.map((n) => n.y);
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const yMin = Math.min(...ys);
  const yMax = Math.max(...ys);
  const xRange = xMax - xMin || 1;
  const yRange = yMax - yMin || 1;
  const result = new Map<string, { cx: number; cy: number }>();
  for (const n of nodes) {
    result.set(n.id, {
      cx: padding + ((n.x - xMin) / xRange) * innerW,
      cy: padding + ((n.y - yMin) / yRange) * innerH,
    });
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
  const innerW = width - padding * 2;
  const innerH = height - padding * 2;

  // Normalize coordinates to fit viewBox, keyed by node ID to avoid
  // duplicate-coordinate collisions (WR-01)
  const posById =
    nodes.length > 0
      ? normalizePositions(nodes, padding, innerW, innerH)
      : new Map<string, { cx: number; cy: number }>();

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
