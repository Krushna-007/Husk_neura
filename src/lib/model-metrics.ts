/**
 * Model metrics — trainable parameters, activation memory and tensor volume.
 *
 * HuskML could infer output shapes but never counted weights: the UI's
 * `getTotalParameterCount` counts a layer's *configurable fields*, not its
 * parameters, and the real number only appeared once the generated Python was
 * run. This module closes that gap so model size is visible while designing.
 *
 * Provenance discipline (after TokenPrint): every figure is tagged with where
 * it came from, and nothing is invented. A layer whose parameter count this
 * module does not model reports `unknown` rather than 0, so an incomplete
 * total can never masquerade as a complete one.
 */

import type { LayerObject } from "./dag-parser";

export type Provenance = "derived" | "estimated" | "unresolved" | "unknown";

export interface LayerMetrics {
  id: string;
  type: string;
  /** Output shape excluding batch, e.g. [28, 28, 32]. */
  shape: number[] | null;
  /** Trainable weights, or null when this layer type is not modelled. */
  params: number | null;
  paramProvenance: Provenance;
  /** Activation bytes for one sample at float32. */
  activationBytes: number | null;
  /** How the parameter count is arrived at, in plain arithmetic. */
  formula: string | null;
}

export interface ModelMetrics {
  layers: LayerMetrics[];
  totalParams: number;
  /** True when every layer's parameter count is modelled. */
  totalIsComplete: boolean;
  unmodelledTypes: string[];
  /** Layers shape inference never reached — usually disconnected on canvas. */
  unresolvedCount: number;
  totalActivationBytes: number;
  /** Weight storage at float32. */
  weightBytes: number;
}

const BYTES_PER_FLOAT32 = 4;

const num = (v: unknown, fallback = 0): number => {
  const n = typeof v === "string" ? Number(v) : (v as number);
  return Number.isFinite(n) ? n : fallback;
};

/** kernel_size arrives as 3, "3", "3,3" or "(3, 3)". */
function kernel(value: unknown, rank: number): number[] {
  if (typeof value === "number") return Array(rank).fill(value);
  const parts = String(value ?? "")
    .replace(/[()[\]\s]/g, "")
    .split(",")
    .map(Number)
    .filter(Number.isFinite);
  if (parts.length === 0) return Array(rank).fill(0);
  if (parts.length === 1) return Array(rank).fill(parts[0]);
  return parts.slice(0, rank);
}

const prod = (a: number[]) => a.reduce((x, y) => x * y, 1);

/** Channels of the incoming tensor, assuming channels-last. */
const channelsOf = (shape: number[] | null): number | null =>
  shape && shape.length > 0 ? shape[shape.length - 1] : null;

/**
 * Trainable parameters for one layer.
 * Returns null when the layer type is not modelled here.
 */
export function computeLayerParams(
  type: string,
  params: Record<string, unknown>,
  inputShape: number[] | null,
  outputShape: number[] | null
): { count: number | null; formula: string | null } {
  const cIn = channelsOf(inputShape);
  const bias = params.use_bias === false ? 0 : 1;

  switch (type) {
    case "Dense": {
      const units = num(params.units);
      if (cIn === null || !units) return { count: null, formula: null };
      const count = cIn * units + bias * units;
      return {
        count,
        formula: `${cIn} x ${units}${bias ? ` + ${units} bias` : ""}`,
      };
    }

    case "Conv2D":
    case "Conv2DTranspose": {
      const f = num(params.filters);
      const k = kernel(params.kernel_size, 2);
      if (cIn === null || !f || !prod(k)) return { count: null, formula: null };
      const count = prod(k) * cIn * f + bias * f;
      return {
        count,
        formula: `${k.join("x")} x ${cIn} x ${f}${bias ? ` + ${f} bias` : ""}`,
      };
    }

    case "Conv1D": {
      const f = num(params.filters);
      const k = kernel(params.kernel_size, 1);
      if (cIn === null || !f || !prod(k)) return { count: null, formula: null };
      const count = prod(k) * cIn * f + bias * f;
      return { count, formula: `${k[0]} x ${cIn} x ${f} + ${f} bias` };
    }

    case "SeparableConv2D": {
      const f = num(params.filters);
      const k = kernel(params.kernel_size, 2);
      const dm = num(params.depth_multiplier, 1);
      if (cIn === null || !f || !prod(k)) return { count: null, formula: null };
      const depthwise = prod(k) * cIn * dm;
      const pointwise = cIn * dm * f;
      return {
        count: depthwise + pointwise + f,
        formula: `depthwise ${depthwise} + pointwise ${pointwise} + ${f} bias`,
      };
    }

    case "Dense_": // unreachable; keeps the switch exhaustive-looking
      return { count: null, formula: null };

    case "Embedding": {
      const vocab = num(params.input_dim);
      const dim = num(params.output_dim);
      if (!vocab || !dim) return { count: null, formula: null };
      return { count: vocab * dim, formula: `${vocab} vocab x ${dim} dim` };
    }

    case "LSTM":
    case "GRU": {
      const units = num(params.units);
      if (cIn === null || !units) return { count: null, formula: null };
      const gates = type === "LSTM" ? 4 : 3;
      const count = gates * ((cIn + units) * units + units);
      return {
        count,
        formula: `${gates} gates x ((${cIn} + ${units}) x ${units} + ${units})`,
      };
    }

    case "BatchNormalization": {
      const c = channelsOf(outputShape);
      if (c === null) return { count: null, formula: null };
      // gamma + beta trainable; moving mean/variance are not.
      return { count: 2 * c, formula: `gamma ${c} + beta ${c}` };
    }

    case "LayerNormalization": {
      const c = channelsOf(outputShape);
      if (c === null) return { count: null, formula: null };
      return { count: 2 * c, formula: `gamma ${c} + beta ${c}` };
    }

    // Layers that genuinely hold no weights.
    case "Input":
    case "Output":
    case "Activation":
    case "Dropout":
    case "SpatialDropout2D":
    case "GaussianNoise":
    case "Flatten":
    case "Reshape":
    case "ReshapeFlat":
    case "Permute":
    case "Merge":
    case "MaxPool2D":
    case "AveragePooling2D":
    case "GlobalAveragePooling2D":
    case "ZeroPadding2D":
    case "Cropping2D":
      return { count: 0, formula: "no trainable weights" };

    default:
      return { count: null, formula: null };
  }
}

/**
 * Build metrics for an ordered graph. `nodeShapes` comes from computeShapes,
 * so shapes are derived from the same inference the canvas already runs.
 */
export function computeModelMetrics(
  orderedNodes: LayerObject[],
  edgeMap: Map<string, string[]>,
  nodeShapes: Map<string, number[]>
): ModelMetrics {
  const layers: LayerMetrics[] = [];
  const unmodelled = new Set<string>();
  let totalParams = 0;
  let complete = true;
  let unresolvedCount = 0;
  let totalActivationBytes = 0;

  for (const node of orderedNodes) {
    const outputShape = nodeShapes.get(node.id) ?? null;

    // Input shape = the shape of this node's first incoming edge.
    let inputShape: number[] | null = null;
    for (const [from, tos] of edgeMap.entries()) {
      if (tos.includes(node.id)) {
        inputShape = nodeShapes.get(from) ?? null;
        break;
      }
    }

    const { count, formula } = computeLayerParams(
      node.type,
      (node.params ?? {}) as Record<string, unknown>,
      inputShape,
      outputShape
    );

    // Two different failures, and conflating them misreports the model.
    // A layer the module does not model is a gap here; a layer shape
    // inference never reached is a disconnected node on the canvas.
    const unresolved = outputShape === null;
    if (count === null) {
      complete = false;
      if (unresolved) unresolvedCount += 1;
      else unmodelled.add(node.type);
    } else {
      totalParams += count;
    }

    const activationBytes =
      outputShape && outputShape.length
        ? prod(outputShape) * BYTES_PER_FLOAT32
        : null;
    if (activationBytes) totalActivationBytes += activationBytes;

    layers.push({
      id: node.id,
      type: node.type,
      shape: outputShape,
      params: count,
      paramProvenance:
        count !== null ? "derived" : unresolved ? "unresolved" : "unknown",
      activationBytes,
      formula,
    });
  }

  return {
    layers,
    totalParams,
    totalIsComplete: complete,
    unmodelledTypes: [...unmodelled],
    unresolvedCount,
    totalActivationBytes,
    weightBytes: totalParams * BYTES_PER_FLOAT32,
  };
}

export function formatCount(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return String(n);
}

export function formatBytes(b: number): string {
  if (b >= 1024 ** 3) return `${(b / 1024 ** 3).toFixed(2)} GB`;
  if (b >= 1024 ** 2) return `${(b / 1024 ** 2).toFixed(1)} MB`;
  if (b >= 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${b} B`;
}
