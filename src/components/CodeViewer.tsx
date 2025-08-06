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

# Welcome to HUSKML! 🚀
# Start building your neural network by dragging and dropping layers from the left panel

import tensorflow as tf
from tensorflow import keras

# Your HUSKML model will appear here once you add layers
model = None

print("✨ Ready to create something amazing with HUSKML!")`);

  useEffect(() => {
    const generateCode = async () => {
      if (nodes.length === 0) {
        const welcomeMessage = framework === 'keras' 
          ? `# HUSKML - Advanced Neural Network Builder
# https://huskml.maverickspectrum.com

# Welcome to HUSKML! 🚀
# Start building your neural network by dragging and dropping layers from the left panel

import tensorflow as tf
from tensorflow import keras

# Your HUSKML model will appear here once you add layers
model = None

print("✨ Ready to create something amazing with HUSKML!")`
          : `# HUSKML - Advanced Neural Network Builder
# https://huskml.maverickspectrum.com

# Welcome to HUSKML! 🚀
# Start building your neural network by dragging and dropping layers from the left panel

import torch
import torch.nn as nn
import torch.nn.functional as F

# Your HUSKML model will appear here once you add layers
model = None

print("✨ Ready to create something amazing with HUSKML!")`;
        
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
    <div className={cn("h-full flex flex-col bg-zinc-900/80", className)}>
      <Card className="border-zinc-800 bg-zinc-900 shadow-sm rounded-xl flex-1 flex flex-col animate-fade-in relative" style={{ height: 'calc(100vh - 57px)' }}>
        <CardHeader className="pb-3">
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
                {hasContent ? (framework === 'pytorch' ? 'PyTorch' : 'Keras') : "Ready"}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 p-0 overflow-hidden">
          <div className="h-[calc(100vh-300px)] overflow-auto">
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
          </div>
        </CardContent>

        <div className="absolute bottom-[80px] left-0 right-0 flex justify-center gap-4 pb-4 px-6">
          <Button
            onClick={handleCopy}
            variant="outline"
            size="sm"
            className={`flex-1 max-w-[200px] bg-transparent border-[1px] border-zinc-700 text-zinc-300 hover:bg-transparent hover:border-blue-500/50 hover:text-blue-400 hover:shadow-[0_0_10px_-3px_rgba(59,130,246,0.5)] transition-all duration-300 ${
              copied ? "border-green-500 text-green-400 shadow-[0_0_10px_-3px_rgba(34,197,94,0.5)]" : ""
            }`}
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
            className={`flex-1 max-w-[200px] bg-transparent border-[1px] border-zinc-700 text-zinc-300 hover:bg-transparent hover:border-blue-500/50 hover:text-blue-400 hover:shadow-[0_0_10px_-3px_rgba(59,130,246,0.5)] transition-all duration-300 ${
              downloaded ? "border-green-500 text-green-400 shadow-[0_0_10px_-3px_rgba(34,197,94,0.5)]" : ""
            }`}
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
        <div className="absolute bottom-0 left-0 right-0 text-center py-3 bg-gradient-to-r from-zinc-900/90 via-black/95 to-zinc-900/90 backdrop-blur-md border-t border-zinc-800/50">
          <div className="flex flex-col items-center justify-center gap-2 group">
            <div className="flex items-center justify-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-zinc-400 group-hover:text-zinc-300 transition-colors duration-300 font-light">Powered by</span>
                <a 
                  href="https://huskml.maverickspectrum.com" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="relative inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 hover:border-blue-400/40 transition-all duration-300 group"
                >
                  <span className="text-blue-400 group-hover:text-blue-300 font-semibold tracking-wider text-sm">
                    HUSKML
                  </span>
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500"></div>
                </a>
              </div>
              <span className="text-zinc-600">|</span>
              <div className="flex items-center gap-2">
                <span className="text-zinc-400 group-hover:text-zinc-300 transition-colors duration-300 font-light">Built with</span>
                <span className="text-red-500/80 group-hover:text-red-400 animate-pulse transition-colors duration-300">❤</span>
                <span className="text-zinc-400 group-hover:text-zinc-300 transition-colors duration-300 font-light">by</span>
                <a 
                  href="https://www.blockdl.com" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-orange-400 hover:text-orange-300 font-semibold transition-colors duration-300"
                >
                  BlockDL
                </a>
              </div>
            </div>
            <div className="text-zinc-500 text-xs">
              Original creator: <a 
                href="https://www.blockdl.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-zinc-400 hover:text-zinc-300 underline transition-colors duration-300"
              >
                BlockDL
              </a> - Please support them too! ✨
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
