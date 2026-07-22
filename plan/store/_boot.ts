// ESM bootstrap — breaks circular dependency between useTrayStore and useLoopStore.
// Not using import/export of the stores themselves; just a mutable ref.
// 💡 var avoids TDZ in circular ESM imports; let/const would throw.

import type { StoreApi } from 'zustand/vanilla';

var _trayStore: StoreApi<unknown> | null = null;
export function getTrayStore<T>(): StoreApi<T> {
  return _trayStore as StoreApi<T>;
}
export function injectTrayStore(s: StoreApi<unknown>) {
  _trayStore = s;
}
