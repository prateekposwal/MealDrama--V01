// ─────────────────────────────────────────────────────────────────────────────
// MACRO LABELS — "macros are estimates" enforced at every surface.
//
// Product rule (honest-product trust): calories/protein/carbs/fat are NEVER
// presented as precise. Every surface that renders a macro value must carry
// the shared estimated label, and the label must be DRIVEN by the `estimated`
// flag that `estimateDishMacros` / `getDishCalorieInfo` carry — so the moment
// real per-dish nutrition arrives the UI upgrades without churn.
//
// Proofs:
//   · formatEstimatedMacro/estimatedMacroParts — the flag → label mapping
//   · estimateDishMacros(d).estimated === true → the rendered label carries
//     "~" + "est." (behavioral, real library dish)
//   · computeTodaysCalories: estimated flag flows to the total; explicit lab
//     values (future path) render bare — the upgrade path is real, not locked
//   · static: Dashboard + DishSearchModal render through the SHARED component
//     wired to the data flag (no surface hardcodes its own copy)
//   · static: no nutrition surface hardcodes "exactly … kcal"-style claims
// ─────────────────────────────────────────────────────────────────────────────
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { estimateDishMacros, type DishMacros } from '../utils/macroEstimator';
import { formatEstimatedMacro, estimatedMacroParts } from '../components/meal/EstimatedMacroLabel';
import { computeTodaysCalories } from '../utils/healthInsight';
import { DISH_LIBRARY, type Dish } from '../meal/constants/dishLibrary';

const read = (p: string) => readFileSync(resolve(__dirname, p), 'utf8');

function dish(id: string): Dish {
  const d = DISH_LIBRARY.find(x => x.id === id);
  if (!d) throw new Error(`fixture dish ${id} not in library`);
  return d;
}

// ─── 1 · The flag → label mapping (shared primitive) ─────────────────────────
describe('EstimatedMacroLabel primitives', () => {
  it('estimated: true → "~" prefix + "est." suffix (never a precise claim)', () => {
    expect(estimatedMacroParts(true)).toEqual({ prefix: '~', suffix: ' · est.' });
    expect(formatEstimatedMacro(450, 'kcal', true)).toBe('~450 kcal · est.');
  });

  it('estimated: false → bare value (the future lab-nutrition upgrade path)', () => {
    expect(estimatedMacroParts(false)).toEqual({ prefix: '', suffix: '' });
    expect(formatEstimatedMacro(450, 'kcal', false)).toBe('450 kcal');
  });

  it('no surface ever renders "exactly … kcal" precision claims', () => {
    for (const p of ['../screens/Dashboard.tsx', '../components/meal/DishSearchModal.tsx', '../components/health/WeeklyHealthSummary.tsx']) {
      const src = read(p);
      expect(src).not.toMatch(/exactly\s+\d+\s*(kcal|cal)/i);
    }
  });
});

// ─── 2 · The flag flows from the estimator to the label (behavioral) ─────────
describe('estimated flag flow (estimateDishMacros → label)', () => {
  it('every real library dish estimates with estimated: true, and the label shows it', () => {
    const m = estimateDishMacros(dish('hyderabadi-biryani')) as DishMacros;
    expect(m.estimated).toBe(true);
    const label = formatEstimatedMacro(m.calories, 'kcal', m.estimated);
    expect(label).toMatch(/^~\d+ kcal · est\.$/);
    expect(label).not.toMatch(/^exactly/);
    expect(label).not.toEqual(`${m.calories} kcal`); // bare = a precision claim
  });

  it('the label flips off (bare) when a future non-estimated macro arrives', () => {
    const bare = { calories: 450, estimated: false as const };
    expect(formatEstimatedMacro(bare.calories, 'kcal', bare.estimated)).toBe('450 kcal');
  });
});

// ─── 3 · Dashboard "Today's calories" — the total carries the estimate ───────
describe('Dashboard today-calories surface', () => {
  const src = read('../screens/Dashboard.tsx');

  it('the kcal total renders through the shared estimated label, driven by the tally flag', () => {
    expect(src).toContain('<EstimatedMacroLabel value={todayCalories.totalKcal.toLocaleString(\'en-IN\')} unit="kcal" estimated={todayCalories.estimated}');
  });

  it('the protein total is labeled estimated too (derived macros, never precision)', () => {
    expect(src).toContain('estimated={todayCalories.proteinEstimated}');
    expect(src).toContain('unit="g protein"');
  });

  it('the footnote says "estimated", not a data-coverage claim alone', () => {
    expect(src).toContain('*estimated — typical serving data');
  });

  it('behavioral: a real library tray yields an estimated total with real protein', () => {
    const tally = computeTodaysCalories(
      [
        { meal_id: 'hyderabadi-biryani', quantity: 1 } as any,
        { meal_id: 'idli', quantity: 2 } as any,
      ],
      DISH_LIBRARY,
    );
    expect(tally.unknown).toBe(false);
    expect(tally.countedItems).toBe(2);
    expect(tally.estimated).toBe(true);          // every counted value is an estimate
    expect(tally.totalProtein).toBeGreaterThan(0); // protein is derived, not dead
    expect(tally.proteinEstimated).toBe(true);
  });

  it('behavioral: explicit lab calories (future path) → total NOT estimated', () => {
    const lab = [
      { id: 'lab-a', name: 'Lab A', region: 'all' as const, calories: 500, protein: 42, category: ['lunch'], type: 'veg' as const, weight: 'medium' as const, nutrition: [], tags: [], variants: [] },
    ];
    const tally = computeTodaysCalories([{ meal_id: 'lab-a', quantity: 1 } as any], lab as unknown as Dish[]);
    expect(tally.estimated).toBe(false);
    expect(tally.proteinEstimated).toBe(true);   // protein still derived → labeled
  });
});

// ─── 4 · DishSearchModal per-dish macros — derived + labeled ─────────────────
describe('DishSearchModal per-dish macro surface', () => {
  const src = read('../components/meal/DishSearchModal.tsx');

  it('renders per-dish cal/gP through the shared component from estimateDishMacros', () => {
    expect(src).toContain("import { estimateDishMacros } from '../../utils/macroEstimator'");
    expect(src).toContain("import { EstimatedMacroLabel } from './EstimatedMacroLabel'");
    expect(src).toContain('<EstimatedMacroLabel value={m.calories} unit="cal" estimated={m.estimated}');
    expect(src).toContain('unit="gP" estimated={m.estimated}');
  });

  it('no longer renders the raw dead dish fields (d.calories/d.protein) as precise labels', () => {
    expect(src).not.toMatch(/\{d\.calories\s*&&\s*<span[^>]*>\{d\.calories\}cal/);
    expect(src).not.toMatch(/\{d\.protein\s*&&\s*<span[^>]*>\{d\.protein\}gP/);
  });
});
