/**
 * Pseudo Code Generator - Generates educational pseudo code for completed tasks
 * 
 * Provides Keras-style pseudo code snippets for learning purposes.
 */

import type { Node, Edge } from "@xyflow/react";
import type { CourseTask } from "./course-store";

export interface PseudoCodeSnippet {
  title: string;
  description: string;
  code: string;
  language: 'python' | 'keras' | 'pseudocode';
  concepts: string[];
}

/**
 * Generate pseudo code for a completed task based on canvas state
 */
export function generatePseudoCodeForTask(
  task: CourseTask,
  nodes: Node[],
  edges: Edge[]
): PseudoCodeSnippet | null {
  switch (task.id) {
    case 'create-input':
      return generateInputLayerCode(nodes);
    
    case 'add-dense':
      return generateDenseLayerCode(nodes);
    
    case 'connect-layers':
      return generateConnectionCode(nodes, edges);
    
    case 'add-activation':
      return generateActivationCode(nodes);
    
    default:
      return generateGenericCode(task, nodes, edges);
  }
}

function generateInputLayerCode(nodes: Node[]): PseudoCodeSnippet {
  const inputNode = nodes.find(node => node.data.type === 'Input');
  
  if (!inputNode) {
    return {
      title: "Input Layer Setup",
      description: "Basic input layer configuration",
      code: `# Input Layer - Entry point for data
model = tf.keras.Sequential()
model.add(tf.keras.layers.Input(shape=(28, 28, 1)))

# This creates the input layer that:
# - Accepts grayscale images (28x28 pixels)
# - Defines the data shape for the network
# - Acts as the entry point for all data`,
      language: 'keras',
      concepts: ['Input Shape', 'Data Flow', 'Network Entry Point']
    };
  }

  const params = inputNode.data.params || {};
  const inputType = params.inputType || 'image_grayscale';
  
  let shapeComment = '';
  let shapeCode = '';
  
  switch (inputType) {
    case 'image_grayscale':
      shapeCode = '(28, 28, 1)';
      shapeComment = 'grayscale images (height, width, channels)';
      break;
    case 'image_color':
      shapeCode = '(28, 28, 3)';
      shapeComment = 'color images (height, width, RGB channels)';
      break;
    case 'flat_data':
      shapeCode = '(784,)';
      shapeComment = 'flattened data (features,)';
      break;
    default:
      shapeCode = '(28, 28, 1)';
      shapeComment = 'input data shape';
  }

  return {
    title: "Input Layer Created! 🎯",
    description: "Your network now has an entry point for data",
    code: `# Input Layer - Network's data entry point
import tensorflow as tf

model = tf.keras.Sequential()

# Add input layer with specific shape
model.add(tf.keras.layers.Input(shape=${shapeCode}))

# Shape explanation:
# ${shapeCode} = ${shapeComment}
# This tells the network what kind of data to expect

print("✅ Input layer ready to receive data!")`,
    language: 'keras',
    concepts: ['Input Shape', 'Data Types', 'Network Architecture', 'TensorFlow/Keras']
  };
}

function generateDenseLayerCode(nodes: Node[]): PseudoCodeSnippet {
  const denseNodes = nodes.filter(node => node.data.type === 'Dense');
  const inputNode = nodes.find(node => node.data.type === 'Input');
  
  if (denseNodes.length === 0) return null;
  
  const firstDense = denseNodes[0];
  const units = firstDense.data.params?.units || 128;
  
  return {
    title: "Dense Layer Added! 💪",
    description: "Your network can now learn patterns and relationships",
    code: `# Dense Layer - The learning powerhouse
import tensorflow as tf

model = tf.keras.Sequential()

# Input layer (data entry)
${inputNode ? `model.add(tf.keras.layers.Input(shape=(28, 28, 1)))` : '# Input layer needed first'}

# Dense layer - where the magic happens!
model.add(tf.keras.layers.Dense(units=${units}))

# What this Dense layer does:
# - Contains ${units} neurons (artificial brain cells)
# - Each neuron connects to ALL previous neurons
# - Learns patterns through weights and biases
# - Transforms input into meaningful features

print(f"✅ Dense layer with ${units} neurons ready to learn!")`,
    language: 'keras',
    concepts: ['Dense Layers', 'Neurons', 'Fully Connected', 'Feature Learning', 'Weights & Biases']
  };
}

function generateConnectionCode(nodes: Node[], edges: Edge[]): PseudoCodeSnippet {
  const connections = edges.length;
  const layerTypes = [...new Set(nodes.map(n => n.data.type))];
  
  return {
    title: "Layers Connected! 🔗",
    description: "Data can now flow through your neural network",
    code: `# Network Connections - Data flow established
import tensorflow as tf

# Sequential model automatically connects layers
model = tf.keras.Sequential([
    tf.keras.layers.Input(shape=(28, 28, 1)),
    tf.keras.layers.Dense(128),
    # Add more layers here...
])

# How data flows:
# Input → Dense Layer → Output
# 
# Each connection carries:
# - Processed features from previous layer
# - Weighted signals based on learned importance
# - Information that gets refined at each step

print("✅ Neural pathway established!")
print(f"Network has ${connections} connection(s)")
print(f"Layer types: ${layerTypes.join(' → ')}")`,
    language: 'keras',
    concepts: ['Data Flow', 'Sequential Architecture', 'Layer Connections', 'Information Processing']
  };
}

function generateActivationCode(nodes: Node[]): PseudoCodeSnippet {
  const activationNodes = nodes.filter(node => node.data.type === 'Activation');
  
  if (activationNodes.length === 0) return null;
  
  const activation = activationNodes[0];
  const activationType = activation.data.params?.activation || 'relu';
  
  let activationExplanation = '';
  switch (activationType) {
    case 'relu':
      activationExplanation = `# ReLU (Rectified Linear Unit)
# - Outputs: max(0, input)
# - Removes negative values (sets them to 0)
# - Keeps positive values unchanged
# - Fast and effective for most problems`;
      break;
    case 'sigmoid':
      activationExplanation = `# Sigmoid Activation
# - Outputs: values between 0 and 1
# - Good for binary classification
# - Smooth, S-shaped curve`;
      break;
    case 'tanh':
      activationExplanation = `# Tanh Activation  
# - Outputs: values between -1 and 1
# - Zero-centered output
# - Good for hidden layers`;
      break;
    default:
      activationExplanation = `# ${activationType} Activation
# - Adds non-linearity to the network
# - Enables learning of complex patterns`;
  }

  return {
    title: "Activation Function Added! ⚡",
    description: "Your network can now learn non-linear patterns",
    code: `# Activation Function - Adding intelligence
import tensorflow as tf

model = tf.keras.Sequential([
    tf.keras.layers.Input(shape=(28, 28, 1)),
    tf.keras.layers.Dense(128),
    tf.keras.layers.Activation('${activationType}'),
])

${activationExplanation}

# Why activation functions matter:
# - Without them, network is just linear math
# - They enable learning complex patterns
# - Allow networks to approximate any function
# - Essential for deep learning!

print("⚡ Network can now learn complex patterns!")`,
    language: 'keras',
    concepts: ['Activation Functions', 'Non-linearity', 'Pattern Recognition', activationType.toUpperCase()]
  };
}

function generateGenericCode(task: CourseTask, nodes: Node[], edges: Edge[]): PseudoCodeSnippet {
  const nodeCount = nodes.length;
  const edgeCount = edges.length;
  const layerTypes = [...new Set(nodes.map(n => n.data.type))];
  
  return {
    title: `Task Completed: ${task.title}! 🎉`,
    description: task.description,
    code: `# ${task.title} - Completed!
import tensorflow as tf

# Current network status:
# - Layers: ${nodeCount}
# - Connections: ${edgeCount}  
# - Types: ${layerTypes.join(', ')}

model = tf.keras.Sequential()

${nodes.map(node => {
  switch (node.data.type) {
    case 'Input':
      return '# Input layer - data entry point\nmodel.add(tf.keras.layers.Input(shape=(28, 28, 1)))';
    case 'Dense':
      const units = node.data.params?.units || 128;
      return `# Dense layer - ${units} neurons\nmodel.add(tf.keras.layers.Dense(${units}))`;
    case 'Activation':
      const activation = node.data.params?.activation || 'relu';
      return `# Activation - ${activation} function\nmodel.add(tf.keras.layers.Activation('${activation}'))`;
    default:
      return `# ${node.data.type} layer\n# model.add(tf.keras.layers.${node.data.type}())`;
  }
}).join('\n\n')}

print("✅ Task completed successfully!")`,
    language: 'keras',
    concepts: ['Network Building', 'Layer Composition', 'Sequential Model']
  };
}

/**
 * Get concept explanations for educational purposes
 */
export function getConceptExplanation(concept: string): string {
  const explanations: Record<string, string> = {
    'Input Shape': 'Defines the dimensions of data entering the network',
    'Dense Layers': 'Fully connected layers where each neuron connects to all neurons in the previous layer',
    'Activation Functions': 'Mathematical functions that add non-linearity, enabling complex pattern learning',
    'Data Flow': 'How information moves through the network from input to output',
    'Neurons': 'Basic processing units that receive inputs, apply weights, and produce outputs',
    'Weights & Biases': 'Learnable parameters that the network adjusts during training',
    'Non-linearity': 'Mathematical property that allows networks to learn complex, curved relationships',
    'Sequential Model': 'A linear stack of layers where data flows from one layer to the next',
    'ReLU': 'Rectified Linear Unit - sets negative values to zero, keeps positive values unchanged',
    'Pattern Recognition': 'The ability to identify regularities and structures in data'
  };
  
  return explanations[concept] || `Learn more about ${concept} in neural networks`;
}
