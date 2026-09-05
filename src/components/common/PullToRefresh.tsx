import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { RefreshCw, CheckCircle2 } from 'lucide-react';

interface PullToRefreshProps {
  children: React.ReactNode;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({ children }) => {
  const { refreshData, darkMode } = useApp();
  const [pullDistance, setPullDistance] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [refreshSuccess, setRefreshSuccess] = useState<boolean>(false);

  const startYRef = useRef<number>(0);
  const isPullingRef = useRef<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const THRESHOLD = 70; // drag distance required to trigger refresh

  const handleTouchStart = (e: React.TouchEvent) => {
    const targetEl = containerRef.current || (e.currentTarget as HTMLElement);
    const mainEl = targetEl.querySelector('main') || targetEl.querySelector('.overflow-y-auto') || targetEl;
    const scrollTop = mainEl ? mainEl.scrollTop : window.scrollY;

    if (scrollTop <= 5) {
      startYRef.current = e.touches[0].clientY;
      isPullingRef.current = true;
    } else {
      isPullingRef.current = false;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPullingRef.current || isRefreshing) return;
    const currentY = e.touches[0].clientY;
    const dy = currentY - startYRef.current;

    if (dy > 0) {
      const dampened = Math.min(dy * 0.45, 110);
      setPullDistance(dampened);
    } else {
      setPullDistance(0);
    }
  };

  const handleTouchEnd = async () => {
    if (!isPullingRef.current) return;
    isPullingRef.current = false;

    if (pullDistance >= THRESHOLD && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(THRESHOLD);
      try {
        await refreshData();
        setRefreshSuccess(true);
        setTimeout(() => setRefreshSuccess(false), 1200);
      } catch (err) {
        console.warn('Pull-to-refresh failed:', err);
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  };

  const pullRatio = Math.min(pullDistance / THRESHOLD, 1);
  const rotationAngle = pullRatio * 360;

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative min-h-full w-full max-w-full flex-1 flex flex-col"
    >
      {/* Drag-to-Refresh Indicator Banner at Top */}
      {(pullDistance > 0 || isRefreshing || refreshSuccess) && (
        <div
          style={{
            height: isRefreshing ? `${THRESHOLD}px` : `${pullDistance}px`,
            transition: isPullingRef.current ? 'none' : 'height 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
          className={`overflow-hidden flex items-center justify-center transition-all ${
            darkMode ? 'bg-slate-900/90 border-b border-slate-800' : 'bg-white/95 border-b border-trust-200 shadow-sm'
          } backdrop-blur-md sticky top-0 z-50`}
        >
          <div className="flex items-center space-x-2.5 px-4 py-2 rounded-full border border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-xs">
            {refreshSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-500 animate-bounce" />
                <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">Data Synchronized!</span>
              </>
            ) : (
              <>
                <RefreshCw
                  style={{ transform: isRefreshing ? 'none' : `rotate(${rotationAngle}deg)` }}
                  className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`}
                />
                <span>
                  {isRefreshing
                    ? 'Refreshing GenZ Store Data...'
                    : pullDistance >= THRESHOLD
                    ? 'Release to Refresh Now ↑'
                    : 'Pull Down to Refresh ↓'}
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {children}
    </div>
  );
};
