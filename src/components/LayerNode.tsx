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
import { Trash2 } from "lucide-react";
import { getDefaultParams, getLayerFormSpec } from "../lib/layers/parameters";
import { getLayerCategoryColors } from "../lib/categories";
import { getLayerIcon } from "../lib/layer-definitions";
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
  const icon = getLayerIcon(type);
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
            <SelectContent>
              {options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
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
      "layer-node flex flex-col px-4 py-3 rounded-xl shadow-lg border-2 transition-colors duration-200 cursor-pointer min-w-[160px] max-w-[280px] backdrop-blur-sm";

    if (hasShapeError) {
      return `${base} border-red-500 hover:border-red-600 bg-gradient-to-br from-red-900/20 to-red-800/20 animate-pulse`;
    }

    const gradientBg = categoryColors.bg.replace('bg-', 'from-').replace('/20', '/30');
    const gradientTo = categoryColors.bg.replace('bg-', 'to-').replace('/20', '/20');
    
    return `${base} ${categoryColors.border} ${categoryColors.hover} bg-gradient-to-br ${gradientBg} ${gradientTo} hover:backdrop-blur-lg`;
  };

  const getHandleClasses = (isError: boolean, color: string) =>
    `node-handle w-3 h-3 border border-zinc-800 shadow-sm rounded-full transition-colors duration-200 ${
      isError 
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
              className="absolute -top-2 -right-2 z-10 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-lg hover:shadow-xl hover:scale-110"
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
                className={`flex items-center gap-2 ${
                  visibleParams.length === 0 && !hasShapeError
                    ? "justify-center"
                    : ""
                }`}
              >
                <span className="text-base group-hover:scale-110 transition-transform duration-200 flex-shrink-0">
                  {icon}
                </span>
                <span
                  className={`font-semibold text-sm truncate ${
                    hasShapeError ? "text-red-400" : "text-zinc-200"
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
                  <span
                    className="text-red-500 text-sm font-bold flex-shrink-0"
                    title={`Shape Error: ${shapeErrorMessage}`}
                  >
                    ⚠️
                  </span>
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
                          className="text-xs text-zinc-300 bg-zinc-800/70 px-2 py-0.5 rounded-md truncate flex-shrink-0 max-w-[80px]"
                          title={param}
                        >
                          {param}
                        </span>
                      ))}
                  </div>
                  {showMoreIndicator && (
                    <span className="text-xs text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-md font-medium flex-shrink-0">
                      +{totalParams - 2} more
                    </span>
                  )}
                </div>
              )}

              {hasShapeError && shapeErrorMessage && (
                <div className="text-xs text-red-400 bg-red-900/20 px-2 py-1 rounded-md border border-red-700 mt-2">
                  {shapeErrorMessage}
                </div>
              )}
            </div>
          </div>
        </PopoverTrigger>

        <PopoverContent className="w-80 bg-zinc-900 border-zinc-800" side="right" align="start">
          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium text-sm flex items-center gap-2 text-zinc-100">
                <span>{icon}</span>
                Edit {type} Layer
              </h4>
              <p className="text-xs text-zinc-300">
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
