// ─────────────────────────────────────────────────────────────────────────────
// TASTE PROFILE — THE single source of truth for a user's taste.
//
// Product principle (the "one changeDiet/dietQuota" discipline): a taste is
// described ONCE, persisted ONCE, and read by EVERY consumer. There is exactly
// ONE builder (tasteProfileFromUser) and ONE canonical shape (TasteProfile).
// Onboarding, Profile edit, the scorer, the recommendation gates, the reasons
// UI and the learning ledger all read THIS module — never a parallel copy.
//
// Fields (all persisted on the server DietPreference row — see schema.prisma):
//   spiceLevel        'mild' | 'medium' | 'hot'   (canonical; Profile picker)
//   allergies[]       free strings, e.g. ['peanuts','gluten','dairy']
//   dislikedItems[]   free strings, e.g. ['okra','bitter-gourd']
//   noveltyPreference 'familiar' | 'balanced' | 'adventurous'
//                     (familiar = stay with cuisines you already like;
//                      adventurous = prefer cuisines/dishes you have not had)
//   cuisineAffinities[]  cuisine keys the user explicitly loves, e.g.
//                     ['punjabi','south-indian'] — matched against the REAL
//                     cuisine tags carried by DISH_LIBRARY dishes.
//
// ALLERGIES ARE NOT DISLIKES: an allergy is a HARD exclusion (gate 3 FAIL),
// a dislike is a strong negative preference. Both live on the ONE profile.
// ─────────────────────────────────────────────────────────────────────────────
import type { Dish } from '../meal/constants/dishLibrary';

export type SpiceLevel = 'mild' | 'medium' | 'hot';
export const SPICE_LEVELS: readonly SpiceLevel[] = ['mild', 'medium', 'hot'] as const;

export type NoveltyPreference = 'familiar' | 'balanced' | 'adventurous';
export const NOVELTY_PREFERENCES: readonly NoveltyPreference[] = ['familiar', 'balanced', 'adventurous'] as const;

/** Human labels for the ONE novelty picker (onboarding + Profile). */
export const NOVELTY_LABELS: Record<NoveltyPreference, { label: string; icon: string; note: string }> = {
  familiar: { label: 'Familiar', icon: '🏠', note: 'Stick with the cuisines I already love' },
  balanced: { label: 'Balanced', icon: '⚖️', note: 'A mix of favourites and new dishes' },
  adventurous: { label: 'Adventurous', icon: '🧭', note: 'Show me dishes and cuisines I have not tried' },
};

/** The canonical taste shape. Every consumer imports THIS interface. */
export interface TasteProfile {
  spiceLevel: SpiceLevel;
  allergies: string[];
  dislikedItems: string[];
  noveltyPreference: NoveltyPreference;
  cuisineAffinities: string[];
}

/** The honest default — used ONLY when a field is genuinely absent. */
export const DEFAULT_TASTE_PROFILE: TasteProfile = {
  spiceLevel: 'medium',
  allergies: [],
  dislikedItems: [],
  noveltyPreference: 'balanced',
  cuisineAffinities: [],
};

const norm = (s: string): string => (s ?? '').toLowerCase().trim();

/** Normalize ANY stored/list value to a canonical novelty preference. Unknown
 *  or missing → 'balanced' (the documented default; never a random guess). */
export function normalizeNoveltyPreference(v?: string | null): NoveltyPreference {
  const s = norm(v ?? '').replace(/[ _]/g, '-');
  if (s === 'familiar' || s === 'home' || s === 'safe') return 'familiar';
  if (s === 'adventurous' || s === 'adventure' || s === 'novel' || s === 'explorer') return 'adventurous';
  if (s === 'balanced' || s === 'balance' || s === 'mix') return 'balanced';
  return DEFAULT_TASTE_PROFILE.noveltyPreference;
}

/** Canonical cuisine-affinity key (lowercase, spaces → dashes). */
export function normalizeCuisineAffinityKey(s: string): string {
  return norm(s).replace(/[ _]+/g, '-');
}

/** Normalize an arbitrary affinity list: canonical keys, de-duped, bounded. */
export function normalizeCuisineAffinities(v?: readonly string[] | null): string[] {
  if (!v) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of v) {
    const k = normalizeCuisineAffinityKey(raw);
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(k);
    if (out.length >= 20) break;
  }
  return out;
}

/** Normalize a free string list (allergies / dislikes): trimmed, de-duped,
 *  bounded — the SAME bounds the server schema enforces. */
export function normalizeStringList(v?: readonly string[] | null, max = 20): string[] {
  if (!v) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of v) {
    const s = (raw ?? '').trim();
    if (!s) continue;
    const k = s.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(s);
    if (out.length >= max) break;
  }
  return out;
}

/** The fields the builder may read — a structural subset of the store's User
 *  plus the server DietPreference view. Accepts numeric spice (onboarding
 *  pre-feature) so legacy values never fabricate a wrong level. */
export interface TasteProfileSource {
  spiceLevel?: string | number | null;
  allergies?: string[] | null;
  dislikedItems?: string[] | null;
  noveltyPreference?: string | null;
  cuisineAffinities?: string[] | null;
}

/** Map a numeric spice (1/2/3, the onboarding scale) to the canonical level. */
export function spiceLevelFromNumber(n: number): SpiceLevel {
  if (n === 1) return 'mild';
  if (n === 3) return 'hot';
  return 'medium';
}

/** Normalize ANY spice value (string level, numeric scale, legacy label). */
export function normalizeSpiceLevel(v?: string | number | null): SpiceLevel {
  if (typeof v === 'number') return spiceLevelFromNumber(v);
  const s = norm(v ?? '');
  if (s === 'mild' || s === 'low' || s === '1') return 'mild';
  if (s === 'hot' || s === 'high' || s === 'spicy' || s === '3') return 'hot';
  if (s === 'medium' || s === 'med' || s === '2') return 'medium';
  return DEFAULT_TASTE_PROFILE.spiceLevel;
}

/**
 * THE canonical builder. Reads the ONE shape from a store User OR a server
 * DietPreference view. Never throws; every field genuinely absent falls back
 * to the documented default (never a fabricated personal detail).
 */
export function tasteProfileFromUser(src?: TasteProfileSource | null): TasteProfile {
  if (!src) return { ...DEFAULT_TASTE_PROFILE, allergies: [], dislikedItems: [], cuisineAffinities: [] };
  return {
    spiceLevel: normalizeSpiceLevel(src.spiceLevel),
    allergies: normalizeStringList(src.allergies),
    dislikedItems: normalizeStringList(src.dislikedItems),
    noveltyPreference: normalizeNoveltyPreference(src.noveltyPreference),
    cuisineAffinities: normalizeCuisineAffinities(src.cuisineAffinities),
  };
}

/** Serialize for the server DietPreference PUT (canonical keys only). */
export function serializeTasteProfile(p: TasteProfile): {
  spiceLevel: SpiceLevel;
  allergies: string[];
  dislikedItems: string[];
  noveltyPreference: NoveltyPreference;
  cuisineAffinities: string[];
} {
  const n = tasteProfileFromUser(p);
  return {
    spiceLevel: n.spiceLevel,
    allergies: n.allergies,
    dislikedItems: n.dislikedItems,
    noveltyPreference: n.noveltyPreference,
    cuisineAffinities: n.cuisineAffinities,
  };
}

/** True when the taste profile is non-default on an axis that changes dishes
 *  (a UI/report helper — never used to fabricate a personalization claim). */
export function hasTasteSignal(p?: TasteProfile | null): boolean {
  if (!p) return false;
  return p.allergies.length > 0
    || p.dislikedItems.length > 0
    || p.cuisineAffinities.length > 0
    || p.noveltyPreference !== DEFAULT_TASTE_PROFILE.noveltyPreference
    || p.spiceLevel !== DEFAULT_TASTE_PROFILE.spiceLevel;
}

/** Convenience re-export so consumers import the dish type from ONE place. */
export type { Dish };
