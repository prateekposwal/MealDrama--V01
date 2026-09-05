// ─────────────────────────────────────────────────────────────────────────────
// Dashboard visible-branch rotation — regression lock for Bug 1.
//
// The Dashboard's "Try these" strip calls fetchAISuggestions → slotItemsFor.
// Before the fix, slotItemsFor called selectTryThese directly (deterministic
// sort) so the SAME dishes appeared every day. After the fix, slotItemsFor
// routes through nextSuggestionBatch, which consults the per-day seen-map and
// excludes recently-shown ids — so a NEW day yields a fresh rotation, while a
// same-day re-render stays stable (idempotent recording).
// ─────────────────────────────────────────────────────────────────────────────
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { fetchAISuggestions } from '../utils/aiEngine';
import { resetSuggestionSeen, getSuggestionSeen } from '../plan/utils/suggestionRotation';
import { getISODate } from '../utils/dateUTC';
import { DISH_LIBRARY } from '../meal/constants/dishLibrary';

describe('dashboardRotation — visible-branch daily rotation (Bug 1)', () => {
  beforeEach(() => resetSuggestionSeen('dash'));

  afterEach(() => { vi.useRealTimers(); resetSuggestionSeen('dash'); });

  it('day D+1 does not return the ids seeded by fetchAISuggestions on day D', async () => {
    const scope = 'dash';

    // Day D — capture what the visible branch would render.
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-04T06:00:00Z'));
    const dayD = await fetchAISuggestions({}, 'veg', ['north'], scope, []);
    expect(dayD).not.toBeNull();
    const dayDIds = new Set(Object.values(dayD!).flatMap(list => list.map(x => x.id)));
    expect(dayDIds.size).toBeGreaterThan(0);

    // Day D+1 — the seen-map from day D excludes today's ids → fresh batch.
    vi.setSystemTime(new Date('2026-09-05T06:00:00Z'));
    const dayD1 = await fetchAISuggestions({}, 'veg', ['north'], scope, []);
    const dayD1Ids = new Set(Object.values(dayD1!).flatMap(list => list.map(x => x.id)));
    for (const id of dayD1Ids) {
      expect(dayDIds.has(id), `day D+1 repeated ${id}`).toBe(false);
    }
  });

  it('fetchAISuggestions passes addDishIds exclusions through to the batch', async () => {
    const scope = 'dash';
    resetSuggestionSeen(scope);
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-06T06:00:00Z'));

    // Pick a real dish id to exclude, then assert it never surfaces.
    const target = DISH_LIBRARY[0]!.id;
    const result = await fetchAISuggestions({}, 'veg', ['north'], scope, [target]);
    const ids = new Set(Object.values(result!).flatMap(list => list.map(x => x.id)));
    expect(ids.has(target)).toBe(false);
  });

  it('same-day repeated calls stay bounded and record each id uniquely (no infinite re-roll / no unbounded growth)', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-07T06:00:00Z'));
    const scope = 'dash';
    resetSuggestionSeen(scope);

    await fetchAISuggestions({}, 'veg', ['north'], scope, []);
    await fetchAISuggestions({}, 'veg', ['north'], scope, []);
    await fetchAISuggestions({}, 'veg', ['north'], scope, []);

    const seen = getSuggestionSeen(scope, getISODate());
    // The seen-map is bounded (MAX_PER_DAY=48) and ids are unique — a same-day
    // hammering of the strip never re-rolls into an unbounded set.
    expect(seen.length).toBeLessThanOrEqual(48);
    expect(new Set(seen).size).toBe(seen.length);
  });
});
