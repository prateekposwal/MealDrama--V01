import { describe, it, expect } from 'vitest';
import { getIngredientsForMealOption } from '../utils/ingredientUtils';
import type { Dish, DishVariant, DishType } from '../meal/constants/dishLibrary';

// ─────────────────────────────────────────────────────────────────────────────
// REGIONAL PROTEIN-WORD HARDENING — future-dish regression guards.
// These tests build SYNTHETIC future dishes (no library contact, no explicit
// ingredients) and prove the inference dictionary + variant-aware light fill
// resolve regional protein names (koli/kozhi/erachi/.../nakham) WITHOUT the
// explicit-data crutch. They must not depend on — or perturb — library dishes.
// ─────────────────────────────────────────────────────────────────────────────

function futureDish(id: string, name: string, type: DishType, variants: DishVariant[]): Dish {
  return {
    id, name, icon: '🍽️', region: 'all', states: [], category: ['lunch'],
    type, weight: 'medium', nutrition: ['protein'], tags: [], variants,
  };
}

function resolve(dish: Dish, variantId: string): string[] {
  return getIngredientsForMealOption(dish.id, variantId, [dish]).map(i => i.name);
}

const VARIANT = (id: string, name: string, extra: Partial<DishVariant> = {}): DishVariant => ({ id, name, ...extra });

describe('regional protein words resolve future dishes WITHOUT explicit data', () => {
  const cases: Array<{ id: string; name: string; type: DishType; variant: DishVariant; want: string }> = [
    // chicken — Kundapura koli, Kerala kozhi
    { id: 'koli-curry', name: 'Koli Curry', type: 'non-veg', variant: VARIANT('kc-classic', 'Koli Curry'), want: 'Chicken' },
    { id: 'x-koli-chettinad', name: 'Koli Chettinad', type: 'non-veg', variant: VARIANT('xkc-classic', 'Koli Chettinad'), want: 'Chicken' },
    { id: 'kozhi-roast', name: 'Kozhi Roast', type: 'non-veg', variant: VARIANT('kr-classic', 'Kozhi Roast'), want: 'Chicken' },
    // mutton — erachi/botti/nalli (non-veg contexts only)
    { id: 'erachi-roast', name: 'Erachi Roast', type: 'non-veg', variant: VARIANT('er-classic', 'Erachi Roast'), want: 'Mutton' },
    { id: 'botti-gravy', name: 'Botti Gravy', type: 'non-veg', variant: VARIANT('bg-classic', 'Botti Gravy'), want: 'Mutton' },
    { id: 'nalli-stew', name: 'Nalli Stew', type: 'non-veg', variant: VARIANT('ns-classic', 'Nalli Stew'), want: 'Mutton' },
    // fish — maach/nga/macchi (non-veg contexts only)
    { id: 'maach-bhaja-future', name: 'Maach Bhaja', type: 'non-veg', variant: VARIANT('mbf-classic', 'Maach Bhaja'), want: 'Fish' },
    { id: 'nga-thongba-future', name: 'Nga Thongba', type: 'non-veg', variant: VARIANT('ntf-classic', 'Nga Thongba'), want: 'Fish' },
    { id: 'macchi-fry', name: 'Macchi Fry', type: 'non-veg', variant: VARIANT('mf-classic', 'Macchi Fry'), want: 'Fish' },
    // smoked/fermented fish
    { id: 'nakham-chutney', name: 'Nakham Chutney', type: 'non-veg', variant: VARIANT('nc-classic', 'Nakham Chutney'), want: 'Fish' },
    // egg — Bengali dim
    { id: 'dim-roll', name: 'Dim Roll', type: 'eggitarian', variant: VARIANT('dr-classic', 'Dim Roll'), want: 'Eggs' },
    // crab — Tamil nandu
    { id: 'nandu-gravy', name: 'Nandu Gravy', type: 'non-veg', variant: VARIANT('ng-classic', 'Nandu Gravy'), want: 'Crab' },
    // pork — Mizo vawksa, Khasi/Assamese doh (token-gated: jadoh/pudoh stay put)
    { id: 'vawksa-stew', name: 'Vawksa Stew', type: 'non-veg', variant: VARIANT('vs-classic', 'Vawksa Stew'), want: 'Pork' },
    { id: 'doh-neiiong-future', name: 'Doh Neiiong', type: 'non-veg', variant: VARIANT('dnf-classic', 'Doh Neiiong'), want: 'Pork' },
  ];

  for (const c of cases) {
    it(`${c.id} → ${c.want}`, () => {
      const names = resolve(futureDish(c.id, c.name, c.type, [c.variant]), c.variant.id);
      expect(names.some(n => n === c.want), `${c.id} resolved [${names.join(', ')}] but needs ${c.want}`).toBe(true);
    });
  }
});

describe('the light fill never strips a protein that lives in the VARIANT name', () => {
  it('thukpa-style base + "Chicken" variant keeps Chicken + light aromatics', () => {
    const dish = futureDish('future-thukpa', 'Future Thukpa', 'non-veg', [
      VARIANT('ft-chicken', 'Future Thukpa Chicken'),
    ]);
    const names = resolve(dish, 'ft-chicken');
    expect(names).toContain('Chicken');
    expect(names).toContain('Onion');
    expect(names).toContain('Tomato');
    expect(names).toContain('Water');
  });

  it('regional word in the VARIANT name (Koli) keeps Chicken too', () => {
    const dish = futureDish('future-thukpa', 'Future Thukpa', 'non-veg', [
      VARIANT('ft-koli', 'Future Thukpa Koli'),
    ]);
    expect(resolve(dish, 'ft-koli')).toContain('Chicken');
  });

  it('appam-stew-style "with Egg" variant keeps Eggs', () => {
    const dish = futureDish('future-appam-stew', 'Future Appam Stew', 'non-veg', [
      VARIANT('fas-egg', 'Future Appam Stew with Egg'),
    ]);
    expect(resolve(dish, 'fas-egg')).toContain('Eggs');
  });

  it('protein ONLY in the variant name (base name carries no signal) survives', () => {
    const dish = futureDish('future-soup', 'Future Soup', 'non-veg', [
      VARIANT('fs-chicken', 'Future Soup Chicken'),
    ]);
    const names = resolve(dish, 'fs-chicken');
    expect(names).toContain('Chicken');
    expect(names).toContain('Tomato');
  });
});

describe('ensureNameMains adds a regional main to an explicit-but-incomplete future recipe', () => {
  const ING = (name: string, category: 'proteins' | 'produce' | 'pantry') => ({ name, quantity: 1, unit: 'pc', category });

  it('koli-fry with real-but-incomplete explicit data gains Chicken', () => {
    const dish = futureDish('koli-fry', 'Koli Fry', 'non-veg', [
      { id: 'kf-classic', name: 'Koli Fry', ingredients: [ING('Onion', 'produce'), ING('Oil', 'pantry')] },
    ]);
    expect(resolve(dish, 'kf-classic')).toContain('Chicken');
  });

  it('maach-jhol with real-but-incomplete explicit data gains Fish', () => {
    const dish = futureDish('maach-jhol', 'Maach Jhol', 'non-veg', [
      { id: 'mj-classic', name: 'Maach Jhol', ingredients: [ING('Onion', 'produce'), ING('Mustard Oil', 'pantry')] },
    ]);
    expect(resolve(dish, 'mj-classic')).toContain('Fish');
  });

  it('dim-toast with real-but-incomplete explicit data gains Eggs', () => {
    const dish = futureDish('dim-toast', 'Dim Toast', 'eggitarian', [
      { id: 'dt-classic', name: 'Dim Toast', ingredients: [ING('Bread', 'pantry')] },
    ]);
    expect(resolve(dish, 'dt-classic')).toContain('Eggs');
  });
});

describe('veg/vegan future dishes NEVER gain a regional protein (collision guards)', () => {
  const cases: Array<{ id: string; name: string; type: DishType; variantId: string }> = [
    // 'nga' lives INSIDE baingan/longa/mangalorean — must not fire
    { id: 'baingan-future-stew', name: 'Baingan Stew', type: 'vegan', variantId: 'bfs-classic' },
    { id: 'longa-veg-stew', name: 'Longa Veg Stew', type: 'veg', variantId: 'lvs-classic' },
    // 'macchi' lives INSIDE veg macchiato — must not fire
    { id: 'macchiato-lite-future', name: 'Macchiato', type: 'veg', variantId: 'mlf-classic' },
    // 'doh' lives INSIDE pudoh/jadoh — must not fire
    { id: 'pudoh-future', name: 'Pudoh', type: 'veg', variantId: 'puf-classic' },
    // 'dim' gated like the existing egg rule (vegan never gets eggs) — name
    // carries no egg signal so ONLY the id-rule gate is exercised
    { id: 'vegan-dim-roll', name: 'Vegetable Roll', type: 'vegan', variantId: 'vdr-classic' },
    // a genuine veg light soup stays light (no protein, aromatics only)
    { id: 'veg-soup-future', name: 'Veg Soup', type: 'veg', variantId: 'vsf-classic' },
  ];

  for (const c of cases) {
    it(`${c.id} resolves NO protein`, () => {
      const dish = futureDish(c.id, c.name, c.type, [VARIANT(c.variantId, c.name)]);
      const ings = getIngredientsForMealOption(dish.id, c.variantId, [dish]);
      const proteins = ings.filter(i => i.category === 'proteins').map(i => i.name);
      expect(proteins, `${c.id} gained proteins [${proteins.join(', ')}]`).toEqual([]);
    });
  }

  it('a veg light soup still gets the light aromatics fill', () => {
    const dish = futureDish('veg-soup-future', 'Veg Soup', 'veg', [VARIANT('vsf-classic', 'Veg Soup')]);
    const names = resolve(dish, 'vsf-classic');
    expect(names).toContain('Onion');
    expect(names).toContain('Tomato');
  });
});
