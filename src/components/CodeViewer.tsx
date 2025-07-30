import { useCallback, useEffect, useState, useMemo } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import { Check, Copy, Download } from "lucide-react";

import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "./ui/card";
import { Badge } from "./ui/badge";
import { parseGraphToDAG, type DAGResult } from "../lib/dag-parser";
import {
  generateKerasCode,
  generateFunctionalKerasCode,
} from "../lib/code-generation";
import { useFlowStore } from "../lib/flow-store";
import { cn } from "../lib/utils";

const UI_CONFIG = {
  COPY_TIMEOUT: 2000,
  BUTTON_HEIGHT: "h-9",
  BORDER_RADIUS: "rounded-lg",
  SPACING: {
    CARD: "px-4 sm:px-6",
    PADDING: "p-4 sm:p-6",
  },
} as const;

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

// Sub-components
interface APIBadgeProps {
  codeType: "sequential" | "functional";
}

function APIBadge({ codeType }: APIBadgeProps) {
  const isFunctional = codeType === "functional";

  return (
    <span
      className={cn(
        "text-xs px-3 py-1.5 rounded-full font-medium border",
        isFunctional
          ? "bg-blue-900/20 text-blue-300 border-blue-600"
          : "bg-amber-900/20 text-amber-300 border-amber-500"
      )}
    >
      {isFunctional ? "Functional API" : "Sequential API"}
    </span>
  );
}

interface ActionButtonsProps {
  onDownload: () => void;
  onCopy: () => void;
  isDisabled: boolean;
  isCopied: boolean;
}

function ActionButtons({
  onDownload,
  onCopy,
  isDisabled,
  isCopied,
}: ActionButtonsProps) {
  const baseButtonClass = cn(
    UI_CONFIG.BUTTON_HEIGHT,
    "px-4",
    UI_CONFIG.BORDER_RADIUS,
    "transition-all duration-200 shadow-sm"
  );

  return (
    <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-800">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onDownload}
          disabled={isDisabled}
          className={cn(
            baseButtonClass,
            "border-zinc-700 hover:bg-zinc-800 hover:border-zinc-600 hover:shadow-md text-zinc-300"
          )}
        >
          <Download className="h-4 w-4 mr-2" />
          Download .py
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onCopy}
          disabled={isDisabled}
          className={cn(
            baseButtonClass,
            isCopied
              ? "border-amber-600 bg-amber-900/20 text-amber-300 hover:bg-amber-900/30 shadow-md"
              : "border-zinc-700 hover:bg-zinc-800 hover:border-zinc-600 hover:shadow-md text-zinc-300"
          )}
        >
          {isCopied ? (
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
      </div>
    </div>
  );
}

interface CodeEditorProps {
  code: string;
}

function CodeEditor({ code }: CodeEditorProps) {
  return (
    <div className="rounded-xl border border-zinc-800 shadow-inner bg-black flex-1 min-h-0">
      <div className="w-full h-full overflow-auto">
        <CodeMirror
          value={code}
          height="100%"
          extensions={[python()]}
          editable={false}
          basicSetup={{
            lineNumbers: true,
            foldGutter: true,
            dropCursor: false,
            allowMultipleSelections: false,
            indentOnInput: false,
            bracketMatching: true,
            closeBrackets: false,
            autocompletion: false,
            highlightSelectionMatches: false,
            searchKeymap: false,
          }}
          theme="dark"
        />
      </div>
    </div>
  );
}

interface CodeViewerProps {
  className?: string;
}

// Generates Keras code from visual neural network graph
export function CodeViewer({ className }: CodeViewerProps) {
  const { nodes, edges } = useFlowStore();
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const code = useMemo(() => {
    if (nodes.length === 0) {
      return `# HuskML - Neural Network Builder

# No layers added yet
# Drag and drop layers from the left panel to start building your network

import tensorflow as tf
from tensorflow import keras

# Your model will appear here once you add layers
model = None

print("Add some layers to generate code!")`;
    }

    try {
      // Parse the graph to get the DAG structure
      const dagResult = parseGraphToDAG(nodes, edges);
      
      if (!dagResult.isValid) {
        return `# Error: Invalid network structure

# Please fix the following issues:
${dagResult.errors.map(error => `# - ${error}`).join('\n')}

# Make sure your network has:
# - At least one Input layer
# - At least one Output layer  
# - No cycles in the connections`;
      }

      // Check if we need Functional API
      if (checkIfFunctionalAPINeeded(dagResult)) {
        return generateFunctionalKerasCode(dagResult);
      } else {
        // Use Sequential API
        return generateKerasCode(dagResult.orderedNodes);
      }
    } catch (error) {
      console.error("Error generating code:", error);
      return `# Error generating code: ${error}`;
    }
  }, [nodes, edges]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
      <Card className="border-zinc-800 bg-zinc-900 shadow-sm rounded-xl flex-1 flex flex-col min-h-0 animate-fade-in">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl text-zinc-200 font-semibold font-grotesk">
              Generated Code
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={
                  hasContent
                    ? "bg-amber-900/20 text-amber-300 border-amber-500"
                    : "bg-blue-900/20 text-blue-300 border-blue-600"
                }
              >
                {hasContent ? "Keras" : "Ready"}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col min-h-0 p-0">
          <div className="flex-1 relative">
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

        <CardFooter className="pt-3">
          <div className="flex gap-2 w-full">
            <Button
              onClick={handleCopy}
              variant="outline"
              size="sm"
              className={`flex-1 ${UI_CONFIG.BORDER_RADIUS} border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-all duration-200 ${
                copied ? "bg-green-900/20 text-green-300 border-green-500" : ""
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
              className={`flex-1 ${UI_CONFIG.BORDER_RADIUS} border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-all duration-200 ${
                downloaded ? "bg-green-900/20 text-green-300 border-green-500" : ""
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
        </CardFooter>
      </Card>
    </div>
  );
}
