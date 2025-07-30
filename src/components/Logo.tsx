import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <div className={cn("relative", className)}>
      {/* Animated Logo Container */}
      <div className="relative w-full h-full animate-pulse-slow">
        {/* Outer Ring Animation */}
        <div className="absolute inset-0 rounded-full border-2 border-amber-400/30 animate-spin" style={{ animationDuration: '3s' }}></div>
        
        {/* Inner Ring Animation */}
        <div className="absolute inset-1 rounded-full border border-amber-400/50 animate-spin" style={{ animationDuration: '2s', animationDirection: 'reverse' }}></div>
        
        {/* Favicon */}
        <div className="relative z-10 w-full h-full flex items-center justify-center">
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-full h-full animate-float"
          >
            {/* HuskML Logo - Simplified geometric design */}
            <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor" opacity="0.9"/>
            <path d="M2 17L12 22L22 17L12 12L2 17Z" fill="currentColor" opacity="0.7"/>
            <path d="M2 7L2 17L12 22L12 12L2 7Z" fill="currentColor" opacity="0.8"/>
            <path d="M22 7L22 17L12 22L12 12L22 7Z" fill="currentColor" opacity="0.8"/>
            
            {/* Center accent */}
            <circle cx="12" cy="12" r="2" fill="currentColor" opacity="0.6"/>
          </svg>
        </div>
        
        {/* Glow effect */}
        <div className="absolute inset-0 rounded-full bg-amber-400/10 animate-glow blur-sm"></div>
      </div>
    </div>
  );
}
