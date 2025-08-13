/**
 * CourseSelector - Interface for selecting and starting guided courses
 * 
 * Displays available courses with progress indicators and allows users
 * to start new courses or continue existing ones.
 */

import { useState, useEffect } from "react";
import { 
  BookOpen, 
  Clock, 
  Trophy, 
  Play, 
  RotateCcw,
  ChevronRight,
  GraduationCap,
  Target
} from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { useCourseStore } from "../lib/course-store";
import type { Course } from "../lib/course-store";

interface CourseSelectorProps {
  className?: string;
}

export function CourseSelector({ className = "" }: CourseSelectorProps) {
  const {
    availableCourses,
    userProgress,
    initializeCourses,
    startCourse,
    resetCourseProgress
  } = useCourseStore();

  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  // Initialize courses on mount
  useEffect(() => {
    initializeCourses();
  }, [initializeCourses]);

  const getDifficultyColor = (difficulty: Course['difficulty']) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'intermediate':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'advanced':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
    }
  };

  const getCourseProgress = (courseId: string) => {
    const progress = userProgress[courseId];
    if (!progress) return { progress: 0, hasStarted: false };
    
    const course = availableCourses.find(c => c.id === courseId);
    if (!course) return { progress: 0, hasStarted: false };

    const completedLessons = progress.lessonsCompleted.length;
    const totalLessons = course.lessons.length;
    const progressPercentage = Math.round((completedLessons / totalLessons) * 100);

    return {
      progress: progressPercentage,
      hasStarted: true,
      completedLessons,
      totalLessons
    };
  };

  const handleStartCourse = (courseId: string) => {
    startCourse(courseId);
  };

  const handleResetProgress = (courseId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to reset your progress for this course?')) {
      resetCourseProgress(courseId);
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  if (availableCourses.length === 0) {
    return (
      <div className={`p-6 text-center ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-zinc-400">Loading courses...</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full bg-transparent ${className}`}>
      {/* Header */}
      <div className="flex-shrink-0 p-4 pb-3 text-center border-b border-zinc-800">
        <div className="flex items-center justify-center gap-2 mb-2">
          <GraduationCap className="h-5 w-5 text-blue-400" />
          <h2 className="text-lg font-bold text-zinc-100">Guided Courses</h2>
        </div>
        <p className="text-zinc-400 text-xs leading-relaxed">
          Learn neural networks step-by-step with hands-on practice
        </p>
      </div>

      {/* Course List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {availableCourses.map((course) => {
          const progress = getCourseProgress(course.id);
          const isSelected = selectedCourse?.id === course.id;
          
          return (
            <Card
              key={course.id}
              className={`p-3 bg-zinc-900/50 border-zinc-700 hover:border-blue-500/50 transition-all duration-300 cursor-pointer ${
                isSelected ? 'border-blue-500 bg-blue-500/5 shadow-lg shadow-blue-500/10' : ''
              }`}
              onClick={() => setSelectedCourse(isSelected ? null : course)}
            >
              {/* Course Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-zinc-100">{course.title}</h3>
                    <Badge className={getDifficultyColor(course.difficulty)}>
                      {course.difficulty}
                    </Badge>
                  </div>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    {course.description}
                  </p>
                </div>
                <ChevronRight 
                  className={`h-4 w-4 text-zinc-400 transition-transform duration-200 ${
                    isSelected ? 'rotate-90' : ''
                  }`} 
                />
              </div>

              {/* Course Stats */}
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                  <Clock className="h-3 w-3 text-blue-400" />
                  <span className="font-medium">{formatDuration(course.estimatedDuration)}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                  <BookOpen className="h-3 w-3 text-green-400" />
                  <span className="font-medium">{course.lessons.length} lessons</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                  <Target className="h-3 w-3 text-purple-400" />
                  <span className="font-medium">{course.lessons.reduce((acc, lesson) => acc + lesson.tasks.length, 0)} tasks</span>
                </div>
              </div>

              {/* Progress Bar */}
              {progress.hasStarted && (
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
                    <span>Progress</span>
                    <span className="font-medium">{progress.progress}% complete</span>
                  </div>
                  <div className="relative w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-blue-400 h-2 rounded-full transition-all duration-500 ease-out relative"
                      style={{ width: `${progress.progress}%` }}
                    >
                      {progress.progress > 0 && (
                        <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full"></div>
                      )}
                    </div>
                  </div>
                  {progress.completedLessons !== undefined && (
                    <div className="text-xs text-zinc-500 mt-1">
                      {progress.completedLessons} of {progress.totalLessons} lessons completed
                    </div>
                  )}
                </div>
              )}

              {/* Expanded Content */}
              {isSelected && (
                <div className="mt-4 pt-4 border-t border-zinc-700 space-y-4 animate-fade-in">
                  {/* Course Details */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-zinc-200">What you'll learn:</h4>
                    <div className="grid gap-2">
                      {course.lessons.map((lesson, index) => (
                        <div
                          key={lesson.id}
                          className="flex items-center gap-2 text-sm text-zinc-400"
                        >
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                            progress.hasStarted && progress.completedLessons !== undefined && index < progress.completedLessons
                              ? 'bg-green-500 text-white'
                              : 'bg-zinc-700 text-zinc-400'
                          }`}>
                            {progress.hasStarted && progress.completedLessons !== undefined && index < progress.completedLessons ? (
                              <Trophy className="h-3 w-3" />
                            ) : (
                              index + 1
                            )}
                          </div>
                          <span>{lesson.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      onClick={() => handleStartCourse(course.id)}
                      size="sm"
                      className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                    >
                      <Play className="h-3.5 w-3.5" />
                      {progress.hasStarted ? 'Continue Course' : 'Start Course'}
                    </Button>
                    {progress.hasStarted && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => handleResetProgress(course.id, e)}
                        className="px-3 border-zinc-600 text-zinc-400 hover:text-red-400 hover:border-red-500 hover:bg-red-500/10"
                        title="Reset Progress"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 p-3 text-center border-t border-zinc-800">
        <p className="text-xs text-zinc-500">
          More courses coming soon! 🚀
        </p>
      </div>
    </div>
  );
}
