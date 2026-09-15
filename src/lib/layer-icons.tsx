/**
 * Layer icon registry.
 *
 * Replaces the emoji glyphs that previously stood in as the icon system.
 * Emoji render differently on every platform, carry no semantic weight, and
 * read as decoration rather than notation — wrong for a tool whose whole job
 * is precision. These are line icons from lucide, already a dependency.
 *
 * The emoji in layer-definitions.ts are left in place (still returned by
 * getLayerIcon) so nothing that reads that field breaks; render paths use
 * this registry instead.
 */
import {
  ArrowDownToLine, Target, CircleDot, Grid3x3, Minus, Shrink,
  Waves, Globe, Repeat, Frame, Scissors, List, RotateCw, Zap,
  ArrowLeftRight, Clock, Rows, Shuffle, GitMerge, Shield, BarChart3,
  Ruler, Dices, Layers, Square, ArrowUpFromLine, type LucideIcon,
} from "lucide-react";

const LAYER_ICONS: Record<string, LucideIcon> = {
  Input:                  ArrowDownToLine,
  Output:                 Target,
  Dense:                  CircleDot,
  Conv2D:                 Grid3x3,
  Conv1D:                 Minus,
  Conv2DTranspose:        ArrowUpFromLine,
  SeparableConv2D:        Square,
  MaxPool2D:              Shrink,
  AveragePooling2D:       Waves,
  GlobalAveragePooling2D: Globe,
  ZeroPadding2D:          Frame,
  Cropping2D:             Scissors,
  Flatten:                Rows,
  ReshapeFlat:            Repeat,
  Reshape:                Shuffle,
  Permute:                RotateCw,
  Merge:                  GitMerge,
  Embedding:              List,
  LSTM:                   Repeat,
  GRU:                    Repeat,
  Bidirectional:          ArrowLeftRight,
  TimeDistributed:        Clock,
  Activation:             Zap,
  Dropout:                Shield,
  SpatialDropout2D:       Shield,
  BatchNormalization:     BarChart3,
  LayerNormalization:     Ruler,
  GaussianNoise:          Dices,
};

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  input_output:   ArrowDownToLine,
  core:           Layers,
  dense:          CircleDot,
  convolutional:  Grid3x3,
  pooling:        Shrink,
  transformation: Shuffle,
  activation:     Zap,
  regularization: Shield,
  sequence:       BarChart3,
  merge:          GitMerge,
};

export function LayerIcon({
  type,
  className = "h-4 w-4",
}: {
  type: string;
  className?: string;
}) {
  const Icon = LAYER_ICONS[type] ?? Layers;
  return <Icon className={className} strokeWidth={1.75} aria-hidden />;
}

/** Templates carried their own emoji set; same treatment. */
const TEMPLATE_CATEGORY_ICONS: Record<string, LucideIcon> = {
  classification: Target,
  regression:     BarChart3,
  cnn:            Grid3x3,
  rnn:            Repeat,
  autoencoder:    Shuffle,
  gan:            GitMerge,
  transformer:    Layers,
};

export function TemplateIcon({
  categoryKey,
  className = "h-4 w-4",
}: {
  categoryKey: string;
  className?: string;
}) {
  const Icon = TEMPLATE_CATEGORY_ICONS[categoryKey] ?? Layers;
  return <Icon className={className} strokeWidth={1.75} aria-hidden />;
}

export function CategoryIcon({
  categoryKey,
  className = "h-4 w-4",
}: {
  categoryKey: string;
  className?: string;
}) {
  const Icon = CATEGORY_ICONS[categoryKey] ?? Layers;
  return <Icon className={className} strokeWidth={1.75} aria-hidden />;
}
