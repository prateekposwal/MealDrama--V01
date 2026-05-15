import { useEffect, useState, useCallback, useRef } from 'react';
import type { Dish, DishVariant, IngredientCategory } from '../constants/dishLibrary';
import { useStore } from '../store/useStore';
import api, { isAuthReady } from '../lib/api';

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
    const [error, setError] = useState<string | null>(null);
    const loadRef = useRef<((signal?: AbortSignal) => Promise<void>) | null>(null);

    useEffect(() => {
        const abortController = new AbortController();
        const { signal } = abortController;

        const storeLen = useStore.getState().dishes.length;
        console.log('[useBackendDishes] Mount — storeDishes.length:', storeLen, 'isAuthReady:', isAuthReady(), 'isLoading:', isLoading, 'source:', source);
        if (storeLen > 0) {
            const stored = useStore.getState().dishes;
            console.log('[useBackendDishes] Using store dishes, count:', stored.length);
            setDishes(stored);
            setSource('store');
            setIsLoading(false);
            setError(null);
            // Async merge: add local dishes not already in store (handles persisted stale cache)
            getLocalDishes().then(local => {
                if (signal.aborted) return;
                const storedIds = new Set(stored.map(d => d.id));
                const missing = local.filter(d => !storedIds.has(d.id));
                if (missing.length > 0) {
                    console.log('[useBackendDishes] Merging', missing.length, 'local dishes missing from store');
                    const merged = [...stored, ...missing];
                    useStore.getState().setDishes(merged);
                    setDishes(merged);
                    setSource('mixed');
                }
            });
            return;
        }

        async function load() {
            if (!isAuthReady()) {
                console.log('[useBackendDishes] Auth not ready, loading local dishes…');
                try {
                    const local = await getLocalDishes();
                    console.log('[useBackendDishes] Local dishes loaded, count:', local.length);
                    if (!signal.aborted) {
                        setDishes(local);
                        setSource('local');
                        setIsLoading(false);
                        setError(null);
                    }
                } catch (e) {
                    console.log('[useBackendDishes] Local dish load failed:', e);
                    if (!signal.aborted) {
                        setIsLoading(false);
                        setError('Failed to load local dishes');
                    }
                }
                return;
            }

            console.log('[useBackendDishes] Auth ready, fetching /meals…');
            try {
                const res = await api.get<{ data: DishFromBackend[]; total: number }>(
                    '/meals',
                    { timeout: 8000, signal }
                );
                if (signal.aborted) { console.log('[useBackendDishes] Aborted after API response'); return; }
                console.log('[useBackendDishes] API response — data.length:', res.data?.length, 'total:', res.total);
                if (res.data?.length > 0) {
                    const backendDishes = res.data.map(mapBackendDish);
                    const backendIds = new Set(backendDishes.map(d => d.id));
                    const local = await getLocalDishes();
                    for (const localDish of local) {
                        if (!backendIds.has(localDish.id)) {
                            backendDishes.push(localDish);
                        }
                    }
                    const source: 'backend' | 'mixed' = backendDishes.length > res.data.length ? 'mixed' : 'backend';
                    console.log('[useBackendDishes] Backend dishes resolved, source:', source, 'count:', backendDishes.length);
                    setDishes(backendDishes);
                    setSource(source);
                    setIsLoading(false);
                    setError(null);
                } else {
                    console.log('[useBackendDishes] Empty API response, falling back to local');
                    const local = await getLocalDishes();
                    if (!signal.aborted) {
                        setDishes(local);
                        setSource('local');
                        setIsLoading(false);
                        setError(null);
                    }
                }
            } catch (e) {
                console.log('[useBackendDishes] Backend fetch failed:', e);
                if (!signal.aborted) {
                    console.log('[useBackendDishes] Backend unavailable, loading local library…');
                    try {
                        const local = await getLocalDishes();
                        console.log('[useBackendDishes] Fallback local loaded, count:', local.length);
                        if (!signal.aborted) {
                            setDishes(local);
                            setSource('local');
                            setIsLoading(false);
                            setError(null);
                        }
                    } catch (e2) {
                        console.log('[useBackendDishes] Fallback local also failed:', e2);
                        if (!signal.aborted) {
                            setIsLoading(false);
                            setError('Failed to load dishes. Check your connection and try again.');
                        }
                    }
                }
            }
        }

        console.log('[useBackendDishes] loadRef set, calling load()');
        loadRef.current = load;
        load();

        return () => {
            console.log('[useBackendDishes] Cleanup — aborting');
            abortController.abort();
        };
        // Intentionally only run on mount; store length is checked inside via getState
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const retry = useCallback(() => {
        if (!loadRef.current) return;
        setIsLoading(true);
        setError(null);
        const abortController = new AbortController();
        loadRef.current(abortController.signal);
    }, []);

    return { dishes, source, isLoading, error, retry };
}
