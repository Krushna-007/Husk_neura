/**
 * Layer Category Definitions and Color Mappings
 *
 * Single source of truth for layer categorization and theming.
 * Defines the visual categorization and theming for different types of neural network layers.
 */

import { getLayersByCategory } from "./layer-definitions";

// ============================================================================
// CATEGORY DEFINITIONS
// ============================================================================

export const categories: Record<string, CategoryDefinition> = {
  input_output: {
    name: "Input/Output",
    color: "emerald",
    description: "Start and end points of your network",
    icon: "🔌",
  },
  core: {
    name: "Core Layers",
    color: "slate",
    description: "Essential building blocks for neural networks",
    icon: "🧱",
  },
  dense: {
    name: "Dense Layers",
    color: "blue",
    description: "Fully connected layers",
    icon: "🔗",
  },
  convolutional: {
    name: "Convolutional",
    color: "purple",
    description: "Conv2D and related layers",
    icon: "🔲",
  },
  pooling: {
    name: "Pooling",
    color: "indigo",
    description: "Downsampling and upsampling",
    icon: "🏊",
  },
  transformation: {
    name: "Transformation",
    color: "amber",
    description: "Shape transformation layers",
    icon: "🔄",
  },
  activation: {
    name: "Activation",
    color: "orange",
    description: "Non-linear activation functions",
    icon: "⚡",
  },
  regularization: {
    name: "Regularization",
    color: "rose",
    description: "Batch normalization and dropout",
    icon: "🛡️",
  },
  sequence: {
    name: "Sequence",
    color: "cyan",
    description: "RNN and embedding layers",
    icon: "📊",
  },
  merge: {
    name: "Merge",
    color: "teal",
    description: "Layer combination operations",
    icon: "🔀",
  },
} as const;

// ============================================================================
// COLOR MAPPINGS
// ============================================================================

/**
 * Static color mapping to ensure Tailwind classes are included in build.
 *
 * Husk Platinum (light): each category reads as a faint tinted card with a
 * hairline border and a saturated label. The hue identity of every category
 * is preserved from the dark build, so existing muscle memory survives —
 * only the lightness is re-derived for a white ground.
 */
const categoryColorMap: Record<
  string,
  { bg: string; border: string; text: string; hover: string }
> = {
  emerald: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
    hover: "hover:border-emerald-400 hover:shadow-emerald-500/10",
  },
  blue: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-700",
    hover: "hover:border-blue-400 hover:shadow-blue-500/10",
  },
  purple: {
    bg: "bg-purple-50",
    border: "border-purple-200",
    text: "text-purple-700",
    hover: "hover:border-purple-400 hover:shadow-purple-500/10",
  },
  indigo: {
    bg: "bg-indigo-50",
    border: "border-indigo-200",
    text: "text-indigo-700",
    hover: "hover:border-indigo-400 hover:shadow-indigo-500/10",
  },
  amber: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
    hover: "hover:border-amber-400 hover:shadow-amber-500/10",
  },
  orange: {
    bg: "bg-orange-50",
    border: "border-orange-200",
    text: "text-orange-700",
    hover: "hover:border-orange-400 hover:shadow-orange-500/10",
  },
  rose: {
    bg: "bg-rose-50",
    border: "border-rose-200",
    text: "text-rose-700",
    hover: "hover:border-rose-400 hover:shadow-rose-500/10",
  },
  cyan: {
    bg: "bg-cyan-50",
    border: "border-cyan-200",
    text: "text-cyan-700",
    hover: "hover:border-cyan-400 hover:shadow-cyan-500/10",
  },
  teal: {
    bg: "bg-teal-50",
    border: "border-teal-200",
    text: "text-teal-700",
    hover: "hover:border-teal-400 hover:shadow-teal-500/10",
  },
  slate: {
    bg: "bg-paper-raised",
    border: "border-rule",
    text: "text-ink-2",
    hover: "hover:border-ink-faint hover:shadow-black/5",
  },
};

// ============================================================================
// TYPES
// ============================================================================

export interface CategoryDefinition {
  name: string;
  color: string;
  description: string;
  icon: string;
}

export interface CategoryColors {
  bg: string;
  border: string;
  text: string;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

// Layer type to category mapping to avoid circular dependencies
const layerCategoryMap: Record<string, string> = {
  // Input/Output
  Input: "input_output",
  Output: "input_output",

  // Core
  Dense: "core",
  Activation: "core",

  // Convolutional
  Conv2D: "convolutional",
  Conv1D: "convolutional",
  Conv2DTranspose: "convolutional",
  SeparableConv2D: "convolutional",
  ZeroPadding2D: "convolutional",
  Cropping2D: "convolutional",

  // Pooling
  MaxPool2D: "pooling",
  AveragePooling2D: "pooling",
  GlobalAveragePooling2D: "pooling",

  // Transformation
  Flatten: "transformation",
  ReshapeFlat: "transformation",
  Reshape: "transformation",
  Permute: "transformation",
  Merge: "transformation",

  // Regularization
  Dropout: "regularization",
  BatchNormalization: "regularization",
  LayerNormalization: "regularization",
  GaussianNoise: "regularization",
  SpatialDropout2D: "regularization",

  // Sequence
  Embedding: "sequence",
  LSTM: "sequence",
  GRU: "sequence",
  Bidirectional: "sequence",
  TimeDistributed: "sequence",
};

/**
 * Get category colors for a specific layer type
 */
export function getLayerCategoryColors(layerType: string): {
  bg: string;
  border: string;
  text: string;
  hover: string;
} {
  const category = layerCategoryMap[layerType] || "core";
  return getCategoryColorsByKey(category);
}

/**
 * Get category colors by category key
 */
export function getCategoryColorsByKey(categoryKey: string): {
  bg: string;
  border: string;
  text: string;
  hover: string;
} {
  const categoryInfo = categories[categoryKey as keyof typeof categories];

  if (!categoryInfo?.color) {
    return categoryColorMap.blue; // fallback to blue
  }

  return categoryColorMap[categoryInfo.color] || categoryColorMap.blue;
}

/**
 * Get layer categories with their associated layers
 */
export function getLayerCategories() {
  return Object.entries(categories).map(([key, category]) => {
    const colorClasses = getCategoryColorsByKey(key);
    const layersByCategory = getLayersByCategory(key);

    return {
      key,
      name: category.name,
      color: category.color,
      bgColor: colorClasses.bg,
      borderColor: colorClasses.border,
      textColor: colorClasses.text,
      description: category.description,
      layerTypes: layersByCategory.map(({ type }: { type: string }) => type),
    };
  });
}
