# DATA CLEANUP — dead curated calorie-map ids (deprecation ledger)

Status: **REMOVED from the hot path (2026-09-13). Guarded so they cannot return.**

## What these ids were

`meal/constants/dishCalories.ts` previously carried a curated per-serving kcal
map with **94 keys**. **54 of those ids did not exist in `DISH_LIBRARY`** (679
live dishes at time of writing) — they referenced an earlier version of the
dish library and could never be looked up by the active path
(`getDishCalorieInfo` is keyed by a live dish's id).

## Why they were dangerous (the honesty rule)

> Never hide a data-quality problem by rendering a plausible-looking meal.

A dead id in the map is a trap:
- any consumer that looked a stale id up would silently fall through to the
  weight/category estimate — or worse;
- someone could inject a stale id into a plan input **expecting a curated
  value** while the UI rendered a different (estimated) meal;
- a stale id resolved against the old library could render a *plausible-looking
  dish that does not exist in the current catalog*.

## Intended action — DONE + locked

1. **Removed from the map** — 40 live curated entries remain; every key now
   resolves to a live `DISH_LIBRARY` dish id.
2. **CI/build tripwire** — `scripts/validateDataIntegrity.mjs`
   (`npm run validate:data`; wired into `npm test` and `npm run build` via
   `prebuild`): fails with exit 1 + the list whenever a `DISH_CALORIES` key
   has no dish in the library. A NEW dead id fails `npm test` AND `npm run build`.
3. **Structural guard** — `tests/dataIntegrity.test.ts` imports the REAL
   modules and asserts every key resolves; the script's failure path is proven
   with a fixture.
4. **Recommendation path** — `stripInvalidDishMappings` (utils/mealPlanRegen.ts)
   excludes any dead library-shaped id injected into a plan input, records
   `invalid_dish_mapping:<slot>:<id>` (Λ2.3), and the fill step replaces it
   with a VALID diet-compatible dish (20/20 regression locked in
   tests/mealPlanRegen.test.ts).

## The 54 removed ids

```
dal-tadka            chole-bhature        veg-biryani
paneer-tikka         paneer-tikka-masala  dal-makhani
rajma                palak-paneer         masala-dosa
sambar               vada                 puri-bhaji
parotta              naan                 roti
poori                bhatura              fish-fry
fish-curry           prawn-curry          egg-curry
egg-bhurji           kerala-chicken-stew  korma
matar-paneer         aloo-gobi            bhindi-masala
baingan-bharta       sambar-rice          khichdi
khichuri             dal-chawal           dahi-vada
poha                 upma                 idli-sambar
jalebi               kheer                phirni
rasmalai             malpua               halwa
shaahi-paneer        mix-veg              paneer-chilli
fried-rice           tomato-soup          mushroom-soup
sweet-corn-soup      thepla               sev-tameta
macher-jhol          puchka               biriyani
```

## Live equivalents (where obvious)

Many removed ids are the BASE names whose live library id is a suffixed
variant — e.g. `dal-tadka` → `dal-tadka-central`, `poha` → `poha-mp`,
`rajma` → dishes under `rajma-*`. The curated kcal for those bases was never
reachable; the deterministic estimator (`utils/macroEstimator.ts`,
`estimated: true`) covers every live dish.

## How a NEW dead id fails (the guard, proven)

1. Someone adds `'ghost-dish': 100` to `DISH_CALORIES`.
2. `npm test` → `validate:data` exits 1, listing `ghost-dish`.
3. `npm run build` → `prebuild` runs the same guard → the build fails.
4. The vitest guard (`tests/dataIntegrity.test.ts`) also fails.
5. `tests/mealPlanRegen.test.ts` — a dead id in a plan input is excluded
   with `invalid_dish_mapping:...` and a valid dish fills the slot (20/20).
