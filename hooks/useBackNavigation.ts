import { useState, useRef, useCallback, useEffect } from 'react';
import { hasOpenModals, closeTopModal } from '../utils/modalStack';

export function useBackNavigation(activeTab: string, setActiveTab: (tab: string) => void, setToast: (toast: { message: string; type: 'info' | 'error' | 'success' } | null) => void) {
  const [navStack, setNavStack] = useState<string[]>([]);
  const navStackRef = useRef(navStack);
  navStackRef.current = navStack;
  const backExitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pushNav = useCallback((tab: string) => {
    setNavStack(prev => [...prev, tab]);
  }, []);

  const goBack = useCallback(() => {
    setNavStack(prev => {
      if (prev.length === 0) return prev;
      const restoredTab = prev[prev.length - 1];
      setActiveTab(restoredTab ?? 'dashboard');
      return prev.slice(0, -1);
    });
  }, [setActiveTab]);

  // Hardware back button (Capacitor Android)
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    (async () => {
      try {
        const { App } = await import('@capacitor/app');
        const handler = await App.addListener('backButton', () => {
          if (hasOpenModals()) {
            closeTopModal();
            return;
          }
          if (navStackRef.current.length > 0) {
            goBack();
            return;
          }
          if (activeTab !== 'dashboard') {
            setActiveTab('dashboard');
            return;
          }
          if (backExitTimerRef.current) {
            clearTimeout(backExitTimerRef.current);
            backExitTimerRef.current = null;
            (async () => {
              const { App } = await import('@capacitor/app');
              App.exitApp();
            })();
          } else {
            setToast({ message: 'Press back again to exit', type: 'info' });
            backExitTimerRef.current = setTimeout(() => {
              backExitTimerRef.current = null;
            }, 2000);
          }
        });
        cleanup = handler.remove;
      } catch {
        // web preview
      }
    })();
    return () => {
      cleanup?.();
      if (backExitTimerRef.current) {
        clearTimeout(backExitTimerRef.current);
        backExitTimerRef.current = null;
      }
    };
  }, [goBack, activeTab, setToast]);

  // Flush persistence stores before app goes to background
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    (async () => {
      try {
        const { App } = await import('@capacitor/app');
        const handler = await App.addListener('appStateChange', () => {});
        cleanup = handler.remove;
      } catch {}
    })();
    return () => { cleanup?.(); };
  }, []);

  return { navStack, pushNav, goBack };
}
