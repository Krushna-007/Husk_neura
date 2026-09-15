/**
 * LessonViewer - Blog-style lesson content viewer with task validation
 * 
 * Displays lesson content in a readable format with integrated task
 * validation and progress tracking.
 */

import { useState, useEffect, useRef } from "react";
import { 
  CheckCircle, 
  Circle, 
  Clock, 
  ChevronLeft, 
  ChevronRight,
  BookOpen,
  Target,
  Lightbulb,
  ArrowRight,
  Trophy,
  X
} from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { useCourseStore } from "../lib/course-store";
import { useFlowStore } from "../lib/flow-store";
import type { CourseTask } from "../lib/course-store";
import ReactMarkdown from "react-markdown";
import { CourseCompletion } from "./CourseCompletion";

interface LessonViewerProps {
  className?: string;
}



export function LessonViewer({ className = "" }: LessonViewerProps) {
  const {
    currentCourse,
    currentLesson,
    selectLesson,
    completeTask,
    updateReadingProgress,
    getTaskValidationResults,
    getNextLesson,
    canProgressToNextLesson,
    toggleLessonViewer,
    saveCanvasState,
    restoreCanvasState
  } = useCourseStore();

  const { nodes, edges, setNodes, setEdges } = useFlowStore();
  const contentRef = useRef<HTMLDivElement>(null);
  const [showHints, setShowHints] = useState<Record<string, boolean>>({});
  const [taskValidation, setTaskValidation] = useState<Record<string, boolean>>({});

  // Auto-scroll to top when lesson changes
  useEffect(() => {
    if (currentLesson && contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [currentLesson?.id]);

  // Restore canvas state when course is started
  useEffect(() => {
    if (currentCourse && nodes.length === 0) {
      const savedState = restoreCanvasState();
      if (savedState) {
        setNodes(savedState.nodes);
        setEdges(savedState.edges);
      }
    }
  }, [currentCourse?.id, nodes.length, restoreCanvasState, setNodes, setEdges]);

  // Update task validation when canvas changes
  useEffect(() => {
    if (currentLesson && nodes.length > 0) {
      console.log('🔍 Validating tasks with current canvas state:', {
        nodes: nodes.length,
        edges: edges.length,
        lesson: currentLesson.title
      });
      
      const results = getTaskValidationResults(nodes, edges);
      setTaskValidation(results);
      
      // Auto-complete tasks when validation passes
      Object.entries(results).forEach(([taskId, isValid]) => {
        if (isValid) {
          const task = currentLesson.tasks.find(t => t.id === taskId);
          if (task && !task.completed) {
            console.log('✅ Auto-completing task:', task.title);
            // Save canvas state before completing task
            saveCanvasState(nodes, edges);
            completeTask(taskId);
          }
        }
      });
    }
  }, [nodes, edges, currentLesson, getTaskValidationResults, completeTask, saveCanvasState]);

  // Track reading progress
  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current) return;

      const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
      const progress = Math.min(100, Math.round((scrollTop / (scrollHeight - clientHeight)) * 100));
      
      if (progress > 0) {
        updateReadingProgress(progress);
      }
    };

    const contentElement = contentRef.current;
    if (contentElement) {
      contentElement.addEventListener('scroll', handleScroll);
      return () => contentElement.removeEventListener('scroll', handleScroll);
    }
  }, [updateReadingProgress]);

  const toggleHints = (taskId: string) => {
    setShowHints(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };

  const handleNextLesson = () => {
    const nextLesson = getNextLesson();
    if (nextLesson) {
      selectLesson(nextLesson.id);
    }
  };

  const handlePreviousLesson = () => {
    if (!currentCourse || !currentLesson) return;

    const currentIndex = currentCourse.lessons.findIndex(l => l.id === currentLesson.id);
    const previousLesson = currentCourse.lessons[currentIndex - 1];
    
    if (previousLesson) {
      selectLesson(previousLesson.id);
    }
  };

  const getLessonProgress = () => {
    if (!currentLesson) return { completed: 0, total: 0 };
    
    const completedTasks = currentLesson.tasks.filter(task => task.completed).length;
    return {
      completed: completedTasks,
      total: currentLesson.tasks.length
    };
  };

  const renderTaskCard = (task: CourseTask) => {
    const isCompleted = task.completed;
    const isValid = taskValidation[task.id] || false;
    const shouldShowHints = showHints[task.id] || false;

    return (
      <Card
        key={task.id}
        className={`p-4 transition-colors duration-150 ${
          isCompleted 
            ? 'bg-green-50 border-green-300 shadow-lg shadow-green-500/5' 
            : isValid 
              ? 'bg-blue-50 border-blue-300 shadow-lg shadow-blue-500/5 animate-pulse' 
              : 'bg-zinc-800/50 border-zinc-700'
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="mt-1">
            {isCompleted ? (
              <CheckCircle className="h-5 w-5 text-green-400" />
            ) : isValid ? (
              <CheckCircle className="h-5 w-5 text-blue-400 animate-pulse" />
            ) : (
              <Circle className="h-5 w-5 text-zinc-400" />
            )}
          </div>
          
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-zinc-100">{task.title}</h4>
              <Badge 
                variant="outline" 
                className={`text-xs ${
                  isCompleted 
                    ? 'border-green-300 text-green-400'
                    : isValid
                      ? 'border-blue-300 text-blue-400'
                      : 'border-zinc-600 text-zinc-400'
                }`}
              >
                {isCompleted ? 'Completed' : isValid ? 'Completing...' : 'Pending'}
              </Badge>
            </div>
            
            <p className="text-sm text-zinc-300 leading-relaxed">
              {task.description}
            </p>

            {/* Requirements */}
            <div className="space-y-1">
              {task.requirements.map((req, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-2 text-xs text-zinc-400"
                >
                  <div className="w-1 h-1 rounded-full bg-zinc-500" />
                  <span>{req.description}</span>
                </div>
              ))}
            </div>

            {/* Task Completion Indicator */}
            {isValid && !isCompleted && (
              <div className="mt-2 p-2 bg-blue-50 border border-blue-300 rounded-md">
                <div className="flex items-center gap-2 text-xs text-blue-300 font-medium">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span>✨ Task requirements met! Auto-completing...</span>
                </div>
              </div>
            )}



            {/* Hints */}
            {task.hints.length > 0 && !isCompleted && (
              <div className="mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleHints(task.id)}
                  className="text-xs border-zinc-600 text-zinc-400 hover:text-yellow-400 hover:border-yellow-500"
                >
                  <Lightbulb className="h-3 w-3 mr-1" />
                  {shouldShowHints ? 'Hide' : 'Show'} Hints
                </Button>
                
                {shouldShowHints && (
                  <div className="mt-2 p-3 bg-yellow-50 border border-yellow-300 rounded-md">
                    <div className="space-y-1">
                      {task.hints.map((hint, index) => (
                        <div 
                          key={index}
                          className="flex items-start gap-2 text-xs text-yellow-200"
                        >
                          <span className="text-yellow-400 mt-0.5">💡</span>
                          <span>{hint}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  };

  if (!currentCourse || !currentLesson) {
    return (
      <div className={`p-6 text-center ${className}`}>
        <BookOpen className="h-12 w-12 text-zinc-400 mx-auto mb-4" />
        <p className="text-zinc-400">No lesson selected</p>
        <p className="text-sm text-zinc-500 mt-1">Choose a course to get started</p>
      </div>
    );
  }

  // Show course completion if course is completed
  if (currentCourse.completed) {
    return <CourseCompletion className={className} />;
  }

  const progress = getLessonProgress();
  const currentLessonIndex = currentCourse.lessons.findIndex(l => l.id === currentLesson.id);
  const canGoNext = canProgressToNextLesson() && getNextLesson() !== null;
  const canGoPrevious = currentLessonIndex > 0;

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-zinc-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleLessonViewer}
              className="border-zinc-600 text-zinc-400 hover:text-zinc-200"
            >
              <X className="h-4 w-4" />
            </Button>
            <h2 className="font-semibold text-zinc-100">{currentLesson.title}</h2>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <Clock className="h-4 w-4" />
            <span>{currentLesson.estimatedTime}m</span>
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Lesson Progress</span>
            <span className="font-medium">{progress.completed} of {progress.total} tasks completed</span>
          </div>
          <div className="relative w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-colors duration-150 ease-out relative"
              style={{ width: `${(progress.completed / progress.total) * 100}%` }}
            >
              {progress.completed > 0 && (
                <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full"></div>
              )}
            </div>
          </div>
          {progress.completed === progress.total && (
            <div className="flex items-center justify-center gap-1 text-xs text-green-400 font-medium mt-2">
              <CheckCircle className="h-3 w-3" />
              <span>All tasks completed! 🎉</span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div 
        ref={contentRef}
        className="flex-1 overflow-y-auto p-6 space-y-6"
      >
        {/* Lesson Content */}
        <div className="prose prose-invert prose-sm max-w-none">
          <ReactMarkdown
            components={{
              h1: ({ children }) => (
                <h1 className="text-2xl font-bold text-zinc-100 mb-4 pb-2 border-b border-zinc-700">
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-xl font-semibold text-zinc-200 mt-6 mb-3">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-lg font-medium text-zinc-300 mt-4 mb-2">
                  {children}
                </h3>
              ),
              p: ({ children }) => (
                <p className="text-zinc-300 leading-relaxed mb-4">
                  {children}
                </p>
              ),
              ul: ({ children }) => (
                <ul className="list-disc list-inside text-zinc-300 space-y-1 mb-4 ml-4">
                  {children}
                </ul>
              ),
              li: ({ children }) => (
                <li className="text-zinc-300">
                  {children}
                </li>
              ),
              strong: ({ children }) => (
                <strong className="font-semibold text-zinc-100">
                  {children}
                </strong>
              ),
              code: ({ children }) => (
                <code className="px-1.5 py-0.5 bg-zinc-800 text-zinc-200 rounded text-sm">
                  {children}
                </code>
              )
            }}
          >
            {currentLesson.content}
          </ReactMarkdown>
        </div>

        {/* Tasks Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pt-4 border-t border-zinc-700">
            <Target className="h-5 w-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-zinc-100">Tasks</h3>
            <Badge variant="outline" className="border-zinc-600 text-zinc-400">
              {progress.completed} / {progress.total}
            </Badge>
          </div>
          
          <div className="space-y-3">
            {currentLesson.tasks.map(renderTaskCard)}
          </div>
        </div>

        {/* Completion Message */}
        {progress.completed === progress.total && (
          <Card className="p-6 bg-green-50 border-green-300 text-center">
            <Trophy className="h-8 w-8 text-green-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-green-400 mb-2">
              Lesson Complete! 🎉
            </h3>
            <p className="text-zinc-300 mb-4">
              Great job! You've completed all tasks for this lesson.
            </p>
            {canGoNext && (
              <Button
                onClick={handleNextLesson}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Continue to Next Lesson
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </Card>
        )}
      </div>

      {/* Navigation Footer */}
      <div className="flex-shrink-0 p-4 border-t border-zinc-800">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviousLesson}
            disabled={!canGoPrevious}
            className="border-zinc-600 text-zinc-400 hover:text-zinc-200 disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>

          <div className="text-xs text-zinc-500">
            Lesson {currentLessonIndex + 1} of {currentCourse.lessons.length}
          </div>

          <Button
            size="sm"
            onClick={handleNextLesson}
            disabled={!canGoNext}
            className="disabled:opacity-50"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
