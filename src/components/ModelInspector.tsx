/**
 * Model Inspector — what the architecture on the canvas actually costs.
 *
 * Shape inference already ran for validation; this surfaces it, adds weight
 * and activation accounting, and draws each tensor to scale so the shape of
 * the network is legible at a glance.
 *
 * Every figure is labelled with its provenance. A layer whose parameter count
 * is not modelled reports "not modelled" rather than zero, and the total says
 * so, because a total that quietly under-reports is worse than no total.
 */
import { useMemo } from "react";
import type { Node } from "@xyflow/react";

import { useFlowStore } from "../lib/flow-store";
import { parseGraphToDAG } from "../lib/dag-parser";
import { computeShapes } from "../lib/shape-computation";
import {
  computeModelMetrics,
  formatBytes,
  formatCount,
  type LayerMetrics,
} from "../lib/model-metrics";
import { LayerIcon } from "../lib/layer-icons";
import { getLayerCategoryColors } from "../lib/categories";
import { getLayerDefinition } from "../lib/layer-definitions";

const DEFAULT_INPUT_SHAPE = "28,28,1";

function inputShapeOf(nodes: Node[]): string {
  const input = nodes.find((n) => (n.data as { type?: string }).type === "Input");
  const params = (input?.data as { params?: Record<string, unknown> })?.params;
  if (!params) return DEFAULT_INPUT_SHAPE;
  const def = getLayerDefinition("Input");
  const computed = def?.computeShape([], params);
  return computed ? computed.join(",") : DEFAULT_INPUT_SHAPE;
}

/** Tensor drawn as a face whose area tracks the spatial dims, with depth
 *  bars standing in for channels. Scaled against the largest in the model. */
function TensorGlyph({
  shape,
  max,
  tint,
}: {
  shape: number[] | null;
  max: number;
  tint: string;
}) {
  if (!shape || shape.length === 0) {
    return <div className="h-10 w-10 rounded-sm border border-dashed border-rule" />;
  }
  const spatial = shape.length >= 3 ? shape.slice(0, 2) : [shape[0], 1];
  const channels = shape[shape.length - 1] ?? 1;
  const side = Math.max(6, Math.min(40, (Math.sqrt(spatial[0] * spatial[1]) / max) * 40));
  const bars = Math.max(1, Math.min(6, Math.round(Math.log2(channels + 1))));

  return (
    <div className="flex h-10 w-10 items-end justify-center gap-[1px]" title={shape.join(" x ")}>
      {Array.from({ length: bars }).map((_, i) => (
        <div
          key={i}
          className={`${tint} rounded-[1px]`}
          style={{ width: 3, height: Math.max(3, side * (1 - i * 0.08)) }}
        />
      ))}
    </div>
  );
}

function Row({ layer, maxSide, maxParams }: { layer: LayerMetrics; maxSide: number; maxParams: number }) {
  const colors = getLayerCategoryColors(layer.type);
  const share = layer.params && maxParams > 0 ? layer.params / maxParams : 0;

  return (
    <div className="grid grid-cols-[40px_1fr_auto] items-center gap-3 border-b border-rule-soft px-4 py-2.5 last:border-b-0">
      <TensorGlyph shape={layer.shape} max={maxSide} tint={colors.text.replace("text-", "bg-")} />

      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <LayerIcon type={layer.type} className={`h-3.5 w-3.5 flex-shrink-0 ${colors.text}`} />
          <span className="truncate text-[13px] font-medium text-ink">{layer.type}</span>
        </div>
        <div className="mt-0.5 font-mono text-[11px] text-ink-muted">
          {layer.shape ? layer.shape.join(" x ") : "shape unresolved"}
          {layer.activationBytes !== null && (
            <span className="text-ink-faint"> · {formatBytes(layer.activationBytes)}</span>
          )}
        </div>
      </div>

      <div className="text-right">
        {layer.params === null ? (
          <span className="font-mono text-[11px] text-amber-700">
            {layer.paramProvenance === "unresolved" ? "not connected" : "not modelled"}
          </span>
        ) : (
          <>
            <div className="font-mono text-[13px] tabular-nums text-ink">
              {formatCount(layer.params)}
            </div>
            {layer.formula && (
              <div className="font-mono text-[10px] text-ink-faint" title={layer.formula}>
                {layer.formula.length > 22 ? `${layer.formula.slice(0, 22)}…` : layer.formula}
              </div>
            )}
          </>
        )}
        {share > 0.02 && (
          <div className="mt-1 h-[3px] w-16 overflow-hidden rounded-pill bg-rule-soft">
            <div className="h-full rounded-pill bg-brand" style={{ width: `${share * 100}%` }} />
          </div>
        )}
      </div>
    </div>
  );
}

export function ModelInspector() {
  const { nodes, edges } = useFlowStore();

  const metrics = useMemo(() => {
    if (nodes.length === 0) return null;
    const dag = parseGraphToDAG(nodes, edges);
    if (!dag.isValid) return null;
    const { nodeShapes } = computeShapes(dag, inputShapeOf(nodes));
    return computeModelMetrics(dag.orderedNodes, dag.edgeMap, nodeShapes);
  }, [nodes, edges]);

  if (!metrics || metrics.layers.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 px-8 text-center">
        <p className="text-[13px] text-ink-muted">Nothing to inspect yet</p>
        <p className="max-w-[240px] text-xs text-ink-faint">
          Add layers to the canvas and connect them. Parameter counts and tensor
          shapes appear here as you build.
        </p>
      </div>
    );
  }

  const maxSide = Math.max(
    1,
    ...metrics.layers.map((l) =>
      l.shape && l.shape.length >= 3 ? Math.sqrt(l.shape[0] * l.shape[1]) : 1
    )
  );
  const maxParams = Math.max(1, ...metrics.layers.map((l) => l.params ?? 0));

  return (
    <div className="flex h-full flex-col">
      <header className="shrink-0 border-b border-rule bg-paper-raised px-4 py-3">
        <h2 className="font-display text-[15px] font-semibold tracking-tightish text-ink">
          Model Inspector
        </h2>

        <dl className="mt-3 grid grid-cols-3 gap-2">
          <div className="rounded-md border border-rule bg-paper px-2.5 py-2">
            <dt className="text-[10px] uppercase tracking-wider text-ink-faint">Parameters</dt>
            <dd className="mt-0.5 font-mono text-[15px] tabular-nums text-ink">
              {formatCount(metrics.totalParams)}
              {!metrics.totalIsComplete && <span className="text-amber-700">+</span>}
            </dd>
          </div>
          <div className="rounded-md border border-rule bg-paper px-2.5 py-2">
            <dt className="text-[10px] uppercase tracking-wider text-ink-faint">Weights</dt>
            <dd className="mt-0.5 font-mono text-[15px] tabular-nums text-ink">
              {formatBytes(metrics.weightBytes)}
            </dd>
          </div>
          <div className="rounded-md border border-rule bg-paper px-2.5 py-2">
            <dt className="text-[10px] uppercase tracking-wider text-ink-faint">Activations</dt>
            <dd className="mt-0.5 font-mono text-[15px] tabular-nums text-ink">
              {formatBytes(metrics.totalActivationBytes)}
            </dd>
          </div>
        </dl>

        <p className="mt-2 text-[11px] leading-relaxed text-ink-faint">
          Derived from the graph on the canvas at float32, one sample per batch.
          {metrics.unresolvedCount > 0 && (
            <span className="text-amber-700">
              {" "}
              {metrics.unresolvedCount} layer
              {metrics.unresolvedCount === 1 ? "" : "s"} not connected to the
              graph, so excluded.
            </span>
          )}
          {metrics.unmodelledTypes.length > 0 && (
            <span className="text-amber-700">
              {" "}
              Excludes {metrics.unmodelledTypes.join(", ")} — not modelled here.
            </span>
          )}
        </p>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {metrics.layers.map((layer) => (
          <Row key={layer.id} layer={layer} maxSide={maxSide} maxParams={maxParams} />
        ))}
      </div>
    </div>
  );
}
