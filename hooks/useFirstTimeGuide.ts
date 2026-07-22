import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'mealdrama_guide_sessions';
const MAX_SESSIONS = 3;

export function useFirstTimeGuide() {
  const [sessionCount, setSessionCount] = useState(() => {
    try {
      return parseInt(localStorage.getItem(STORAGE_KEY) ?? '0', 10);
    } catch {
      return 0;
    }
  });

  useEffect(() => {
    const count = sessionCount + 1;
    if (count <= MAX_SESSIONS) {
      setSessionCount(count);
      try {
        localStorage.setItem(STORAGE_KEY, String(count));
      } catch {}
    }
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dismissGuide = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(MAX_SESSIONS));
    } catch {}
    setSessionCount(MAX_SESSIONS);
  }, []);

  const showGuide = sessionCount > 0 && sessionCount <= MAX_SESSIONS;

  return { showGuide, dismissGuide, sessionCount };
}
