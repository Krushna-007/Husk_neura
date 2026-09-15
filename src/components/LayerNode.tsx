import { useState } from "react";
import { Handle, Position, useReactFlow } from "@xyflow/react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Button } from "./ui/button";
import { Trash2, AlertTriangle } from "lucide-react";
import { getDefaultParams, getLayerFormSpec } from "../lib/layers/parameters";
import { getLayerCategoryColors } from "../lib/categories";
import { LayerIcon } from "../lib/layer-icons";
import {
  getParameterDisplayValues,
  getTotalParameterCount,
} from "../lib/layer-display";
import type { LayerParamValue } from "../lib/layers/parameters";
import type { LayerFormField } from "../lib/layers/parameters";

interface LayerNodeData {
  type: string;
  params: Record<string, LayerParamValue>;
  hasShapeError?: boolean;
  shapeErrorMessage?: string;
}

interface LayerNodeProps {
  id: string;
  data: LayerNodeData;
}

export function LayerNode({ id, data }: LayerNodeProps) {
  const {
    type,
    params = getDefaultParams(data.type),
    hasShapeError,
    shapeErrorMessage,
  } = data;
  const [isOpen, setIsOpen] = useState(false);
  const [editParams, setEditParams] = useState(params);
  const { updateNodeData, deleteElements } = useReactFlow();

  const formSpec = getLayerFormSpec(type);
  const categoryColors = getLayerCategoryColors(type);
  const visibleParams = getParameterDisplayValues(type, params);
  const totalParams = getTotalParameterCount(type);
  const showMoreIndicator = type !== "Input" && totalParams > 3;

  const handleDoubleClick = () => {
    setIsOpen(true);
    setEditParams({ ...params });
  };

  const handleSave = () => {
    updateNodeData(id, { ...data, params: editParams });
    setIsOpen(false);
  };

  const handleCancel = () => {
    setEditParams({ ...params });
    setIsOpen(false);
  };

  const handleDelete = () => {
    deleteElements({ nodes: [{ id }] });
  };

  const renderParamEditor = (field: LayerFormField) => {
    const { key, label, type, options, min, max, step, show } = field;

    if (show && !show(editParams)) return null;

    const updateParam = (newValue: string | number) => {
      setEditParams((prev) => ({ ...prev, [key]: newValue }));
    };

    if (type === "select") {
      const currentValue = editParams[key]?.toString() || "";
      const selectValue =
        currentValue === "" && key === "activation" ? "none" : currentValue;

      return (
        <div key={key} className="space-y-1">
          <Label htmlFor={key} className="text-xs">
            {label}
          </Label>
          <Select value={selectValue} onValueChange={updateParam}>
            <SelectTrigger className="h-8">
              <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent className="!bg-zinc-950 border-zinc-700 [&>div]:!bg-zinc-950 [&>*]:!bg-zinc-950">
              {options?.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  className="!text-zinc-200 data-[highlighted]:!bg-zinc-800 data-[highlighted]:!text-zinc-200 !cursor-pointer">
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    return (
      <div key={key} className="space-y-1">
        <Label htmlFor={key} className="text-xs">
          {label}
        </Label>
        <Input
          id={key}
          type={type}
          value={editParams[key]?.toString() || ""}
          min={min}
          max={max}
          step={step}
          onChange={(e) => {
            const value =
              type === "number" && e.target.value !== ""
                ? Number(e.target.value)
                : e.target.value;
            updateParam(value);
          }}
          className="h-8"
          autoFocus={false}
        />
      </div>
    );
  };

  const getNodeClasses = () => {
    const base =
      "layer-node flex flex-col px-4 py-3 rounded-md shadow-sm border cursor-pointer min-w-[160px] max-w-[280px]";

    if (hasShapeError) {
      return `${base} border-red-400 hover:border-red-500 bg-red-50`;
    }

    return `${base} ${categoryColors.bg} ${categoryColors.border} ${categoryColors.hover} hover:shadow-md`;
  };

  const getHandleClasses = (isError: boolean, color: string) =>
    `node-handle w-3 h-3 border-2 border-paper-raised shadow-sm rounded-full transition-colors duration-200 ${isError
      ? "!bg-red-500"
      : color
    }`;

  return (
    <div className="layer-node">
      {type !== "Input" && (
        <Handle
          type="target"
          position={Position.Top}
          className={getHandleClasses(!!hasShapeError, "!bg-blue-500")}
        />
      )}

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <div className="relative group">
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                handleDelete();
              }}
              className="absolute -top-2 -right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-150 ease-out-soft bg-red-600 hover:bg-red-700 text-white rounded-full p-1 shadow-sm"
              title="Delete this block"
            >
              <Trash2 className="h-3 w-3" />
            </button>

            <div
              className={getNodeClasses()}
              onDoubleClick={handleDoubleClick}
              title={
                hasShapeError
                  ? `Shape Error: ${shapeErrorMessage}`
                  : `${type} - Double click to edit`
              }
            >
              <div
                className={`flex items-center gap-2 ${visibleParams.length === 0 && !hasShapeError
                  ? "justify-center"
                  : ""
                  }`}
              >
                <LayerIcon
                  type={type}
                  className={`h-4 w-4 flex-shrink-0 ${hasShapeError ? "text-red-600" : "text-ink-muted"}`}
                />
                <span
                  className={`font-semibold text-sm truncate ${hasShapeError ? "text-red-600" : "text-ink"
                    }`}
                >
                  {type}
                </span>
                {params.multiplier && Number(params.multiplier) > 1 && (
                  <span
                    className="bg-amber-500 text-black text-xs px-1.5 py-0.5 rounded-full font-bold flex-shrink-0"
                    title={`This layer will be repeated ${params.multiplier} times`}
                  >
                    ×{params.multiplier}
                  </span>
                )}
                {hasShapeError && (
                  <AlertTriangle
                    className="h-3.5 w-3.5 flex-shrink-0 text-red-600"
                    strokeWidth={2}
                    aria-label={`Shape error: ${shapeErrorMessage}`}
                  />
                )}
              </div>

              {visibleParams.length > 0 && (
                <div className="flex gap-1 mt-2 overflow-hidden">
                  <div className="flex gap-1 flex-1 min-w-0">
                    {visibleParams
                      .slice(0, showMoreIndicator ? 2 : 3)
                      .map((param, index) => (
                        <span
                          key={index}
                          className="text-xs font-mono text-ink-muted bg-paper-raised border border-rule px-2 py-0.5 rounded-sm truncate flex-shrink-0 max-w-[80px]"
                          title={param}
                        >
                          {param}
                        </span>
                      ))}
                  </div>
                  {showMoreIndicator && (
                    <span className="text-xs font-mono text-ink-faint bg-rule-soft px-2 py-0.5 rounded-sm font-medium flex-shrink-0">
                      +{totalParams - 2} more
                    </span>
                  )}
                </div>
              )}

              {hasShapeError && shapeErrorMessage && (
                <div className="text-xs text-red-700 bg-red-50 px-2 py-1 rounded-sm border border-red-200 mt-2">
                  {shapeErrorMessage}
                </div>
              )}
            </div>
          </div>
        </PopoverTrigger>

        <PopoverContent className="w-80 bg-paper-raised border-rule" side="right" align="start">
          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium text-sm flex items-center gap-2 text-ink">
                <LayerIcon type={type} className="h-4 w-4 text-ink-muted" />
                Edit {type} Layer
              </h4>
              <p className="text-xs text-ink-muted">
                Configure the parameters for this layer.
              </p>
            </div>

            <div className="space-y-3">{formSpec.map(renderParamEditor)}</div>

            <div className="flex gap-2">
              <Button onClick={handleSave} size="sm" className="flex-1">
                Save
              </Button>
              <Button
                onClick={handleCancel}
                variant="outline"
                size="sm"
                className="flex-1 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              >
                Cancel
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {type !== "Output" && (
        <Handle
          type="source"
          position={Position.Bottom}
          className={getHandleClasses(!!hasShapeError, "!bg-green-500")}
        />
      )}
    </div>
  );
}
