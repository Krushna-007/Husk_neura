/**
 * PyTorch Shape Computation System
 * 
 * Handles tensor shape inference and dimension tracking for PyTorch code generation.
 * Ensures proper input/output dimension matching between layers.
 */

import type { LayerObject, DAGResult } from "./dag-parser";
import { layerDefinitions } from "./layer-definitions";

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface PyTorchShapeInfo {
  shape: number[];
  tensorFormat: 'NCHW' | 'NLC' | 'NC' | 'N'; // Batch, Channel, Height, Width | Batch, Length, Channel | Batch, Channel | Batch
  description: string;
}

export interface LayerDimensionInfo {
  layerId: string;
  layerType: string;
  inputDims: number[];
  outputDims: number[];
  inputChannels?: number;
  outputChannels?: number;
  spatialDims?: [number, number]; // [height, width] for 2D layers
}

export interface PyTorchShapeResult {
  layerDimensions: Map<string, LayerDimensionInfo>;
  errors: Array<{ layerId: string; message: string }>;
  isValid: boolean;
}

// ============================================================================
// SHAPE INFERENCE UTILITIES
// ============================================================================

/**
 * Converts Keras shape format to PyTorch tensor format
 */
function convertKerasToPyTorchShape(kerasShape: number[], layerType: string): PyTorchShapeInfo {
  // Keras uses (H, W, C) for images, PyTorch uses (C, H, W)
  if (layerType === 'Input') {
    if (kerasShape.length === 3) {
      // Image data: (H, W, C) -> (C, H, W)
      const [h, w, c] = kerasShape;
      return {
        shape: [c, h, w],
        tensorFormat: 'NCHW',
        description: `Image tensor (batch_size, ${c}, ${h}, ${w})`
      };
    } else if (kerasShape.length === 1) {
      // Flat data: (N,) -> (N,)
      return {
        shape: kerasShape,
        tensorFormat: 'NC',
        description: `Flat tensor (batch_size, ${kerasShape[0]})`
      };
    } else if (kerasShape.length === 2) {
      // Sequence data: (seq_len, features) -> (seq_len, features)
      return {
        shape: kerasShape,
        tensorFormat: 'NLC',
        description: `Sequence tensor (batch_size, ${kerasShape[0]}, ${kerasShape[1]})`
      };
    }
  }
  
  // Default handling
  return {
    shape: kerasShape,
    tensorFormat: kerasShape.length === 1 ? 'NC' : 'NCHW',
    description: `Tensor shape: (batch_size, ${kerasShape.join(', ')})`
  };
}

/**
 * Computes input dimensions for a layer based on previous layer's output
 */
function computeLayerInputDimensions(
  layer: LayerObject,
  previousLayerInfo: LayerDimensionInfo | null,
  inputShapeInfo: PyTorchShapeInfo
): number[] {
  if (!previousLayerInfo) {
    // First layer - use input shape
    return inputShapeInfo.shape;
  }

  return previousLayerInfo.outputDims;
}

/**
 * Computes output dimensions for a specific layer
 */
function computeLayerOutputDimensions(
  layer: LayerObject,
  inputDims: number[],
  inputChannels?: number
): { outputDims: number[]; outputChannels?: number } {
  const definition = layerDefinitions[layer.type];
  if (!definition) {
    return { outputDims: inputDims };
  }

  switch (layer.type) {
    case 'Dense': {
      const units = Number(layer.params.units) || 128;
      return { outputDims: [units], outputChannels: units };
    }

    case 'Conv2D': {
      const filters = Number(layer.params.filters) || 32;
      const kernelSizeStr = String(layer.params.kernel_size) || "(3,3)";
      const stridesStr = String(layer.params.strides) || "(1,1)";
      const padding = String(layer.params.padding) || "same";

      // Parse kernel size and strides
      const kernelSize = kernelSizeStr.replace(/[()]/g, '').split(',').map(s => parseInt(s.trim()));
      const strides = stridesStr.replace(/[()]/g, '').split(',').map(s => parseInt(s.trim()));

      if (inputDims.length >= 3) {
        const [c, h, w] = inputDims;
        let outputH, outputW;

        if (padding === "same") {
          outputH = Math.ceil(h / strides[0]);
          outputW = Math.ceil(w / strides[1]);
        } else {
          outputH = Math.floor((h - kernelSize[0]) / strides[0]) + 1;
          outputW = Math.floor((w - kernelSize[1]) / strides[1]) + 1;
        }

        return { 
          outputDims: [filters, outputH, outputW], 
          outputChannels: filters 
        };
      }
      break;
    }

    case 'Flatten': {
      if (inputDims.length > 1) {
        const flatSize = inputDims.reduce((acc, dim) => acc * dim, 1);
        return { outputDims: [flatSize], outputChannels: flatSize };
      }
      break;
    }

    case 'MaxPool2D':
    case 'AveragePooling2D': {
      if (inputDims.length >= 3) {
        const [c, h, w] = inputDims;
        const poolSizeStr = String(layer.params.pool_size) || "(2,2)";
        const stridesStr = String(layer.params.strides) || poolSizeStr;
        const padding = String(layer.params.padding) || "valid";

        // Parse pool size and strides
        const poolSize = poolSizeStr.replace(/[()]/g, '').split(',').map(s => parseInt(s.trim()));
        const strides = stridesStr.replace(/[()]/g, '').split(',').map(s => parseInt(s.trim()));

        let outputH, outputW;
        if (padding === "same") {
          outputH = Math.ceil(h / strides[0]);
          outputW = Math.ceil(w / strides[1]);
        } else {
          outputH = Math.floor((h - poolSize[0]) / strides[0]) + 1;
          outputW = Math.floor((w - poolSize[1]) / strides[1]) + 1;
        }

        return { 
          outputDims: [c, outputH, outputW], 
          outputChannels: c 
        };
      }
      break;
    }

    case 'GlobalAveragePooling2D': {
      if (inputDims.length >= 3) {
        const [c] = inputDims;
        return { outputDims: [c], outputChannels: c };
      }
      break;
    }

    case 'Dropout': {
      return { outputDims: inputDims, outputChannels: inputChannels };
    }

    case 'Output': {
      const outputType = String(layer.params.outputType || "multiclass");
      let units: number;

      switch (outputType) {
        case "multiclass":
          units = Number(layer.params.numClasses) || 10;
          break;
        case "binary":
          units = 1;
          break;
        case "regression":
        case "multilabel":
          units = Number(layer.params.units) || 1;
          break;
        default:
          units = 10;
      }

      return { outputDims: [units], outputChannels: units };
    }
  }

  // Default: preserve input dimensions
  return { outputDims: inputDims, outputChannels: inputChannels };
}

// ============================================================================
// MAIN COMPUTATION FUNCTIONS
// ============================================================================

/**
 * Computes PyTorch-specific shape information for all layers in a DAG
 */
export function computePyTorchShapes(dagResult: DAGResult): PyTorchShapeResult {
  const { orderedNodes, edgeMap } = dagResult;
  const layerDimensions = new Map<string, LayerDimensionInfo>();
  const errors: Array<{ layerId: string; message: string }> = [];

  if (orderedNodes.length === 0) {
    return { layerDimensions, errors: [{ layerId: 'root', message: 'No layers to process' }], isValid: false };
  }

  // Find input layer and get initial shape
  const inputLayer = orderedNodes.find(layer => layer.type === 'Input');
  if (!inputLayer) {
    errors.push({ layerId: 'root', message: 'No Input layer found' });
    return { layerDimensions, errors, isValid: false };
  }

  // Get input shape from Input layer
  const definition = layerDefinitions[inputLayer.type];
  const inputKerasShape = definition?.computeShape([], inputLayer.params);
  if (!inputKerasShape) {
    errors.push({ layerId: inputLayer.id, message: 'Could not compute input shape' });
    return { layerDimensions, errors, isValid: false };
  }

  const inputShapeInfo = convertKerasToPyTorchShape(inputKerasShape, inputLayer.type);

  // Process each layer in topological order
  let previousLayerInfo: LayerDimensionInfo | null = null;

  for (const layer of orderedNodes) {
    try {
      // Compute input dimensions for this layer
      const inputDims = computeLayerInputDimensions(layer, previousLayerInfo, inputShapeInfo);
      const inputChannels = previousLayerInfo?.outputChannels || (inputDims.length > 0 ? inputDims[0] : undefined);

      // Compute output dimensions
      const { outputDims, outputChannels } = computeLayerOutputDimensions(layer, inputDims, inputChannels);

      // Create layer dimension info
      const layerInfo: LayerDimensionInfo = {
        layerId: layer.id,
        layerType: layer.type,
        inputDims,
        outputDims,
        inputChannels,
        outputChannels,
        spatialDims: inputDims.length >= 3 ? [inputDims[1], inputDims[2]] : undefined
      };

      layerDimensions.set(layer.id, layerInfo);
      previousLayerInfo = layerInfo;

    } catch (error) {
      errors.push({ 
        layerId: layer.id, 
        message: `Error computing dimensions: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    }
  }

  return {
    layerDimensions,
    errors,
    isValid: errors.length === 0
  };
}

/**
 * Gets the input dimension for a specific layer with proper tensor shape handling
 */
export function getLayerInputDimension(
  layerId: string,
  shapeResult: PyTorchShapeResult
): number | null {
  const layerInfo = shapeResult.layerDimensions.get(layerId);
  if (!layerInfo) return null;

  // For Dense layers, return the flattened input size
  if (layerInfo.layerType === 'Dense' || layerInfo.layerType === 'Output') {
    // If input is multi-dimensional (from conv layers), flatten it
    if (layerInfo.inputDims.length > 1) {
      return layerInfo.inputDims.reduce((acc, dim) => acc * dim, 1);
    }
    // If already flat, return the dimension
    return layerInfo.inputDims[0] || 784;
  }

  // For Conv layers, return input channels
  if (layerInfo.layerType === 'Conv2D') {
    return layerInfo.inputChannels || layerInfo.inputDims[0];
  }

  // For LSTM/GRU, return feature dimension
  if (layerInfo.layerType === 'LSTM' || layerInfo.layerType === 'GRU') {
    return layerInfo.inputDims.length >= 2 ? layerInfo.inputDims[1] : layerInfo.inputDims[0];
  }

  // For other layers, return appropriate dimension
  return layerInfo.inputDims[0] || null;
}

/**
 * Detects if a Flatten layer is needed between two layers
 */
export function needsFlattenLayer(
  fromLayerType: string,
  toLayerType: string,
  fromOutputDims: number[],
  toInputRequirement: 'flat' | 'multi' | 'any'
): boolean {
  // Conv/Pooling layers output multi-dimensional tensors
  const multiDimOutputLayers = ['Conv2D', 'MaxPool2D', 'AveragePooling2D', 'GlobalAveragePooling2D'];
  
  // Dense layers need flat input
  const flatInputLayers = ['Dense', 'Output'];
  
  // Check if we're going from multi-dim output to flat input requirement
  if (multiDimOutputLayers.includes(fromLayerType) && flatInputLayers.includes(toLayerType)) {
    // If output is multi-dimensional (more than 1D), we need flatten
    return fromOutputDims.length > 1;
  }
  
  return false;
}

/**
 * Calculates the flattened dimension size for a multi-dimensional tensor
 */
export function calculateFlattenedSize(dims: number[]): number {
  return dims.reduce((acc, dim) => acc * dim, 1);
}

/**
 * Validates that layer dimensions are consistent throughout the network
 */
export function validatePyTorchDimensions(shapeResult: PyTorchShapeResult): boolean {
  if (!shapeResult.isValid) return false;

  // Check for dimension mismatches
  for (const [layerId, layerInfo] of shapeResult.layerDimensions) {
    if (layerInfo.inputDims.some(dim => dim <= 0)) {
      shapeResult.errors.push({
        layerId,
        message: `Invalid input dimensions: ${layerInfo.inputDims.join(', ')}`
      });
      return false;
    }

    if (layerInfo.outputDims.some(dim => dim <= 0)) {
      shapeResult.errors.push({
        layerId,
        message: `Invalid output dimensions: ${layerInfo.outputDims.join(', ')}`
      });
      return false;
    }

    // Validate specific layer type requirements
    if (layerInfo.layerType === 'Dense' || layerInfo.layerType === 'Output') {
      if (layerInfo.inputDims.length > 1) {
        shapeResult.errors.push({
          layerId,
          message: `Dense layer requires flattened input, got ${layerInfo.inputDims.length}D tensor. Consider adding a Flatten layer before this.`
        });
        return false;
      }
    }

    if (layerInfo.layerType === 'Conv2D') {
      if (layerInfo.inputDims.length !== 3) {
        shapeResult.errors.push({
          layerId,
          message: `Conv2D layer requires 3D input (C, H, W), got ${layerInfo.inputDims.length}D tensor`
        });
        return false;
      }
    }
  }

  return true;
}

/**
 * Detects and reports common tensor shape issues
 */
export function detectShapeIssues(shapeResult: PyTorchShapeResult): string[] {
  const issues: string[] = [];
  
  for (const [layerId, layerInfo] of shapeResult.layerDimensions) {
    // Check for Conv2D -> Dense without Flatten
    if (layerInfo.layerType === 'Dense' && layerInfo.inputDims.length > 1) {
      const flattenedSize = calculateFlattenedSize(layerInfo.inputDims);
      issues.push(
        `Layer ${layerId} (${layerInfo.layerType}): ` +
        `Receiving ${layerInfo.inputDims.length}D tensor ${layerInfo.inputDims.join('×')}. ` +
        `Need to flatten to ${flattenedSize} before Dense layer. ` +
        `Add nn.Flatten() or use x.view(x.size(0), -1).`
      );
    }

    // Check for very large flattened dimensions
    if (layerInfo.layerType === 'Dense' && layerInfo.inputDims[0] > 100000) {
      issues.push(
        `Layer ${layerId} (${layerInfo.layerType}): ` +
        `Very large input dimension (${layerInfo.inputDims[0]}). ` +
        `This may cause memory issues. Consider using GlobalAveragePooling2D before Dense layers.`
      );
    }

    // Check for dimension mismatches
    if (layerInfo.inputDims.some(dim => dim <= 0)) {
      issues.push(
        `Layer ${layerId} (${layerInfo.layerType}): ` +
        `Invalid input dimensions: ${layerInfo.inputDims.join('×')}. ` +
        `Check previous layer output shapes.`
      );
    }
  }

  return issues;
}