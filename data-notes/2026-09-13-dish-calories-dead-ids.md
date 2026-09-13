# DISH_CALORIES — Dead curated ids removed (2026-09-13)

## What happened

`meal/constants/dishCalories.ts` carried a curated per-serving kcal map with
**94 keys**. **54 of those ids did not exist in `DISH_LIBRARY`** (679 live
dishes at time of writing) — they referenced an earlier version of the dish
library. They could never be looked up by the active path (`getDishCalorieInfo`
is keyed by a live dish's id), but they were dead weight and a trap: any
consumer that looked a stale id up would silently fall through to the weight/
category estimate — or worse, someone could inject a stale id expecting a
curated value.

This session they were **removed from the map** (40 live curated entries
remain) and guarded so they can never come back:

- `scripts/validateDataIntegrity.mjs` — CI/build tripwire (`npm run
  validate:data`; wired into `npm test` and `npm run build` via `prebuild`).
  Fails with exit 1 + the list whenever a `DISH_CALORIES` key has no dish.
- `tests/dataIntegrity.test.ts` — vitest imports the REAL modules and asserts
  every key resolves; the script's failure path is proven with a fixture.

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

## How a NEW dead id fails

1. Someone adds `'ghost-dish': 100` to `DISH_CALORIES`.
2. `npm test` → `validate:data` exits 1, listing `ghost-dish`.
3. `npm run build` → `prebuild` runs the same guard → the build fails.
4. The vitest guard (`tests/dataIntegrity.test.ts`) also fails.
