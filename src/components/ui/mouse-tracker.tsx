"use client";

import * as React from "react";
import {
    motion,
    useMotionValue,
    AnimatePresence,
    type HTMLMotionProps,
    type SpringOptions,
} from "framer-motion";

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cx(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export type MouseTrackerContextType = {
    position: { x: number; y: number };
    active: boolean;
    wrapperRef: React.RefObject<HTMLDivElement>;
    pointerRef: React.RefObject<HTMLDivElement>;
};

const MouseTrackerContext = React.createContext<
    MouseTrackerContextType | undefined
>(undefined);

export const useMouseTracker = (): MouseTrackerContextType => {
    const context = React.useContext(MouseTrackerContext);
    if (!context) {
        throw new Error("useMouseTracker must be used within MouseTrackerProvider");
    }
    return context;
};

export type MouseTrackerProviderProps = React.ComponentProps<"div"> & {
    children: React.ReactNode;
};

export function MouseTrackerProvider({
    children,
    className,
    ...rest
}: MouseTrackerProviderProps) {
    const [position, setPosition] = React.useState({ x: 0, y: 0 });
    const [active, setActive] = React.useState(false);
    const wrapperRef = React.useRef<HTMLDivElement>(null);
    const pointerRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        // We'll attach listening to the window/body for smoother global tracking if needed,
        // but the user's code attaches to the wrapper's parent.
        // Let's stick to the user's logic but ensure it works for full screen.
        // Actually, adapting to window for better "app" feel is often safer for these overlays.
        // But let's follow the provided code's structure first:
        const wrapper = wrapperRef.current;
        if (!wrapper) return;

        const handleMouseMove = (e: MouseEvent) => {
            setPosition({ x: e.clientX, y: e.clientY });
            setActive(true);
        };

        const handleMouseLeave = () => setActive(false);

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseleave", handleMouseLeave);

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseleave", handleMouseLeave);
        };
    }, []);

    return (
        <MouseTrackerContext.Provider
            value={{ position, active, wrapperRef, pointerRef }}
        >
            <div ref={wrapperRef} className={cx("relative", className)} {...rest}>
                {children}
            </div>
        </MouseTrackerContext.Provider>
    );
}

export type PointerProps = HTMLMotionProps<"div"> & {
    children?: React.ReactNode;
};

export function Pointer({ className, style, children, ...rest }: PointerProps) {
    const { position, active, pointerRef } = useMouseTracker();

    const x = useMotionValue(0);
    const y = useMotionValue(0);

    React.useEffect(() => {
        x.set(position.x);
        y.set(position.y);
    }, [position, x, y]);

    return (
        <AnimatePresence>
            {active && (
                <motion.div
                    ref={pointerRef}
                    className={cx(
                        "pointer-events-none fixed z-[9999] top-0 left-0",
                        className
                    )}
                    style={{ x, y, ...style }}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    {...rest}
                >
                    {children}
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export type Anchor =
    | "top"
    | "top-left"
    | "top-right"
    | "bottom"
    | "bottom-left"
    | "bottom-right"
    | "left"
    | "right"
    | "center";

export type PointerFollowerProps = HTMLMotionProps<"div"> & {
    align?: Anchor;
    gap?: number;
    transition?: SpringOptions;
    children: React.ReactNode;
};

export function PointerFollower({
    align = "bottom-right",
    gap = 20,
    transition = { stiffness: 500, damping: 50, bounce: 0 },
    children,
    className,
    style,
    ...rest
}: PointerFollowerProps) {
    const { position, active } = useMouseTracker();

    // Clean offset logic for fixed positioning
    const xOffset = React.useMemo(() => {
        if (align.includes("left")) return -gap;
        if (align.includes("right")) return gap;
        return 0;
    }, [align, gap]);

    const yOffset = React.useMemo(() => {
        if (align.includes("top")) return -gap;
        if (align.includes("bottom")) return gap;
        return 0;
    }, [align, gap]);

    return (
        <AnimatePresence>
            {active && (
                <motion.div
                    className={cx(
                        "pointer-events-none fixed z-[9998] top-0 left-0",
                        className
                    )}
                    initial={{ scale: 0, opacity: 0, x: position.x, y: position.y }}
                    animate={{
                        scale: 1,
                        opacity: 1,
                        x: position.x + xOffset,
                        y: position.y + yOffset
                    }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{
                        type: "spring",
                        stiffness: transition.stiffness,
                        damping: transition.damping,
                        mass: 0.5 // slightly lighter for follow effect
                    }}
                    style={style}
                    {...rest}
                >
                    {children}
                </motion.div>
            )}
        </AnimatePresence>
    );
}
