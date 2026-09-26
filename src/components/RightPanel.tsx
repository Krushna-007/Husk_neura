/**
 * Right panel host — switches between the generated code and the inspector.
 * Both read the same store, so neither view can drift from the canvas.
 */
import { useState } from "react";
import { Code2, Gauge } from "lucide-react";

import { CodeViewer } from "./CodeViewer";
import { ModelInspector } from "./ModelInspector";

type View = "code" | "inspector";

const VIEWS = [
  { id: "code" as const, label: "Code", Icon: Code2 },
  { id: "inspector" as const, label: "Inspector", Icon: Gauge },
];

export function RightPanel() {
  const [view, setView] = useState<View>("code");

  return (
    <div className="flex h-full flex-col bg-chrome">
      <div className="shrink-0 border-b border-rule px-4 pt-3">
        <div role="tablist" className="flex gap-1 rounded-md bg-rule-soft p-1">
          {VIEWS.map(({ id, label, Icon }) => {
            const selected = view === id;
            return (
              <button
                key={id}
                role="tab"
                aria-selected={selected}
                onClick={() => setView(id)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-sm px-3 py-1.5 text-[13px] font-medium transition-colors duration-150 ease-out-soft ${
                  selected
                    ? "bg-raised text-ink shadow-sm"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="min-h-0 flex-1">
        {view === "code" ? <CodeViewer /> : <ModelInspector />}
      </div>
    </div>
  );
}
