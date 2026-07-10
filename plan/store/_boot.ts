// ESM bootstrap — breaks circular dependency between useTrayStore and useLoopStore.
// Not using import/export of the stores themselves; just a mutable ref.
// 💡 var avoids TDZ in circular ESM imports; let/const would throw.

var _trayStore: any = null;
export function getTrayStore() { return _trayStore; }
export function injectTrayStore(s: any) { _trayStore = s; }
