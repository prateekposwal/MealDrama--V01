import { useEffect, useState, useCallback } from 'react';
import type { Dish } from '../constants/dishLibrary';
import { DISH_LIBRARY } from '../constants/dishLibrary';
import { useStore } from '../store/useStore';

// Static import of DISH_LIBRARY ensures Vite tracks the dependency for HMR.
// When dishLibrary.ts is updated, Vite invalidates this module too,
// so the new dishes are always available without a full page reload.
function getLocalDishes(): Dish[] {
    return DISH_LIBRARY;
}

// Module-level load guard: ensures dishes are loaded exactly once,
// regardless of how many components call useBackendDishes or StrictMode double-mounts.
let _loaded = false;

function loadLocalDishesOnce(): Dish[] {
    if (_loaded) return DISH_LIBRARY;
    _loaded = true;
    const local = getLocalDishes();
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
        const local = loadLocalDishesOnce();
        const best = local.length >= (storeDishes?.length || 0) ? local : storeDishes;
        if (cancelled) return;
        setDishes(best);
        setSource(best === local ? 'local' : 'store');
        setIsLoading(false);
        setError(null);
        return () => { cancelled = true; };
    }, []);

    const retry = useCallback(() => {
        _loaded = false;
        const local = loadLocalDishesOnce();
        setDishes(local);
        setSource('local');
        setIsLoading(false);
        setError(null);
    }, []);

    return { dishes, source, isLoading, error, retry };
}
