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
  const scrollerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const pulling = useRef(false);
  const stateRef = useRef<PullState>('idle');
  const distRef = useRef(0);
  const heightRef = useRef(0);

  const update = useCallback((state: PullState, dist: number) => {
    stateRef.current = state;
    distRef.current = dist;
    setPullState(state);
    setPullDistance(dist);
  }, []);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const onTouchStart = (e: TouchEvent) => {
      if (scroller.scrollTop > 0 || stateRef.current === 'refreshing') return;
      startY.current = e.touches[0]!.clientY;
      pulling.current = false;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (stateRef.current === 'refreshing') return;
      const delta = e.touches[0]!.clientY - startY.current;
      if (scroller.scrollTop > 0 || delta <= 0) {
        update('idle', 0);
        pulling.current = false;
        return;
      }
      const damped = Math.min(delta * 0.5, 120);
      heightRef.current = damped;
      pulling.current = true;
      update(damped > threshold ? 'ready' : 'pulling', damped);
    };

    const onTouchEnd = () => {
      if (!pulling.current) return;
      if (distRef.current > threshold && stateRef.current === 'ready') {
        update('refreshing', 0);
        heightRef.current = 0;
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

    scroller.addEventListener('touchstart', onTouchStart, { passive: true });
    scroller.addEventListener('touchmove', onTouchMove, { passive: true });
    scroller.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      scroller.removeEventListener('touchstart', onTouchStart);
      scroller.removeEventListener('touchmove', onTouchMove);
      scroller.removeEventListener('touchend', onTouchEnd);
    };
  }, [onRefresh, threshold, update]);

  return (
    <div
      ref={scrollerRef}
      style={{
        height: 'calc(100dvh - 80px - env(safe-area-inset-bottom, 0px))',
        overflowY: 'auto',
        overscrollBehavior: 'none',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      <div
        className="flex items-center justify-center overflow-hidden shrink-0"
        style={{
          height: pullState === 'refreshing' ? 48 : Math.round(pullDistance),
          transition: pullState === 'idle' ? 'height 0.35s cubic-bezier(0.22, 1, 0.36, 1)' : 'none',
        }}
      >
        {pullState === 'pulling' && (
          <RefreshCw
            size={20}
            className="text-gray-400"
            style={{
              transform: `rotate(${pullDistance * 2}deg)`,
              opacity: 0.4 + pullDistance / threshold * 0.6,
              transition: 'transform 0.1s linear, opacity 0.1s linear',
            }}
          />
        )}
        {pullState === 'ready' && (
          <RefreshCw size={20} className="text-[#FF385C]" style={{ transform: 'rotate(180deg)' }} />
        )}
        {pullState === 'refreshing' && (
          <RefreshCw size={20} className="text-[#FF385C] animate-spin" />
        )}
      </div>
      {children}
    </div>
  );
}
