import { useEffect, useState, useCallback } from 'react';
import type { Dish } from '../constants/dishLibrary';
import { useStore } from '../store/useStore';

// Lazy-loaded
let _localDishLib: Dish[] | null = null;
const _localDishPromise = import('../constants/dishLibrary').then(m => {
    _localDishLib = m.DISH_LIBRARY;
});

async function getLocalDishes(): Promise<Dish[]> {
    if (_localDishLib) return _localDishLib;
    await _localDishPromise;
    return _localDishLib!;
}

// Module-level load guard: ensures dishes are loaded exactly once,
// regardless of how many components call useBackendDishes or StrictMode double-mounts.
let _loadPromise: Promise<Dish[]> | null = null;
let _loadError: Error | null = null;

async function loadLocalDishesOnce(): Promise<Dish[]> {
    if (_loadPromise) return _loadPromise;
    _loadPromise = getLocalDishes().then(local => {
        useStore.getState().setDishes(local);
        return local;
    }).catch(e => {
        _loadError = e;
        throw e;
    });
    return _loadPromise;
}

export function useBackendDishes() {
    const storeDishes = useStore(s => s.dishes);
    const [dishes, setDishes] = useState<Dish[]>(storeDishes.length > 0 ? storeDishes : []);
    const [source, setSource] = useState<'store' | 'backend' | 'local' | 'mixed'>(
        storeDishes.length > 0 ? 'store' : 'local'
    );
    const [isLoading, setIsLoading] = useState(storeDishes.length === 0);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // H4: React to store hydration — if dishes appear in store after mount, use them
        if (storeDishes.length > 0) {
            setDishes(storeDishes);
            setSource('store');
            setIsLoading(false);
            setError(null);
            return;
        }

        const abortController = new AbortController();
        const { signal } = abortController;

        loadLocalDishesOnce().then(local => {
            if (signal.aborted) return;
            setDishes(local);
            setSource('local');
            setIsLoading(false);
            setError(null);
        }).catch(() => {
            if (signal.aborted) return;
            setIsLoading(false);
            setError(
                _loadError
                    ? 'Failed to load dishes. Check your connection and try again.'
                    : 'Failed to load dishes.'
            );
        });

        return () => {
            abortController.abort();
        };
    }, [storeDishes.length]);

    const retry = useCallback(() => {
        _loadPromise = null;
        _loadError = null;
        setIsLoading(true);
        setError(null);
        loadLocalDishesOnce().then(local => {
            setDishes(local);
            setSource('local');
            setIsLoading(false);
            setError(null);
        }).catch(() => {
            setIsLoading(false);
            setError('Failed to load dishes. Check your connection and try again.');
        });
    }, []);

    return { dishes, source, isLoading, error, retry };
}
