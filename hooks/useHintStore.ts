import { create } from 'zustand';

const HINT_SEEN_KEY = 'md-hint-seen-v1';

// Mirror of md-buy-assumptions (BuyByDishSheet): plain localStorage, try/catch,
// Set round-trip. Seen is written ONLY on dismissal — never on auto-show.
export function parseSeen(raw: string | null): Set<string> {
  try {
    const parsed = JSON.parse(raw ?? '[]');
    return new Set<string>(Array.isArray(parsed) ? parsed.filter(x => typeof x === 'string') : []);
  } catch {
    return new Set<string>();
  }
}

function loadSeen(): Set<string> {
  try {
    return parseSeen(window.localStorage.getItem(HINT_SEEN_KEY));
  } catch {
    return new Set<string>();
  }
}

function saveSeen(seen: Set<string>) {
  try {
    window.localStorage.setItem(HINT_SEEN_KEY, JSON.stringify([...seen]));
  } catch { /* storage unavailable */ }
}

export interface HintStore {
  seen: Set<string>;
  markSeen: (id: string) => void;
  hasSeen: (id: string) => boolean;
}

export const useHintStore = create<HintStore>((set, get) => ({
  seen: loadSeen(),
  markSeen: (id) => {
    if (get().seen.has(id)) return;
    const next = new Set(get().seen).add(id);
    saveSeen(next);
    set({ seen: next });
  },
  hasSeen: (id) => get().seen.has(id),
}));
