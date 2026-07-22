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
    const [dishes, setDishes] = useState<Dish[]>([]);
    const [source, setSource] = useState<'store' | 'backend' | 'local' | 'mixed'>('local');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            const local = await loadLocalDishesOnce();
            const storeDishes = useStore.getState().dishes;
            const best = local.length >= (storeDishes?.length || 0) ? local : storeDishes;
            if (cancelled) return;
            setDishes(best);
            setSource(best === local ? 'local' : 'store');
            setIsLoading(false);
            setError(null);
        })();
        return () => { cancelled = true; };
    }, []);

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
