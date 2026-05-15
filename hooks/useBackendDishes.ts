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
        const abortController = new AbortController();
        const { signal } = abortController;

        const storeLen = useStore.getState().dishes.length;
        if (storeLen > 0) {
            const stored = useStore.getState().dishes;
            setDishes(stored);
            setSource('store');
            setIsLoading(false);
            setError(null);
            loadLocalDishesOnce().then(local => {
                if (signal.aborted) return;
                const storedIds = new Set(stored.map(d => d.id));
                const missing = local.filter(d => !storedIds.has(d.id));
                if (missing.length > 0) {
                    const merged = [...stored, ...missing];
                    useStore.getState().setDishes(merged);
                    setDishes(merged);
                    setSource('mixed');
                }
            });
            return;
        }

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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
