import { useEffect } from "react";
import { AppShell } from "./components/AppShell";
import { CanvasEditor } from "./components/CanvasEditor";
import BlockPalette from "./components/BlockPalette";
import { CodeViewer } from "./components/CodeViewer";
import { BackgroundParticles } from "./components/BackgroundParticles";
import type { Node, Edge } from "@xyflow/react";
import { useFlowStore } from "./lib/flow-store";
import "./App.css";
import "./styles/fonts.css";

function App() {
  const { nodes, edges, setNodes, setEdges, initializeHistory } = useFlowStore();

  // Initialize history when app starts
  useEffect(() => {
    initializeHistory();
  }, [initializeHistory]);

  const handleClearAll = () => {
    setNodes([]);
    setEdges([]);
  };

  const handleImportProject = (data: { nodes: Node[]; edges: Edge[] }) => {
    setNodes(data.nodes);
    setEdges(data.edges);
  };

  const paletteContent = <BlockPalette />;

  const canvasContent = <CanvasEditor />;

  const codeViewerContent = <CodeViewer />;

  return (
    <>
      <BackgroundParticles />
      <AppShell
        palette={paletteContent}
        canvas={canvasContent}
        codeViewer={codeViewerContent}
        nodes={nodes}
        edges={edges}
        onImportProject={handleImportProject}
        onClearAll={handleClearAll}
      />
    </>
  );
}

export default App;
