"use client";

import { MousePointer2, Hand } from "lucide-react";
import { MouseTrackerProvider, Pointer, PointerFollower } from "./ui/mouse-tracker";
import { useEffect, useState } from "react";

export function RetroCursor() {
    const [isClicking, setIsClicking] = useState(false);
    const [isHoveringCanvas, setIsHoveringCanvas] = useState(false);

    useEffect(() => {
        const handleMouseDown = () => setIsClicking(true);
        const handleMouseUp = () => setIsClicking(false);

        const handleMouseOver = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            // Check if hovering over the React Flow canvas pane (background)
            const isCanvas = target.closest('.react-flow__pane');
            // Check if hovering over a node or interactive element
            const isNode = target.closest('.react-flow__node') || target.closest('button') || target.closest('a') || target.closest('input');

            // Show hand only if on canvas AND NOT on a node/interactive element
            if (isCanvas && !isNode) {
                setIsHoveringCanvas(true);
            } else {
                setIsHoveringCanvas(false);
            }
        };

        window.addEventListener("mousedown", handleMouseDown);
        window.addEventListener("mouseup", handleMouseUp);
        window.addEventListener("mouseover", handleMouseOver);

        return () => {
            window.removeEventListener("mousedown", handleMouseDown);
            window.removeEventListener("mouseup", handleMouseUp);
            window.removeEventListener("mouseover", handleMouseOver);
        };
    }, []);

    return (
        <MouseTrackerProvider className="contents">
            <Pointer className="z-[9999]" style={{ cursor: "none" }}>
                {isClicking || isHoveringCanvas ? (
                    <Hand
                        className="h-5 w-5"
                        style={{
                            color: "var(--color-paper-raised)",
                            fill: "var(--color-ink)",
                            strokeWidth: 1.5,
                            transform: isClicking
                                ? "translate(-2px, -2px) scale(0.92)"
                                : "translate(-2px, -2px)",
                        }}
                    />
                ) : (
                    <MousePointer2
                        className="h-5 w-5"
                        style={{
                            color: "var(--color-paper-raised)",
                            fill: "var(--color-ink)",
                            strokeWidth: 1.5,
                            transform: "translate(-1px, -1px)",
                        }}
                    />
                )}
            </Pointer>
            {isHoveringCanvas && (
                <PointerFollower
                    align="bottom-right"
                    gap={12}
                    transition={{ stiffness: 400, damping: 30, bounce: 0 }}
                    className="z-[9998]"
                >
                    <div className="rounded-sm bg-ink px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-white whitespace-nowrap">
                        {isClicking ? "Panning" : "Drag to pan"}
                    </div>
                </PointerFollower>
            )}
        </MouseTrackerProvider>
    );
}
