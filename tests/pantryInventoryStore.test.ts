import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { usePantryInventoryStore, groupPurchasesByDay, consolidateEventsForDisplay } from '../app/store/pantryInventoryStore';
import type { PurchaseEvent } from '../app/store/pantryInventoryStore';
import { defaultExpiry } from '../utils/pantryForecast';

// Days between two ISO dates (pure UTC).
const dayDiff = (a: string, b: string): number =>
  Math.round((new Date(b + 'T00:00:00Z').getTime() - new Date(a + 'T00:00:00Z').getTime()) / 86400000);

// IST boundary pair — the store's "today" must be IST, not the device/UTC day:
//   2026-08-21T20:00:00Z = 2026-08-22 01:30 IST (next IST day)
//   2026-08-21T18:00:00Z = 2026-08-21 23:30 IST (same IST day)
const LATE_IST = new Date('2026-08-21T20:00:00Z');
const EARLY_IST = new Date('2026-08-21T18:00:00Z');

describe('pantryInventoryStore.logPurchase — P2 auto defaults', () => {
  beforeEach(() => {
    // Fixed clock keeps every assertion deterministic (no live new Date()).
    vi.useFakeTimers();
    vi.setSystemTime(LATE_IST);
    usePantryInventoryStore.getState().clearEntries();
    usePantryInventoryStore.getState().clearPurchases();
  });
  afterEach(() => vi.useRealTimers());

  it('auto-classifies category + storage when none given (Milk → dairy/fridge)', () => {
    usePantryInventoryStore.getState().logPurchase('Milk', { quantity: 1000, unit: 'ml' });
    const e = usePantryInventoryStore.getState().entries[0]!;
    expect(e.category).toBe('dairy');
    expect(e.storage).toBe('fridge');
  });

  it('auto-expiry: dairy entry gets an expiry ~3 days out (pure UTC math)', () => {
    usePantryInventoryStore.getState().logPurchase('Milk', { quantity: 1000, unit: 'ml', category: 'dairy' });
    const e = usePantryInventoryStore.getState().entries[0]!;
    expect(e.expiry).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(e.expiry).toBe(defaultExpiry(e.addedAt, 'dairy')); // dairy → 3 days
    expect(dayDiff(e.addedAt, e.expiry!)).toBe(3);
  });

  it('explicit expiry wins over the auto default', () => {
    usePantryInventoryStore.getState().logPurchase('Milk', {
      quantity: 500, unit: 'ml', category: 'dairy', expiry: '2026-09-01',
    });
    expect(usePantryInventoryStore.getState().entries[0]!.expiry).toBe('2026-09-01');
  });

  it('grain pack defaults to pantry storage with a long shelf life', () => {
    usePantryInventoryStore.getState().logPurchase('Atta', { quantity: 5, unit: 'kg' });
    const e = usePantryInventoryStore.getState().entries[0]!;
    expect(e.category).toBe('grains');
    expect(e.storage).toBe('pantry');
    expect(dayDiff(e.addedAt, e.expiry!)).toBe(365);
  });

  it('re-stock of the same item refreshes expiry from today', () => {
    usePantryInventoryStore.getState().logPurchase('Milk', { quantity: 500, unit: 'ml' });
    const first = usePantryInventoryStore.getState().entries[0]!;
    usePantryInventoryStore.getState().logPurchase('Milk', { quantity: 500, unit: 'ml' });
    const second = usePantryInventoryStore.getState().entries[0]!;
    expect(second.quantity).toBe(1000);
    expect(second.expiry).toBe(defaultExpiry(second.addedAt, 'dairy'));
    expect(second.category).toBe('dairy');
    expect(first.name).toBe(second.name);
  });
});

describe('pantryInventoryStore.purchase ledger — P0 IST + append-only', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    usePantryInventoryStore.getState().clearEntries();
    usePantryInventoryStore.getState().clearPurchases();
  });
  afterEach(() => vi.useRealTimers());

  it('TZ boundary 01:30 IST: addedAt is the IST day (Aug 22), expiry Aug 25 — not the UTC day', () => {
    vi.setSystemTime(LATE_IST); // 2026-08-21T20:00:00Z
    usePantryInventoryStore.getState().logPurchase('Milk', { quantity: 1000, unit: 'ml', category: 'dairy' });
    const e = usePantryInventoryStore.getState().entries[0]!;
    expect(e.addedAt).toBe('2026-08-22');
    expect(e.expiry).toBe('2026-08-25'); // 22 + 3 dairy days
  });

  it('TZ boundary 23:30 IST: addedAt stays the same IST day (Aug 21)', () => {
    vi.setSystemTime(EARLY_IST); // 2026-08-21T18:00:00Z
    usePantryInventoryStore.getState().logPurchase('Milk', { quantity: 1000, unit: 'ml', category: 'dairy' });
    expect(usePantryInventoryStore.getState().entries[0]!.addedAt).toBe('2026-08-21');
  });

  it('ledger: two purchases of the same item+unit → 2 events, aggregate summed', () => {
    vi.setSystemTime(LATE_IST);
    usePantryInventoryStore.getState().logPurchase('Milk', { quantity: 500, unit: 'ml' });
    usePantryInventoryStore.getState().logPurchase('Milk', { quantity: 500, unit: 'ml' });
    const s = usePantryInventoryStore.getState();
    expect(s.purchaseEvents).toHaveLength(2);
    expect(s.purchaseEvents[0]!.name).toBe('Milk');
    expect(s.purchaseEvents[0]!.quantity).toBe(500);
    expect(s.purchaseEvents[1]!.quantity).toBe(500);
    expect(s.entries[0]!.quantity).toBe(1000);
    // add-sheet path (no source passed) defaults to 'manual'
    expect(s.purchaseEvents.every(ev => ev.source === 'manual')).toBe(true);
  });

  it('ledger: bought gesture tags its event with source=bought', () => {
    vi.setSystemTime(LATE_IST);
    usePantryInventoryStore.getState().logPurchase('Onion', { quantity: 5, unit: 'pc', source: 'bought' });
    const ev = usePantryInventoryStore.getState().purchaseEvents[0]!;
    expect(ev.source).toBe('bought');
    expect(ev.name).toBe('Onion');
    expect(ev.quantity).toBe(5);
    expect(ev.unit).toBe('pc');
  });

  it('boughtOn is the IST day, purchasedAt is the UTC instant (Aug 22 01:30 IST case)', () => {
    vi.setSystemTime(LATE_IST);
    usePantryInventoryStore.getState().logPurchase('Milk', { quantity: 1000, unit: 'ml', category: 'dairy' });
    const ev = usePantryInventoryStore.getState().purchaseEvents[0]!;
    expect(ev.boughtOn).toBe('2026-08-22');
    expect(ev.purchasedAt).toBe('2026-08-21T20:00:00.000Z');
  });

  it('ledger cap: >200 events evicts the oldest, aggregate untouched', () => {
    vi.setSystemTime(LATE_IST);
    const s = usePantryInventoryStore.getState();
    s.logPurchase('A', { quantity: 1, unit: 'g' }); // oldest — will be evicted
    for (let i = 0; i < 205; i++) {
      s.logPurchase('B', { quantity: 1, unit: 'g' });
    }
    const st = usePantryInventoryStore.getState();
    expect(st.purchaseEvents).toHaveLength(200);
    expect(st.purchaseEvents[0]!.name).toBe('B'); // 'A' dropped from the ledger
    expect(st.purchaseEvents.some(ev => ev.name === 'A')).toBe(false);
    // aggregates were never touched by ledger eviction
    expect(st.entries.find(e => e.name === 'B')!.quantity).toBe(205);
    expect(st.entries.find(e => e.name === 'A')!.quantity).toBe(1);
  });
});


describe('pantryInventoryStore — P2 requestedBy attribution', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(LATE_IST);
    usePantryInventoryStore.getState().clearEntries();
    usePantryInventoryStore.getState().clearPurchases();
  });
  afterEach(() => vi.useRealTimers());

  it('requestedBy is preserved on the ledger row when passed', () => {
    usePantryInventoryStore.getState().logPurchase('Onion', {
      quantity: 5, unit: 'pc', source: 'bought', requestedBy: 'Prateek',
    });
    const ev = usePantryInventoryStore.getState().purchaseEvents[0]!;
    expect(ev.requestedBy).toBe('Prateek');
    expect(ev.source).toBe('bought');
  });

  it('requestedBy stays undefined when not passed', () => {
    usePantryInventoryStore.getState().logPurchase('Onion', { quantity: 5, unit: 'pc', source: 'bought' });
    expect(usePantryInventoryStore.getState().purchaseEvents[0]!.requestedBy).toBeUndefined();
  });

  it('manual add-sheet path also carries requestedBy when given', () => {
    usePantryInventoryStore.getState().logPurchase('Atta', { quantity: 5, unit: 'kg', requestedBy: 'Roommate' });
    expect(usePantryInventoryStore.getState().purchaseEvents[0]!.requestedBy).toBe('Roommate');
  });

  it('one-tap re-buy path: re-stock sums the aggregate + appends a new ledger event', () => {
    usePantryInventoryStore.getState().logPurchase('Milk', { quantity: 500, unit: 'ml', source: 'bought' });
    usePantryInventoryStore.getState().logPurchase('Milk', { quantity: 500, unit: 'ml', source: 'bought' });
    const s = usePantryInventoryStore.getState();
    expect(s.purchaseEvents).toHaveLength(2);
    expect(s.entries.find(e => e.name === 'Milk')!.quantity).toBe(1000);
    expect(s.purchaseEvents.every(ev => ev.source === 'bought')).toBe(true);
  });
});

describe('groupPurchasesByDay — P2 history grouping', () => {
  const ev = (name: string, boughtOn: string, purchasedAt: string, source: PurchaseEvent['source'] = 'bought'): PurchaseEvent =>
    ({ name, quantity: 1, unit: 'g', purchasedAt, boughtOn, source });

  it('collapses multiple events on the same IST day into one group, newest-first inside', () => {
    const groups = groupPurchasesByDay([
      ev('Milk', '2026-08-22', '2026-08-22T06:00:00.000Z'),
      ev('Onion', '2026-08-22', '2026-08-22T10:00:00.000Z'),
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0]!.boughtOn).toBe('2026-08-22');
    expect(groups[0]!.events.map(e => e.name)).toEqual(['Onion', 'Milk']);
  });

  it('sorts day groups newest-first and honors the group cap', () => {
    const groups = groupPurchasesByDay([
      ev('F', '2026-08-25', '2026-08-25T06:00:00.000Z'),
      ev('E', '2026-08-24', '2026-08-24T06:00:00.000Z'),
      ev('D', '2026-08-23', '2026-08-23T06:00:00.000Z'),
      ev('C', '2026-08-22', '2026-08-22T06:00:00.000Z'),
      ev('B', '2026-08-21', '2026-08-21T06:00:00.000Z'),
      ev('A', '2026-08-20', '2026-08-20T06:00:00.000Z'),
    ], 3);
    expect(groups.map(g => g.boughtOn)).toEqual(['2026-08-25', '2026-08-24', '2026-08-23']);
  });

  it('default cap is 5 groups', () => {
    const days = ['2026-08-20', '2026-08-21', '2026-08-22', '2026-08-23', '2026-08-24', '2026-08-25'];
    const groups = groupPurchasesByDay(days.map((d, i) => ev(String(i), d, d + 'T06:00:00.000Z')));
    expect(groups).toHaveLength(5);
  });

  it('is source-agnostic — caller filters bought/manual before grouping', () => {
    const groups = groupPurchasesByDay([ev('Salt', '2026-08-22', '2026-08-22T06:00:00.000Z', 'restock')]);
    expect(groups).toHaveLength(1);
    expect(groups[0]!.events[0]!.source).toBe('restock');
  });

  it('preserves requestedBy through grouping', () => {
    const withReq = { ...ev('Onion', '2026-08-22', '2026-08-22T06:00:00.000Z'), requestedBy: 'Prateek' };
    const groups = groupPurchasesByDay([withReq]);
    expect(groups[0]!.events[0]!.requestedBy).toBe('Prateek');
  });

  it('handles an empty ledger', () => {
    expect(groupPurchasesByDay([])).toEqual([]);
  });

describe('pantryInventoryStore — delete/remove (fill the mistake-gap)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(LATE_IST);
    usePantryInventoryStore.setState({ entries: [], purchaseEvents: [] });
  });
  afterEach(() => {
    vi.useRealTimers();
    usePantryInventoryStore.setState({ entries: [], purchaseEvents: [] });
  });

  it('removePurchaseEvent deletes ONE event without touching the aggregate', () => {
    vi.setSystemTime(new Date('2026-08-21T20:00:00Z'));
    usePantryInventoryStore.getState().logPurchase('Cauliflower', { quantity: 1.33, unit: 'pc' });
    vi.setSystemTime(new Date('2026-08-21T20:00:01Z'));
    usePantryInventoryStore.getState().logPurchase('Cauliflower', { quantity: 1.33, unit: 'pc' });
    expect(usePantryInventoryStore.getState().purchaseEvents).toHaveLength(2);
    // aggregate sums to 2.66, rounded to 1 decimal = 2.7
    expect(usePantryInventoryStore.getState().entries[0]!.quantity).toBe(2.7);
    const first = usePantryInventoryStore.getState().purchaseEvents[0]!;
    usePantryInventoryStore.getState().removePurchaseEvent(first.purchasedAt, 'Cauliflower');
    expect(usePantryInventoryStore.getState().purchaseEvents).toHaveLength(1);
    // aggregate stock unchanged by a single-event delete
    expect(usePantryInventoryStore.getState().entries[0]!.quantity).toBe(2.7);
  });

  it('removePurchaseByName clears the item entirely (aggregate + all events)', () => {
    usePantryInventoryStore.getState().logPurchase('Cauliflower', { quantity: 1.33, unit: 'pc' });
    usePantryInventoryStore.getState().logPurchase('Cauliflower', { quantity: 1.33, unit: 'pc' });
    usePantryInventoryStore.getState().removePurchaseByName('Cauliflower');
    expect(usePantryInventoryStore.getState().entries).toHaveLength(0);
    expect(usePantryInventoryStore.getState().purchaseEvents).toHaveLength(0);
  });

  it('removePurchaseByName is case/whitespace insensitive and leaves other items', () => {
    usePantryInventoryStore.getState().logPurchase('Cauliflower', { quantity: 1.33, unit: 'pc' });
    usePantryInventoryStore.getState().logPurchase('   coriander leaves ', { quantity: 0.5, unit: 'cup' });
    usePantryInventoryStore.getState().removePurchaseByName(' CAULIFLOWER ');
    expect(usePantryInventoryStore.getState().entries).toHaveLength(1);
    expect(usePantryInventoryStore.getState().entries[0]!.name.toLowerCase()).toBe('coriander leaves');
  });
});

describe('consolidateEventsForDisplay — collpase the mistaken triple', () => {
  it('3× 1.33pc same name+unit → one line with summed quantity and count 3', () => {
    const mk = (at: string): PurchaseEvent => ({
      name: 'Cauliflower', quantity: 1.33, unit: 'pc', purchasedAt: at, boughtOn: '2026-08-22', source: 'bought',
    });
    const events: PurchaseEvent[] = [
      mk('2026-08-22T01:00:00.000Z'),
      mk('2026-08-22T02:00:00.000Z'),
      mk('2026-08-22T03:00:00.000Z'),
    ];
    const lines = consolidateEventsForDisplay(events);
    expect(lines).toHaveLength(1);
    expect(lines[0]!.quantity).toBeCloseTo(3.99, 2);
    expect(lines[0]!.count).toBe(3);
    expect(lines[0]!.purchasedAt).toBe('2026-08-22T01:00:00.000Z'); // earliest = row identity
  });

  it('mixed units stay separate lines', () => {
    const events: PurchaseEvent[] = [
      ev('Milk', '2026-08-22', '2026-08-22T01:00:00.000Z'),
      { ...ev('Milk', '2026-08-22', '2026-08-22T02:00:00.000Z'), unit: 'liter' },
    ];
    const lines = consolidateEventsForDisplay(events);
    expect(lines).toHaveLength(2);
  });

  it('different items on the same day do not merge; newest-first', () => {
    const events: PurchaseEvent[] = [
      ev('Cauliflower', '2026-08-22', '2026-08-22T02:00:00.000Z'),
      ev('Coriander Leaves', '2026-08-22', '2026-08-22T01:00:00.000Z'),
    ];
    const lines = consolidateEventsForDisplay(events);
    expect(lines).toHaveLength(2);
    expect(lines[0]!.name).toBe('Cauliflower'); // newest first
  });

  it('empty events → empty lines', () => {
    expect(consolidateEventsForDisplay([])).toEqual([]);
  });
});
});
