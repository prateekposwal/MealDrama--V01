import React, { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Info } from 'lucide-react';
import { useHintStore } from '../../hooks/useHintStore';
import { useFirstVisitHint } from '../../hooks/useFirstVisitHint';
import { useBackButtonClose } from '../../hooks/useBackButtonClose';
import { track } from '../../utils/analytics';

// Shared open-state: the provider's openId is the SINGLE authority for which
// bubble is live (one at a time). Backdrop / Escape / Android-back dismissal
// is centralized. A hint counts as SEEN only when the user actively dismisses
// it — displacement (another hint taking focus) never marks.
interface HintContextValue {
  openId: string | null;
  requestOpen: (id: string) => void;
  requestClose: (id: string) => void;
  registerDismiss: (id: string, fn: () => void) => void;
  unregisterDismiss: (id: string) => void;
  closeCurrent: () => void;
}

const HintContext = createContext<HintContextValue | null>(null);

export const HintProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [openId, setOpenId] = useState<string | null>(null);
  const dismissRef = useRef(new Map<string, () => void>());
  const openIdRef = useRef<string | null>(null);
  openIdRef.current = openId;

  const requestOpen = useCallback((id: string) => setOpenId(id), []);
  const requestClose = useCallback((id: string) => setOpenId(prev => (prev === id ? null : prev)), []);
  const registerDismiss = useCallback((id: string, fn: () => void) => { dismissRef.current.set(id, fn); }, []);
  const unregisterDismiss = useCallback((id: string) => { dismissRef.current.delete(id); }, []);
  const closeCurrent = useCallback(() => {
    const id = openIdRef.current;
    if (!id) return;
    dismissRef.current.get(id)?.();
  }, []);

  useBackButtonClose(openId !== null, closeCurrent);

  useEffect(() => {
    if (!openId) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeCurrent(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openId, closeCurrent]);

  const value = useMemo<HintContextValue>(() => ({
    openId, requestOpen, requestClose, registerDismiss, unregisterDismiss, closeCurrent,
  }), [openId, requestOpen, requestClose, registerDismiss, unregisterDismiss, closeCurrent]);

  return (
    <HintContext.Provider value={value}>
      {children}
      {openId && <div className="fixed inset-0 z-[90]" onClick={closeCurrent} aria-hidden="true" />}
    </HintContext.Provider>
  );
};

interface HintProps {
  id: string;
  text: string;
  trigger?: 'tap' | 'first-visit';
  placement?: 'top' | 'bottom';
  className?: string;
  anchorRef?: React.RefObject<HTMLElement | null>;
  label?: string;
  /** Controlled mode: the parent owns the bubble (e.g. chip long-press). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const Hint: React.FC<HintProps> = ({
  id, text, trigger = 'tap', placement = 'bottom', className,
  anchorRef, label, open: openProp, onOpenChange,
}) => {
  const ctx = useContext(HintContext);
  const ctxRef = useRef(ctx);
  ctxRef.current = ctx;
  const markSeen = useHintStore(s => s.markSeen);
  const firstVisit = useFirstVisitHint(id);
  const isControlled = openProp !== undefined;
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const bubbleRef = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  // The provider's openId is the single authority; active = this hint is live.
  const active = ctx?.openId === id;
  const showRequested = trigger === 'first-visit' ? firstVisit.open : isControlled ? !!openProp : active;
  const bubbleId = `hint-${id}`;

  const dismiss = useCallback(() => {
    track('hint_dismissed', { id });
    if (trigger === 'first-visit') {
      firstVisit.dismiss();
    } else {
      markSeen(id);
      if (isControlled) onOpenChange?.(false);
    }
    ctx?.requestClose(id);
  }, [trigger, firstVisit, markSeen, id, isControlled, onOpenChange, ctx]);

  // Auto-request: first-visit nudges and controlled opens claim focus only
  // when nothing else is live. (Displacement is unreachable in practice: the
  // backdrop intercepts every tap while a bubble is live.)
  useEffect(() => {
    if (!showRequested) return;
    const el = anchorRef?.current ?? triggerRef.current;
    if (!el) return;
    if (ctx?.openId === null) ctx?.requestOpen(id);
  }, [showRequested, id, anchorRef, ctx]);

  // Registered so backdrop / Escape / Android-back can dismiss this bubble.
  useEffect(() => {
    if (!active) return;
    ctx?.registerDismiss(id, dismiss);
    return () => ctx?.unregisterDismiss(id);
  }, [active, id, ctx, dismiss]);

  // Analytics: this hint became the live bubble (open moment).
  useEffect(() => {
    if (active) track('hint_open', { id });
  }, [active, id]);

  // Screen unmount with a live bubble must not leave the backdrop stuck.
  // ctxRef keeps the cleanup stable across openId changes (no open/close loop).
  useEffect(() => () => ctxRef.current?.requestClose(id), [id]);

  // aria-describedby on the anchored element while its bubble is live.
  useLayoutEffect(() => {
    const el = anchorRef?.current ?? triggerRef.current;
    if (!el) return;
    if (active) el.setAttribute('aria-describedby', bubbleId);
    else el.removeAttribute('aria-describedby');
  }, [active, id, anchorRef, bubbleId]);

  // Measure anchor + bubble, clamp inside the max-w-lg app frame, flip if tight.
  useLayoutEffect(() => {
    if (!active) return;
    const anchor = anchorRef?.current ?? triggerRef.current;
    const bubble = bubbleRef.current;
    if (!anchor || !bubble) return;
    const place = () => {
      const a = anchor.getBoundingClientRect();
      const b = bubble.getBoundingClientRect();
      const frame = Math.min(window.innerWidth, 512);
      const frameLeft = (window.innerWidth - frame) / 2;
      const frameRight = frameLeft + frame;
      const margin = 12;
      let left = a.left + a.width / 2 - b.width / 2;
      left = Math.max(frameLeft + margin, Math.min(left, frameRight - b.width - margin));
      let top: number;
      if (placement === 'top') {
        top = a.top - b.height - 8;
        if (top < margin) top = a.bottom + 8;
      } else {
        top = a.bottom + 8;
        if (top + b.height > window.innerHeight - margin && a.top - b.height - 8 > margin) {
          top = a.top - b.height - 8;
        }
      }
      setPos({ top, left });
    };
    place();
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, [active, placement, anchorRef]);

  const bubble = active && typeof document !== 'undefined' ? createPortal(
    <div
      ref={bubbleRef}
      id={bubbleId}
      role="tooltip"
      style={{ top: pos?.top ?? 0, left: pos?.left ?? 0, visibility: pos ? 'visible' : 'hidden' }}
      className="fixed z-[92] max-w-[260px] bg-gray-900 text-white rounded-2xl px-4 py-3 text-xs font-medium shadow-2xl hint-pop"
    >
      <p className="leading-snug">{text}</p>
      <div className="mt-2 flex justify-end">
        <button
          onClick={dismiss}
          className="px-3 py-1.5 rounded-lg bg-white/15 text-white text-[11px] font-bold active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
        >
          Got it
        </button>
      </div>
    </div>,
    document.body,
  ) : null;

  if (trigger === 'first-visit') {
    return (
      <>
        {bubble}
        <style>{HINT_STYLE}</style>
      </>
    );
  }

  const onTrigger = () => {
    if (active) {
      dismiss();
    } else if (isControlled) {
      onOpenChange?.(true);
      ctx?.requestOpen(id);
    } else {
      ctx?.requestOpen(id);
    }
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={onTrigger}
        aria-expanded={active}
        aria-controls={bubbleId}
        aria-label={label ?? 'Learn more'}
        className={`w-11 h-11 shrink-0 rounded-xl bg-gray-100 text-gray-500 flex items-center justify-center active:scale-90 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF385C]/50 ${className ?? ''}`}
      >
        <Info size={16} />
      </button>
      {bubble}
      <style>{HINT_STYLE}</style>
    </>
  );
};

// The codebase's `animate-in fade-in` utilities are NOT emitted by this
// Tailwind v4 setup (verified in the built CSS) — so the bubble defines its
// own keyframe in the MealCard style, with a reduced-motion guard.
const HINT_STYLE = `
  @keyframes hintFadeIn {
    from { opacity: 0; transform: translateY(4px); }
    to { opacity: 1; transform: none; }
  }
  .hint-pop { animation: hintFadeIn 0.18s ease-out; }
  @media (prefers-reduced-motion: reduce) {
    .hint-pop { animation: none !important; }
  }
`;
