import { useState, useEffect } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import { Check, Copy, Download } from "lucide-react";

import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { parseGraphToDAG, type DAGResult } from "../lib/dag-parser";
import {
  generateKerasCode,
  generateFunctionalKerasCode,
  generatePyTorchCodeFromDAG,
} from "../lib/code-generation";
import { useFlowStore } from "../lib/flow-store";
import { cn } from "../lib/utils";
import RetroGrid from "./ui/RetroGrid";
import ShinyButton from "./ui/ShinyButton";



// Helper functions
function checkIfFunctionalAPINeeded(dagResult: DAGResult): boolean {
  const hasMultipleInputs =
    dagResult.orderedNodes.filter((n) => n.type === "Input").length > 1;
  const hasMultipleOutputs =
    dagResult.orderedNodes.filter((n) => n.type === "Output").length > 1;
  const hasComplexStructure = Array.from(dagResult.edgeMap.values()).some(
    (targets) => targets.length > 1
  );
  const hasMergeLayer = dagResult.orderedNodes.some((n) => n.type === "Merge");

  return (
    hasMultipleInputs ||
    hasMultipleOutputs ||
    hasComplexStructure ||
    hasMergeLayer
  );
}

function fallbackCopyToClipboard(text: string): void {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.position = "fixed";
  textArea.style.left = "-999999px";
  textArea.style.top = "-999999px";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    document.execCommand("copy");
  } catch (err) {
    console.error("Fallback: Oops, unable to copy", err);
  }
  document.body.removeChild(textArea);
}



interface CodeViewerProps {
  className?: string;
}

// Generates neural network code from visual graph (Keras or PyTorch)
export function CodeViewer({ className }: CodeViewerProps) {
  const { nodes, edges } = useFlowStore();
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [framework, setFramework] = useState<'keras' | 'pytorch'>('keras');

  const [code, setCode] = useState(`# HUSKML - Advanced Neural Network Builder
# https://huskml.maverickspectrum.com

# Welcome to HUSKML
# Start building your neural network by dragging and dropping layers from the left panel

import tensorflow as tf
from tensorflow import keras

# Your HUSKML model will appear here once you add layers
model = None

print("Model scaffold ready.")`);

  useEffect(() => {
    const generateCode = async () => {
      if (nodes.length === 0) {
        const welcomeMessage = framework === 'keras'
          ? `# HUSKML - Advanced Neural Network Builder
# https://huskml.maverickspectrum.com

# Welcome to HUSKML
# Start building your neural network by dragging and dropping layers from the left panel

import tensorflow as tf
from tensorflow import keras

# Your HUSKML model will appear here once you add layers
model = None

print("Model scaffold ready.")`
          : `# HUSKML - Advanced Neural Network Builder
# https://huskml.maverickspectrum.com

# Welcome to HUSKML
# Start building your neural network by dragging and dropping layers from the left panel

import torch
import torch.nn as nn
import torch.nn.functional as F

# Your HUSKML model will appear here once you add layers
model = None

print("Model scaffold ready.")`;

        setCode(welcomeMessage);
        return;
      }

      try {
        // Parse the graph to get the DAG structure
        const dagResult = parseGraphToDAG(nodes, edges);

        if (!dagResult.isValid) {
          setCode(`# Error: Invalid network structure

# Please fix the following issues:
${dagResult.errors.map(error => `# - ${error}`).join('\n')}

# Make sure your network has:
# - At least one Input layer
# - At least one Output layer  
# - No cycles in the connections`);
          return;
        }

        // Generate code based on selected framework
        if (framework === 'pytorch') {
          const generatedCode = await generatePyTorchCodeFromDAG(dagResult);
          setCode(generatedCode);
        } else {
          // Keras generation (existing logic)
          if (checkIfFunctionalAPINeeded(dagResult)) {
            const generatedCode = await generateFunctionalKerasCode(dagResult);
            setCode(generatedCode);
          } else {
            // Use Sequential API
            const generatedCode = generateKerasCode(dagResult.orderedNodes);
            setCode(generatedCode);
          }
        }
      } catch (error) {
        console.error("Error generating code:", error);
        setCode(`# Error generating code: ${error}`);
      }
    };

    generateCode();
  }, [nodes, edges, framework]);

  const handleCopy = () => {
    try {
      navigator.clipboard.writeText(code).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }).catch((error) => {
        console.error("Failed to copy code:", error);
        // Fallback for older browsers
        fallbackCopyToClipboard(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    } catch (error) {
      console.error("Failed to copy code:", error);
      // Fallback for older browsers
      fallbackCopyToClipboard(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "huskml_model.py";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2000);
  };

  const hasContent = nodes.length > 0;

  return (
    <div className={cn("h-full flex flex-col bg-zinc-900 border-l border-zinc-800", className)}>
      <Card className="border-0 bg-transparent shadow-none rounded-none flex-1 flex flex-col pt-6 pb-0 gap-0 animate-fade-in relative overflow-hidden h-full">
        <CardHeader className="pb-3 shrink-0 z-10 bg-zinc-900/95 backdrop-blur-sm border-b border-zinc-800/50">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl text-zinc-200 font-semibold font-grotesk">
              Generated Code
            </CardTitle>
            <div className="flex items-center gap-3">
              <Select value={framework} onValueChange={(value: 'keras' | 'pytorch') => setFramework(value)}>
                <SelectTrigger className="w-[120px] h-8 bg-zinc-800/50 border-zinc-700 text-zinc-300">
                  <SelectValue placeholder="Framework" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  <SelectItem value="keras" className="text-zinc-300 hover:bg-zinc-700">
                    Keras
                  </SelectItem>
                  <SelectItem value="pytorch" className="text-zinc-300 hover:bg-zinc-700">
                    PyTorch
                  </SelectItem>
                </SelectContent>
              </Select>
              <Badge
                variant="outline"
                className={
                  hasContent
                    ? framework === 'pytorch'
                      ? "bg-orange-900/20 text-orange-300 border-orange-500"
                      : "bg-amber-900/20 text-amber-300 border-amber-500"
                    : "bg-blue-900/20 text-blue-300 border-blue-600"
                }
              >
                {hasContent ? (framework === 'pytorch' ? 'PyTorch Beta' : 'Keras') : "Ready"}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 p-0 overflow-hidden relative z-0">
          <CodeMirror
            value={code}
            height="100%"
            extensions={[python()]}
            theme="dark"
            editable={false}
            className="h-full"
            style={{
              fontSize: "14px",
              fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace",
            }}
          />
        </CardContent>

        <div className="shrink-0 z-10 bg-zinc-900/95 backdrop-blur-sm border-t border-zinc-800/50 p-4 pb-0 flex justify-center gap-4">
          <Button
            onClick={handleCopy}
            variant="outline"
            size="sm"
            className={`flex-1 max-w-[200px] ${copied ? "border-green-600 text-green-700" : ""}`}
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Copy Code
              </>
            )}
          </Button>
          <Button
            onClick={handleDownload}
            variant="outline"
            size="sm"
            className={`flex-1 max-w-[200px] ${downloaded ? "border-green-600 text-green-700" : ""}`}
          >
            {downloaded ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Downloaded!
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Download
              </>
            )}
          </Button>
        </div>

        {/* Reduced Height Retro Grid Footer */}
        <div className="relative h-28 w-full overflow-hidden border-t border-rule shrink-0 bg-paper-raised">
          <RetroGrid className="opacity-100" angle={65} />

          <div className="absolute inset-0 flex flex-row items-center justify-between z-10 px-10 pointer-events-auto max-w-full mx-auto w-full">
            <a
              href="https://neura-huskml.maverickspectrum.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col gap-0.5 select-none hover:opacity-80 transition-opacity"
            >
              <div className="text-[11px] tracking-[0.4em] text-zinc-500 font-bold uppercase" style={{ fontFamily: "var(--font-display)" }}>
                In The Neural Cloud
              </div>
              <div className="text-4xl font-bold tracking-display text-ink" style={{ fontFamily: "var(--font-display)" }}>
                HUSKML
              </div>
            </a>

            <div className="flex items-center">
              <ShinyButton
                href="https://www.linkedin.com/company/huskml"
                target="_blank"
                rel="noopener noreferrer"
                className="!font-mono"
              >
                <div className="flex flex-row items-center gap-2">
                  <span className="text-[10px] uppercase tracking-wider opacity-80">Follow on</span>
                  <span className="text-sm font-bold tracking-tight">LinkedIn</span>
                </div>
              </ShinyButton>
            </div>
          </div>

          {/* Top Fade */}
          <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-zinc-900 to-transparent pointer-events-none" />
        </div>
      </Card>
    </div>
  );
}
