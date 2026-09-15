/**
 * AchievementBadge - Premium achievement and milestone component
 * 
 * Displays beautiful achievement badges with animations for completed milestones.
 */

import { Trophy, Star, Zap, Target, CheckCircle } from "lucide-react";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  type: 'lesson' | 'course' | 'streak' | 'skill';
  icon: 'trophy' | 'star' | 'zap' | 'target' | 'check';
  color: 'gold' | 'silver' | 'bronze' | 'blue' | 'green' | 'purple';
  unlockedAt?: string;
}

interface AchievementBadgeProps {
  achievement: Achievement;
  size?: 'sm' | 'md' | 'lg';
  showDescription?: boolean;
  animated?: boolean;
  className?: string;
}

export function AchievementBadge({ 
  achievement, 
  size = 'md', 
  showDescription = false,
  animated = false,
  className = "" 
}: AchievementBadgeProps) {
  const icons = {
    trophy: Trophy,
    star: Star,
    zap: Zap,
    target: Target,
    check: CheckCircle,
  };

  const colors = {
    gold: {
      bg: 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20',
      border: 'border-yellow-300',
      icon: 'text-yellow-600',
      text: 'text-yellow-700',
      glow: 'shadow-lg shadow-yellow-500/20'
    },
    silver: {
      bg: 'bg-gradient-to-br from-zinc-400/20 to-zinc-500/20',
      border: 'border-zinc-400/30',
      icon: 'text-zinc-300',
      text: 'text-zinc-200',
      glow: 'shadow-lg shadow-zinc-400/20'
    },
    bronze: {
      bg: 'bg-gradient-to-br from-orange-600/20 to-amber-600/20',
      border: 'border-orange-300',
      icon: 'text-orange-600',
      text: 'text-orange-700',
      glow: 'shadow-lg shadow-orange-500/20'
    },
    blue: {
      bg: 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20',
      border: 'border-blue-300',
      icon: 'text-blue-600',
      text: 'text-blue-700',
      glow: 'shadow-lg shadow-blue-500/20'
    },
    green: {
      bg: 'bg-gradient-to-br from-green-500/20 to-emerald-500/20',
      border: 'border-green-300',
      icon: 'text-green-600',
      text: 'text-green-700',
      glow: 'shadow-lg shadow-green-500/20'
    },
    purple: {
      bg: 'bg-gradient-to-br from-purple-500/20 to-pink-500/20',
      border: 'border-purple-300',
      icon: 'text-purple-600',
      text: 'text-purple-700',
      glow: 'shadow-lg shadow-purple-500/20'
    },
  };

  const sizes = {
    sm: {
      container: 'w-8 h-8',
      icon: 'w-4 h-4',
      text: 'text-xs'
    },
    md: {
      container: 'w-12 h-12',
      icon: 'w-6 h-6',
      text: 'text-sm'
    },
    lg: {
      container: 'w-16 h-16',
      icon: 'w-8 h-8',
      text: 'text-base'
    }
  };

  const IconComponent = icons[achievement.icon];
  const colorScheme = colors[achievement.color];
  const sizeScheme = sizes[size];

  const isUnlocked = !!achievement.unlockedAt;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div 
        className={`
          flex items-center justify-center rounded-full border-2 transition-colors duration-150
          ${sizeScheme.container}
          ${isUnlocked 
            ? `${colorScheme.bg} ${colorScheme.border} ${colorScheme.glow}` 
            : 'bg-zinc-800/50 border-zinc-700/50'
          }
          ${animated && isUnlocked ? 'animate-pulse' : ''}
        `}
      >
        <IconComponent 
          className={`
            ${sizeScheme.icon} 
            ${isUnlocked ? colorScheme.icon : 'text-zinc-500'}
          `} 
        />
      </div>

      {showDescription && (
        <div className="flex-1 min-w-0">
          <h4 className={`font-medium ${isUnlocked ? colorScheme.text : 'text-zinc-400'} ${sizeScheme.text}`}>
            {achievement.title}
          </h4>
          <p className="text-zinc-500 text-xs leading-relaxed">
            {achievement.description}
          </p>
          {isUnlocked && achievement.unlockedAt && (
            <p className="text-zinc-600 text-xs mt-1">
              Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// Predefined achievement templates
export const achievementTemplates: Achievement[] = [
  {
    id: 'first-lesson',
    title: 'First Steps',
    description: 'Complete your first lesson',
    type: 'lesson',
    icon: 'check',
    color: 'green'
  },
  {
    id: 'course-complete',
    title: 'Course Master',
    description: 'Complete an entire course',
    type: 'course',
    icon: 'trophy',
    color: 'gold'
  },
  {
    id: 'quick-learner',
    title: 'Quick Learner',
    description: 'Complete 3 lessons in one day',
    type: 'streak',
    icon: 'zap',
    color: 'blue'
  },
  {
    id: 'neural-architect',
    title: 'Neural Architect',
    description: 'Build your first complete neural network',
    type: 'skill',
    icon: 'star',
    color: 'purple'
  }
];
