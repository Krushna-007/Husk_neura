import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "./ui/dialog";
import { Laptop, Smartphone, Tablet } from "lucide-react";

export function DeviceWarning() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if device is mobile or tablet
    const checkDevice = () => {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const isTablet = /iPad|Android/i.test(navigator.userAgent) && !/Mobile/i.test(navigator.userAgent);
      return isMobile || isTablet;
    };

    setIsOpen(checkDevice());

    // Also check on resize in case of device rotation or browser window resizing
    const handleResize = () => {
      if (window.innerWidth < 1024) { // Standard laptop breakpoint
        setIsOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 p-4 sm:p-6 max-w-[95vw] sm:max-w-md mx-auto rounded-xl">
        <div className="space-y-8">
          {/* Icons with animation */}
          <div className="flex items-center justify-center gap-6 sm:gap-8 py-2">
            <div className="flex flex-col items-center gap-2">
              <Smartphone className="text-red-500 w-10 h-10 animate-pulse" />
              <span className="text-xs text-red-400">Mobile</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Tablet className="text-yellow-500 w-10 h-10" />
              <span className="text-xs text-yellow-400">Tablet</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Laptop className="text-green-500 w-10 h-10" />
              <span className="text-xs text-green-400">Desktop</span>
            </div>
          </div>
          
          <div className="space-y-4 text-center px-2">
            <h2 className="text-2xl font-semibold text-zinc-100 mb-4">
              Please Use Desktop
            </h2>
            
            <p className="text-zinc-300 text-base leading-relaxed">
              HuskML works best on desktop computers. Mobile support is limited.
            </p>

            <div className="mt-6 space-y-3">
              <p className="text-sm font-medium text-zinc-300">
                Why desktop is better:
              </p>
              <ul className="text-sm text-zinc-400 space-y-2 text-left list-none">
                <li className="flex items-center gap-2">
                  <span className="text-red-400">•</span>
                  Larger canvas for network design
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-red-400">•</span>
                  Better drag & drop support
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-red-400">•</span>
                  Precise mouse control
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-zinc-800 pt-6 space-y-3">
            <button
              onClick={() => setIsOpen(false)}
              className="w-full py-3 px-4 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 text-zinc-100 rounded-lg transition-colors duration-200 text-base font-medium touch-manipulation"
            >
              Continue Anyway
            </button>
            <p className="text-xs text-zinc-500 text-center">
              Tap anywhere outside to close
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}