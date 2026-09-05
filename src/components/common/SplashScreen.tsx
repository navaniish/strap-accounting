import React, { useState, useEffect } from 'react';
import { Sparkles, ShieldCheck } from 'lucide-react';

export const SplashScreen: React.FC = () => {
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const [isFading, setIsFading] = useState<boolean>(false);

  useEffect(() => {
    // Start fade-out transition after 2 seconds
    const fadeTimer = setTimeout(() => {
      setIsFading(true);
    }, 2000);

    // Completely unmount splash component after transition finishes (2.7s total)
    const removeTimer = setTimeout(() => {
      setIsVisible(false);
    }, 2700);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div 
      onClick={() => {
        setIsFading(true);
        setTimeout(() => setIsVisible(false), 500);
      }}
      className={`fixed inset-0 z-50 bg-trust-950 text-white flex flex-col items-center justify-between p-8 selection:bg-none select-none cursor-pointer transition-all duration-700 ease-in-out ${
        isFading ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Top Header Branding */}
      <div className="pt-8 flex items-center space-x-2 text-xs font-bold text-sapphire-400 uppercase tracking-widest animate-fade-in">
        <ShieldCheck className="w-4 h-4 text-growth-400" />
        <span>GenZ Mobile Platform</span>
      </div>

      {/* Center Hero Splash Image with Pulse Zoom & Glow Effects */}
      <div className="flex flex-col items-center justify-center space-y-6 max-w-sm text-center px-4">
        
        <div className="relative group">
          {/* Outer Sapphire Glow Ring */}
          <div className="absolute -inset-4 bg-gradient-to-r from-sapphire-600 via-growth-500 to-sapphire-600 rounded-3xl blur-xl opacity-60 animate-pulse" />
          
          {/* Main Splash Image Container */}
          <div className="relative w-44 h-44 sm:w-52 sm:h-52 rounded-3xl overflow-hidden border-2 border-sapphire-400/40 shadow-2xl bg-trust-900 flex items-center justify-center">
            <img 
              src="/splash.jpeg" 
              alt="GenZ Mobile Splash" 
              className="w-full h-full object-cover transform scale-105 hover:scale-110 transition-transform duration-1000"
            />
          </div>
        </div>

        {/* Title & Subtitle */}
        <div className="space-y-1.5 animate-slide-up">
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            GenZ
          </h1>
          <p className="text-xs text-trust-300 font-medium">
            Fashion & Footwear Shop Management
          </p>
        </div>

        {/* Animated Loading Bar */}
        <div className="w-48 h-1.5 bg-trust-800 rounded-full overflow-hidden relative">
          <div className="h-full bg-gradient-to-r from-sapphire-500 via-growth-400 to-sapphire-500 rounded-full w-full animate-pulse" />
        </div>

      </div>

      {/* Bottom Footer Note */}
      <div className="pb-6 text-[10px] text-trust-400 font-mono tracking-wider flex items-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5 text-sapphire-400" />
        <span>Initializing Realtime Workspace • Tap to Skip</span>
      </div>

    </div>
  );
};
