import type { TrayItem, Meal } from '../../types/tray';
import { aggregateSlotItems } from '../../types/tray';
import type { Dish, DishVariant } from '../constants/dishLibrary';
import { memoizeMulti } from '../../utils/memoize';

export interface FlattenedItem {
  category: string;
  name: string;
  quantity: number;
  unit: string;
}

export interface VariantOption {
  id: string;
  name: string;
  dishId: string;
}

export class MealHelper {
  static resolveVariants(dishId: string, dishes: Dish[]): VariantOption[] {
    const dish = dishes.find(d => d.id === dishId);
    if (!dish || !dish.variants?.length) return [];
    return dish.variants.map(v => ({
      id: v.id,
      name: v.name,
      dishId: dish.id,
    }));
  }

  static aggregateSlotItemsCached = memoizeMulti(
    (slotKey: string, _json: string) => {
      const items: TrayItem[] = JSON.parse(_json);
      return aggregateSlotItems(items);
    },
    50,
  );

  static flattenCategorySelections(items: TrayItem[]): FlattenedItem[] {
    const agg = aggregateSlotItems(items);
    const result: FlattenedItem[] = [];

    for (const g of agg.gravy) result.push({ category: 'gravy', name: g.name, quantity: g.totalQty, unit: g.unit });
    for (const r of agg.roti) result.push({ category: 'roti', name: r.name, quantity: r.totalQty, unit: r.unit });
    for (const r of agg.rice) result.push({ category: 'rice', name: r.name, quantity: r.totalQty, unit: r.unit });
    for (const s of agg.sides) result.push({ category: 'sides', name: s.name, quantity: s.totalQty, unit: s.unit });
    for (const b of agg.beverages) result.push({ category: 'beverages', name: b.name, quantity: b.totalQty, unit: b.unit });
    for (const d of agg.dessert) result.push({ category: 'dessert', name: d.name, quantity: d.totalQty, unit: d.unit });

    return result;
  }

  static getDishById(dishId: string, dishes: Dish[]): Dish | undefined {
    return dishes.find(d => d.id === dishId);
  }

  static getMealTitle(items: TrayItem[]): string {
    return items.map(i => i.title || i.name).filter(Boolean).join(', ');
  }
}
