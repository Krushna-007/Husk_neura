/**
 * PyTorch Code Generation System
 * 
 * Generates PyTorch model code from visual neural network graphs.
 * Supports both nn.Sequential for simple chains and custom nn.Module for complex architectures.
 */

import type { LayerObject, DAGResult } from "./dag-parser";
import { layerDefinitions } from "./layer-definitions";
import { 
  computePyTorchShapes, 
  getLayerInputDimension, 
  needsFlattenLayer, 
  calculateFlattenedSize,
  validatePyTorchDimensions,
  detectShapeIssues,
  type PyTorchShapeResult 
} from "./shape-computation-pytorch";

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface PyTorchImportManager {
  torch: boolean;
  torch_nn: boolean;
  torch_nn_functional: boolean;
  torch_optim: boolean;
  custom_imports: Set<string>;
}

export interface PyTorchCodeOptions {
  className?: string;
  includeTraining?: boolean;
  optimizerType?: 'adam' | 'sgd' | 'rmsprop';
  lossFunction?: 'crossentropy' | 'mse' | 'bce';
}

// ============================================================================
// IMPORT MANAGEMENT
// ============================================================================

class ImportManager {
  private imports: PyTorchImportManager = {
    torch: false,
    torch_nn: false,
    torch_nn_functional: false,
    torch_optim: false,
    custom_imports: new Set()
  };

  addTorch(): void {
    this.imports.torch = true;
  }

  addTorchNN(): void {
    this.imports.torch_nn = true;
  }

  addTorchFunctional(): void {
    this.imports.torch_nn_functional = true;
  }

  addTorchOptim(): void {
    this.imports.torch_optim = true;
  }

  addCustomImport(importStatement: string): void {
    this.imports.custom_imports.add(importStatement);
  }

  addLayerImports(layerImports: string[]): void {
    layerImports.forEach(imp => {
      switch (imp) {
        case 'torch':
          this.addTorch();
          break;
        case 'torch.nn':
          this.addTorchNN();
          break;
        case 'torch.nn.functional':
          this.addTorchFunctional();
          break;
        case 'torch.optim':
          this.addTorchOptim();
          break;
        default:
          this.addCustomImport(imp);
      }
    });
  }

  generateImports(): string[] {
    const imports: string[] = [];
    
    if (this.imports.torch) {
      imports.push("import torch");
    }
    if (this.imports.torch_nn) {
      imports.push("import torch.nn as nn");
    }
    if (this.imports.torch_nn_functional) {
      imports.push("import torch.nn.functional as F");
    }
    if (this.imports.torch_optim) {
      imports.push("import torch.optim as optim");
    }
    
    // Add custom imports
    this.imports.custom_imports.forEach(imp => imports.push(imp));
    
    return imports;
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Determines if the network structure requires a custom nn.Module class
 */
export function requiresCustomModule(dagResult: DAGResult): boolean {
  const { orderedNodes, edgeMap } = dagResult;
  
  // Check for branching (nodes with multiple outputs)
  for (const [nodeId, targets] of edgeMap.entries()) {
    if (targets.length > 1) {
      return true; // Branching detected
    }
  }
  
  // Check for merging (nodes with multiple inputs)
  const inputCounts = new Map<string, number>();
  for (const targets of edgeMap.values()) {
    targets.forEach(target => {
      inputCounts.set(target, (inputCounts.get(target) || 0) + 1);
    });
  }
  
  for (const count of inputCounts.values()) {
    if (count > 1) {
      return true; // Merging detected
    }
  }
  
  return false; // Simple sequential structure
}

/**
 * Generates a valid Python class name from layer types
 */
function generateClassName(layers: LayerObject[]): string {
  if (layers.length === 0) return "Net";
  
  const layerTypes = layers
    .filter(layer => layer.type !== 'Input')
    .map(layer => layer.type)
    .slice(0, 3); // Take first 3 non-input layers
  
  if (layerTypes.length === 0) return "Net";
  
  return layerTypes.join("") + "Net";
}

/**
 * Gets the input dimension for the first layer that needs it
 */
function getInputDimension(layers: LayerObject[]): number {
  // For now, return a placeholder - this will be enhanced in Phase 3
  return 784; // Common MNIST input size
}

// ============================================================================
// SEQUENTIAL MODEL GENERATION
// ============================================================================

/**
 * Generates PyTorch nn.Sequential model code for simple linear architectures
 */
export function generatePyTorchSequential(
  layers: LayerObject[], 
  shapeResult?: PyTorchShapeResult
): string {
  if (layers.length === 0) {
    return "# No layers to generate code for";
  }

  const importManager = new ImportManager();
  importManager.addTorch();
  importManager.addTorchNN();

  const sequentialLayers: string[] = [];

  // Process each layer
  layers.forEach((layer, index) => {
    const layerDef = layerDefinitions[layer.type];
    if (!layerDef?.generateCode.pytorch) {
      sequentialLayers.push(`    # TODO: Implement PyTorch code for ${layer.type}`);
      return;
    }

    // Check if we need to insert a Flatten layer before this layer
    if (index > 0 && shapeResult) {
      const prevLayer = layers[index - 1];
      const prevLayerInfo = shapeResult.layerDimensions.get(prevLayer.id);
      const currentLayerInfo = shapeResult.layerDimensions.get(layer.id);
      
      if (prevLayerInfo && currentLayerInfo) {
        const needsFlatten = needsFlattenLayer(
          prevLayer.type,
          layer.type,
          prevLayerInfo.outputDims,
          'flat'
        );
        
        if (needsFlatten) {
          sequentialLayers.push(`    nn.Flatten(),`);
          importManager.addTorchNN();
        }
      }
    }

    // Get proper input dimensions and channels
    const inputDim = shapeResult ? getLayerInputDimension(layer.id, shapeResult) : null;
    const layerInfo = shapeResult?.layerDimensions.get(layer.id);
    const enhancedParams = { ...layer.params };
    if (inputDim) {
      enhancedParams._inputDim = inputDim;
    }
    if (layerInfo?.inputChannels) {
      enhancedParams._inputChannels = layerInfo.inputChannels;
    }
    if (layerInfo?.inputDims) {
      enhancedParams._inputDims = layerInfo.inputDims;
    }
    if (layerInfo?.spatialDims) {
      enhancedParams._spatialDims = layerInfo.spatialDims;
    }

    const pytorchCode = layerDef.generateCode.pytorch(enhancedParams);
    importManager.addLayerImports(pytorchCode.imports);

    // Extract layer creation from init code (remove self.)
    let layerCode = pytorchCode.init.replace(/self\.\w+\s*=\s*/, '');
    
    // Handle activation functions as separate layers
    const activation = String(layer.params.activation || 'linear');
    if (activation !== 'linear' && activation !== 'none') {
      importManager.addTorchFunctional();
      sequentialLayers.push(`    ${layerCode},`);
      
      // Add activation as separate layer
      switch (activation) {
        case 'relu':
          sequentialLayers.push(`    nn.ReLU(),`);
          break;
        case 'sigmoid':
          sequentialLayers.push(`    nn.Sigmoid(),`);
          break;
        case 'tanh':
          sequentialLayers.push(`    nn.Tanh(),`);
          break;
        case 'softmax':
          sequentialLayers.push(`    nn.Softmax(dim=1),`);
          break;
        case 'leaky_relu':
          sequentialLayers.push(`    nn.LeakyReLU(),`);
          break;
        default:
          sequentialLayers.push(`    # TODO: Add ${activation} activation layer`);
      }
    } else {
      sequentialLayers.push(`    ${layerCode},`);
    }
  });

  // Remove last comma
  if (sequentialLayers.length > 0) {
    const lastIndex = sequentialLayers.length - 1;
    sequentialLayers[lastIndex] = sequentialLayers[lastIndex].replace(/,$/, '');
  }

  const imports = importManager.generateImports();
  const modelCode = [
    "",
    "# Create the model using nn.Sequential",
    "model = nn.Sequential(",
    ...sequentialLayers,
    ")",
    "",
    "# Print model architecture",
    "print(model)",
    "",
    "# Model summary",
    "total_params = sum(p.numel() for p in model.parameters())",
    "trainable_params = sum(p.numel() for p in model.parameters() if p.requires_grad)",
    "print(f'Total parameters: {total_params:,}')",
    "print(f'Trainable parameters: {trainable_params:,}')"
  ];

  return [...imports, ...modelCode].join("\n");
}

// ============================================================================
// CUSTOM MODULE GENERATION
// ============================================================================

/**
 * Generates PyTorch custom nn.Module class for complex architectures
 */
export function generatePyTorchModule(
  dagResult: DAGResult, 
  options: PyTorchCodeOptions = {}
): string {
  const { orderedNodes, edgeMap } = dagResult;
  
  if (orderedNodes.length === 0) {
    return "# Invalid DAG structure - cannot generate code";
  }

  // Compute proper dimensions
  const shapeResult = computePyTorchShapes(dagResult);
  if (!shapeResult.isValid) {
    return `# Shape computation failed:\n${shapeResult.errors.map(e => `# ${e.message}`).join('\n')}`;
  }

  const className = options.className || generateClassName(orderedNodes);
  const importManager = new ImportManager();
  importManager.addTorch();
  importManager.addTorchNN();
  importManager.addTorchFunctional();

  const initLines: string[] = [];
  const forwardLines: string[] = [];
  const layerVariables = new Map<string, string>();

  // Process each layer
  orderedNodes.forEach((layer, index) => {
    const layerDef = layerDefinitions[layer.type];
    if (!layerDef?.generateCode.pytorch) {
      initLines.push(`        # TODO: Implement PyTorch code for ${layer.type}`);
      forwardLines.push(`        # TODO: Forward pass for ${layer.type}`);
      return;
    }

    // Check if we need to insert a Flatten layer before this layer
    if (index > 0) {
      const prevLayer = orderedNodes[index - 1];
      const prevLayerInfo = shapeResult.layerDimensions.get(prevLayer.id);
      const currentLayerInfo = shapeResult.layerDimensions.get(layer.id);
      
      if (prevLayerInfo && currentLayerInfo) {
        const needsFlatten = needsFlattenLayer(
          prevLayer.type,
          layer.type,
          prevLayerInfo.outputDims,
          'flat'
        );
        
        if (needsFlatten) {
          const flattenVarName = `flatten_${index}`;
          initLines.push(`        self.${flattenVarName} = nn.Flatten()`);
          forwardLines.push(`        x = self.${flattenVarName}(x)`);
        }
      }
    }

    // Get proper input dimensions and channels
    const inputDim = getLayerInputDimension(layer.id, shapeResult);
    const layerInfo = shapeResult.layerDimensions.get(layer.id);
    const enhancedParams = { ...layer.params };
    if (inputDim) {
      enhancedParams._inputDim = inputDim;
    }
    if (layerInfo?.inputChannels) {
      enhancedParams._inputChannels = layerInfo.inputChannels;
    }
    if (layerInfo?.inputDims) {
      enhancedParams._inputDims = layerInfo.inputDims;
    }
    if (layerInfo?.spatialDims) {
      enhancedParams._spatialDims = layerInfo.spatialDims;
    }

    const pytorchCode = layerDef.generateCode.pytorch(enhancedParams);
    importManager.addLayerImports(pytorchCode.imports);

    // Add to __init__ method with proper variable naming
    if (pytorchCode.init && !pytorchCode.init.includes('# Input shape') && !pytorchCode.init.includes('# x is')) {
      const layerVarName = layer.varName || `${layer.type.toLowerCase()}_${index}`;
      const initCode = pytorchCode.init.replace(/self\.\w+/, `self.${layerVarName}`);
      initLines.push(`        ${initCode}`);
      layerVariables.set(layer.id, layerVarName);
    } else if (pytorchCode.init.includes('# Input shape')) {
      initLines.push(`        ${pytorchCode.init}`);
    }

    // Add to forward method with proper variable usage
    if (pytorchCode.forward && !pytorchCode.forward.includes('# x is')) {
      const layerVarName = layerVariables.get(layer.id) || layer.varName;
      let forwardCode = pytorchCode.forward;
      
      // Replace self.layer_name with actual variable name
      if (layerVarName) {
        forwardCode = forwardCode.replace(/self\.\w+/g, `self.${layerVarName}`);
      }
      
      forwardLines.push(`        ${forwardCode}`);
    }
  });

  // Generate class structure with best practices
  const imports = importManager.generateImports();
  const classCode = [
    "",
    `class ${className}(nn.Module):`,
    '    """',
    `    ${className} - Neural Network Architecture`,
    `    Generated by HUSKML`,
    '    """',
    "",
    "    def __init__(self):",
    `        super(${className}, self).__init__()`,
    "",
    "        # Define layers",
    ...initLines,
    "",
    "    def forward(self, x: torch.Tensor) -> torch.Tensor:",
    '        """Forward pass through the network"""',
    ...forwardLines,
    "        return x",
    "",
    "",
    "# Model instantiation and summary",
    `model = ${className}()`,
    "",
    "# Print model architecture",
    "print(model)",
    "",
    "# Model summary",
    "total_params = sum(p.numel() for p in model.parameters())",
    "trainable_params = sum(p.numel() for p in model.parameters() if p.requires_grad)",
    "print(f'\\nModel Summary:')",
    "print(f'Total parameters: {total_params:,}')",
    "print(f'Trainable parameters: {trainable_params:,}')",
    "",
    "# Example input (adjust shape as needed)",
    "# sample_input = torch.randn(1, *input_shape)  # Add your input shape here",
    "# output = model(sample_input)",
    "# print(f'Output shape: {output.shape}')"
  ];

  return [...imports, ...classCode].join("\n");
}

// ============================================================================
// MAIN GENERATION FUNCTION
// ============================================================================

/**
 * Main PyTorch code generation function
 * Automatically selects between Sequential and custom Module based on architecture complexity
 */
export function generatePyTorchCode(
  dagResult: DAGResult,
  options: PyTorchCodeOptions = {}
): string {
  if (!dagResult.isValid || dagResult.orderedNodes.length === 0) {
    return "# Invalid DAG structure - cannot generate PyTorch code";
  }

  // Compute shape information for proper dimensions
  const shapeResult = computePyTorchShapes(dagResult);

  // Validate dimensions and detect common issues
  const isValid = validatePyTorchDimensions(shapeResult);
  const shapeIssues = detectShapeIssues(shapeResult);

  // If there are critical shape issues, return error with explanations
  if (!isValid || shapeIssues.length > 0) {
    let errorCode = "# ⚠️  TENSOR SHAPE ISSUES DETECTED ⚠️\n";
    errorCode += "# The following issues need to be resolved:\n#\n";
    
    if (shapeResult.errors.length > 0) {
      errorCode += "# CRITICAL ERRORS:\n";
      shapeResult.errors.forEach(error => {
        errorCode += `# - ${error.message}\n`;
      });
      errorCode += "#\n";
    }
    
    if (shapeIssues.length > 0) {
      errorCode += "# SHAPE ISSUES:\n";
      shapeIssues.forEach(issue => {
        errorCode += `# - ${issue}\n`;
      });
      errorCode += "#\n";
    }
    
    errorCode += "# SOLUTIONS:\n";
    errorCode += "# 1. Add nn.Flatten() layer between Conv2D/Pooling and Dense layers\n";
    errorCode += "# 2. Check that input dimensions match expected tensor shapes\n";
    errorCode += "# 3. Use GlobalAveragePooling2D to reduce large feature maps\n";
    errorCode += "# 4. Verify that layer connections are compatible\n";
    errorCode += "#\n";
    errorCode += "# Fix these issues and the PyTorch code will generate correctly.\n\n";
    
    // Still try to generate code but with warnings
    errorCode += "# GENERATED CODE (may have issues):\n";
    errorCode += "# " + "="*50 + "\n\n";
  }

  // Determine which generation method to use
  let generatedCode: string;
  if (requiresCustomModule(dagResult)) {
    generatedCode = generatePyTorchModule(dagResult, options);
  } else {
    generatedCode = generatePyTorchSequential(dagResult.orderedNodes, shapeResult);
  }

  // Add shape issue warnings to the generated code if any
  if (!isValid || shapeIssues.length > 0) {
    return (errorCode || "") + generatedCode;
  }

  return generatedCode;
}

// ============================================================================
// TRAINING CODE GENERATION
// ============================================================================

/**
 * Generates PyTorch training loop template with best practices
 */
export function generatePyTorchTrainingCode(
  modelCode: string,
  options: PyTorchCodeOptions = {}
): string {
  const optimizer = options.optimizerType || 'adam';
  const lossFunction = options.lossFunction || 'crossentropy';

  const trainingTemplate = [
    "",
    "# ============================================================================",
    "# TRAINING SETUP",
    "# ============================================================================",
    "",
    "# Device configuration",
    "device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')",
    "model = model.to(device)",
    "print(f'Using device: {device}')",
    "",
    "# Optimizer setup",
  ];

  switch (optimizer) {
    case 'adam':
      trainingTemplate.push("optimizer = optim.Adam(model.parameters(), lr=0.001, weight_decay=1e-4)");
      break;
    case 'sgd':
      trainingTemplate.push("optimizer = optim.SGD(model.parameters(), lr=0.01, momentum=0.9, weight_decay=1e-4)");
      break;
    case 'rmsprop':
      trainingTemplate.push("optimizer = optim.RMSprop(model.parameters(), lr=0.001, weight_decay=1e-4)");
      break;
    default:
      trainingTemplate.push("optimizer = optim.Adam(model.parameters(), lr=0.001, weight_decay=1e-4)");
  }

  trainingTemplate.push("", "# Loss function");

  switch (lossFunction) {
    case 'crossentropy':
      trainingTemplate.push("criterion = nn.CrossEntropyLoss()");
      break;
    case 'mse':
      trainingTemplate.push("criterion = nn.MSELoss()");
      break;
    case 'bce':
      trainingTemplate.push("criterion = nn.BCEWithLogitsLoss()  # More numerically stable than BCELoss");
      break;
    default:
      trainingTemplate.push("criterion = nn.CrossEntropyLoss()");
  }

  trainingTemplate.push(
    "",
    "# Learning rate scheduler (optional)",
    "scheduler = optim.lr_scheduler.StepLR(optimizer, step_size=10, gamma=0.1)",
    "",
    "",
    "# ============================================================================",
    "# TRAINING FUNCTIONS",
    "# ============================================================================",
    "",
    "def train_epoch(model, train_loader, criterion, optimizer, device):",
    '    """Train for one epoch"""',
    "    model.train()",
    "    running_loss = 0.0",
    "    correct = 0",
    "    total = 0",
    "    ",
    "    for batch_idx, (data, target) in enumerate(train_loader):",
    "        data, target = data.to(device), target.to(device)",
    "        ",
    "        # Zero gradients",
    "        optimizer.zero_grad()",
    "        ",
    "        # Forward pass",
    "        output = model(data)",
    "        loss = criterion(output, target)",
    "        ",
    "        # Backward pass",
    "        loss.backward()",
    "        optimizer.step()",
    "        ",
    "        # Statistics",
    "        running_loss += loss.item()",
    "        if len(output.shape) > 1 and output.shape[1] > 1:  # Classification",
    "            _, predicted = torch.max(output.data, 1)",
    "            total += target.size(0)",
    "            correct += (predicted == target).sum().item()",
    "    ",
    "    avg_loss = running_loss / len(train_loader)",
    "    accuracy = 100 * correct / total if total > 0 else 0",
    "    return avg_loss, accuracy",
    "",
    "",
    "def validate(model, val_loader, criterion, device):",
    '    """Validate the model"""',
    "    model.eval()",
    "    val_loss = 0.0",
    "    correct = 0",
    "    total = 0",
    "    ",
    "    with torch.no_grad():",
    "        for data, target in val_loader:",
    "            data, target = data.to(device), target.to(device)",
    "            output = model(data)",
    "            val_loss += criterion(output, target).item()",
    "            ",
    "            if len(output.shape) > 1 and output.shape[1] > 1:  # Classification",
    "                _, predicted = torch.max(output.data, 1)",
    "                total += target.size(0)",
    "                correct += (predicted == target).sum().item()",
    "    ",
    "    avg_loss = val_loss / len(val_loader)",
    "    accuracy = 100 * correct / total if total > 0 else 0",
    "    return avg_loss, accuracy",
    "",
    "",
    "def train_model(model, train_loader, val_loader=None, num_epochs=25, save_path='best_model.pth'):",
    '    """Complete training loop with validation and model saving"""',
    "    best_val_loss = float('inf')",
    "    train_losses = []",
    "    val_losses = []",
    "    ",
    "    print(f'Starting training for {num_epochs} epochs...')",
    "    print('-' * 60)",
    "    ",
    "    for epoch in range(num_epochs):",
    "        # Training",
    "        train_loss, train_acc = train_epoch(model, train_loader, criterion, optimizer, device)",
    "        train_losses.append(train_loss)",
    "        ",
    "        # Validation",
    "        if val_loader is not None:",
    "            val_loss, val_acc = validate(model, val_loader, criterion, device)",
    "            val_losses.append(val_loss)",
    "            ",
    "            print(f'Epoch [{epoch+1:3d}/{num_epochs}] | '",
    "                  f'Train Loss: {train_loss:.4f} | Train Acc: {train_acc:.2f}% | '",
    "                  f'Val Loss: {val_loss:.4f} | Val Acc: {val_acc:.2f}%')",
    "            ",
    "            # Save best model",
    "            if val_loss < best_val_loss:",
    "                best_val_loss = val_loss",
    "                torch.save({",
    "                    'epoch': epoch,",
    "                    'model_state_dict': model.state_dict(),",
    "                    'optimizer_state_dict': optimizer.state_dict(),",
    "                    'loss': val_loss,",
    "                }, save_path)",
    "                print(f'    → New best model saved! (Val Loss: {val_loss:.4f})')",
    "        else:",
    "            print(f'Epoch [{epoch+1:3d}/{num_epochs}] | Train Loss: {train_loss:.4f} | Train Acc: {train_acc:.2f}%')",
    "        ",
    "        # Learning rate scheduling",
    "        scheduler.step()",
    "        ",
    "        # Early stopping (optional)",
    "        # if epoch > 10 and val_loss > best_val_loss * 1.1:",
    "        #     print('Early stopping triggered')",
    "        #     break",
    "    ",
    "    print('-' * 60)",
    "    print('Training completed!')",
    "    return train_losses, val_losses",
    "",
    "",
    "# ============================================================================",
    "# USAGE EXAMPLE",
    "# ============================================================================",
    "",
    "# Uncomment and modify the following to start training:",
    "# ",
    "# # Create your data loaders",
    "# # train_loader = DataLoader(train_dataset, batch_size=32, shuffle=True)",
    "# # val_loader = DataLoader(val_dataset, batch_size=32, shuffle=False)",
    "# ",
    "# # Start training",
    "# train_losses, val_losses = train_model(",
    "# ",
    "#     model=model,",
    "#     train_loader=train_loader,",
    "#     val_loader=val_loader,",
    "#     num_epochs=25,",
    "#     save_path='best_model.pth'",
    "# )",
    "",
    "# # Load the best model for inference",
    "# checkpoint = torch.load('best_model.pth')",
    "# model.load_state_dict(checkpoint['model_state_dict'])",
    "# model.eval()"
  );

  return modelCode + "\n" + trainingTemplate.join("\n");
}