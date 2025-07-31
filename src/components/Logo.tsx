import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <img 
      src="/logo_Husk.svg" 
      alt="HuskML Logo" 
      className={cn("w-full h-full", className)}
    />
  );
}
