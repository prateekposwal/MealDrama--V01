import { useEffect, useState } from 'react';
import type { Dish, DishVariant, IngredientCategory } from '../constants/dishLibrary';
import { useStore } from '../store/useStore';
import api from '../lib/api';

type DishFromBackend = {
    id: string;
    name: string;
    icon: string;
    region: string;
    states: string[];
    category: string[];
    type: string;
    weight: string;
    nutrition: string[];
    tags: string[];
    season?: string[];
    variants: {
        id: string;
        name: string;
        baseStyle?: string;
        cookingStyle?: string;
        addOn?: string;
        mealContext?: string;
        regionOverride?: string;
        accompaniments?: string[];
        _ingredients?: { name: string; quantity: number; unit: string; category: string }[];
    }[];
};

function mapBackendDish(d: DishFromBackend): Dish {
    return {
        id: d.id,
        name: d.name,
        icon: d.icon,
        region: d.region as Dish['region'],
        states: d.states,
        category: d.category as Dish['category'],
        type: d.type as Dish['type'],
        weight: d.weight as Dish['weight'],
        nutrition: d.nutrition,
        tags: d.tags,
        season: d.season,
        variants: d.variants.map(v => ({
            id: v.id,
            name: v.name,
            baseStyle: v.baseStyle,
            cookingStyle: v.cookingStyle,
            addOn: v.addOn,
            mealContext: v.mealContext as DishVariant['mealContext'],
            regionOverride: v.regionOverride,
            accompaniments: v.accompaniments,
            ingredients: (v._ingredients || []).map(ing => ({
                name: ing.name,
                quantity: ing.quantity,
                unit: ing.unit,
                category: ing.category as IngredientCategory,
            })),
        })),
    };
}

// Lazy-loaded — only fetched when backend is unavailable
let _localDishLib: Dish[] | null = null;
const _localDishPromise = import('../constants/dishLibrary').then(m => {
    _localDishLib = m.DISH_LIBRARY;
});

async function getLocalDishes(): Promise<Dish[]> {
    if (_localDishLib) return _localDishLib;
    await _localDishPromise;
    return _localDishLib!;
}

export function useBackendDishes() {
    const storeDishes = useStore(s => s.dishes);
    const [dishes, setDishes] = useState<Dish[]>(storeDishes.length > 0 ? storeDishes : []);
    const [source, setSource] = useState<'store' | 'backend' | 'local' | 'mixed'>(
        storeDishes.length > 0 ? 'store' : 'local'
    );
    const [isLoading, setIsLoading] = useState(storeDishes.length === 0);

    useEffect(() => {
        if (storeDishes.length > 0) {
            setDishes(storeDishes);
            setSource('store');
            setIsLoading(false);
            return;
        }

        let cancelled = false;

        async function load() {
            try {
                const res = await api.get<{ data: DishFromBackend[]; total: number }>('/meals', { timeout: 8000 });
                if (!cancelled && res.data?.length > 0) {
                    setDishes(res.data.map(mapBackendDish));
                    setSource('backend');
                } else if (!cancelled) {
                    const local = await getLocalDishes();
                    if (!cancelled) { setDishes(local); setSource('local'); }
                }
            } catch (err) {
                if (!cancelled) {
                    console.log('[useBackendDishes] Backend unavailable, loading local library…');
                    const local = await getLocalDishes();
                    if (!cancelled) { setDishes(local); setSource('local'); }
                }
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }

        load();
        return () => { cancelled = true; };
    }, [storeDishes.length]);

    return { dishes, source, isLoading };
}
