import { useRef, useCallback } from 'react';

const NOOP = () => {};

export function useStableCallback<T extends (...args: any[]) => any>(fn: T): T {
  const ref = useRef(fn);
  ref.current = fn;
  return useCallback((...args: any[]) => ref.current(...args), []) as unknown as T;
}

export function useNoopCallback(): () => void {
  return useRef(NOOP).current;
}
