// Household kitchen: ONE shared stock ledger + persisted member lanes.
// Not persisted locally (derived from server); refreshed with the household feed.
import { create } from 'zustand';
import { householdKitchenApi, HouseholdStockLine, MemberLaneSnapshot } from '../../app/utils/householdKitchenApi';

export interface HouseholdKitchenState {
  stock: Record<string, HouseholdStockLine>;
  assumptions: Record<string, 'have' | 'notHave'>;
  lanes: MemberLaneSnapshot[];
  lastError: string | null;
  refresh: (householdId: string) => Promise<void>;
  addPurchase: (householdId: string, name: string, quantity: number, unit: string) => Promise<void>;
  setAssumption: (householdId: string, name: string, flag: 'have' | 'notHave' | null, memberId?: string) => Promise<void>;
  saveLane: (householdId: string, memberId: string, snapshot: unknown) => Promise<void>;
}

export function linesToMap(lines: HouseholdStockLine[]): Record<string, HouseholdStockLine> {
  const m: Record<string, HouseholdStockLine> = {};
  for (const l of lines) m[`${l.name.toLowerCase()}|${(l.unit ?? '').toLowerCase()}`] = l;
  return m;
}

export const useHouseholdKitchenStore = create<HouseholdKitchenState>((set, get) => ({
  stock: {},
  assumptions: {},
  lanes: [],
  lastError: null,

  refresh: async (householdId: string) => {
    if (!householdId) return;
    try {
      const [stock, assumptions, lanes] = await Promise.all([
        householdKitchenApi.getStock(householdId),
        householdKitchenApi.getAssumptions(householdId),
        householdKitchenApi.getLanes(householdId),
      ]);
      const a: Record<string, 'have' | 'notHave'> = {};
      for (const x of assumptions) a[x.name.toLowerCase()] = x.flag;
      set({ stock: linesToMap(stock), assumptions: a, lanes, lastError: null });
    } catch (e: any) {
      set({ lastError: e?.message ?? 'kitchen unavailable' });
    }
  },

  addPurchase: async (householdId, name, quantity, unit) => {
    try {
      const updated = await householdKitchenApi.addStock(householdId, name, quantity, unit);
      const key = `${name.toLowerCase()}|${(unit ?? '').toLowerCase()}`;
      set(s => ({
        stock: {
          ...s.stock,
          [key]: { name: updated.name, quantity: updated.quantity, unit: updated.unit, purchasedBy: updated.purchasedBy },
        },
      }));
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('family:refresh'));
    } catch {
      // next poll reconciles
    }
  },

  setAssumption: async (householdId, name, flag, memberId) => {
    try {
      await householdKitchenApi.putAssumption(householdId, name, flag);
      const k = name.toLowerCase();
      set(s => {
        const next = { ...s.assumptions };
        if (flag) next[k] = flag; else delete next[k];
        return { assumptions: next };
      });
    } catch {
      // next poll reconciles
    }
  },

  saveLane: async (householdId, memberId, snapshot) => {
    try {
      await householdKitchenApi.putLane(householdId, memberId, snapshot);
    } catch {
      // best-effort — regeneration still works client-side
    }
  },
}));