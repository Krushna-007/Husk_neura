/**
 * Visual flow editor for neural network architectures
 *
 * Drag layers from palette, connect them visually, and generate code.
 * Uses React Flow with Zustand for state management.
 */

import { useCallback, useState, useEffect, useRef } from "react";

import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  ConnectionLineType,
} from "@xyflow/react";
import type {
  Node,
  NodeTypes,
  EdgeTypes,
  ReactFlowInstance,
  XYPosition,
  Connection,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";

import { LayerNode } from "./LayerNode";
import { DeletableEdge } from "./DeletableEdge";
import { CopyPasteControls } from "./CopyPasteControls";
import { getDefaultParams } from "../lib/layers/parameters";
import { getTemplateById } from "../lib/templates";
import { useFlowStore } from "../lib/flow-store";
import { cn } from "../lib/utils";

// Flow editor configuration
const FLOW_CONFIG = {
  BACKGROUND: { 
    GAP: 25, 
    SIZE: 1, 
    COLOR: "#18181b",
    SECONDARY_COLOR: "#27272a",
    PATTERN_COLOR: "#3f3f46",
    ANIMATION_DURATION: "20s"
  },
  EDGE: { 
    STROKE_WIDTH: 2, 
    STROKE_COLOR: "#a1a1aa",
    ANIMATED_STROKE: "rgba(99, 102, 241, 0.5)",
    SELECTED_STROKE: "rgba(99, 102, 241, 0.8)",
    HOVER_STROKE: "rgba(129, 140, 248, 0.7)"
  },
} as const;

const nodeTypes: NodeTypes = { layerNode: LayerNode };
const edgeTypes: EdgeTypes = { 
  smoothstep: DeletableEdge,
};

/**
 * Props for CanvasEditor component
 */
interface CanvasEditorProps {
  className?: string;
}

function CanvasEditorInner({ className = "" }: CanvasEditorProps) {
  const {
    nodes,
    edges,
    onNodesChange: handleNodesChange,
    onEdgesChange: handleEdgesChange,
    onConnect: handleConnect,
    addNode,
    addNodesAndEdges,
  } = useFlowStore();

  const [reactFlowInstance, setReactFlowInstance] =
    useState<ReactFlowInstance | null>(null);

  // Prevent accidental node deletion to preserve network integrity
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Delete" || event.key === "Backspace") {
        const target = event.target as HTMLElement;

        // Allow deletion in input fields
        if (
          target &&
          (target.tagName === "INPUT" ||
            target.tagName === "TEXTAREA" ||
            target.contentEditable === "true")
        ) {
          return;
        }

        // Block delete operations to preserve network structure
        event.preventDefault();
        event.stopPropagation();
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!reactFlowInstance) return;

      const reactFlowBounds = event.currentTarget.getBoundingClientRect();
      const layerType = event.dataTransfer.getData("layerType");
      const templateId = event.dataTransfer.getData("templateId");

      const position: XYPosition = reactFlowInstance.screenToFlowPosition({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      if (layerType) {
        // Handle single layer drop
        const newNode: Node = {
          id: `${layerType.toLowerCase()}-${Date.now()}`,
          type: "layerNode",
          position,
          data: {
            type: layerType,
            params: getDefaultParams(layerType),
          },
        };

        addNode(newNode);
      } else if (templateId) {
        // Handle template drop
        const template = getTemplateById(templateId);
        if (!template) return;

        const timestamp = Date.now();
        const nodeIdMap = new Map<string, string>();

        // Create new nodes with unique IDs and adjusted positions
        const newNodes: Node[] = template.network.nodes.map((templateNode) => {
          const nodeData = templateNode.data as {
            type: string;
            params: Record<string, unknown>;
          };
          const newId = `${nodeData.type.toLowerCase()}-${timestamp}-${Math.random()
            .toString(36)
            .substr(2, 9)}`;
          nodeIdMap.set(templateNode.id, newId);

          return {
            id: newId,
            type: "layerNode",
            position: {
              x: position.x + templateNode.position.x,
              y: position.y + templateNode.position.y,
            },
            data: {
              type: nodeData.type,
              params: nodeData.params || getDefaultParams(nodeData.type),
            },
          };
        });

        // Create new edges with updated node IDs
        const newEdges = template.network.edges
          .map((templateEdge) => {
            const sourceId = nodeIdMap.get(templateEdge.source);
            const targetId = nodeIdMap.get(templateEdge.target);

            if (!sourceId || !targetId) return null;

            return {
              id: `${sourceId}-${targetId}`,
              source: sourceId,
              target: targetId,
              type: "smoothstep" as const,
              style: { strokeWidth: 2, stroke: "#6b7280" },
            };
          })
          .filter((edge): edge is NonNullable<typeof edge> => edge !== null);

        // Add all nodes and edges at once
        addNodesAndEdges(newNodes, newEdges);
      }
    },
    [reactFlowInstance, addNode, addNodesAndEdges]
  );

  return (
    <div className={cn("h-full w-full", className)}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={handleConnect}
        onInit={setReactFlowInstance}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        attributionPosition="top-right"
        deleteKeyCode={[]}
        multiSelectionKeyCode={["Control", "Meta"]}
        connectionLineType={ConnectionLineType.SmoothStep}
        defaultEdgeOptions={{
          type: "smoothstep",
          style: {
            strokeWidth: FLOW_CONFIG.EDGE.STROKE_WIDTH,
            stroke: FLOW_CONFIG.EDGE.STROKE_COLOR,
            transition: 'all 0.3s ease-in-out',
          },
          animated: true,
        }}
        className="animate-[fadeIn_0.5s_ease-in-out]"
      >
        <Controls 
          className="bg-zinc-900/90 border-zinc-800 text-zinc-100 rounded-xl backdrop-blur-sm transition-transform duration-300 hover:scale-105" 
          showZoom={true}
          showFitView={true}
          fitViewOptions={{ duration: 800, padding: 0.2 }}
        />
        <MiniMap 
          className="bg-zinc-900/80 border border-zinc-800 rounded-lg backdrop-blur-sm transition-all duration-300 hover:bg-zinc-900/90 hover:shadow-lg"
          nodeColor={(node) => {
            const type = (node.data as any)?.type?.toLowerCase() || '';
            if (type.includes('input')) return '#3B82F6';
            if (type.includes('output')) return '#10B981';
            if (type.includes('conv')) return '#8B5CF6';
            if (type.includes('pool')) return '#F59E0B';
            if (type.includes('dense')) return '#EC4899';
            return '#6B7280';
          }}
          nodeStrokeWidth={3}
          nodeBorderRadius={2}
          maskColor="rgba(0, 0, 0, 0.7)"
          onClick={(event, position) => {
            if (reactFlowInstance) {
              const transform = reactFlowInstance.getViewport();
              reactFlowInstance.setViewport({
                x: -position.x + window.innerWidth / 2,
                y: -position.y + window.innerHeight / 2,
                zoom: transform.zoom,
              }, { duration: 800 });
            }
          }}
        />
        <CopyPasteControls />
        <Background
          variant={BackgroundVariant.Lines}
          gap={FLOW_CONFIG.BACKGROUND.GAP}
          size={FLOW_CONFIG.BACKGROUND.SIZE}
          color={FLOW_CONFIG.BACKGROUND.COLOR}
          style={{
            backgroundColor: FLOW_CONFIG.BACKGROUND.SECONDARY_COLOR,
            backgroundImage: `
              radial-gradient(${FLOW_CONFIG.BACKGROUND.PATTERN_COLOR} 1px, transparent 1px),
              radial-gradient(${FLOW_CONFIG.BACKGROUND.PATTERN_COLOR} 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
            backgroundPosition: '0 0, 25px 25px',
            animation: `backgroundScroll ${FLOW_CONFIG.BACKGROUND.ANIMATION_DURATION} linear infinite`,
          }}
        />
      </ReactFlow>
    </div>
  );
}

/**
 * Main CanvasEditor component with ReactFlow provider
 */
export function CanvasEditor(props: CanvasEditorProps) {
  return (
    <ReactFlowProvider>
      <CanvasEditorInner {...props} />
    </ReactFlowProvider>
  );
}
