import { useEffect, useState, useCallback } from 'react';
import type { Dish } from '../meal/constants/dishLibrary';
import { useStore } from '../app/store/useStore';

let _loaded = false;

const getDishLibrary = () => import('../meal/constants/dishLibrary').then(m => m.DISH_LIBRARY);

async function loadLocalDishesOnce(): Promise<Dish[]> {
    if (_loaded) {
        const storeDishes = useStore.getState().dishes;
        return storeDishes as Dish[];
    }
    _loaded = true;
    const local = await getDishLibrary();
    useStore.getState().setDishes(local);
    return local;
}

export function useBackendDishes() {
    const storeDishes = useStore(s => s.dishes);
    const customDishes = useStore(s => s.customDishes);
    const [dishes, setDishes] = useState<Dish[]>([]);
    const [source, setSource] = useState<'store' | 'backend' | 'local' | 'mixed'>('local');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            const local = await loadLocalDishesOnce();
            const storeDishes = useStore.getState().dishes;
            const custom = useStore.getState().customDishes || [];
            let best = local.length >= (storeDishes?.length || 0) ? local : storeDishes;
            // Merge custom dishes into the list — dedupe by id AND normalized
            // name (a custom dish cloning a library name must not render twice).
            if (custom.length > 0) {
                const norm = (s: string) => (s || '').trim().toLowerCase();
                const existingIds = new Set(best.map(d => d.id));
                const existingNames = new Set(best.map(d => norm(d.name)));
                const newCustom = custom.filter(d => !existingIds.has(d.id) && !existingNames.has(norm(d.name)));
                best = [...newCustom, ...best];
            }
            if (cancelled) return;
            setDishes(best);
            setSource(best === local ? 'local' : 'store');
            setIsLoading(false);
            setError(null);
        })();
        return () => { cancelled = true; };
    }, [customDishes.length]);

    const retry = useCallback(async () => {
        _loaded = false;
        const local = await loadLocalDishesOnce();
        setDishes(local);
        setSource('local');
        setIsLoading(false);
        setError(null);
    }, []);

    return { dishes, source, isLoading, error, retry };
}
