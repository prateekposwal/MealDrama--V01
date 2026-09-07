import { useState, useEffect, useCallback, useRef } from 'react';
import { useHintStore } from './useHintStore';

// Once-per-session auto-nudge: the first time a screen (placement) mounts and
// the hint is unseen, open it. Never re-opens in the same session; NEVER marks
// seen on auto-show — dismissal (close/dismiss) is the only path to seen.
const sessionShown = new Set<string>();

export function useFirstVisitHint(id: string) {
  const markSeen = useHintStore(s => s.markSeen);
  const [open, setOpen] = useState(false);
  const openRef = useRef(open);
  openRef.current = open;

  useEffect(() => {
    if (useHintStore.getState().hasSeen(id)) return;
    const t = setTimeout(() => {
      if (sessionShown.has(id) || openRef.current) return;
      sessionShown.add(id);
      setOpen(true);
    }, 600);
    return () => clearTimeout(t);
  }, [id]);

  const close = useCallback(() => setOpen(false), []);
  const dismiss = useCallback(() => {
    setOpen(false);
    markSeen(id);
  }, [id, markSeen]);

  return { open, close, dismiss };
}
