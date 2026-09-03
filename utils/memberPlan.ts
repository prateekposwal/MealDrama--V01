// ─────────────────────────────────────────────────────────────────────────────
// MEMBER PLAN — Phase-1 mirror-plans. Every household member's lane is
// auto-generated from THEIR OWN diet + region + slots + health focus, using the
// same pipeline as a user's own plan (diet-first → region pools → quota reps →
// health tiebreak → sweets excluded). No one picks dishes "for" a member —
// the member's preferences do. Pure + testable.
// ─────────────────────────────────────────────────────────────────────────────
import type { Dish } from '../meal/constants/dishLibrary';
import { DISH_LIBRARY } from '../meal/constants/dishLibrary';
import { distinctiveTypeFor, pickDietRepresentativesWithSlots } from './dietQuota';
import { getRegionKey, goalToDishHealthFilter, dishHealthMatchScore } from './dishSearch';
import { isPureSweetDish } from '../meal/constants/pairingCatalog';
import { getISODate } from './dateUTC';

export interface MemberPlanPrefs {
  dietType: string;
  region: string;
  plannedSlots: string[];
  healthGoal?: string;
}

export type MemberDay = Record<'breakfast' | 'lunch' | 'snacks' | 'dinner', Dish | null>;

const SLOT_KEYS = ['breakfast', 'lunch', 'snacks', 'dinner'] as const;
const ALLOWED: Record<string, string[]> = {
  veg: ['veg', 'vegan'],
  eggitarian: ['veg', 'vegan', 'eggitarian'],
  'non-veg': ['veg', 'non-veg', 'vegan', 'eggitarian'],
  vegan: ['vegan'],
};
const DIET_PRIORITY: Record<string, number> = {
  eggitarian: 0, vegan: 1, veg: 2, 'non-veg': 0,
};

function healthMatchFor(goal?: string): (d: Dish) => number {
  const f = goalToDishHealthFilter(goal);
  return (d) => (f && f !== 'all' ? dishHealthMatchScore(d, f) : 0);
}

/** A single auto-picked dish per planned slot — the member's own plan card. */
export function buildMemberDay(prefs: MemberPlanPrefs, library: Dish[] = DISH_LIBRARY): MemberDay {
  const day: MemberDay = { breakfast: null, lunch: null, snacks: null, dinner: null };
  const diet = (prefs.dietType || 'veg').toLowerCase();
  const regionKey = getRegionKey(prefs.region) || 'north';
  const allowed: string[] = ALLOWED[diet] ?? ALLOWED.veg ?? ['veg'];
  const distType = distinctiveTypeFor(diet);
  const slots: string[] = (prefs.plannedSlots?.length ? prefs.plannedSlots : ['Breakfast', 'Lunch', 'Snacks', 'Dinner'])
    .map(s => s.toLowerCase()).filter(s => (SLOT_KEYS as readonly string[]).includes(s));
  const health = healthMatchFor(prefs.healthGoal);

  const norm = (s: string) => (s || '').trim().toLowerCase();
  const usedNames = new Set<string>();

  // 1) Diet-first pick per planned slot (region + all, category, no sweets).
  for (const slot of slots) {
    const candidates = library
      .filter(d =>
        (d.region === regionKey || d.region === 'all') &&
        (d.category ?? []).includes(slot as Dish['category'][number]) &&
        allowed.includes(d.type) &&
        !isPureSweetDish(d) &&
        !usedNames.has(norm(d.name)))
      .sort((a, b) => {
        const ap = DIET_PRIORITY[(a.diet || a.type || '').toLowerCase()] ?? 99;
        const bp = DIET_PRIORITY[(b.diet || b.type || '').toLowerCase()] ?? 99;
        return ap - bp || health(b) - health(a) || a.name.localeCompare(b.name);
      });
    const pick = candidates[0];
    if (pick) {
      day[slot as keyof MemberDay] = pick;
      usedNames.add(norm(pick.name));
    }
  }

  // 2) Diet-representation top-up: fill any planned slot with no distinctive
  //    dish from cross-region reps (mirrors the per-user quota heal).
  if (distType) {
    const missing = slots.filter(s => {
      const d = day[s as keyof MemberDay];
      return !d || (d.diet || d.type || '').toLowerCase() !== distType;
    });
    if (missing.length > 0) {
      const reps = pickDietRepresentativesWithSlots(library, {
        distType,
        regionKey,
        minCount: missing.length,
        excludeNames: usedNames,
        plannedSlots: missing,
      });
      for (const { dish, slot } of reps) {
        if (!slot || day[slot as keyof MemberDay]) continue;
        day[slot as keyof MemberDay] = dish;
        usedNames.add(norm(dish.name));
      }
    }
  }
  return day;
}

/** A member's lane across `days` dates (defaults: today + tomorrow). */
export function buildMemberWeek(
  prefs: MemberPlanPrefs,
  autoPlanEnabled: boolean,
  days = 2,
): Array<{ date: string; day: MemberDay }> {
  if (!autoPlanEnabled) return [];
  const base = getISODate();
  const out: Array<{ date: string; day: MemberDay }> = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(`${base}T00:00:00`);
    d.setDate(d.getDate() + i);
    out.push({ date: getISODate(d), day: buildMemberDay(prefs) });
  }
  return out;
}