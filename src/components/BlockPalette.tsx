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
      `🔄 BlockPalette updateData: ${types.length} types, ${categories.length} categories, ${allTemplates.length} templates`
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
      className={`space-y-6 p-6 h-full overflow-y-auto bg-transparent ${className}`}
    >
      {/* Course Mode Indicator */}
      {isCourseMode && currentLesson && (
        <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
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
      <div className="flex space-x-2">
        <button
          onClick={() => setActiveTab(CONFIG.TABS.LAYERS)}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 hover-lift ${
            activeTab === CONFIG.TABS.LAYERS
              ? "bg-transparent border-2 border-blue-500 text-blue-400 shadow-[0_0_10px_-3px_rgba(59,130,246,0.5)] animate-pulse"
              : "bg-transparent border-2 border-blue-500/30 text-blue-400/70 hover:border-blue-400 hover:text-blue-300 hover:shadow-[0_0_10px_-3px_rgba(59,130,246,0.3)]"
          }`}
        >
          <Layers className="h-4 w-4" />
          Layers
        </button>
        <button
          onClick={() => setActiveTab(CONFIG.TABS.TEMPLATES)}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 hover-lift ${
            activeTab === CONFIG.TABS.TEMPLATES
              ? "bg-transparent border-2 border-purple-500 text-purple-400 shadow-[0_0_10px_-3px_rgba(168,85,247,0.5)] animate-pulse"
              : "bg-transparent border-2 border-purple-500/30 text-purple-400/70 hover:border-purple-400 hover:text-purple-300 hover:shadow-[0_0_10px_-3px_rgba(168,85,247,0.3)]"
          }`}
        >
          <Grid3X3 className="h-4 w-4" />
          Templates
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-pulse ${
          activeTab === CONFIG.TABS.LAYERS
            ? "text-blue-400 shadow-[0_0_10px_-1px_rgba(59,130,246,0.5)]"
            : "text-purple-400 shadow-[0_0_10px_-1px_rgba(168,85,247,0.5)]"
        }`} />
        <Input
          type="text"
          placeholder={
            activeTab === CONFIG.TABS.LAYERS
              ? "Search layers..."
              : "Search templates..."
          }
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
                        className={`pl-10 pr-10 bg-transparent border-2 text-zinc-100 placeholder:text-zinc-400 focus:ring-2 focus:border-transparent backdrop-blur-sm transition-all duration-200 ${
                          activeTab === CONFIG.TABS.LAYERS 
                            ? "border-blue-500/50 focus:ring-blue-500/50 shadow-[0_0_10px_-3px_rgba(59,130,246,0.5)]"
                            : "border-purple-500/50 focus:ring-purple-500/50 shadow-[0_0_10px_-3px_rgba(168,85,247,0.5)]"
                        }`}
        />
        {searchTerm && (
          <button
            onClick={clearSearch}
            className={`absolute right-3 top-1/2 transform -translate-y-1/2 transition-colors duration-200 ${
              activeTab === CONFIG.TABS.LAYERS
                ? "text-blue-400/70 hover:text-blue-300"
                : "text-purple-400/70 hover:text-purple-300"
            }`}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {templatesRestricted ? (
        <div className="text-center py-8 text-zinc-400 animate-fade-in">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-purple-500/10 rounded-full border border-purple-500/20">
            <GraduationCap className="h-8 w-8 text-purple-400" />
          </div>
          <h3 className="text-zinc-200 font-medium mb-2">Templates Not Available</h3>
          <p className="text-sm text-zinc-400 leading-relaxed max-w-sm mx-auto mb-4">
            Templates are limited during guided lessons. Focus on building with individual layers to master the fundamentals.
          </p>
          <div className="text-xs text-purple-300/70 bg-purple-500/10 rounded-lg p-3 max-w-xs mx-auto">
            💡 Complete the course to unlock all templates
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
        <div className="space-y-6">
          {activeTab === CONFIG.TABS.LAYERS
            ? // Layers View
              filteredCategories.map((category, index) => (
                <div key={category.name} className="space-y-3 animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                  <h3
                    className={`text-sm font-medium ${category.textColor} border-b border-zinc-700 pb-1`}
                  >
                    {category.name}
                  </h3>
                  <div className="space-y-2">
                    {category.layers.map((layer: LayerType, layerIndex: number) => (
                      <div
                        key={layer.type}
                        className={`cursor-move transition-all duration-300 hover:scale-[1.02] hover-lift animate-scale-in ${category.borderColor} rounded-xl border-2 p-3 backdrop-blur-sm bg-transparent shadow-[0_0_10px_-3px_rgba(245,158,11,0.3)]`}
                        style={{ 
                          cursor: CONFIG.DRAG_CURSOR.GRAB,
                          animationDelay: `${(index * 0.1) + (layerIndex * 0.05)}s`
                        }}
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
                          <span className="text-base">{layer.icon}</span>
                          <span className="font-medium text-sm">
                            {layer.type}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-300 leading-relaxed">
                          {layer.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            : // Templates View
              Object.values(templatesByCategory).map((categoryData, index) => (
                <div key={categoryData.category} className="space-y-3 animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                  <h3
                    className={`text-sm font-medium ${categoryData.textColor} border-b border-zinc-700 pb-1 flex items-center gap-2`}
                  >
                    <span>{categoryData.icon}</span>
                    {categoryData.name}
                  </h3>
                  <div className="space-y-2">
                    {categoryData.templates.map((template, templateIndex) => (
                      <div
                        key={template.id}
                        className={`cursor-move transition-all duration-300 hover:scale-[1.02] hover-lift animate-scale-in ${categoryData.borderColor} rounded-xl border-2 p-3 backdrop-blur-sm bg-transparent`}
                        style={{ 
                          cursor: CONFIG.DRAG_CURSOR.GRAB,
                          animationDelay: `${(index * 0.1) + (templateIndex * 0.05)}s`
                        }}
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
                          <span className="text-base">{template.icon}</span>
                          <span className="font-medium text-sm">
                            {template.name}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-300 leading-relaxed mb-2">
                          {template.description}
                        </p>
                        <div className="flex gap-1 flex-wrap">
                          {template.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="text-xs px-2 py-1 bg-zinc-700/50 text-zinc-200 rounded-full border border-zinc-600/50 backdrop-blur-sm"
                            >
                              {tag}
                            </span>
                          ))}
                          {template.tags.length > 3 && (
                            <span className="text-xs px-2 py-1 bg-zinc-700/50 text-zinc-200 rounded-full border border-zinc-600/50 backdrop-blur-sm">
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



