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
 * Static color mapping to ensure Tailwind classes are included in build
 */
const categoryColorMap: Record<
  string,
  { bg: string; border: string; text: string; hover: string }
> = {
  emerald: {
    bg: "bg-emerald-900/20",
    border: "border-emerald-600",
    text: "text-emerald-300",
    hover: "hover:border-emerald-500 hover:shadow-emerald-500/20",
  },
  blue: {
    bg: "bg-blue-900/20",
    border: "border-blue-600",
    text: "text-blue-300",
    hover: "hover:border-blue-500 hover:shadow-blue-500/20",
  },
  purple: {
    bg: "bg-purple-900/20",
    border: "border-purple-600",
    text: "text-purple-300",
    hover: "hover:border-purple-500 hover:shadow-purple-500/20",
  },
  indigo: {
    bg: "bg-indigo-900/20",
    border: "border-indigo-600",
    text: "text-indigo-300",
    hover: "hover:border-indigo-500 hover:shadow-indigo-500/20",
  },
  amber: {
    bg: "bg-amber-900/20",
    border: "border-amber-500",
    text: "text-amber-300",
    hover: "hover:border-amber-400 hover:shadow-amber-400/20",
  },
  orange: {
    bg: "bg-orange-900/20",
    border: "border-orange-600",
    text: "text-orange-300",
    hover: "hover:border-orange-500 hover:shadow-orange-500/20",
  },
  rose: {
    bg: "bg-rose-900/20",
    border: "border-rose-600",
    text: "text-rose-300",
    hover: "hover:border-rose-500 hover:shadow-rose-500/20",
  },
  cyan: {
    bg: "bg-cyan-900/20",
    border: "border-cyan-600",
    text: "text-cyan-300",
    hover: "hover:border-cyan-500 hover:shadow-cyan-500/20",
  },
  teal: {
    bg: "bg-teal-900/20",
    border: "border-teal-600",
    text: "text-teal-300",
    hover: "hover:border-teal-500 hover:shadow-teal-500/20",
  },
  slate: {
    bg: "bg-zinc-800/50",
    border: "border-zinc-600",
    text: "text-zinc-300",
    hover: "hover:border-zinc-500 hover:shadow-zinc-500/20",
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
