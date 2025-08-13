import React from 'react';
import { Trophy, Share2, RotateCcw, ExternalLink, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { useCourseStore } from '../lib/course-store';

interface CourseCompletionProps {
  className?: string;
}

export function CourseCompletion({ className = "" }: CourseCompletionProps) {
  const { currentCourse, resetCourseProgress, exitCourse } = useCourseStore();

  if (!currentCourse || !currentCourse.completed) {
    return null;
  }

  const handleLinkedInShare = () => {
    const courseTitle = encodeURIComponent(currentCourse.title);
    const text = encodeURIComponent(
      `🎉 Just completed "${currentCourse.title}" on BlockDL! Built my first neural network from scratch and learned AI fundamentals. Excited to dive deeper into machine learning! #AI #MachineLearning #NeuralNetworks #BlockDL`
    );
    const url = encodeURIComponent(window.location.origin);
    
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}&text=${text}`;
    window.open(linkedInUrl, '_blank', 'width=600,height=400');
  };

  const handleTwitterShare = () => {
    const text = encodeURIComponent(
      `🎉 Just completed "${currentCourse.title}" on @BlockDL! Built my first neural network from scratch 🧠✨ #AI #MachineLearning #NeuralNetworks`
    );
    const url = encodeURIComponent(window.location.origin);
    
    const twitterUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');
  };

  const handleRestart = () => {
    if (currentCourse) {
      resetCourseProgress(currentCourse.id);
      // Restart the course
      window.location.reload(); // Simple way to reset state
    }
  };

  const completionTime = currentCourse.completedAt ? new Date(currentCourse.completedAt).toLocaleDateString() : 'Today';

  return (
    <div className={`flex flex-col h-full ${className}`}>
      <div className="flex-1 overflow-y-auto p-6">
        {/* Celebration Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full mb-4 animate-bounce">
            <Trophy className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Congratulations! 🎉
          </h1>
          <p className="text-zinc-300 text-lg">
            You've successfully completed <span className="text-blue-400 font-semibold">{currentCourse.title}</span>
          </p>
          <p className="text-zinc-400 text-sm mt-2">
            Completed on {completionTime}
          </p>
        </div>

        {/* Achievement Summary */}
        <Card className="bg-zinc-800/50 border-zinc-700 mb-6">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-400" />
              What You've Accomplished
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span className="text-zinc-300">Built a complete neural network</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-zinc-300">Learned AI fundamentals</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                <span className="text-zinc-300">Mastered layer connections</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                <span className="text-zinc-300">Configured parameters correctly</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Share Section */}
        <Card className="bg-zinc-800/50 border-zinc-700 mb-6">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Share2 className="h-5 w-5 text-blue-400" />
              Share Your Achievement
            </h3>
            <p className="text-zinc-400 text-sm mb-4">
              Help us build more amazing courses by sharing your success! Your support helps us create better AI education for everyone.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleLinkedInShare}
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white flex-1"
              >
                <ExternalLink className="h-4 w-4" />
                Share on LinkedIn
              </Button>
              <Button
                onClick={handleTwitterShare}
                className="flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-600 text-white flex-1"
              >
                <ExternalLink className="h-4 w-4" />
                Share on Twitter
              </Button>
            </div>
          </div>
        </Card>

        {/* Next Steps */}
        <Card className="bg-zinc-800/50 border-zinc-700">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">What's Next?</h3>
            <div className="space-y-3 text-zinc-300">
              <p>🚀 <strong>Keep Learning:</strong> Try building more complex networks with different architectures</p>
              <p>🔬 <strong>Experiment:</strong> Modify parameters and see how they affect your network's performance</p>
              <p>📚 <strong>Advanced Topics:</strong> Explore convolutional networks, RNNs, and transformer architectures</p>
              <p>🤝 <strong>Community:</strong> Join AI communities and share your projects</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="border-t border-zinc-700 p-4 bg-zinc-900/50">
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleRestart}
            variant="outline"
            className="flex items-center justify-center gap-2 border-zinc-600 text-zinc-300 hover:bg-zinc-800 flex-1"
          >
            <RotateCcw className="h-4 w-4" />
            Restart Course
          </Button>
          <Button
            onClick={exitCourse}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white flex-1"
          >
            Explore More Courses
          </Button>
        </div>
      </div>
    </div>
  );
}
