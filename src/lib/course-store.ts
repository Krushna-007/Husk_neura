/**
 * Course Store - State management for guided learning courses
 * 
 * Manages course progress, lesson navigation, and task validation.
 * Integrates with the existing flow store for canvas validation.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Node, Edge } from "@xyflow/react";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface CourseTask {
  id: string;
  title: string;
  description: string;
  requirements: TaskRequirement[];
  hints: string[];
  completed: boolean;
}

export interface TaskRequirement {
  type: 'layer' | 'connection' | 'parameter' | 'structure';
  layerType?: string;
  layerCount?: number;
  sourceLayerType?: string;
  targetLayerType?: string;
  parameterKey?: string;
  parameterValue?: any;
  description: string;
}

export interface CourseLesson {
  id: string;
  title: string;
  description: string;
  content: string; // Markdown content
  estimatedTime: number; // in minutes
  allowedLayers: string[]; // Layer types allowed in this lesson
  tasks: CourseTask[];
  completed: boolean;
  unlocked: boolean;
  readingProgress: number; // 0-100
}

export interface Course {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration: number; // total minutes
  lessons: CourseLesson[];
  progress: number; // 0-100
  completed: boolean;
  startedAt?: string;
  completedAt?: string;
}

export interface CourseState {
  // Course data
  availableCourses: Course[];
  currentCourse: Course | null;
  currentLesson: CourseLesson | null;
  
  // Course mode state
  isCourseMode: boolean;
  showLessonViewer: boolean;
  
  // Progress tracking
  userProgress: Record<string, {
    courseId: string;
    lessonsCompleted: string[];
    tasksCompleted: string[];
    lastAccessedAt: string;
    canvasState?: {
      nodes: Node[];
      edges: Edge[];
    };
  }>;
  
  // Actions
  initializeCourses: () => void;
  startCourse: (courseId: string) => void;
  selectLesson: (lessonId: string) => void;
  completeTask: (taskId: string) => void;
  completeLesson: (lessonId: string) => void;
  updateReadingProgress: (progress: number) => void;
  validateCurrentTasks: (nodes: Node[], edges: Edge[]) => boolean[];
  toggleCourseMode: () => void;
  toggleLessonViewer: () => void;
  exitCourse: () => void;
  resetCourseProgress: (courseId: string) => void;
  saveCanvasState: (nodes: Node[], edges: Edge[]) => void;
  restoreCanvasState: () => { nodes: Node[], edges: Edge[] } | null;
  
  // Getters
  getCurrentAllowedLayers: () => string[];
  getTaskValidationResults: (nodes: Node[], edges: Edge[]) => Record<string, boolean>;
  canProgressToNextLesson: () => boolean;
  getNextLesson: () => CourseLesson | null;
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validates if current canvas state meets task requirements
 */
export const validateTaskRequirement = (
  requirement: TaskRequirement,
  nodes: Node[],
  edges: Edge[]
): boolean => {
  switch (requirement.type) {
    case 'layer':
      if (requirement.layerType && requirement.layerCount) {
        const matchingLayers = nodes.filter(node => 
          node.data?.type === requirement.layerType
        );
        const isValid = matchingLayers.length >= requirement.layerCount;
        
        // Debug logging for layer validation
        if (process.env.NODE_ENV === 'development') {
          console.log(`Layer validation for ${requirement.layerType}:`, {
            required: requirement.layerCount,
            found: matchingLayers.length,
            nodes: nodes.map(n => ({ id: n.id, type: n.data?.type })),
            isValid
          });
        }
        
        return isValid;
      }
      return false;
      
    case 'connection':
      if (requirement.sourceLayerType && requirement.targetLayerType) {
        const validConnections = edges.filter(edge => {
          const sourceNode = nodes.find(n => n.id === edge.source);
          const targetNode = nodes.find(n => n.id === edge.target);
          return sourceNode?.data?.type === requirement.sourceLayerType &&
                 targetNode?.data?.type === requirement.targetLayerType;
        });
        
        const isValid = validConnections.length > 0;
        
        // Debug logging for connection validation
        if (process.env.NODE_ENV === 'development') {
          console.log(`Connection validation ${requirement.sourceLayerType} → ${requirement.targetLayerType}:`, {
            edges: edges.length,
            validConnections: validConnections.length,
            isValid
          });
        }
        
        return isValid;
      }
      return false;
      
    case 'parameter':
      if (requirement.layerType && requirement.parameterKey) {
        const layers = nodes.filter(n => n.data?.type === requirement.layerType);
        
        if (layers.length === 0) {
          if (process.env.NODE_ENV === 'development') {
            console.log(`Parameter validation failed: No ${requirement.layerType} layers found`);
          }
          return false;
        }
        
        // For layers that need specific parameter values (like Dense with 10 units),
        // we need to check if AT LEAST ONE layer has the correct parameter
        let foundValidParameter = false;
        
        for (const layer of layers) {
          if (!layer.data?.params) {
            if (process.env.NODE_ENV === 'development') {
              console.log(`Layer ${layer.id} has no params`);
            }
            continue;
          }
          
          const paramValue = (layer.data.params as any)?.[requirement.parameterKey];
          let isValid = false;
          
          if (requirement.parameterValue !== undefined) {
            // Handle different types of parameter values
            if (typeof requirement.parameterValue === 'string' && typeof paramValue === 'string') {
              isValid = paramValue.toLowerCase() === requirement.parameterValue.toLowerCase();
            } else {
              isValid = paramValue === requirement.parameterValue;
            }
          } else {
            isValid = paramValue !== undefined && paramValue !== null && paramValue !== '';
          }
          
          // Debug logging for parameter validation
          if (process.env.NODE_ENV === 'development') {
            console.log(`Parameter validation for ${requirement.layerType}.${requirement.parameterKey} (layer ${layer.id}):`, {
              expected: requirement.parameterValue,
              actual: paramValue,
              actualType: typeof paramValue,
              expectedType: typeof requirement.parameterValue,
              isValid
            });
          }
          
          if (isValid) {
            foundValidParameter = true;
            break; // Found at least one layer with valid parameter
          }
        }
        
        return foundValidParameter;
      }
      return false;
      
    case 'structure':
      // Validate overall network structure
      if (requirement.layerCount) {
        const isValid = nodes.length >= requirement.layerCount;
        
        // Debug logging for structure validation
        if (process.env.NODE_ENV === 'development') {
          console.log(`Structure validation:`, {
            required: requirement.layerCount,
            actual: nodes.length,
            isValid
          });
        }
        
        return isValid;
      }
      return false;
      
    default:
      console.warn(`Unknown requirement type: ${requirement.type}`);
      return false;
  }
};

// ============================================================================
// DEFAULT COURSES
// ============================================================================

const createNN101Course = (): Course => ({
  id: 'nn-101',
  title: 'Neural Network 101',
  description: 'Build your first AI brain step by step - from zero to digit recognition hero',
  difficulty: 'beginner',
  estimatedDuration: 120, // 2 hours
  progress: 0,
  completed: false,
  lessons: [
    {
      id: 'intro-nn',
      title: 'Introduction to Neural Networks',
      description: 'Learn the basics and create your first Input layer',
      content: `# Welcome to Neural Networks! 🧠

Think of neural networks as really smart pattern-matching systems. Just like how your mom can instantly tell which handwriting belongs to which kid in the family (even when you all try to forge each other's signatures on report cards), neural networks can learn to recognize patterns in data.

## What Are Neural Networks?

Imagine you're teaching a computer to recognize handwritten digits (0, 1, 2... 9). It's like training your younger sibling to read numbers, except this sibling never gets tired, never asks "Are we there yet?", and actually pays attention!

You show it thousands of examples, and gradually it learns the patterns:
- "This curved line is probably an 8" (or maybe uncle ji's attempt at writing anything)
- "This straight line with a horizontal bar is a 7" (written by someone who actually went to school)
- "This circle is likely a 0" (or a very confused attempt at drawing a roti)

That's exactly what neural networks do - they find patterns! Just like how you can spot a government office from miles away by the long queues.

## The Input Layer: Where It All Begins

Every neural network starts with an **Input Layer**. Think of it as the "eyes" of your AI - it's where data first enters the system. Kind of like the security guard at your apartment complex who sees everyone coming in (but hopefully with better pattern recognition).

For our digit recognition project, we need to tell our network:
- **What kind of data**: Images of handwritten digits (clearer than most doctor prescriptions, thankfully)
- **What size**: 28×28 pixels (that's 784 tiny squares - smaller than a passport photo)
- **What format**: Grayscale (black and white, like old Doordarshan shows)

## Why Start With Digits?

Handwritten digit recognition is the "Hello World" of AI because:
- ✅ **Simple**: Only 10 possible answers (0-9) - unlike trying to understand what the vegetable vendor is actually charging
- ✅ **Visual**: You can see what the AI is trying to learn (no guesswork like interpreting WhatsApp forwards)
- ✅ **Practical**: Used in postal codes, bank checks, forms (basically everywhere bureaucracy exists)
- ✅ **Achievable**: You'll get great results quickly! (Unlike waiting for that government approval)

## Your First Task

Let's create the Input layer - the foundation of your AI system. Drag an **Input** layer from the palette and configure it for 28×28 grayscale images.

Think of this as telling your AI: "Beta, you're going to see small black and white pictures of numbers. Get ready to become smarter than the guy who calculates your electricity bill!"`,
      estimatedTime: 10,
      allowedLayers: ['Input'],
      tasks: [
        {
          id: 'create-input',
          title: 'Add Input Layer',
          description: 'Drag an Input layer from the palette to the canvas',
          requirements: [
            {
              type: 'layer',
              layerType: 'Input',
              layerCount: 1,
              description: 'Add one Input layer to the canvas'
            }
          ],
          hints: [
            'Look for the Input layer in the "Input/Output" category',
            'Drag it from the left palette to the center canvas',
            'You should see a green Input node appear on the canvas'
          ],
          completed: false
        }
      ],
      completed: false,
      unlocked: true,
      readingProgress: 0
    },
    {
      id: 'dense-layers',
      title: 'Dense Layers & Forward Propagation',
      description: 'Build the core of your network with Dense layers',
      content: `# Building the Brain: Dense Layers 💪

Shabash! You've created the "eyes" of your AI. Now let's build the "brain" - the part that actually learns and makes decisions. Think of it as upgrading from a basic Nokia phone to a smartphone.

## The Problem: Images vs. Numbers

Here's the thing: your Input layer gives us a 28×28 image (like a tiny grid), but the brain of our AI (Dense layers) only understands lists of numbers, not grids.

It's like trying to feed a photo into a calculator - we need to convert it first! Or like trying to explain a meme to your parents - you need to translate it into their language.

## Enter the Flatten Layer

The **Flatten layer** is our converter. It takes your 28×28 grid and turns it into one long list of 784 numbers.

Think of it like organizing your wardrobe:
- **Before Flatten**: Clothes scattered everywhere in a 2D mess (your room)
- **After Flatten**: Everything neatly arranged in one long line (Marie Kondo style)

Same clothes, different organization! Your mom would be proud.

## The Dense Layer: Where Learning Happens

The **Dense layer** is where the magic happens. It's called "dense" because every number from the flatten layer connects to every neuron in this layer.

Think of it like a family WhatsApp group:
- **784 relatives** (the flattened pixels) each share their opinion about everything
- **128 sensible family members** (the neurons) listen to ALL the chaos
- Each sensible person forms their own conclusion based on filtering through all the noise

Unlike your family group though, this actually produces useful results!

## Why 128 Neurons?

128 is a good starting number - enough to learn complex patterns, but not so many that it gets confused. It's like inviting people to your wedding: not too few (people will think you're antisocial), not too many (your budget will cry), just the right amount for a good celebration.

## Your Task: Build the Processing Pipeline

1. **Add a Flatten layer** - converts your 28×28 image to 784 numbers (like converting your messy room into a neat list)
2. **Add a Dense layer** - set it to 128 neurons for learning (your smart processing committee)
3. **Connect them** - Input → Flatten → Dense

You're building: Eyes → Organizer → Brain

Chalo, let's do it! Your AI is about to become smarter than the person who designed those captcha puzzles.`,
      estimatedTime: 15,
      allowedLayers: ['Input', 'Dense', 'Flatten'],
      tasks: [
        {
          id: 'add-flatten',
          title: 'Add Flatten Layer',
          description: 'Add a Flatten layer to prepare image data for Dense layer',
          requirements: [
            {
              type: 'layer',
              layerType: 'Flatten',
              layerCount: 1,
              description: 'Add one Flatten layer to the canvas'
            }
          ],
          hints: [
            'Find the Flatten layer in the "Transformation" category',
            'Flatten converts 2D image data to 1D for Dense layers',
            'Place it between Input and Dense layers'
          ],
          completed: false
        },
        {
          id: 'add-dense',
          title: 'Add Dense Layer',
          description: 'Add a Dense layer with 128 neurons',
          requirements: [
            {
              type: 'layer',
              layerType: 'Dense',
              layerCount: 1,
              description: 'Add one Dense layer to the canvas'
            },
            {
              type: 'parameter',
              layerType: 'Dense',
              parameterKey: 'units',
              parameterValue: 128,
              description: 'Set Dense layer to have 128 units'
            }
          ],
          hints: [
            'Find the Dense layer in the "Core Layers" category',
            'Double-click the Dense layer to open its settings',
            'Set the "units" parameter to 128'
          ],
          completed: false
        },
        {
          id: 'connect-layers',
          title: 'Connect the Layers',
          description: 'Create connections: Input → Flatten → Dense',
          requirements: [
            {
              type: 'connection',
              sourceLayerType: 'Input',
              targetLayerType: 'Flatten',
              description: 'Connect Input layer to Flatten layer'
            },
            {
              type: 'connection',
              sourceLayerType: 'Flatten',
              targetLayerType: 'Dense',
              description: 'Connect Flatten layer to Dense layer'
            }
          ],
          hints: [
            'First: Connect Input → Flatten',
            'Then: Connect Flatten → Dense',
            'This creates the proper data flow for image processing'
          ],
          completed: false
        }
      ],
      completed: false,
      unlocked: false,
      readingProgress: 0
    },
    {
      id: 'activation-functions',
      title: 'Activation Functions',
      description: 'Add non-linearity with activation functions',
      content: `# Adding Intelligence: Activation Functions ⚡

Your AI has eyes (Input) and a brain (Dense layer), but it's thinking too simply. It's like that relative who takes everything literally - technically correct but missing the nuance. Let's add some smart decision-making!

## The Problem: Your AI is Too Linear

Right now, your Dense layer is like a very simple calculator - it just adds and multiplies numbers. But real intelligence needs to make decisions and have preferences.

Imagine if you could only think in straight lines:
- "If I see ANY curved line, it's definitely an 8"
- "If I see ANY straight line, it's definitely a 1"

That's not very smart, right? It's like saying "If it's raining, I'll definitely get wet" - technically true, but what about umbrellas, covered areas, or staying indoors?

## Enter ReLU: The Smart Filter

**ReLU** stands for "Rectified Linear Unit" - but don't let the fancy name scare you. It's actually super simple, like most brilliant ideas:

**ReLU's Rule**: 
- If a number is positive → Keep it (like keeping good vibes)
- If a number is negative → Change it to 0 (like ignoring negative comments on social media)

That's it! It's like having that friend who filters out all the drama and only tells you the good stuff. Or like your mom screening phone calls - "If it's important, they'll call back!"

## Why This Makes Your AI Smarter

ReLU helps your AI make nuanced decisions:
- Instead of "This line means 8", it thinks "This curved line + this thickness + this position + this angle = probably 8"
- It can ignore irrelevant features (negative values become 0) - like ignoring that one weird uncle's opinions
- It can emphasize important features (positive values stay strong) - like focusing on what actually matters

## Real-World Analogy

Think of ReLU like choosing what to pay attention to in a busy Indian street:
- You notice: vehicles, pedestrians, traffic signals (important stuff)
- You ignore: random honking, street vendors shouting, that guy arguing with his phone (irrelevant noise)

Your brain automatically filters out the chaos and focuses on what matters. ReLU does the same for your AI!

## Your Task: Add the Smart Filter

Add an **Activation layer** with **ReLU** function after your Dense layer.

Your pipeline becomes: Input → Flatten → Dense → ReLU (Smart Filter)

Now your AI can make intelligent decisions instead of just doing basic math! It's like upgrading from a feature phone to a smartphone - same basic functionality, but way smarter processing.`,
      estimatedTime: 12,
      allowedLayers: ['Input', 'Dense', 'Activation', 'Flatten'],
      tasks: [
        {
          id: 'add-activation',
          title: 'Add Activation Layer',
          description: 'Add an Activation layer with ReLU function',
          requirements: [
            {
              type: 'layer',
              layerType: 'Activation',
              layerCount: 1,
              description: 'Add one Activation layer to the canvas'
            },
            {
              type: 'parameter',
              layerType: 'Activation',
              parameterKey: 'activation_function',
              parameterValue: 'relu',
              description: 'Set activation function to ReLU'
            }
          ],
          hints: [
            'Find the Activation layer in the "Core Layers" category',
            'Double-click to configure the activation function',
            'Select "relu" from the activation dropdown'
          ],
          completed: false
        },
        {
          id: 'connect-activation',
          title: 'Connect Dense to Activation',
          description: 'Connect your Dense layer to the Activation layer',
          requirements: [
            {
              type: 'connection',
              sourceLayerType: 'Dense',
              targetLayerType: 'Activation',
              description: 'Connect Dense layer to Activation layer'
            }
          ],
          hints: [
            'Drag from the bottom of Dense layer to top of Activation layer',
            'The connection enables data flow through the activation function'
          ],
          completed: false
        }
      ],
      completed: false,
      unlocked: false,
      readingProgress: 0
    },
    {
      id: 'first-classifier',
      title: 'Building Your First Classifier',
      description: 'Complete your first neural network for digit classification',
      content: `# The Final Step: Making Predictions! 🎯

Bas ek aur step! Your AI can see (Input), convert (Flatten), think (Dense), and filter (ReLU). Now let's teach it to make actual predictions - time for the grand finale!

## The Output Layer: Your AI's Voice

The **Output layer** is where your AI finally speaks up and says: "Bhai, I think this is a 7!" 

For digit recognition, we need exactly **10 neurons** - one for each digit (0, 1, 2, 3, 4, 5, 6, 7, 8, 9).

Think of it like a panel discussion on a news channel, but actually useful:
- Panelist #0: "Definitely a zero! Look at that perfect circle!"
- Panelist #1: "No no, it's clearly a one! See that straight line!"
- Panelist #2: "Are you both blind? It's obviously a two!"
- ...and so on (but unlike TV debates, this actually reaches a conclusion)

## The Softmax Decision Maker

But wait - what if multiple panelists are shouting equally loud? We need a fair way to decide!

Enter **Softmax** - it's like that one sensible moderator who:
1. Listens to all 10 panelists (without losing their mind)
2. Converts their confidence into percentages
3. Makes sure all percentages add up to 100% (basic math, unlike some TV anchors)
4. Picks the panelist with the highest percentage

It's like having Kapil Sharma moderate a serious discussion - somehow makes everyone's opinion count while keeping things organized!

## Example: How It Works

Let's say you show your AI a handwritten "7" (written by someone who actually passed school):
- Panelist #7: "90% confident it's a 7" (the smart one)
- Panelist #1: "8% confident it's a 1" (the confused one - maybe it's slightly curvy)
- Panelist #2: "2% confident it's a 2" (the optimist)
- All others: "0% confident" (the honest ones)

**Result**: Your AI predicts "7" with 90% confidence! Better accuracy than most humans reading doctor prescriptions.

## Your Complete AI System

When you finish, your AI will work like this:

**Input** (sees image) → **Flatten** (organizes data) → **Dense** (finds patterns) → **ReLU** (filters noise) → **Dense** (expert opinions) → **Softmax** (final decision) → **Prediction**!

It's like a well-oiled machine, except it actually works on the first try (unlike most things).

## Your Final Task

Add a **Dense layer** with **10 neurons** (one for each digit) and set its activation to **Softmax**.

Connect everything together and... shabash! You've built your first AI that can recognize handwritten digits! 🎉

This is the same type of AI used in:
- Reading postal codes (finally, some hope for India Post!)
- Processing bank checks (so they stop asking you to rewrite everything)
- Digitizing handwritten forms (government offices, take notes!)
- And much more!

Your AI is now smarter than most captcha systems and definitely more reliable than autocorrect. Time to celebrate with some chai! ☕`,
      estimatedTime: 15,
      allowedLayers: ['Input', 'Dense', 'Activation', 'Flatten'],
      tasks: [
        {
          id: 'add-output-dense',
          title: 'Add Output Dense Layer',
          description: 'Add a Dense layer with 10 units for digit classification',
          requirements: [
            {
              type: 'layer',
              layerType: 'Dense',
              layerCount: 2,
              description: 'Add a second Dense layer (total of 2 Dense layers)'
            },
            {
              type: 'parameter',
              layerType: 'Dense',
              parameterKey: 'units',
              parameterValue: 10,
              description: 'Set the output Dense layer to have 10 units (one for each digit)'
            }
          ],
          hints: [
            'Add another Dense layer from the palette',
            'This will be your output layer',
            'Configure it with 10 units (one for each digit 0-9)'
          ],
          completed: false
        },
        {
          id: 'add-output-activation',
          title: 'Add Softmax Activation',
          description: 'Add softmax activation for probability output',
          requirements: [
            {
              type: 'layer',
              layerType: 'Activation',
              layerCount: 2,
              description: 'Add a second Activation layer (total of 2 Activation layers)'
            },
            {
              type: 'parameter',
              layerType: 'Activation',
              parameterKey: 'activation_function',
              parameterValue: 'softmax',
              description: 'Set the activation function to Softmax for probability output'
            }
          ],
          hints: [
            'Add another Activation layer',
            'Set its activation function to "softmax"',
            'Softmax converts outputs to probabilities that sum to 1'
          ],
          completed: false
        },
        {
          id: 'complete-connections',
          title: 'Complete All Connections',
          description: 'Connect all layers to create a complete network',
          requirements: [
            {
              type: 'structure',
              layerCount: 5,
              description: 'Have 5 total layers in your network'
            }
          ],
          hints: [
            'Connect: Input → Dense → Activation → Dense → Activation',
            'Your network should have a clear path from input to output',
            'Check that all layers are connected in sequence'
          ],
          completed: false
        }
      ],
      completed: false,
      unlocked: false,
      readingProgress: 0
    }
  ]
});

// ============================================================================
// ZUSTAND STORE
// ============================================================================

export const useCourseStore = create<CourseState>()(
  persist(
    (set, get) => ({
      // Initial state
      availableCourses: [],
      currentCourse: null,
      currentLesson: null,
      isCourseMode: false,
      showLessonViewer: false,
      userProgress: {},

      // Initialize courses
      initializeCourses: () => {
        const courses = [createNN101Course()];
        set({ availableCourses: courses });
      },

      // Start a course
      startCourse: (courseId: string) => {
        const { availableCourses, userProgress } = get();
        const course = availableCourses.find(c => c.id === courseId);
        
        if (course) {
          // Initialize user progress if not exists
          if (!userProgress[courseId]) {
            set({
              userProgress: {
                ...userProgress,
                [courseId]: {
                  courseId,
                  lessonsCompleted: [],
                  tasksCompleted: [],
                  lastAccessedAt: new Date().toISOString()
                }
              }
            });
          }
          
          // Update course start time if not started
          const updatedCourse = { 
            ...course, 
            startedAt: course.startedAt || new Date().toISOString() 
          };
          
          // Find the current lesson based on progress
          const progress = userProgress[courseId];
          let currentLesson = course.lessons[0]; // Default to first lesson
          
          if (progress && progress.lessonsCompleted.length > 0) {
            // Find the first incomplete lesson, or the last lesson if all are complete
            const incompleteLesson = course.lessons.find(lesson => 
              !progress.lessonsCompleted.includes(lesson.id) && lesson.unlocked
            );
            currentLesson = incompleteLesson || course.lessons.find(l => l.unlocked) || course.lessons[0];
          }
          
          set({
            currentCourse: updatedCourse,
            currentLesson,
            isCourseMode: true,
            showLessonViewer: true
          });
        }
      },

      // Select a lesson
      selectLesson: (lessonId: string) => {
        const { currentCourse } = get();
        if (!currentCourse) return;

        const lesson = currentCourse.lessons.find(l => l.id === lessonId);
        if (lesson && lesson.unlocked) {
          set({ 
            currentLesson: lesson,
            showLessonViewer: true 
          });
        }
      },

      // Complete a task
      completeTask: (taskId: string) => {
        const { currentCourse, currentLesson, userProgress } = get();
        if (!currentCourse || !currentLesson) return;

        // Update task completion
        const updatedTasks = currentLesson.tasks.map(task =>
          task.id === taskId ? { ...task, completed: true } : task
        );

        const updatedLesson = { ...currentLesson, tasks: updatedTasks };
        
        // Update user progress
        const courseProgress = userProgress[currentCourse.id] || {
          courseId: currentCourse.id,
          lessonsCompleted: [],
          tasksCompleted: [],
          lastAccessedAt: new Date().toISOString()
        };

        const updatedUserProgress = {
          ...userProgress,
          [currentCourse.id]: {
            ...courseProgress,
            tasksCompleted: [...new Set([...courseProgress.tasksCompleted, taskId])],
            lastAccessedAt: new Date().toISOString()
          }
        };

        // Update course with new lesson
        const updatedLessons = currentCourse.lessons.map(l =>
          l.id === currentLesson.id ? updatedLesson : l
        );

        const updatedCourse = { ...currentCourse, lessons: updatedLessons };

        // Update state first
        set({
          currentCourse: updatedCourse,
          currentLesson: updatedLesson,
          userProgress: updatedUserProgress
        });

        // Check if lesson can be completed after state update
        const allTasksCompleted = updatedTasks.every(task => task.completed);
        if (allTasksCompleted && !updatedLesson.completed) {
          // Use setTimeout to ensure state is updated before completing lesson
          setTimeout(() => {
            get().completeLesson(currentLesson.id);
          }, 100);
        }
      },

      // Complete a lesson
      completeLesson: (lessonId: string) => {
        const { currentCourse, userProgress } = get();
        if (!currentCourse) return;

        const lessonIndex = currentCourse.lessons.findIndex(l => l.id === lessonId);
        if (lessonIndex === -1) return;

        // Mark lesson as completed and unlock next lesson
        const updatedLessons = currentCourse.lessons.map((lesson, index) => {
          if (index === lessonIndex) {
            return { ...lesson, completed: true };
          }
          if (index === lessonIndex + 1) {
            return { ...lesson, unlocked: true };
          }
          return lesson;
        });

        // Calculate course progress
        const completedLessons = updatedLessons.filter(l => l.completed).length;
        const progress = Math.round((completedLessons / updatedLessons.length) * 100);
        const courseCompleted = completedLessons === updatedLessons.length;

        const updatedCourse = {
          ...currentCourse,
          lessons: updatedLessons,
          progress,
          completed: courseCompleted,
          completedAt: courseCompleted ? new Date().toISOString() : undefined
        };

        // Update user progress
        const courseProgress = userProgress[currentCourse.id] || {
          courseId: currentCourse.id,
          lessonsCompleted: [],
          tasksCompleted: [],
          lastAccessedAt: new Date().toISOString()
        };

        const updatedUserProgress = {
          ...userProgress,
          [currentCourse.id]: {
            ...courseProgress,
            lessonsCompleted: [...new Set([...courseProgress.lessonsCompleted, lessonId])],
            lastAccessedAt: new Date().toISOString()
          }
        };

        set({
          currentCourse: updatedCourse,
          userProgress: updatedUserProgress
        });
      },

      // Update reading progress
      updateReadingProgress: (progress: number) => {
        const { currentLesson, currentCourse } = get();
        if (!currentLesson || !currentCourse) return;

        const updatedLesson = { ...currentLesson, readingProgress: progress };
        const updatedLessons = currentCourse.lessons.map(l =>
          l.id === currentLesson.id ? updatedLesson : l
        );

        set({
          currentLesson: updatedLesson,
          currentCourse: { ...currentCourse, lessons: updatedLessons }
        });
      },

      // Validate current tasks against canvas state
      validateCurrentTasks: (nodes: Node[], edges: Edge[]) => {
        const { currentLesson } = get();
        if (!currentLesson) return [];

        return currentLesson.tasks.map(task => {
          const results = task.requirements.map(req =>
            validateTaskRequirement(req, nodes, edges)
          );
          return results.every(Boolean);
        });
      },

      // Get task validation results
      getTaskValidationResults: (nodes: Node[], edges: Edge[]) => {
        const { currentLesson } = get();
        if (!currentLesson) return {};

        const results: Record<string, boolean> = {};
        currentLesson.tasks.forEach(task => {
          const requirementResults = task.requirements.map(req =>
            validateTaskRequirement(req, nodes, edges)
          );
          results[task.id] = requirementResults.every(Boolean);
        });

        return results;
      },

      // Toggle course mode
      toggleCourseMode: () => {
        set(state => ({ isCourseMode: !state.isCourseMode }));
      },

      // Toggle lesson viewer
      toggleLessonViewer: () => {
        set(state => ({ showLessonViewer: !state.showLessonViewer }));
      },

      // Exit course
      exitCourse: () => {
        set({
          currentCourse: null,
          currentLesson: null,
          isCourseMode: false,
          showLessonViewer: false
        });
      },

      // Reset course progress
      resetCourseProgress: (courseId: string) => {
        const { userProgress } = get();
        const updatedProgress = { ...userProgress };
        delete updatedProgress[courseId];

        set({ userProgress: updatedProgress });
      },

      // Get currently allowed layers
      getCurrentAllowedLayers: () => {
        const { currentLesson, isCourseMode } = get();
        if (!isCourseMode || !currentLesson) return [];
        return currentLesson.allowedLayers;
      },

      // Check if can progress to next lesson
      canProgressToNextLesson: () => {
        const { currentLesson } = get();
        if (!currentLesson) return false;
        return currentLesson.tasks.every(task => task.completed);
      },

      // Get next lesson
      getNextLesson: () => {
        const { currentCourse, currentLesson } = get();
        if (!currentCourse || !currentLesson) return null;

        const currentIndex = currentCourse.lessons.findIndex(l => l.id === currentLesson.id);
        const nextLesson = currentCourse.lessons[currentIndex + 1];
        
        return nextLesson && nextLesson.unlocked ? nextLesson : null;
      },

      // Save canvas state for current course
      saveCanvasState: (nodes: Node[], edges: Edge[]) => {
        const { currentCourse, userProgress } = get();
        if (!currentCourse) return;

        const courseProgress = userProgress[currentCourse.id] || {
          courseId: currentCourse.id,
          lessonsCompleted: [],
          tasksCompleted: [],
          lastAccessedAt: new Date().toISOString()
        };

        const updatedUserProgress = {
          ...userProgress,
          [currentCourse.id]: {
            ...courseProgress,
            canvasState: { nodes, edges },
            lastAccessedAt: new Date().toISOString()
          }
        };

        set({ userProgress: updatedUserProgress });
      },

      // Restore canvas state for current course
      restoreCanvasState: () => {
        const { currentCourse, userProgress } = get();
        if (!currentCourse) return null;

        const courseProgress = userProgress[currentCourse.id];
        return courseProgress?.canvasState || null;
      }
    }),
    {
      name: 'course-progress-storage',
      partialize: (state) => ({
        userProgress: state.userProgress
      })
    }
  )
);
