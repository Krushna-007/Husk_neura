import { BaseEdge, EdgeProps, getBezierPath, useReactFlow } from "@xyflow/react";
import { useCallback, useEffect, useState } from "react";

export function DeletableEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  selected,
}: EdgeProps) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const [offset, setOffset] = useState(0);
  const { deleteElements } = useReactFlow();

  // Animate the flow effect
  useEffect(() => {
    const interval = setInterval(() => {
      setOffset((offset) => (offset + 1) % 15);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const onEdgeClick = useCallback((evt: React.MouseEvent<SVGGElement, MouseEvent>, id: string) => {
    evt.stopPropagation();
    deleteElements({ edges: [{ id }] });
  }, [deleteElements]);

  return (
    <>
      {/* Base edge with glow effect */}
      <BaseEdge
        path={edgePath}
        style={{
          ...style,
          strokeWidth: selected ? 3 : 2,
          stroke: selected ? 'rgba(99, 102, 241, 0.8)' : 'rgba(161, 161, 170, 0.6)',
          filter: selected ? 'drop-shadow(0 0 8px rgba(99, 102, 241, 0.5))' : undefined,
        }}
        onClick={(e) => onEdgeClick(e, id)}
      />
      
      {/* Animated flow effect */}
      <BaseEdge
        path={edgePath}
        style={{
          strokeWidth: 2,
          stroke: 'url(#flowGradient)',
          strokeDasharray: '5 10',
          strokeDashoffset: -offset,
          opacity: 0.6,
        }}
        onClick={(e) => onEdgeClick(e, id)}
      />

      {/* Gradient definition */}
      <defs>
        <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(99, 102, 241, 0)" />
          <stop offset="50%" stopColor="rgba(99, 102, 241, 0.8)" />
          <stop offset="100%" stopColor="rgba(99, 102, 241, 0)" />
        </linearGradient>
      </defs>
    </>
  );
}