// Three-panel layout: palette | canvas | code viewer
// Maintains fixed min-width for optimal UX across all panels

import type { ReactNode } from "react";
import type { Node, Edge } from "@xyflow/react";

import { cn } from "@/lib/utils";
import { AppHeader } from "./AppHeader";
import { CourseSelector } from "./CourseSelector";
import { LessonViewer } from "./LessonViewer";
import { CoursePrompt } from "./CoursePrompt";
import { useCourseStore } from "../lib/course-store";

const LAYOUT_CONFIG = {
  MIN_WIDTH: 1280,
  SIDEBAR_WIDTH: 288, // w-72
  CODE_VIEWER_WIDTH: 500,
} as const;

interface AppShellProps {
  palette?: ReactNode;
  canvas?: ReactNode;
  codeViewer?: ReactNode;
  className?: string;
  nodes?: Node[];
  edges?: Edge[];
  onImportProject?: (data: { nodes: Node[]; edges: Edge[] }) => void;
  onClearAll?: () => void;
}

export function AppShell({
  palette,
  canvas,
  codeViewer,
  className,
  nodes = [],
  edges = [],
  onImportProject,
  onClearAll,
}: AppShellProps) {
  const { 
    isCourseMode, 
    showLessonViewer, 
    currentCourse 
  } = useCourseStore();
  return (
    <div
      className={cn(
        "flex flex-col h-screen bg-paper text-ink",
        className
      )}
      style={{ minWidth: LAYOUT_CONFIG.MIN_WIDTH }}
    >
      <AppHeader
        nodes={nodes}
        edges={edges}
        onImportProject={onImportProject}
        onClearAll={onClearAll}
      />

      <div className="flex flex-1 overflow-hidden">
        <aside
          className="flex-shrink-0 border-r border-rule bg-paper-raised"
          style={{ width: LAYOUT_CONFIG.SIDEBAR_WIDTH }}
        >
          <div className="h-full overflow-hidden">
            {isCourseMode && !currentCourse ? <CourseSelector /> : palette}
          </div>
        </aside>

        <main className="flex-grow bg-paper-sunken min-w-0">
          <div className="h-full">{canvas}</div>
        </main>

        <aside
          className="flex-shrink-0 border-l border-rule bg-paper-raised"
          style={{ width: LAYOUT_CONFIG.CODE_VIEWER_WIDTH }}
        >
          <div className="h-full overflow-hidden">
            {isCourseMode ? (
              showLessonViewer ? <LessonViewer /> : <CoursePrompt />
            ) : (
              codeViewer
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
