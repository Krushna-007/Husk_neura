import { useState } from "react";
import { Button } from "./ui/button";
import { ChevronRight, ChevronLeft } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

interface TutorialStep {
  title: string;
  content: string;
  description: string;
  tips: string[];
}

const tutorialSteps: TutorialStep[] = [
  {
    title: "Welcome to HUSKML! 👋",
    content: "Your Journey to Visual Neural Network Design Starts Here",
    description: "HUSKML makes neural network design intuitive and visual. You'll be able to create complex architectures with just a few clicks and see the code generate automatically.",
    tips: [
      "Take this quick tour to learn the essential features",
      "You can access this tutorial anytime from the Tutorial button"
    ]
  },
  {
    title: "Layer Palette 🧱",
    content: "Your Building Blocks Library",
    description: "On the left side, you'll find all the neural network layers organized by categories. From basic Dense layers to advanced Convolutional layers, everything you need is here.",
    tips: [
      "Start with an Input layer - it's required for every network",
      "Hover over layers to see quick descriptions",
      "Click categories to explore different layer types"
    ]
  },
  {
    title: "Canvas Workspace 🎯",
    content: "Design Your Network Architecture",
    description: "The main canvas is your design space. Drag layers from the palette and arrange them to create your network structure. The visual layout directly represents your network's architecture.",
    tips: [
      "Drag and drop layers onto the canvas",
      "Use mouse wheel to zoom in/out",
      "Click and drag empty space to pan around"
    ]
  },
  {
    title: "Making Connections 🔗",
    content: "Connect Your Layers",
    description: "Layers communicate through connections. Each connection represents data flow in your network. Create them by dragging from one layer's output (bottom) to another layer's input (top).",
    tips: [
      "Connections turn red if they're incompatible",
      "Multiple connections create branching paths",
      "Right-click a connection to delete it"
    ]
  },
  {
    title: "Layer Settings ⚙️",
    content: "Customize Your Layers",
    description: "Double-click any layer to open its settings panel. Here you can configure everything from the number of neurons to activation functions and special parameters specific to each layer type.",
    tips: [
      "Each layer type has its own unique settings",
      "Changes are reflected instantly in the code",
      "Hover over settings for quick explanations"
    ]
  },
  {
    title: "Live Code Generation 💻",
    content: "From Visual to Code",
    description: "Watch as your visual design transforms into production-ready Keras code in real-time. The code panel on the right shows the exact implementation of your network, ready to use in your projects.",
    tips: [
      "Code updates automatically as you build",
      "Copy the code with one click",
      "Download as a Python file"
    ]
  },
  {
    title: "Save Your Work 💾",
    content: "Preserve Your Designs",
    description: "Your network designs can be saved and shared. Use the Export button to save your work as a JSON file, which you can later import to continue working or share with others.",
    tips: [
      "Export regularly to save your progress",
      "Share your designs with teammates",
      "Import existing networks to modify them"
    ]
  },
  {
    title: "Ready to Create! 🚀",
    content: "Start Building Amazing Networks",
    description: "You're now equipped with all the essential tools to create neural networks visually. Remember to start simple and gradually add complexity as you become more comfortable.",
    tips: [
      "Begin with a basic network structure",
      "Experiment with different layer combinations",
      "Use the tutorial button if you need a refresher"
    ]
  }
];

interface TutorialGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TutorialGuide({ isOpen, onClose }: TutorialGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const step = tutorialSteps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === tutorialSteps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onClose();
      setCurrentStep(0);
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    onClose();
    setCurrentStep(0);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-900 border-zinc-800 max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-xl text-zinc-100 flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 font-medium text-sm">
              {currentStep + 1}
            </div>
            {step.title}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-6 space-y-6">
          {/* Main Content */}
          <div className="space-y-4">
            <h3 className="text-lg text-blue-400 font-medium tracking-tight">
              {step.content}
            </h3>
            <p className="text-zinc-300 text-base leading-relaxed">
              {step.description}
            </p>
            <div className="space-y-2 mt-4">
              {step.tips.map((tip, index) => (
                <div key={index} className="flex items-start gap-2 text-sm">
                  <span className="text-blue-500 mt-1">•</span>
                  <span className="text-zinc-400">{tip}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Progress Dots */}
          <div className="flex items-center justify-center gap-1.5 pt-2">
            {tutorialSteps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                  index === currentStep
                    ? "bg-blue-500"
                    : "bg-zinc-700"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-8 pt-4 border-t border-zinc-800">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevious}
              disabled={isFirstStep}
              className={`text-zinc-400 border-zinc-700 hover:bg-zinc-800 ${
                isFirstStep ? "opacity-50" : ""
              }`}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSkip}
              className="text-zinc-400 border-zinc-700 hover:bg-zinc-800"
            >
              Skip Tutorial
            </Button>
          </div>
          <Button onClick={handleNext} size="sm" className="flex items-center gap-1">
            {isLastStep ? "Get Started" : "Next"}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}