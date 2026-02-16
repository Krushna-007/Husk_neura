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
                        className="h-6 w-6 text-cyan-400 fill-zinc-900 stroke-[1.5px]"
                        style={{
                            filter: "drop-shadow(0 0 5px rgba(34, 211, 238, 0.5))",
                            transform: isClicking
                                ? "translate(-2px, -2px) scale(0.9)" // Clicking/Grabbing effect
                                : "translate(-2px, -2px)",           // Hovering canvas (Open Hand)
                        }}
                    />
                ) : (
                    <MousePointer2
                        className="h-6 w-6 text-cyan-400 fill-zinc-900 stroke-[1.5px]"
                        style={{
                            filter: "drop-shadow(0 0 5px rgba(34, 211, 238, 0.5))",
                            transform: "rotate(-15deg) translate(-2px, -2px)"
                        }}
                    />
                )}
            </Pointer>
            <PointerFollower
                align="bottom-right"
                gap={15}
                transition={{ stiffness: 300, damping: 20, bounce: 0.5 }}
                className="z-[9998]"
            >
                <div className="px-3 py-1 bg-black/80 border border-cyan-500/50 rounded-lg backdrop-blur-sm text-[10px] font-mono font-bold text-cyan-300 uppercase tracking-widest shadow-[0_0_15px_-3px_rgba(34,211,238,0.3)] whitespace-nowrap">
                    8-Bit from PAST
                </div>
            </PointerFollower>
        </MouseTrackerProvider>
    );
}
