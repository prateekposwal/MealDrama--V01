import api from '../../lib/api';
import type { Dish, DishType, Weight } from '../../meal/constants/dishLibrary';

function toBackendPayload(dish: Record<string, unknown>) {
  return {
    name: (dish.name as string) ?? '',
    category: (dish.category as string) ?? 'lunch',
    dietType: (dish.type as string) ?? 'veg',
    defaultGravy: (dish.defaultGravy as string) ?? 'Default',
    defaultRoti: (dish.defaultRoti as string) ?? 'Phulka',
    defaultRice: (dish.defaultRice as string) ?? 'Plain',
    prepMinutes: (dish.prepMinutes as number) ?? 30,
    description: (dish.description as string) ?? '',
    ingredients: (dish.ingredients as string[]) ?? [],
  };
}

function fromBackendDish(record: Record<string, unknown>): Dish {
  return {
    id: record.id as string,
    name: record.name as string,
    icon: (record.icon as string) ?? '🍽️',
    category: record.category as Dish['category'],
    type: ((record.dietType as string) ?? 'veg') as DishType,
    region: '' as Dish['region'],
    states: [],
    nutrition: [],
    tags: [],
    variants: [],
    weight: 'light' as Weight,
    description: record.description as string | undefined,
    prepTime: (record.prepMinutes as number) ?? undefined,
  };
}

export async function fetchCustomDishes(): Promise<Dish[]> {
  try {
    const records = await api.get<Record<string, unknown>[]>('/custom-dishes');
    return records.map(fromBackendDish);
  } catch (err) {
    console.warn('[CustomDishApi] fetch failed:', err);
    return [];
  }
}

export async function createCustomDish(dish: Partial<Dish>): Promise<Dish | null> {
  try {
    const body = toBackendPayload(dish as unknown as Record<string, unknown>);
    const result = await api.post<Record<string, unknown>>('/custom-dishes', body);
    return fromBackendDish(result);
  } catch (err) {
    console.warn('[CustomDishApi] create failed:', err);
    return null;
  }
}

export async function updateCustomDish(id: string, updates: Partial<Dish>): Promise<boolean> {
  try {
    const body: Record<string, unknown> = {};
    const u = updates as unknown as Record<string, unknown>;
    if (u.name) body.name = u.name;
    if (u.type) body.dietType = u.type;
    if (u.defaultGravy) body.defaultGravy = u.defaultGravy;
    if (u.defaultRoti) body.defaultRoti = u.defaultRoti;
    if (u.defaultRice) body.defaultRice = u.defaultRice;
    if (u.prepMinutes) body.prepMinutes = u.prepMinutes;
    if (u.description !== undefined) body.description = u.description;
    await api.patch(`/custom-dishes/${id}`, body);
    return true;
  } catch (err) {
    console.warn('[CustomDishApi] update failed:', err);
    return false;
  }
}

export async function deleteCustomDish(id: string): Promise<boolean> {
  try {
    await api.delete(`/custom-dishes/${id}`);
    return true;
  } catch (err) {
    console.warn('[CustomDishApi] delete failed:', err);
    return false;
  }
}
