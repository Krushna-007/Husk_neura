import { useState, useCallback, useEffect } from "react";
import type { Node, Edge } from "@xyflow/react";
import { Download, Upload, Trash2, GraduationCap } from "lucide-react";

import { Button } from "./ui/button";

import { UndoRedoControls } from "./UndoRedoControls";
import { TutorialGuide } from "./TutorialGuide";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from "./ui/dialog";

const PROJECT_CONFIG = {
  VERSION: "1.0.0",
  FILE_TYPE: "application/json",
  FILE_ACCEPT: ".json",
} as const;

const ERROR_MESSAGES = {
  INVALID_FORMAT:
    "Invalid project file format. Please ensure the file contains valid nodes and edges.",
  READ_ERROR:
    "Error reading project file. Please check that the file is a valid JSON format.",
} as const;

interface AppHeaderProps {
  nodes?: Node[];
  edges?: Edge[];
  onImportProject?: (data: { nodes: Node[]; edges: Edge[] }) => void;
  onClearAll?: () => void;
}

// Header with project management controls
export function AppHeader({
  nodes = [],
  edges = [],
  onImportProject,
  onClearAll,
}: AppHeaderProps) {
  const [showTutorial, setShowTutorial] = useState(false);
  
  // Check if it's the first visit
  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('huskml_has_seen_tutorial');
    if (!hasSeenTutorial) {
      setShowTutorial(true);
      localStorage.setItem('huskml_has_seen_tutorial', 'true');
    }
  }, []);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const hasContent = nodes.length > 0 || edges.length > 0;

  const handleExportProject = useCallback(() => {
    const projectData = {
      nodes,
      edges,
      metadata: {
        exportedAt: new Date().toISOString(),
        version: PROJECT_CONFIG.VERSION,
      },
    };

    const dataStr = JSON.stringify(projectData, null, 2);
    const dataBlob = new Blob([dataStr], { type: PROJECT_CONFIG.FILE_TYPE });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `huskml-project-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [nodes, edges]);

  const showImportError = useCallback((message: string) => {
    setErrorMessage(message);
    setShowErrorDialog(true);
  }, []);

  const handleImportProject = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = PROJECT_CONFIG.FILE_ACCEPT;
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          if (data.nodes && data.edges) {
            onImportProject?.(data);
          } else {
            showImportError(ERROR_MESSAGES.INVALID_FORMAT);
          }
        } catch (error) {
          console.error("Error reading project file:", error);
          showImportError(ERROR_MESSAGES.READ_ERROR);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, [onImportProject, showImportError]);

  const handleClearConfirm = useCallback(() => {
    onClearAll?.();
    setShowClearDialog(false);
  }, [onClearAll]);

  return (
    <header className="bg-black border-b border-zinc-800 shadow-sm px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <img src="/favicon_new.svg" alt="Icon" className="h-5 w-5" />
          <span className="text-zinc-100 font-medium">Neural Network Builder</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Undo/Redo Controls */}
        <UndoRedoControls />
        
        {/* Project Controls */}
        <div className="flex items-center gap-2 border-l border-zinc-700 pl-2">
        <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={!hasContent}
              className="flex items-center gap-2 hover:bg-red-900/20 hover:border-red-500 hover:text-red-400 border-zinc-700 text-zinc-300"
            >
              <Trash2 className="h-4 w-4" />
              Clear All
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-zinc-900 border-zinc-800">
            <DialogHeader>
              <DialogTitle className="text-zinc-100">Clear All Blocks</DialogTitle>
              <DialogDescription className="text-zinc-300">
                Are you sure you want to clear all blocks from the canvas? This
                action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowClearDialog(false)}
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleClearConfirm}>
                Clear All
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Button
          variant="outline"
          size="sm"
          onClick={handleExportProject}
          disabled={!hasContent}
          className="flex items-center gap-2 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
        >
          <Upload className="h-4 w-4" />
          Export
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleImportProject}
          className="flex items-center gap-2 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
        >
          <Download className="h-4 w-4" />
          Import
        </Button>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowTutorial(true)}
          className="flex items-center gap-2 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
        >
          <GraduationCap className="h-4 w-4" />
          Tutorial
        </Button>

        <TutorialGuide isOpen={showTutorial} onClose={() => setShowTutorial(false)} />

        <Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
          <DialogContent className="bg-zinc-900 border-zinc-800">
            <DialogHeader>
              <DialogTitle className="text-zinc-100">Import Error</DialogTitle>
              <DialogDescription className="text-zinc-300">{errorMessage}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={() => setShowErrorDialog(false)}>OK</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </header>
  );
}
