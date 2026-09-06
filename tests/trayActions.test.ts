// ─────────────────────────────────────────────────────────────────────────────
// Tray store action tests — the most user-tapped methods of useTrayStore.
//
// Every assertion pins the REAL behavior read from plan/store/useTrayStore.ts:
//   addMealToSlot @206 (prepend + dedup-merge + completed/skipped guard)
//   removeMealFromSlot @754 (itemId-only removal + future-day cascade + index rebuild)
//   swapMealInSlot @389 / undoSwap @839 (full oldItemState restore INCL. title +
//     titleOwnership/smartVersion + loop-store remap reversal — Issue 2 fix)
//   updateItemInline @646 / batchUpdateItems @687 (partial merge, Map last-wins)
//   completeSlot @995 / undoCompleteSlot @1012 / skipSlot @1024 / undoSkipSlot @1055
//     (date::mealType keys + `complete:`/`skip:` saveStatus namespaces)
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useTrayStore } from '../plan/store/useTrayStore';
import { useStore } from '../app/store/useStore';
import { useLoopStore } from '../plan/store/useLoopStore';
import type { Meal, MealType, TrayItem } from '../types/tray';
import type { User } from '../app/store/useStore';
import { buildPlanIndex, slotKey } from '../plan/utils/planIndex';
import { clearAllDebounceTimers } from '../plan/utils/trayDebounce';
import { SLOT_TIME_DEFAULTS } from '../types/tray';

const DATE = '2026-06-01';
const FUTURE = '2026-06-02';

const makeMeal = (id: string, name: string, icon = '🍽️', region: Meal['region'] = 'north'): Meal => ({
  id,
  name,
  icon,
  region,
  category: ['lunch'],
});

function seedEmpty() {
  useStore.setState({
    user: {
      id: 'test-user', name: 'Test', region: 'North India', diet: 'veg',
      spiceLevel: 'medium', pantryStaples: [], slotTimePreferences: {},
    } as User,
    dishes: [],
    trayLibrary: { breakfast: [], lunch: [], snacks: [], dinner: [] },
    toast: null,
    setToast: vi.fn(),
  });
  useTrayStore.setState({
    plan: { period: 'week', days: {}, _planIndex: buildPlanIndex({}) },
    guestMode: { active: false, startDate: '', endDate: '', extraServings: 0 },
    swapHistory: [],
    saveStatus: {},
    templates: [],
    completions: {},
    skipped: {},
  });
  useLoopStore.setState({
    mealLoop: {
      config: null,
      sourceDishIds: [],
      pool_version: 1,
      rotationQueue: [],
      rotationPointer: 0,
      next_index: 0,
      assignments: [],
      overrides: new Map(),
      analytics: { cyclesCompleted: 0, mealsAutoFilled: 0, dishesSkipped: 0 },
      refreshing: false,
      lastRefreshStart: undefined,
      undoStack: [],
    },
  });
}

const lunchItems = (date: string = DATE) =>
  useTrayStore.getState().plan.days[date]?.lunch ?? [];

describe('useTrayStore actions', () => {
  beforeEach(() => {
    seedEmpty();
    clearAllDebounceTimers();
    // Keep network side-effects (mealRepository PATCH/DELETE, unskip sync) out
    // of unit tests: with onLine=false the guard `if (navigator.onLine)` skips
    // every API call and debounceSave bails before touching the repository.
    vi.stubGlobal('navigator', { onLine: false });
  });

  // NOTE: no afterEach with vi.unstubAllGlobals() — that would ALSO remove the
  // setup file's localStorage/window stubs and break every later test. Vitest
  // isolates each test file in its own worker, so the navigator stub below is
  // file-scoped and dies with this worker.
  describe('addMealToSlot', () => {
    it('adds a new item to the slot and keeps the plan index consistent', () => {
      useTrayStore.getState().addMealToSlot(DATE, 'lunch', makeMeal('a', 'Dal Makhani', '🍲'), {
        quantity: 3,
        servings: 2,
      });

      const { plan, saveStatus } = useTrayStore.getState();
      const items = plan.days[DATE]!.lunch;
      expect(items).toHaveLength(1);
      const item = items[0]!;
      expect(item.meal_id).toBe('a');
      expect(item.name).toBe('Dal Makhani');
      expect(item.icon).toBe('🍲');
      expect(item.quantity).toBe(3);
      expect(item.servings).toBe(2);
      expect(item.source).toBe('user');
      expect(item.start_time).toBe(SLOT_TIME_DEFAULTS.lunch.start);
      expect(item.end_time).toBe(SLOT_TIME_DEFAULTS.lunch.end);
      expect(item.title).toBeTruthy();

      // Plan index stays consistent with the new day/slot.
      expect(plan._planIndex.dates).toEqual([DATE]);
      expect(plan._planIndex.occupied[slotKey(DATE, 'lunch')]).toBe(true);
      expect(plan._planIndex.bySource.user).toContain(slotKey(DATE, 'lunch'));

      expect(saveStatus[item.id]).toBe('saving');
    });

    it('PREPENDS newer meals to the front of the slot (newest first)', () => {
      useTrayStore.getState().addMealToSlot(DATE, 'lunch', makeMeal('a', 'Dal Makhani'));
      useTrayStore.getState().addMealToSlot(DATE, 'lunch', makeMeal('b', 'Paneer'));

      expect(lunchItems().map(i => i.meal_id)).toEqual(['b', 'a']);
    });

    it('duplicate re-add (same meal_id) merges chips into the existing item — no second item', () => {
      useTrayStore.getState().addMealToSlot(DATE, 'lunch', makeMeal('a', 'Dal Makhani'), {
        quantity: 3,
      });
      const before = lunchItems()[0]!;
      const sidesBefore = [...before.sides];

      useTrayStore.getState().addMealToSlot(DATE, 'lunch', makeMeal('a', 'Dal Makhani'), {
        variantId: 'a_extra',
      });

      const items = lunchItems();
      expect(items).toHaveLength(1);
      expect(items[0]!.id).toBe(before.id);        // same item, not a new card
      expect(items[0]!.meal_id).toBe('a');
      expect(items[0]!.quantity).toBe(3);          // quantity NOT bumped by re-add
      expect(items[0]!.variantId).toBe('a_extra'); // overrides merged in
      expect(items[0]!.sides).toEqual(sidesBefore); // Set-union of identical chips
    });

    it('duplicate re-add with the SAME name (case-insensitive) but a different id also dedups', () => {
      useTrayStore.getState().addMealToSlot(DATE, 'lunch', makeMeal('c', 'Paneer Butter Masala'));
      useTrayStore.getState().addMealToSlot(DATE, 'lunch', makeMeal('d', 'paneer butter masala'));

      const items = lunchItems();
      expect(items).toHaveLength(1);
      expect(items[0]!.meal_id).toBe('c'); // original kept, no new card
    });

    it('refuses to add to a completed or skipped slot (guard returns early)', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

      useTrayStore.setState({ completions: { [slotKey(DATE, 'lunch')]: Date.now() } });
      useTrayStore.getState().addMealToSlot(DATE, 'lunch', makeMeal('a', 'Dal Makhani'));
      expect(useTrayStore.getState().plan.days[DATE]).toBeUndefined();
      expect(warn).toHaveBeenCalled();

      useTrayStore.setState({
        completions: {},
        skipped: { [slotKey(DATE, 'lunch')]: Date.now() },
      });
      useTrayStore.getState().addMealToSlot(DATE, 'lunch', makeMeal('a', 'Dal Makhani'));
      expect(useTrayStore.getState().plan.days[DATE]).toBeUndefined();

      warn.mockRestore();
    });
  });

  describe('removeMealFromSlot', () => {
    it('removes ONLY the given itemId — same-day siblings stay', () => {
      useTrayStore.getState().addMealToSlot(DATE, 'lunch', makeMeal('a', 'Dal Makhani'));
      useTrayStore.getState().addMealToSlot(DATE, 'lunch', makeMeal('b', 'Paneer'));
      useTrayStore.getState().addMealToSlot(DATE, 'lunch', makeMeal('c', 'Rajma'));

      const items = lunchItems(); // prepended: [c, b, a]
      const cId = items[0]!.id;
      const bId = items[1]!.id;
      const aId = items[2]!.id;

      useTrayStore.getState().removeMealFromSlot(DATE, 'lunch', bId);

      const remaining = lunchItems();
      expect(remaining.map(i => i.id)).toEqual([cId, aId]); // siblings stay, only b gone
      expect(remaining.some(i => i.id === bId)).toBe(false);

      // Index rebuilt: slot still occupied, day still in dates.
      const { plan } = useTrayStore.getState();
      expect(plan._planIndex.occupied[slotKey(DATE, 'lunch')]).toBe(true);
      expect(plan._planIndex.dates).toContain(DATE);
      expect(useTrayStore.getState().saveStatus[bId]).toBe('saving');
    });

    it('index rebuild: a day whose last slot item is removed drops out of occupied/dates', () => {
      useTrayStore.getState().addMealToSlot(DATE, 'lunch', makeMeal('a', 'Dal Makhani'));
      useTrayStore.getState().addMealToSlot(DATE, 'dinner', makeMeal('b', 'Paneer'));
      const aId = lunchItems()[0]!.id;

      useTrayStore.getState().removeMealFromSlot(DATE, 'lunch', aId);

      const { plan } = useTrayStore.getState();
      expect(plan._planIndex.occupied[slotKey(DATE, 'lunch')]).toBeUndefined();
      expect(plan._planIndex.occupied[slotKey(DATE, 'dinner')]).toBe(true);
      expect(plan._planIndex.dates).toEqual([DATE]); // day survives via dinner
    });

    it('future-day cascade (d > date): keeps removed dish + user/suggestion items, scrubs OTHER loop items', () => {
      const mk = (id: string, meal_id: string, name: string, source: TrayItem['source']): TrayItem => ({
        id,
        meal_id,
        name,
        source,
        quantity: 1,
        servings: 1,
        gravy: null,
        roti: null,
        rice: null,
        sides: [],
        beverages: [],
        dessert: [],
        itemQtys: {},
      });
      useTrayStore.setState({
        plan: {
          period: 'week',
          days: {
            [DATE]: { breakfast: [], lunch: [mk('i-rm', 'a', 'Dal', 'user')], snacks: [], dinner: [] },
            [FUTURE]: {
              breakfast: [],
              lunch: [
                mk('i-keep-dish', 'a', 'Dal', 'loop'),   // same dish as removed → kept
                mk('i-other-loop', 'x', 'Other', 'loop'), // different dish, loop → SCRUBBED
                mk('i-user', 'y', 'User Dish', 'user'),   // different dish, user → kept
              ],
              snacks: [],
              dinner: [],
            },
          },
          _planIndex: buildPlanIndex({}), // rebuilt by the action anyway
        },
      });

      useTrayStore.getState().removeMealFromSlot(DATE, 'lunch', 'i-rm');

      const futureLunch = useTrayStore.getState().plan.days[FUTURE]!.lunch;
      expect(futureLunch.map(i => i.id).sort()).toEqual(['i-keep-dish', 'i-user']);
      // Same-day slot: only the removed item is gone (no siblings existed here).
      expect(useTrayStore.getState().plan.days[DATE]!.lunch).toHaveLength(0);
    });
  });

  describe('swapMealInSlot', () => {
    it('replaces the dish in the SAME slot (item id kept); preserves quantity/servings/time window', () => {
      useTrayStore.getState().addMealToSlot(DATE, 'lunch', makeMeal('a', 'Dal Makhani', '🍲'), {
        quantity: 3,
        servings: 2,
      });
      const item = lunchItems()[0]!;
      const itemId = item.id;

      useTrayStore.getState().swapMealInSlot(DATE, 'lunch', itemId, makeMeal('b', 'Paneer', '🍛'));

      const items = lunchItems();
      expect(items).toHaveLength(1); // slot kept, no new card
      const swapped = items[0]!;
      expect(swapped.id).toBe(itemId); // same item identity
      expect(swapped.meal_id).toBe('b');
      expect(swapped.name).toBe('Paneer');
      expect(swapped.icon).toBe('🍛');
      expect(swapped.quantity).toBe(3); // preserved
      expect(swapped.servings).toBe(2); // preserved
      expect(swapped.start_time).toBe(item.start_time); // custom window preserved
      expect(swapped.end_time).toBe(item.end_time);

      const rec = useTrayStore.getState().swapHistory[0]!;
      expect(rec).toMatchObject({
        date: DATE,
        mealType: 'lunch',
        itemId,
        oldMealId: 'a',
        newMealId: 'b',
      });
      expect(rec.oldItemState?.meal_id).toBe('a');
      expect(rec.oldItemState?.name).toBe('Dal Makhani');
    });

    it('no-op (same state reference) when the target itemId does not exist', () => {
      useTrayStore.getState().addMealToSlot(DATE, 'lunch', makeMeal('a', 'Dal Makhani'));
      const planBefore = useTrayStore.getState().plan;
      const historyBefore = useTrayStore.getState().swapHistory;

      useTrayStore.getState().swapMealInSlot(DATE, 'lunch', 'missing-id', makeMeal('b', 'Paneer'));

      expect(useTrayStore.getState().plan).toBe(planBefore);       // no state change
      expect(useTrayStore.getState().swapHistory).toBe(historyBefore);
    });
  });

  describe('undoSwap', () => {
    it('restores the LAST swapped item from oldItemState (incl. PRE-SWAP title) and pops the history entry', () => {
      useTrayStore.getState().addMealToSlot(DATE, 'lunch', makeMeal('a', 'Dal Makhani', '🍲'), {
        quantity: 3,
      });
      const itemId = lunchItems()[0]!.id;
      const originalTitle = lunchItems()[0]!.title;

      useTrayStore.getState().swapMealInSlot(DATE, 'lunch', itemId, makeMeal('b', 'Paneer', '🍛'));

      useTrayStore.getState().undoSwap();

      const restored = lunchItems()[0]!;
      expect(restored.meal_id).toBe('a'); // original dish back
      expect(restored.name).toBe('Dal Makhani');
      expect(restored.icon).toBe('🍲');
      expect(restored.quantity).toBe(3);
      expect(restored.id).toBe(itemId);
      expect(useTrayStore.getState().swapHistory).toHaveLength(0); // popped
      // FIX A (Issue 2): oldItemState now captures `title`, so the PRE-SWAP
      // title is restored (the old documented quirk — swapped title surviving
      // undo — was the bug this fix removes).
      expect(restored.title).toBe(originalTitle);
    });

    it('multi-swap → repeated undos walk back one swap per call', () => {
      useTrayStore.getState().addMealToSlot(DATE, 'lunch', makeMeal('a', 'Dal Makhani'));
      const itemId = lunchItems()[0]!.id;
      useTrayStore.getState().swapMealInSlot(DATE, 'lunch', itemId, makeMeal('b', 'Paneer'));
      useTrayStore.getState().swapMealInSlot(DATE, 'lunch', itemId, makeMeal('c', 'Rajma'));

      useTrayStore.getState().undoSwap();
      expect(lunchItems()[0]!.meal_id).toBe('b');
      expect(useTrayStore.getState().swapHistory).toHaveLength(1);

      useTrayStore.getState().undoSwap();
      expect(lunchItems()[0]!.meal_id).toBe('a');
      expect(useTrayStore.getState().swapHistory).toHaveLength(0);
    });

    it('Issue 2 — undoSwap restores the complete pre-swap state (title/titleOwnership) AND reverses the loop-store remap', () => {
      // Seed a CONFIGURED loop whose queue/assignments/sourceDishIds reference dish 'a',
      // so swapMealInSlot's forward remap (a → b) has something to reverse.
      useLoopStore.setState({
        mealLoop: {
          config: { cycleLength: 3, startDate: DATE, skipDays: [], repeatPattern: 'random' },
          sourceDishIds: ['a'],
          pool_version: 1,
          rotationQueue: [{ dishId: 'a', dishName: 'Dal Makhani', mealType: 'lunch' }],
          rotationPointer: 0,
          next_index: 0,
          assignments: [{ date: DATE, mealType: 'lunch', dishId: 'a', dishName: 'Dal Makhani', order: 0 }],
          overrides: new Map(),
          analytics: { cyclesCompleted: 0, mealsAutoFilled: 0, dishesSkipped: 0 },
          refreshing: false,
          lastRefreshStart: undefined,
          undoStack: [],
        },
      });

      useTrayStore.getState().addMealToSlot(DATE, 'lunch', makeMeal('a', 'Dal Makhani'), {
        title: 'Old Custom Title',
        titleOwnership: 'custom',
      });
      const id = lunchItems()[0]!.id;
      const titleBefore = lunchItems()[0]!.title;
      expect(titleBefore).toBe('Old Custom Title');

      useTrayStore.getState().swapMealInSlot(DATE, 'lunch', id, makeMeal('b', 'Paneer'));

      // Swap remapped the loop FORWARD (a → b) in all three structures.
      const mid = useLoopStore.getState().mealLoop;
      expect(mid.rotationQueue.some(q => q.dishId === 'b')).toBe(true);
      expect(mid.sourceDishIds).toEqual(['b']);

      useTrayStore.getState().undoSwap();

      // Tray: complete pre-swap item state restored — including the custom title.
      const restored = lunchItems()[0]!;
      expect(restored.meal_id).toBe('a');
      expect(restored.title).toBe(titleBefore); // NOT the swapped title
      expect(restored.titleOwnership).toBe('custom');

      // Loop: the a → b remap is reversed in rotationQueue, assignments, sourceDishIds.
      const ml = useLoopStore.getState().mealLoop;
      expect(ml.rotationQueue.some(q => q.dishId === 'a')).toBe(true);
      expect(ml.rotationQueue.some(q => q.dishId === 'b')).toBe(false);
      expect(ml.assignments.every(a => a.dishId === 'a')).toBe(true);
      expect(ml.sourceDishIds).toEqual(['a']);
    });

    it('no-ops (same state reference) when swapHistory is empty', () => {
      useTrayStore.getState().addMealToSlot(DATE, 'lunch', makeMeal('a', 'Dal Makhani'));
      const planBefore = useTrayStore.getState().plan;

      useTrayStore.getState().undoSwap();

      expect(useTrayStore.getState().plan).toBe(planBefore);
    });
  });

  describe('updateItemInline', () => {
    it('merges partial updates onto the target item only; siblings untouched', () => {
      useTrayStore.getState().addMealToSlot(DATE, 'lunch', makeMeal('a', 'Dal Makhani'));
      useTrayStore.getState().addMealToSlot(DATE, 'lunch', makeMeal('b', 'Paneer'));
      const items = lunchItems(); // [b, a]
      const bId = items[0]!.id;
      const aId = items[1]!.id;

      useTrayStore.getState().updateItemInline(DATE, 'lunch', aId, {
        quantity: 5,
        servings: 4,
        sides: ['Raita'],
      });

      const after = lunchItems();
      const updated = after.find(i => i.id === aId)!;
      expect(updated.quantity).toBe(5);
      expect(updated.servings).toBe(4);
      expect(updated.sides).toEqual(['Raita']);
      expect(updated.name).toBe('Dal Makhani'); // untouched field survives
      expect(updated.meal_id).toBe('a');

      const sibling = after.find(i => i.id === bId)!;
      expect(sibling.quantity).toBe(1); // untouched
      expect(sibling.name).toBe('Paneer');
      expect(useTrayStore.getState().saveStatus[aId]).toBe('saving');
    });
  });

  describe('batchUpdateItems', () => {
    it('applies ALL updates in a single transaction', () => {
      useTrayStore.getState().addMealToSlot(DATE, 'lunch', makeMeal('a', 'Dal Makhani'));
      useTrayStore.getState().addMealToSlot(DATE, 'lunch', makeMeal('b', 'Paneer'));
      useTrayStore.getState().addMealToSlot(DATE, 'lunch', makeMeal('c', 'Rajma'));
      const items = lunchItems(); // [c, b, a]
      const cId = items[0]!.id;
      const bId = items[1]!.id;
      const aId = items[2]!.id;

      useTrayStore.getState().batchUpdateItems(DATE, 'lunch', [
        { itemId: aId, updates: { quantity: 5 } },
        { itemId: bId, updates: { quantity: 2, servings: 3 } },
      ]);

      const after = lunchItems();
      expect(after.find(i => i.id === aId)!.quantity).toBe(5);
      expect(after.find(i => i.id === bId)!.quantity).toBe(2);
      expect(after.find(i => i.id === bId)!.servings).toBe(3);
      expect(after.find(i => i.id === cId)!.quantity).toBe(1); // untouched
      expect(useTrayStore.getState().saveStatus[aId]).toBe('saving');
      expect(useTrayStore.getState().saveStatus[bId]).toBe('saving');
    });

    it('same itemId twice in one batch → LAST update wins (Map semantics)', () => {
      useTrayStore.getState().addMealToSlot(DATE, 'lunch', makeMeal('a', 'Dal Makhani'));
      const aId = lunchItems()[0]!.id;

      useTrayStore.getState().batchUpdateItems(DATE, 'lunch', [
        { itemId: aId, updates: { quantity: 1 } },
        { itemId: aId, updates: { quantity: 9 } },
      ]);

      expect(lunchItems()[0]!.quantity).toBe(9);
    });

    it('empty update list is a strict no-op (same state reference)', () => {
      useTrayStore.getState().addMealToSlot(DATE, 'lunch', makeMeal('a', 'Dal Makhani'));
      const planBefore = useTrayStore.getState().plan;

      useTrayStore.getState().batchUpdateItems(DATE, 'lunch', []);

      expect(useTrayStore.getState().plan).toBe(planBefore);
    });
  });

  describe('completeSlot / undoCompleteSlot', () => {
    it('sets a Date.now() completion marker keyed by `date::mealType`; undo clears it + its saveStatus', () => {
      const key = slotKey(DATE, 'lunch');
      useTrayStore.getState().completeSlot(DATE, 'lunch');

      const { completions, saveStatus } = useTrayStore.getState();
      expect(typeof completions[key]).toBe('number');
      expect(completions[key]).toBeGreaterThan(0);
      expect(saveStatus[`complete:${key}`]).toBe('saving');
      // Completion does NOT touch the skipped namespace.
      expect(useTrayStore.getState().skipped[key]).toBeUndefined();

      useTrayStore.getState().undoCompleteSlot(DATE, 'lunch');
      expect(useTrayStore.getState().completions[key]).toBeUndefined();
      expect(useTrayStore.getState().saveStatus[`complete:${key}`]).toBeUndefined();
    });
  });

  describe('skipSlot / undoSkipSlot', () => {
    it('sets a Date.now() skip marker keyed by `date::mealType`; undo clears it + its saveStatus', () => {
      const key = slotKey(DATE, 'lunch');
      useTrayStore.getState().skipSlot(DATE, 'lunch');

      const { skipped, saveStatus } = useTrayStore.getState();
      expect(typeof skipped[key]).toBe('number');
      expect(skipped[key]).toBeGreaterThan(0);
      expect(saveStatus[`skip:${key}`]).toBe('saving');
      // Skip does NOT touch the completions namespace.
      expect(useTrayStore.getState().completions[key]).toBeUndefined();

      useTrayStore.getState().undoSkipSlot(DATE, 'lunch');
      expect(useTrayStore.getState().skipped[key]).toBeUndefined();
      expect(useTrayStore.getState().saveStatus[`skip:${key}`]).toBeUndefined();
    });

    it('completion and skip markers are independent per slot (separate namespaces)', () => {
      useTrayStore.getState().skipSlot(DATE, 'lunch');
      useTrayStore.getState().completeSlot(DATE, 'dinner');

      const s = useTrayStore.getState();
      expect(s.skipped[slotKey(DATE, 'lunch')]).toBeDefined();
      expect(s.completions[slotKey(DATE, 'dinner')]).toBeDefined();
      expect(s.completions[slotKey(DATE, 'lunch')]).toBeUndefined();
      expect(s.skipped[slotKey(DATE, 'dinner')]).toBeUndefined();
    });
  });
});
