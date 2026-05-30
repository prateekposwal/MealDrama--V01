import { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: React.ReactNode;
  threshold?: number;
}

type PullState = 'idle' | 'pulling' | 'ready' | 'refreshing';

export default function PullToRefresh({ onRefresh, children, threshold = 80 }: PullToRefreshProps) {
  const [pullState, setPullState] = useState<PullState>('idle');
  const [pullDistance, setPullDistance] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const pulling = useRef(false);
  const stateRef = useRef<PullState>('idle');
  const distRef = useRef(0);

  const update = useCallback((state: PullState, dist: number) => {
    stateRef.current = state;
    distRef.current = dist;
    setPullState(state);
    setPullDistance(dist);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      if (el.scrollTop > 0) return;
      startY.current = e.touches[0]!.clientY;
      pulling.current = false;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (el.scrollTop > 0) {
        update('idle', 0);
        pulling.current = false;
        return;
      }
      const delta = e.touches[0]!.clientY - startY.current;
      if (delta <= 0) {
        update('idle', 0);
        pulling.current = false;
        return;
      }
      e.preventDefault();
      pulling.current = true;
      const damped = Math.min(delta * 0.5, 120);
      update(damped > threshold ? 'ready' : 'pulling', damped);
    };

    const onTouchEnd = () => {
      if (!pulling.current) return;
      if (distRef.current > threshold && stateRef.current === 'ready') {
        update('refreshing', 0);
        setTimeout(async () => {
          try {
            await onRefresh();
          } finally {
            update('idle', 0);
          }
        }, 0);
      } else {
        update('idle', 0);
      }
      pulling.current = false;
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [onRefresh, threshold, update]);

  return (
    <div
      ref={containerRef}
      className="relative"
      style={{ height: '100dvh', overflowY: 'auto', overscrollBehavior: 'none' }}
    >
      {/* Pull indicator */}
      <div
        className="flex items-center justify-center overflow-hidden shrink-0"
        style={{ height: pullState === 'refreshing' ? 48 : Math.round(pullDistance) }}
      >
        {pullState === 'pulling' && (
          <RefreshCw
            size={20}
            className="text-gray-400 transition-all duration-200"
            style={{ transform: `rotate(${pullDistance * 2}deg)`, opacity: 0.4 + pullDistance / threshold * 0.6 }}
          />
        )}
        {pullState === 'ready' && (
          <RefreshCw size={20} className="text-[#FF385C] transition-all duration-200" style={{ transform: 'rotate(180deg)' }} />
        )}
        {pullState === 'refreshing' && (
          <RefreshCw size={20} className="text-[#FF385C] animate-spin" />
        )}
      </div>

      {children}
    </div>
  );
}
