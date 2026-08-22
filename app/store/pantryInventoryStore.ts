// ─────────────────────────────────────────────────────────────────────────────
// PantryInventoryStore — persisted stock overlay for the pantry surplus engine.
// Keeps `pantryStaples` (flat string[]) untouched; this store adds quantities,
// units, expiry and storage per item so the forecast can do real math. P0:
// logPurchase / remove / set, with a bridge action that also feeds the legacy
// `addToPantry` dedupe path (imported lazily to avoid store cycles).
// P0 purchase-capture: an append-only purchase ledger (cap 200, oldest evicted)
// records every pack logged — the add sheet ('manual') or the one-tap bought
// gesture ('bought') — with its IST calendar day, without touching the
// aggregate `entries` math.
// ─────────────────────────────────────────────────────────────────────────────

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nativeStorage } from '../utils/nativeStorage';
import { getISODate } from '../../utils/dateUTC';
import { categoryForName, defaultExpiry, defaultStorageFor, type InventoryEntry } from '../../utils/pantryForecast';
import type { IngredientCategory } from '../../meal/constants/dishLibrary';

/** Purchase-ledger cap: keep the 200 most recent events, evict the oldest. */
const PURCHASE_EVENT_CAP = 200;

export type PurchaseSource = 'manual' | 'bought' | 'restock';

/** One append-only row in the purchase ledger. */
export interface PurchaseEvent {
  id?: string;
  name: string;
  quantity: number;
  unit: string;
  /** ISO-UTC instant of the purchase (e.g. 2026-08-21T20:00:00.000Z). */
  purchasedAt: string;
  /** IST calendar day the purchase happened on (e.g. 2026-08-22). */
  boughtOn: string;
  source: PurchaseSource;
  /** P2: household "cook buys" attribution — member/cook name who asked for it. */
  requestedBy?: string;
}

interface NewPurchase {
  quantity: number;
  unit: string;
  expiry?: string;
  category?: IngredientCategory;
  storage?: 'fridge' | 'freezer' | 'pantry';
  /** 'manual' (add sheet) by default; 'bought' from the one-tap gesture. */
  source?: PurchaseSource;
  /** P2: stamped onto the ledger row when the caller knows the member. */
  requestedBy?: string;
}

interface PantryInventoryState {
  entries: InventoryEntry[];
  purchaseEvents: PurchaseEvent[];
  logPurchase: (name: string, purchase: NewPurchase) => void;
  removeEntry: (name: string) => void;
  setEntry: (name: string, patch: Partial<InventoryEntry>) => void;
  clearEntries: () => void;
  clearPurchases: () => void;
}

export const usePantryInventoryStore = create<PantryInventoryState>()(
  persist(
    (set) => ({
      entries: [],
      purchaseEvents: [],

      logPurchase: (name, purchase) => {
        const clean = (name || '').trim();
        if (!clean || !(purchase.quantity > 0)) return;
        set((s) => {
          const existing = s.entries.find(e => e.name.toLowerCase() === clean.toLowerCase());
          let next: InventoryEntry[];
          // One "now" per call: IST calendar day drives aggregates + the
          // ledger's boughtOn; the raw instant drives purchasedAt.
          const purchasedAt = new Date();
          const now = getISODate(purchasedAt);
          // P2: classify the item and default storage + expiry when the caller
          // gave none — every logged pack gets a category, a storage spot and
          // a use-by date (pure UTC math via defaultExpiry).
          const category = purchase.category ?? categoryForName(clean);
          const storage = purchase.storage ?? defaultStorageFor(category);
          const expiry = purchase.expiry ?? defaultExpiry(now, category, storage);
          if (existing) {
            next = s.entries.map(e => {
              if (e.name.toLowerCase() !== clean.toLowerCase()) return e;
              const sameUnit = e.unit === purchase.unit;
              return {
                ...e,
                // Same item+unit re-stock adds to the pack; different unit keeps both rows.
                ...(sameUnit
                  ? { quantity: Math.round((e.quantity + purchase.quantity) * 10) / 10 }
                  : {}),
                expiry,
                category,
                storage,
                addedAt: now,
              };
            });
          } else {
            const entry: InventoryEntry = {
              name: clean,
              quantity: purchase.quantity,
              unit: purchase.unit,
              addedAt: now,
              expiry,
              category,
              storage,
            };
            next = [...s.entries, entry];
          }
          // P0 purchase capture: append-only ledger, oldest evicted past the cap.
          const purchaseEvents: PurchaseEvent[] = [
            ...(s.purchaseEvents ?? []),
            {
              name: clean,
              quantity: purchase.quantity,
              unit: purchase.unit,
              purchasedAt: purchasedAt.toISOString(),
              boughtOn: now,
              source: purchase.source ?? 'manual',
              requestedBy: purchase.requestedBy,
            },
          ];
          if (purchaseEvents.length > PURCHASE_EVENT_CAP) {
            purchaseEvents.splice(0, purchaseEvents.length - PURCHASE_EVENT_CAP);
          }
          return { entries: next, purchaseEvents };
        });
      },

      removeEntry: (name) => {
        const clean = (name || '').trim().toLowerCase();
        set(s => ({ entries: s.entries.filter(e => e.name.toLowerCase() !== clean) }));
      },

      setEntry: (name, patch) => {
        const clean = (name || '').trim().toLowerCase();
        set(s => ({
          entries: s.entries.map(e => (e.name.toLowerCase() === clean ? { ...e, ...patch } : e)),
        }));
      },

      clearEntries: () => set({ entries: [] }),
      clearPurchases: () => set({ purchaseEvents: [] }),
    }),
    {
      name: 'mealdrama-pantry-inventory',
      storage: nativeStorage,
    }
  )
);

/** One rolled-up purchase day: every ledger event captured on the same IST day. */
export interface PurchaseDayGroup {
  boughtOn: string;
  events: PurchaseEvent[];
}

/**
 * Group purchase events by IST day (boughtOn), newest day first; events within
 * a day are newest-first by their UTC instant. `capGroups` bounds the day count
 * so the history strip stays compact. Pure — no store access, deterministic.
 */
export function groupPurchasesByDay(events: PurchaseEvent[], capGroups = 5): PurchaseDayGroup[] {
  const byDay = new Map<string, PurchaseEvent[]>();
  for (const ev of events) {
    const list = byDay.get(ev.boughtOn);
    if (list) list.push(ev);
    else byDay.set(ev.boughtOn, [ev]);
  }
  return Array.from(byDay.entries())
    .map(([boughtOn, evs]) => ({
      boughtOn,
      events: [...evs].sort((a, b) =>
        a.purchasedAt < b.purchasedAt ? 1 : a.purchasedAt > b.purchasedAt ? -1 : 0),
    }))
    .sort((a, b) => (a.boughtOn < b.boughtOn ? 1 : a.boughtOn > b.boughtOn ? -1 : 0))
    .slice(0, capGroups);
}

/** Bridge: also mark the name present in the legacy pantryStaples dedupe list. */
export function bridgeToPantryStaples(names: string[]): void {
  if (!names || !names.length) return;
  try {
    // Lazy require avoids a store import cycle at module load.
    const { useStore } = require('../store/useStore');
    useStore.getState().addToPantry?.(names);
  } catch {
    /* ignored — legacy path is optional */
  }
}
