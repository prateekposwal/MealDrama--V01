// ─────────────────────────────────────────────────────────────────────────────
// CANONICAL TRAY UPSERT + DIET WRITE-PATH VALIDATION  (R2, TC-08/TC-13/TC-14)
//
// The "second meal card" defect had FOUR divergent dedupe rules across the tray
// write paths. This suite pins the ONE canonical rule (utils/trayUpsert) and the
// single sanctioned diet write path (updateProfile) so no future writer can
// drift back to id-only dedupe or a silent unknown-diet default.
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { upsertMealToSlot, trayHasMeal, normName, SLOT_KEYS } from '../utils/trayUpsert';
import { allowedTypesForDiet, CANONICAL_DIETS, isCanonicalDiet } from '../utils/dietQuota';
import { useStore } from '../app/store/useStore';
import type { MealOption } from '../app/store/useStore';

const makeMeal = (id: string, name: string, icon = '🍲', sourceRegion = 'north'): MealOption =>
  ({ id, dishId: id, name, icon, sourceRegion });

function seedEmptyTray() {
  useStore.setState({
    user: { id: 'u-tray', name: 'Tray Tester', diet: 'veg', region: 'north', spiceLevel: 'medium' } as any,
    trayLibrary: { breakfast: [], lunch: [], snacks: [], dinner: [] },
    smartQueue: { week2: [], favorites: [] },
  });
}

describe('upsertMealToSlot — ONE canonical dedupe rule (id OR normalized name)', () => {
  it('appends a genuinely new meal', () => {
    const { tray, added, replaced } = upsertMealToSlot([], makeMeal('a', 'Butter Chicken'));
    expect(added).toBe(true); expect(replaced).toBe(false);
    expect(tray).toHaveLength(1);
  });

  it('REPLACES a same-name entry even when the id changed (regenerated dish → no second card)', () => {
    const before = [makeMeal('v1', 'Butter Chicken')];
    const regenerated = makeMeal('v9', 'Butter Chicken'); // new id, same name
    const { tray, added, replaced } = upsertMealToSlot(before, regenerated);
    expect(replaced).toBe(true); expect(added).toBe(false);
    expect(tray).toHaveLength(1);            // exactly ONE card
    expect(tray[0]!.id).toBe('v9');          // the regenerated id wins
    expect(tray[0]!.name).toBe('Butter Chicken');
  });

  it('is a NO-OP (same array back) for identical content — no pointless state writes', () => {
    const before = [makeMeal('a', 'Butter Chicken')];
    const { tray, added, replaced } = upsertMealToSlot(before, makeMeal('a', 'Butter Chicken'));
    expect(added).toBe(false); expect(replaced).toBe(false);
    expect(tray).toBe(before);
  });

  it('updates an existing id in place when the icon/region changed', () => {
    const before = [makeMeal('a', 'Butter Chicken')];
    const { tray, replaced } = upsertMealToSlot(before, makeMeal('a', 'Butter Chicken', '🍗', 'south'));
    expect(replaced).toBe(true);
    expect(tray[0]!.icon).toBe('🍗'); expect(tray[0]!.sourceRegion).toBe('south');
  });

  it('is name-case-insensitive and trims whitespace trim', () => {
    const before = [makeMeal('a', 'Butter Chicken')];
    const { replaced } = upsertMealToSlot(before, makeMeal('b', '  butter chicken '));
    expect(replaced).toBe(true);
  });
});

describe('store addToTray — uses the canonical rule (TC-14)', () => {
  beforeEach(() => seedEmptyTray());

  it('same name, regenerated id → ONE entry (replaced, not duplicated)', () => {
    useStore.getState().addToTray('lunch', makeMeal('v1', 'Butter Chicken'));
    useStore.getState().addToTray('lunch', makeMeal('v9', 'Butter Chicken'));
    const slot = useStore.getState().trayLibrary.lunch;
    expect(slot).toHaveLength(1);
    expect(slot[0]!.id).toBe('v9');
  });

  it('same id identical → no-op (no re-render state churn)', () => {
    useStore.getState().addToTray('lunch', makeMeal('a', 'Butter Chicken'));
    const before = useStore.getState().trayLibrary.lunch;
    useStore.getState().addToTray('lunch', makeMeal('a', 'Butter Chicken'));
    expect(useStore.getState().trayLibrary.lunch).toBe(before);
  });
});

describe('store moveToTrayFromQueue — id-only dedupe is GONE (TC-08/TC-14)', () => {
  beforeEach(() => {
    seedEmptyTray();
    useStore.setState({ smartQueue: { week2: [], favorites: [] } });
  });

  it('a queue dish whose NAME already sits in the tray replaces it — no second card', () => {
    useStore.getState().addToTray('lunch', makeMeal('v1', 'Butter Chicken'));
    useStore.getState().moveToTrayFromQueue(makeMeal('q-1', 'Butter Chicken'));
    const slot = useStore.getState().trayLibrary.lunch;
    expect(slot).toHaveLength(1);               // exactly one card
    expect(slot[0]!.id).toBe('q-1');            // replaced with the queue item
    expect(useStore.getState().smartQueue.favorites).toHaveLength(0); // moved out
  });

  it('identical item already in tray → no-op, queue keeps it (old semantics preserved)', () => {
    useStore.setState({ smartQueue: { week2: [], favorites: [makeMeal('a', 'Rajma Chawal')] } });
    useStore.getState().addToTray('lunch', makeMeal('a', 'Rajma Chawal'));
    useStore.getState().moveToTrayFromQueue(makeMeal('a', 'Rajma Chawal'));
    expect(useStore.getState().trayLibrary.lunch).toHaveLength(1);
    expect(useStore.getState().smartQueue.favorites).toHaveLength(1);
  });
});

describe('updateProfile — the ONE diet write path validates + normalizes (TC-13)', () => {
  beforeEach(() => seedEmptyTray());

  it('lowercases the canonical picker value ("Veg" → "veg", "VEG " → "veg")', () => {
    useStore.getState().updateProfile({ diet: 'Veg' as any });
    expect(useStore.getState().user!.diet).toBe('veg');
    useStore.getState().updateProfile({ diet: 'VEGAN  ' as any });
    expect(useStore.getState().user!.diet).toBe('vegan');
  });

  it('REJECTS unknown diets and keeps the previous value — never a silent guess', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    useStore.setState((s: any) => ({ user: { ...s.user, diet: 'eggitarian' } }));
    useStore.getState().updateProfile({ diet: 'pescatarian' as any });
    expect(useStore.getState().user!.diet).toBe('eggitarian'); // unchanged
    expect(warn).toHaveBeenCalled();
    useStore.getState().updateProfile({ diet: '' as any });
    expect(useStore.getState().user!.diet).toBe('eggitarian');
    warn.mockRestore();
  });

  it('non-diet updates are untouched', () => {
    useStore.getState().updateProfile({ region: 'south' });
    expect(useStore.getState().user!.region).toBe('south');
  });
});

describe('allowedTypesForDiet — unknown diet is NEVER silently veg/vegan', () => {
  it('maps the 4 canonical diets exactly as before', () => {
    expect(allowedTypesForDiet('veg')).toEqual(['veg', 'vegan']);
    expect(allowedTypesForDiet('non-veg')).toContain('non-veg');
    expect(allowedTypesForDiet('eggitarian')).toEqual(['veg', 'vegan', 'eggitarian']);
    expect(allowedTypesForDiet('vegan')).toEqual(['vegan']);
    expect(CANONICAL_DIETS).toEqual(['veg', 'eggitarian', 'non-veg', 'vegan']);
    expect(isCanonicalDiet('egg')).toBe(false);
    expect(isCanonicalDiet('EGGITARIAN')).toBe(true);
  });

  it('unknown diet → ALL types (nothing stripped) + a warn marker', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(allowedTypesForDiet('vegetarian')).toEqual(['veg', 'vegan', 'eggitarian', 'non-veg']);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe('SLOT_KEYS — every slot the rebuild + upsert trust exists', () => {
  it('covers exactly the four tray buckets', () => {
    expect([...SLOT_KEYS].sort()).toEqual(['breakfast', 'dinner', 'lunch', 'snacks']);
  });
});

void normName;