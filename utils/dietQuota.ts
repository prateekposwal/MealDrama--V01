// ─────────────────────────────────────────────────────────────────────────────
// Diet representation quota — a user who picks "Eggitarian" or "Vegan" chose
// that diet FOR its distinctive foods (eggs / plant-only). Regional pools may
// contain zero such dishes (all 16 egg curries are south/east/west; a north
// eggitarian's region-filtered seed had none). This helper guarantees those
// foods appear in trays and loop pools by selecting cross-region
// representatives, tiered so same-region/all-region dishes lead when present.
// ─────────────────────────────────────────────────────────────────────────────
import type { Dish } from '../meal/constants/dishLibrary';

export interface DietQuotaOpts {
  /** Distinctive type that must be represented: 'eggitarian' | 'vegan' | null */
  distType: string | null;
  regionKey: string;
  /** How many representatives to select (default 3) */
  minCount?: number;
  /** Normalized lowercase names already selected elsewhere */
  excludeNames?: Set<string>;
  /** Planned slots — representatives are spread across DISTINCT slots */
  plannedSlots?: string[];
}

const normName = (s: string): string => (s || '').trim().toLowerCase();

const SLOTS = ['breakfast', 'lunch', 'dinner', 'snacks'] as const;

function regionTier(d: Dish, regionKey: string): number {
  const r = (d.region || '').toLowerCase();
  if (r === regionKey.toLowerCase()) return 0;
  if (!r || r === 'all') return 1;
  return 2;
}

/** Dishes usable in more meal slots are more valuable inside rotation pools. */
function slotBreadth(d: Dish): number {
  const cats = (d.category || []) as ReadonlyArray<string>;
  return SLOTS.reduce((n, s) => n + (cats.some(c => c.includes(s)) ? 1 : 0), 0);
}

/**
 * Slot-aware variant: returns each representative WITH its assigned slot so
 * callers never re-route through primarySlotFor (which collapses everything
 * back onto breakfast/lunch and defeats the spread).
 */
export interface DietRepAssignment { dish: Dish; slot: string | null }

export function pickDietRepresentativesWithSlots(library: Dish[], opts: DietQuotaOpts): DietRepAssignment[] {
  const { distType, regionKey, minCount = 3, excludeNames, plannedSlots } = opts;
  if (!distType || minCount <= 0) return [];
  const excluded = excludeNames ?? new Set<string>();
  const candidates = (library as any[])
    .filter(d => {
      const dt = (d.diet || d.type || '').toLowerCase();
      return dt === distType && !excluded.has(normName(d.name));
    })
    .sort((a, b) =>
      regionTier(a as Dish, regionKey) - regionTier(b as Dish, regionKey) ||
      slotBreadth(b as Dish) - slotBreadth(a as Dish) ||
      a.name.localeCompare(b.name));

  if (!plannedSlots || plannedSlots.length === 0) {
    return candidates.slice(0, minCount).map(dish => ({ dish: dish as Dish, slot: null }));
  }

  // Greedy slot-diverse selection. Pass 1 assigns each dish its first
  // UNCLAIMED category-matching planned slot — routing by primarySlotFor
  // alone collapsed onto breakfast/lunch (all north eggs are
  // breakfast-tagged; every [lunch,dinner] curry's primary IS lunch),
  // leaving dinner/snacks unreached. Pass 2 allows slot reuse when the
  // pool is thin.
  const taken = new Set<string>();
  const chosen: DietRepAssignment[] = [];
  const catsOf = (d: Dish) => ((d.category || []) as ReadonlyArray<string>).map(c => c.toLowerCase());
  const findSlot = (d: Dish, requireFresh: boolean): string | null => {
    const cats = catsOf(d);
    for (const s of plannedSlots) {
      const slot = s.toLowerCase();
      if (!cats.some(c => c.includes(slot))) continue;
      if (requireFresh && taken.has(slot)) continue;
      return slot;
    }
    return null;
  };
  for (const pass of [1, 2]) {
    for (const c of candidates) {
      if (chosen.length >= minCount) break;
      if (chosen.some(x => x.dish.id === c.id)) continue;
      const slot = findSlot(c as Dish, pass === 1) ?? (pass === 2 ? primarySlotFor(c as Dish, plannedSlots) : null);
      if (!slot) continue;
      taken.add(slot);
      chosen.push({ dish: c as Dish, slot });
    }
    if (chosen.length >= minCount) break;
  }
  return chosen;
}

/**
 * Select up to `minCount` dishes whose diet type equals `distType`, ordered:
 * exact-region → all-region → other regions, then broader slot coverage,
 * then name. Returns [] when distType is null (veg / non-veg users keep
 * their existing behavior untouched).
 *
 * With `plannedSlots`, representatives are spread across DISTINCT slots
 * (one per slot before a second lands in the same slot) — routing 3 eggs
 * into lunch-only starved breakfast/dinner/snacks (the reported bug).
 */
export function pickDietRepresentatives(library: Dish[], opts: DietQuotaOpts): Dish[] {
  return pickDietRepresentativesWithSlots(library, opts).map(a => a.dish);
}

/**
 * Per-slot diet deficit. The old global model counted ALL reps in one basket:
 * three breakfast eggs satisfied a target of 3, so lunch/dinner/snacks got
 * zero reps — the reported sparse-plan bug. This returns how many MORE of
 * `distType` each pool slot needs to reach `target` (and the total).
 */
export function dietDeficitBySlot(
  pools: Record<string, ReadonlyArray<Dish> | undefined>,
  distType: string | null,
  target: number,
): { deficits: Array<{ slot: string; need: number }>; total: number } {
  if (!distType || target <= 0) return { deficits: [], total: 0 };
  const deficits: Array<{ slot: string; need: number }> = [];
  let total = 0;
  for (const slot of SLOTS) {
    const items = pools[slot] ?? [];
    const have = (items as any[]).filter(d => (d.diet || d.type || '').toLowerCase() === distType).length;
    const need = Math.max(0, target - have);
    if (need > 0) { deficits.push({ slot, need }); total += need; }
  }
  return { deficits, total };
}

/** Rotation-pool shape used by loop configs. */
export type DietSlot = 'breakfast' | 'lunch' | 'snacks' | 'dinner';
export type DietSourcePool = Record<DietSlot, Dish[]>;

export interface EnrichSourcePoolOpts {
  /** Diet types the profile allows (e.g. ['veg','vegan','eggitarian']). */
  allowedTypes: string[];
  regionKey: string;
  /** Per-slot pool target breadth (rotation variety). */
  target?: number;
  /** Priority fn — lower first. Defaults to exact-region → all → rest, then name. */
  priority?: (d: Dish, regionKey: string) => number;
  /** Health match fn — HIGHER first. Breakss ties after `priority` so a health
   *  focus (High Protein / Weight Loss) steers the pool without excluding. */
  healthScore?: (d: Dish) => number;
}

/**
 * Rotation-pool ENRICHMENT: a rotation pool capped at the 6-item tray repeats
 * the same dishes every day ("repeating again again"). Existing pool items
 * (the user's tray picks) keep their lead; the slot is then filled to `target`
 * with diet-allowed, region-appropriate candidates (region + 'all'), diet &
 * region prioritized, duplicates excluded by normalized name.
 */
export function enrichSourcePool<P extends DietSourcePool>(
  pool: P,
  library: Dish[],
  opts: EnrichSourcePoolOpts,
): P {
  const { allowedTypes, regionKey, target = 12, priority, healthScore } = opts;
  const out: DietSourcePool = { breakfast: [], lunch: [], snacks: [], dinner: [] };
  const rank = priority ?? ((d: Dish) => (d.region === regionKey ? 0 : (d.region === 'all' ? 1 : 2)));
  const hs = healthScore ?? (() => 0);
  for (const slot of ['breakfast', 'lunch', 'snacks', 'dinner'] as const) {
    const items = [...(pool[slot] ?? [])];
    const seen = new Set<string>(items.map(d => (d.name || '').trim().toLowerCase()));
    // Qualified fill candidates beyond the tray's picks.
    const eligible = (library as any[])
      .filter(d =>
        allowedTypes.includes(d.type) &&
        (d.category ?? []).includes(slot) &&
        (d.region === regionKey || d.region === 'all') &&
        !seen.has((d.name || '').trim().toLowerCase()))
      .sort((a, b) =>
        rank(a as Dish, regionKey) - rank(b as Dish, regionKey) ||
        hs(b as Dish) - hs(a as Dish) ||
        ((a as Dish).name || '').localeCompare((b as Dish).name || ''));
    for (const d of eligible) {
      const dish = d as Dish;
      if (items.length >= target) break;
      items.push(dish);
      seen.add((dish.name || '').trim().toLowerCase());
    }
    out[slot] = items;
  }
  return out as P;
}

/** Diet → allowed dish types (canonical; used by plan purge + share guards). */
export function allowedTypesForDiet(diet?: string | null): string[] {
  const d = (diet || '').toLowerCase();
  if (d === 'veg') return ['veg', 'vegan'];
  if (d === 'eggitarian') return ['veg', 'vegan', 'eggitarian'];
  if (d === 'non-veg') return ['veg', 'non-veg', 'vegan', 'eggitarian'];
  if (d === 'vegan') return ['vegan'];
  return ['veg', 'vegan'];
}

/** Keep only tray items local to (or shared across) the NEW region — drops
 *  far-region leftovers when a user changes their food region. Pure. */
export function keepRegionTrayItems(
  tray: { breakfast?: Array<{ sourceRegion?: string; region?: string; [k: string]: unknown }>; lunch?: Array<{ sourceRegion?: string; region?: string; [k: string]: unknown }>; snacks?: Array<{ sourceRegion?: string; region?: string; [k: string]: unknown }>; dinner?: Array<{ sourceRegion?: string; region?: string; [k: string]: unknown }> },
  regionKey: string,
): typeof tray {
  const slots = ['breakfast', 'lunch', 'snacks', 'dinner'] as const;
  const out: any = {};
  for (const s of slots) {
    out[s] = (tray?.[s] ?? []).filter(m => {
      const r = (m.sourceRegion ?? m.region ?? '').toLowerCase();
      return !r || r === 'all' || r === regionKey.toLowerCase();
    });
  }
  return out as typeof tray;
}

/** Map a profile diet string to its distinctive type (null when unknown). */
export function distinctiveTypeFor(diet?: string | null): string | null {
  const d = (diet || '').toLowerCase();
  if (d === 'eggitarian') return 'eggitarian';
  if (d === 'vegan') return 'vegan';
  if (d === 'veg') return 'veg';
  if (d === 'non-veg') return 'non-veg';
  return null;
}

/**
 * How many MORE dishes of `distType` are needed to reach `target` within
 * `items` (the already-seeded tray or loop pool). Uniform across diets:
 * veg/non-veg pools usually self-satisfy → zero additions; eggitarian/vegan
 * pools in food-desert regions fill from cross-region representatives.
 */
export function deficitCount(items: Dish[], distType: string | null, target: number): number {
  if (!distType || target <= 0) return 0;
  const have = (items as any[]).filter(d => (d.diet || d.type || '').toLowerCase() === distType).length;
  return Math.max(0, target - have);
}

/** First planned slot this dish belongs to (fallback: first slot given). */
export function primarySlotFor(dish: Dish, plannedSlots: string[]): string | null {
  const cats = ((dish.category || []) as ReadonlyArray<string>).map(c => c.toLowerCase());
  for (const slot of plannedSlots) {
    if (cats.some(c => c.includes(slot.toLowerCase()))) return slot.toLowerCase();
  }
  for (const s of SLOTS) {
    if (cats.some(c => c.includes(s))) return s;
  }
  return plannedSlots[0]?.toLowerCase() ?? null;
}
