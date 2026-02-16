/**
 * CoursePrompt - Premium course selection guide displayed in the right panel
 * 
 * Provides elegant guidance and motivation for course selection with premium UX.
 */

import { ArrowLeft, BookOpen, Target, Trophy, Zap, Brain } from "lucide-react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";

interface CoursePromptProps {
  className?: string;
}

export function CoursePrompt({ className = "" }: CoursePromptProps) {
  return (
    <div className={`flex flex-col h-full bg-gradient-to-br from-zinc-900/50 to-zinc-800/30 ${className}`}>
      {/* Header */}
      <div className="flex-shrink-0 p-6 pb-4 text-center border-b border-zinc-800/50">
        <div className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl border border-blue-500/20">
          <BookOpen className="w-8 h-8 text-blue-400" />
        </div>
        <h2 className="text-xl font-bold text-zinc-100 mb-2">
          Ready to Master Neural Networks?
        </h2>
        <p className="text-zinc-400 text-sm leading-relaxed max-w-sm mx-auto">
          Choose a guided course from the left panel to begin your journey from beginner to expert.
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Visual Guide */}
        <Card className="p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-500/20 rounded-full">
              <ArrowLeft className="w-5 h-5 text-blue-400 animate-pulse" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-blue-200 mb-1">Start Here</p>
              <p className="text-blue-300/80 text-xs">Browse courses in the left panel</p>
            </div>
          </div>
        </Card>

        {/* Premium Features */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-400" />
            Premium Learning Experience
          </h3>
          
          <div className="grid gap-3">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-zinc-800/30 border border-zinc-700/50">
              <div className="flex items-center justify-center w-8 h-8 bg-green-500/20 rounded-lg">
                <Brain className="w-4 h-4 text-green-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-zinc-200 text-sm">Interactive Learning</p>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  Real-time feedback as you build networks visually
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-zinc-800/30 border border-zinc-700/50">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-500/20 rounded-lg">
                <Target className="w-4 h-4 text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-zinc-200 text-sm">Guided Practice</p>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  Step-by-step tasks with intelligent validation
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-zinc-800/30 border border-zinc-700/50">
              <div className="flex items-center justify-center w-8 h-8 bg-purple-500/20 rounded-lg">
                <Trophy className="w-4 h-4 text-purple-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-zinc-200 text-sm">Progress Tracking</p>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  Visual progress with achievements and milestones
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Course Preview */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-zinc-200">Available Now</h3>
          <Card className="p-4 bg-gradient-to-br from-emerald-500/10 to-blue-500/10 border-emerald-500/20">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="font-semibold text-emerald-200">Neural Network 101</h4>
                <p className="text-emerald-300/80 text-xs mt-1">Perfect for beginners</p>
              </div>
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                Free
              </Badge>
            </div>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="text-center">
                <div className="font-medium text-emerald-200">2h</div>
                <div className="text-emerald-300/60">Duration</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-emerald-200">4</div>
                <div className="text-emerald-300/60">Lessons</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-emerald-200">8</div>
                <div className="text-emerald-300/60">Tasks</div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 p-6 pt-4 text-center border-t border-zinc-800/50">
        <p className="text-zinc-500 text-xs mb-3">
          World-class education, completely free
        </p>
        <div className="flex items-center justify-center gap-2 text-xs text-zinc-400">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span>Free Forever</span>
          </div>
          <div className="w-1 h-1 bg-zinc-600 rounded-full"></div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
            <span>Premium Quality</span>
          </div>
        </div>
      </div>
    </div>
  );
}
