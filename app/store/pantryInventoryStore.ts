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
  /** Undo a mistaken log: removes the ledger event AND subtracts its
   *  quantity from the matching stock entry (entry dropped at ≤0). */
  removePurchase: (name: string, purchasedAt: string) => void;
  removeEntry: (name: string) => void;
  /** Remove one purchase event by its unique instant. Aggregate untouched. */
  removePurchaseEvent: (purchasedAt: string, name: string) => void;
  /** Remove all events + the aggregate for a name ("clear my mistake"). */
  removePurchaseByName: (name: string) => void;
  setEntry: (name: string, patch: Partial<InventoryEntry>) => void;
  clearEntries: () => void;
  clearPurchases: () => void;
}

/** Double-fire guard window (ms): an identical pack logged within this span
 *  of the previous event is treated as an accidental double-tap and ignored
 *  — protects stock totals AND the purchases history from duplicates. */
const DUPLICATE_WINDOW_MS = 1500;

export const usePantryInventoryStore = create<PantryInventoryState>()(
  persist(
    (set, get) => ({
      entries: [],
      purchaseEvents: [],

      logPurchase: (name, purchase) => {
        const clean = (name || '').trim();
        if (!clean || !(purchase.quantity > 0)) return;
        // Idempotency: drop accidental double-fires of the SAME pack
        // (same name+quantity+unit) within DUPLICATE_WINDOW_MS of the last
        // logged event — before touching stock or the ledger.
        const events = get().purchaseEvents ?? [];
        const last = events[events.length - 1];
        if (
          last &&
          last.name.toLowerCase() === clean.toLowerCase() &&
          last.quantity === purchase.quantity &&
          last.unit === purchase.unit &&
          Date.now() - Date.parse(last.purchasedAt) < DUPLICATE_WINDOW_MS
        ) {
          return;
        }
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

      removePurchase: (name, purchasedAt) => {
        const clean = (name || '').trim().toLowerCase();
        set((s) => {
          const events = s.purchaseEvents ?? [];
          const idx = events.findIndex(
            ev => ev.name.toLowerCase() === clean && ev.purchasedAt === purchasedAt,
          );
          if (idx === -1) return {};
          const ev = events[idx]!;
          // Subtract the mistaken pack from stock (same-unit entries only —
          // a different-unit row can't be converted safely, stock untouched).
          let nextEntries = s.entries;
          const entry = s.entries.find(e => e.name.toLowerCase() === clean);
          if (entry && entry.unit === ev.unit) {
            const remaining = Math.round((entry.quantity - ev.quantity) * 10) / 10;
            nextEntries = remaining > 0
              ? s.entries.map(e => (e.name.toLowerCase() === clean ? { ...e, quantity: remaining } : e))
              : s.entries.filter(e => e.name.toLowerCase() !== clean);
          }
          return {
            entries: nextEntries,
            purchaseEvents: events.filter((_, i) => i !== idx),
          };
        });
      },

      removeEntry: (name) => {
        const clean = (name || '').trim().toLowerCase();
        set(s => ({ entries: s.entries.filter(e => e.name.toLowerCase() !== clean) }));
      },

      removePurchaseEvent: (purchasedAt, name) => {
        const clean = (name || '').trim().toLowerCase();
        set(s => ({
          purchaseEvents: (s.purchaseEvents ?? []).filter(
            ev => !(ev.purchasedAt === purchasedAt && ev.name.toLowerCase() === clean),
          ),
        }));
      },

      removePurchaseByName: (name) => {
        const clean = (name || '').trim().toLowerCase();
        set(s => ({
          entries: s.entries.filter(e => e.name.toLowerCase() !== clean),
          purchaseEvents: (s.purchaseEvents ?? []).filter(e => e.name.toLowerCase() !== clean),
        }));
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

/** Display-row for a consolidated purchase line (same item+unit, summed qty). */
export interface ConsolidatedPurchaseLine {
  key: string;
  name: string;
  quantity: number;
  unit: string;
  /** First event's instant is the row's identity for delete-one. */
  purchasedAt: string;
  requestedBy?: string;
  /** How many raw events this row represents. */
  count: number;
}

/**
 * Collapse same-name+same-unit events within a day into ONE display line with
 * summed quantity (so a mistaken triple "Cauliflower 1.33pc ×3" reads as a
 * single "Cauliflower 4pc"). Raw ledger events are untouched — history stays
 * exact; only the presentation is consolidated. Pure, deterministic.
 */
export function consolidateEventsForDisplay(events: PurchaseEvent[]): ConsolidatedPurchaseLine[] {
  const byKey = new Map<string, ConsolidatedPurchaseLine>();
  for (const ev of events) {
    const key = `${ev.name.toLowerCase()}::${ev.unit.toLowerCase()}`;
    const row = byKey.get(key);
    if (row) {
      // earliest instant remains the row identity (cheapest true deletion anchor)
      row.quantity = Math.round((row.quantity + ev.quantity) * 100) / 100;
      row.count += 1;
      if (ev.purchasedAt! < row.purchasedAt!) row.purchasedAt = ev.purchasedAt;
      if (ev.requestedBy) row.requestedBy = ev.requestedBy;
    } else {
      byKey.set(key, {
        key,
        name: ev.name,
        quantity: ev.quantity,
        unit: ev.unit,
        purchasedAt: ev.purchasedAt!,
        requestedBy: ev.requestedBy,
        count: 1,
      });
    }
  }
  return Array.from(byKey.values()).sort((a, b) =>
    a.purchasedAt < b.purchasedAt ? 1 : a.purchasedAt > b.purchasedAt ? -1 : 0);
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
