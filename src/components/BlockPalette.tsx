import { useState, useEffect, useCallback } from "react";
import { Search, X, Layers, Grid3X3, GraduationCap } from "lucide-react";
import { Input } from "./ui/input";
import { useCourseStore } from "../lib/course-store";
// Layer and Category type definitions
interface LayerType {
  type: string;
  description: string;
  icon: string;
}

interface CategoryType {
  key: string;
  name: string;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  description: string;
  layerTypes: string[];
}
import type { NetworkTemplate } from "../lib/templates";
import { getLayerTypes } from "../lib/layer-definitions";
import { LayerIcon, CategoryIcon, TemplateIcon } from "../lib/layer-icons";
import { getLayerCategories } from "../lib/categories";
import {
  getAllTemplates,
  templateCategories,
  getTemplateCategoryColors,
} from "../lib/templates";


const CONFIG = {
  TABS: {
    LAYERS: "layers",
    TEMPLATES: "templates",
  },
  POLLING_INTERVAL: 100,
  DRAG_CURSOR: {
    GRAB: "grab",
    GRABBING: "grabbing",
  },
} as const;

interface BlockPaletteProps {
  className?: string;
}

interface TemplatesByCategory {
  [key: string]: {
    category: string;
    name: string;
    color: string;
    bgColor: string;
    borderColor: string;
    textColor: string;
    hoverColor: string;
    description: string;
    icon: string;
    templates: NetworkTemplate[];
  };
}

// Drag-and-drop interface for React Flow
export default function BlockPalette({
  className = "",
}: BlockPaletteProps = {}) {
  const [activeTab, setActiveTab] = useState<string>(CONFIG.TABS.LAYERS);
  const [layerTypes, setLayerTypes] = useState<LayerType[]>([]);
  const [layerCategories, setLayerCategories] = useState<CategoryType[]>([]);
  const [templates, setTemplates] = useState<NetworkTemplate[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Course store for filtering layers based on current lesson
  const {
    isCourseMode,
    currentLesson,
    getCurrentAllowedLayers
  } = useCourseStore();

  const updateData = useCallback(() => {
    const types = getLayerTypes();
    const categories = getLayerCategories();
    const allTemplates = getAllTemplates();

    console.log(
      `BlockPalette updateData: ${types.length} types, ${categories.length} categories, ${allTemplates.length} templates`
    );

    setLayerTypes(types);
    setLayerCategories(categories);
    setTemplates(allTemplates);
  }, []);

  const handleDragStart = useCallback(
    (event: React.DragEvent, layerType: string) => {
      event.dataTransfer.setData("layerType", layerType);
      event.dataTransfer.setData("application/reactflow", "default");
      event.dataTransfer.effectAllowed = "move";
    },
    []
  );

  const handleTemplateDragStart = useCallback(
    (event: React.DragEvent, templateId: string) => {
      event.dataTransfer.setData("templateId", templateId);
      event.dataTransfer.setData("application/reactflow", "template");
      event.dataTransfer.effectAllowed = "move";
    },
    []
  );

  const clearSearch = useCallback(() => setSearchTerm(""), []);

  useEffect(() => {
    updateData();

    // Poll until data loads (YAML loading is async)
    const interval = setInterval(() => {
      const currentTypes = getLayerTypes();
      const currentCategories = getLayerCategories();
      const currentTemplates = getAllTemplates();

      if (
        currentTypes.length > 0 &&
        currentCategories.length > 0 &&
        currentTemplates.length > 0 &&
        (currentTypes.length !== layerTypes.length ||
          currentCategories.length !== layerCategories.length ||
          currentTemplates.length !== templates.length)
      ) {
        updateData();
        clearInterval(interval);
      }
    }, CONFIG.POLLING_INTERVAL);

    return () => clearInterval(interval);
  }, [layerTypes.length, layerCategories.length, templates.length, updateData]);

  // Get allowed layers for current lesson (if in course mode)
  const allowedLayers = isCourseMode ? getCurrentAllowedLayers() : [];

  // Filter layers by search term and course restrictions
  const filteredCategories = layerCategories
    .map((category) => {
      const matchingLayers = layerTypes.filter(
        (layer) => {
          // Check if layer is in category
          const inCategory = category.layerTypes.includes(layer.type);

          // Check search term match
          const searchMatch = layer.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
            layer.description.toLowerCase().includes(searchTerm.toLowerCase());

          // Check course restrictions (if in course mode)
          const courseAllowed = !isCourseMode || allowedLayers.length === 0 || allowedLayers.includes(layer.type);

          return inCategory && searchMatch && courseAllowed;
        }
      );

      return { ...category, layers: matchingLayers };
    })
    .filter((category) => category.layers.length > 0);

  // Group templates by category and filter by search term and course restrictions
  const templatesByCategory: TemplatesByCategory = {};

  Object.entries(templateCategories).forEach(([key, category]) => {
    let categoryTemplates = templates.filter(
      (template) =>
        template.category === key &&
        (searchTerm === "" ||
          template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          template.description
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          template.tags.some((tag) =>
            tag.toLowerCase().includes(searchTerm.toLowerCase())
          ))
    );

    // Filter templates based on course mode - only show relevant templates
    if (isCourseMode && allowedLayers.length > 0) {
      categoryTemplates = categoryTemplates.filter(template => {
        // Check if template uses only allowed layers
        // This is a simplified check - in a real implementation, you'd parse the template structure
        const templateLayers = template.tags || [];
        return templateLayers.some(tag => allowedLayers.includes(tag)) ||
          allowedLayers.some(layer => template.name.toLowerCase().includes(layer.toLowerCase()));
      });
    }

    if (categoryTemplates.length > 0) {
      const colors = getTemplateCategoryColors(key);
      templatesByCategory[key] = {
        category: key,
        name: category.name,
        color: category.color,
        bgColor: colors.bg,
        borderColor: colors.border,
        textColor: colors.text,
        hoverColor: colors.hover,
        description: category.description,
        icon: category.icon,
        templates: categoryTemplates,
      };
    }
  });

  // Check if templates are restricted in course mode
  const templatesRestricted = isCourseMode && allowedLayers.length > 0 &&
    activeTab === CONFIG.TABS.TEMPLATES && Object.keys(templatesByCategory).length === 0;

  const hasNoResults =
    (activeTab === CONFIG.TABS.LAYERS
      ? filteredCategories.length === 0
      : Object.keys(templatesByCategory).length === 0) && searchTerm;

  return (
    <div
      className={`flex h-full flex-col gap-4 overflow-y-auto bg-transparent p-4 ${className}`}
    >
      {/* Course Mode Indicator */}
      {isCourseMode && currentLesson && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-300 rounded-md">
          <div className="flex items-center gap-2 mb-1">
            <GraduationCap className="h-4 w-4 text-blue-400" />
            <span className="text-sm font-medium text-blue-300">Course Mode</span>
          </div>
          <p className="text-xs text-blue-200">
            {currentLesson.title}
          </p>
          {allowedLayers.length > 0 && (
            <p className="text-xs text-blue-300/70 mt-1">
              Only lesson layers available ({allowedLayers.length} types)
            </p>
          )}
        </div>
      )}

      {/* Tab Navigation */}
      <div
        role="tablist"
        className="flex gap-1 rounded-md bg-rule-soft p-1"
      >
        {[
          { id: CONFIG.TABS.LAYERS, label: "Layers", Icon: Layers },
          { id: CONFIG.TABS.TEMPLATES, label: "Templates", Icon: Grid3X3 },
        ].map(({ id, label, Icon }) => {
          const selected = activeTab === id;
          return (
            <button
              key={id}
              role="tab"
              aria-selected={selected}
              onClick={() => setActiveTab(id)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-sm px-3 py-1.5 text-[13px] font-medium transition-colors duration-150 ease-out-soft ${
                selected
                  ? "bg-paper-raised text-ink shadow-sm"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
              {label}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" strokeWidth={1.75} />
        <Input
          type="text"
          placeholder={
            activeTab === CONFIG.TABS.LAYERS
              ? "Search layers..."
              : "Search templates..."
          }
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="h-9 rounded-md border border-rule bg-paper-raised pl-9 pr-9 text-[13px] text-ink placeholder:text-ink-faint transition-colors duration-150 ease-out-soft focus-visible:border-brand"
        />
        {searchTerm && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint transition-colors duration-150 ease-out-soft hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {templatesRestricted ? (
        <div className="text-center py-8 text-zinc-400 animate-fade-in">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-purple-50 rounded-full border border-purple-300">
            <GraduationCap className="h-8 w-8 text-purple-400" />
          </div>
          <h3 className="text-zinc-200 font-medium mb-2">Templates Not Available</h3>
          <p className="text-sm text-zinc-400 leading-relaxed max-w-sm mx-auto mb-4">
            Templates are limited during guided lessons. Focus on building with individual layers to master the fundamentals.
          </p>
          <div className="mx-auto max-w-xs rounded-md border border-rule bg-paper-raised p-3 text-xs text-ink-muted">
            Complete the course to unlock all templates
          </div>
        </div>
      ) : hasNoResults ? (
        <div className="text-center py-8 text-zinc-400 animate-fade-in">
          <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>
            No {activeTab === CONFIG.TABS.LAYERS ? "layers" : "templates"} found
            matching "{searchTerm}"
          </p>
        </div>
      ) : (
        activeTab === CONFIG.TABS.LAYERS
          ? filteredCategories.length === 0
          : Object.keys(templatesByCategory).length === 0
      ) ? (
        <div className="text-center py-8 text-zinc-400 animate-fade-in">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-500 mx-auto mb-2"></div>
          <p>
            Loading {activeTab === CONFIG.TABS.LAYERS ? "layers" : "templates"}
            ...
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {activeTab === CONFIG.TABS.LAYERS
            ? // Layers View
            filteredCategories.map((category) => (
              <div key={category.name} className="space-y-1.5">
                <h3
                  className={`flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider ${category.textColor} border-b border-rule pb-1.5`}
                >
                  <CategoryIcon categoryKey={category.key} className="h-3.5 w-3.5 flex-shrink-0" />
                  {category.name}
                </h3>
                <div className="space-y-1.5">
                  {category.layers.map((layer: LayerType) => (
                    <div
                      key={layer.type}
                      className={`cursor-grab ${category.borderColor} rounded-md border bg-paper-raised px-3 py-2.5 transition-colors duration-150 ease-out-soft hover:border-brand`}
                      style={{ cursor: CONFIG.DRAG_CURSOR.GRAB }}
                      draggable
                      onDragStart={(event) =>
                        handleDragStart(event, layer.type)
                      }
                      onMouseDown={(e) =>
                      (e.currentTarget.style.cursor =
                        CONFIG.DRAG_CURSOR.GRABBING)
                      }
                      onMouseUp={(e) =>
                      (e.currentTarget.style.cursor =
                        CONFIG.DRAG_CURSOR.GRAB)
                      }
                    >
                      <div
                        className={`flex items-center gap-2 mb-1 ${category.textColor}`}
                      >
                        <LayerIcon type={layer.type} className="h-4 w-4 flex-shrink-0" />
                        <span className="font-medium text-sm">
                          {layer.type}
                        </span>
                      </div>
                      <p className="text-xs text-ink-muted leading-relaxed">
                        {layer.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))
            : // Templates View
            Object.values(templatesByCategory).map((categoryData) => (
              <div key={categoryData.category} className="space-y-1.5">
                <h3
                  className={`flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider ${categoryData.textColor} border-b border-rule pb-1.5`}
                >
                  <TemplateIcon categoryKey={categoryData.category} className="h-3.5 w-3.5 flex-shrink-0" />
                  {categoryData.name}
                </h3>
                <div className="space-y-1.5">
                  {categoryData.templates.map((template) => (
                    <div
                      key={template.id}
                      className={`cursor-grab ${categoryData.borderColor} rounded-md border bg-paper-raised px-3 py-2.5 transition-colors duration-150 ease-out-soft hover:border-brand`}
                      style={{ cursor: CONFIG.DRAG_CURSOR.GRAB }}
                      draggable
                      onDragStart={(event) =>
                        handleTemplateDragStart(event, template.id)
                      }
                      onMouseDown={(e) =>
                      (e.currentTarget.style.cursor =
                        CONFIG.DRAG_CURSOR.GRABBING)
                      }
                      onMouseUp={(e) =>
                      (e.currentTarget.style.cursor =
                        CONFIG.DRAG_CURSOR.GRAB)
                      }
                    >
                      <div
                        className={`flex items-center gap-2 mb-1 ${categoryData.textColor}`}
                      >
                        <TemplateIcon categoryKey={template.category} className="h-4 w-4 flex-shrink-0" />
                        <span className="font-medium text-sm">
                          {template.name}
                        </span>
                      </div>
                      <p className="mb-2 text-xs leading-relaxed text-ink-muted">
                        {template.description}
                      </p>
                      <div className="flex gap-1 flex-wrap">
                        {template.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-sm border border-rule bg-paper px-1.5 py-0.5 font-mono text-[11px] text-ink-muted"
                          >
                            {tag}
                          </span>
                        ))}
                        {template.tags.length > 3 && (
                          <span className="rounded-sm border border-rule bg-paper px-1.5 py-0.5 font-mono text-[11px] text-ink-muted">
                            +{template.tags.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}



