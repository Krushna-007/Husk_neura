import type { EdgeProps } from "@xyflow/react";
import { BaseEdge, getBezierPath, useReactFlow } from "@xyflow/react";
import { useCallback } from "react";

/**
 * Connection edge. Click to remove.
 *
 * This previously drew two stacked edges: a base line plus a gradient dash
 * whose offset was advanced by `setInterval(…, 50)` — a React state update
 * twenty times a second, per edge, for as long as the graph was open. On a
 * dozen edges that is ~240 re-renders a second spent on a decorative dash
 * that reported nothing, since HuskML has no running state to indicate.
 *
 * One line now, coloured from the token layer, thickening to the accent when
 * selected.
 */
export function DeletableEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
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

  const { deleteElements } = useReactFlow();

  const onEdgeClick = useCallback(
    (evt: React.MouseEvent<SVGGElement, MouseEvent>) => {
      evt.stopPropagation();
      deleteElements({ edges: [{ id }] });
    },
    [deleteElements, id]
  );

  return (
    <BaseEdge
      path={edgePath}
      style={{
        ...style,
        strokeWidth: selected ? 2.5 : 1.5,
        stroke: selected ? "var(--color-accent)" : "var(--color-ink-muted)",
      }}
      onClick={onEdgeClick}
    />
  );
}
