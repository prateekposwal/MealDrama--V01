import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { Dish, DishVariant } from '../constants/dishLibrary';

const DEBOUNCE_MS = 300;
const CACHE_KEY = 'mealdrama-search-cache';
const CACHE_TTL_MS = 5 * 60 * 1000;
const FUZZY_THRESHOLD = 0.85;

interface SearchResult {
    dish: Dish;
    variant: DishVariant;
    confidence: number;
    matchesDiet: boolean;
}

interface SearchCacheEntry {
    query: string;
    results: SearchResult[];
    timestamp: number;
}

interface SearchAnalytics {
    query: string;
    regionFilter: string;
    resultsCount: number;
    latencyMs: number;
}

function levenshtein(a: string, b: string): number {
    const matrix: number[][] = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b[i - 1] === a[j - 1]) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }
    return matrix[b.length][a.length];
}

function fuzzyScore(query: string, target: string): number {
    const q = query.toLowerCase().trim();
    const t = target.toLowerCase().trim();
    if (t.includes(q)) return 1.0;
    if (q.includes(t)) return 0.9;
    const dist = levenshtein(q, t);
    const maxLen = Math.max(q.length, t.length);
    return maxLen === 0 ? 1.0 : 1 - dist / maxLen;
}

function loadCache(): SearchCacheEntry[] {
    try {
        const raw = localStorage.getItem(CACHE_KEY);
        if (!raw) return [];
        return JSON.parse(raw);
    } catch {
        return [];
    }
}

function saveCache(cache: SearchCacheEntry[]) {
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch {
    }
}

function getCached(query: string): SearchResult[] | null {
    const cache = loadCache();
    const entry = cache.find(
        e => e.query.toLowerCase() === query.toLowerCase() && Date.now() - e.timestamp < CACHE_TTL_MS
    );
    return entry?.results ?? null;
}

function setCached(query: string, results: SearchResult[]) {
    const cache = loadCache().filter(e => e.query.toLowerCase() !== query.toLowerCase());
    cache.push({ query, results, timestamp: Date.now() });
    if (cache.length > 50) cache.splice(0, cache.length - 50);
    saveCache(cache);
}

function logAnalytics(event: SearchAnalytics) {
    try {
        const existing = JSON.parse(localStorage.getItem('mealdrama-analytics') || '[]');
        existing.push({ type: 'meal_search', ...event, ts: Date.now() });
        if (existing.length > 500) existing.splice(0, existing.length - 500);
        localStorage.setItem('mealdrama-analytics', JSON.stringify(existing));
    } catch {
    }
}

export function useMealSearch({
    dishes,
    userRegion,
    userDiet,
}: {
    dishes: Dish[];
    userRegion: string;
    userDiet: string;
}) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isOffline, setIsOffline] = useState(!navigator.onLine);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const [searchCount, setSearchCount] = useState(0);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const requestCounterRef = useRef(0);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const onOnline = () => setIsOffline(false);
        const onOffline = () => setIsOffline(true);
        window.addEventListener('online', onOnline);
        window.addEventListener('offline', onOffline);
        return () => {
            window.removeEventListener('online', onOnline);
            window.removeEventListener('offline', onOffline);
        };
    }, []);

    const dietFilter = useMemo(() => {
        const map: Record<string, string[]> = {
            veg: ['veg'],
            'non-veg': ['veg', 'non-veg', 'eggitarian'],
            eggitarian: ['veg', 'eggitarian', 'non-veg'],
            vegan: ['veg', 'vegan'],
        };
        return map[userDiet?.toLowerCase()] || ['veg'];
    }, [userDiet]);

    const regionKey = (userRegion ?? '').toLowerCase().replace(' india', '');

    const search = useCallback(
        (q: string) => {
            const trimmed = q.trim();
            if (!trimmed) {
                setResults([]);
                setHighlightedIndex(-1);
                return;
            }

            const cached = getCached(trimmed);
            if (cached !== null) {
                setResults(cached);
                setHighlightedIndex(-1);
                const startTime = Date.now();
                logAnalytics({
                    query: trimmed,
                    regionFilter: userRegion,
                    resultsCount: cached.length,
                    latencyMs: 0,
                });
                return;
            }

            const currentRequestId = ++requestCounterRef.current;
            setIsSearching(true);
            const startTime = Date.now();

            const allResults: SearchResult[] = [];

            for (const dish of dishes) {
                const nameScore = fuzzyScore(trimmed, dish.name);
                const tagScore = Math.max(0, ...dish.tags.map(t => fuzzyScore(trimmed, t)));
                const variantScores = dish.variants.map(v => fuzzyScore(trimmed, v.name));
                const bestVariantScore = Math.max(0, ...variantScores);

                const confidence = Math.max(nameScore, tagScore * 0.7, bestVariantScore);

                if (confidence < FUZZY_THRESHOLD) continue;

                for (const variant of dish.variants) {
                    const vScore = fuzzyScore(trimmed, variant.name);
                    const combinedConfidence = Math.max(confidence, vScore * 0.9);
                    if (combinedConfidence < FUZZY_THRESHOLD) continue;

                    const matchesDiet = dietFilter.includes(dish.type);

                    allResults.push({
                        dish,
                        variant,
                        confidence: combinedConfidence,
                        matchesDiet,
                    });
                }
            }

            allResults.sort((a, b) => {
                if (a.confidence !== b.confidence) return b.confidence - a.confidence;
                const aRegional = a.dish.region.toLowerCase().includes(regionKey);
                const bRegional = b.dish.region.toLowerCase().includes(regionKey);
                if (aRegional && !bRegional) return -1;
                if (!aRegional && bRegional) return 1;
                if (a.matchesDiet && !b.matchesDiet) return -1;
                if (!a.matchesDiet && b.matchesDiet) return 1;
                return a.dish.name.localeCompare(b.dish.name);
            });

            if (currentRequestId === requestCounterRef.current) {
                setResults(allResults);
                setHighlightedIndex(-1);
                setIsSearching(false);
                setSearchCount(prev => prev + 1);

                const latency = Date.now() - startTime;
                logAnalytics({
                    query: trimmed,
                    regionFilter: userRegion,
                    resultsCount: allResults.length,
                    latencyMs: latency,
                });

                setCached(trimmed, allResults);
            }
        },
        [dishes, dietFilter, regionKey, userRegion]
    );

    useEffect(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        setHighlightedIndex(-1);

        if (!query.trim()) {
            setResults([]);
            setIsSearching(false);
            return;
        }

        setIsSearching(true);

        timerRef.current = setTimeout(() => {
            search(query);
        }, DEBOUNCE_MS);

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [query, search]);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setHighlightedIndex(prev =>
                    prev < results.length - 1 ? prev + 1 : 0
                );
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setHighlightedIndex(prev =>
                    prev > 0 ? prev - 1 : results.length - 1
                );
            } else if (e.key === 'Enter' && highlightedIndex >= 0 && highlightedIndex < results.length) {
                e.preventDefault();
                const selected = results[highlightedIndex];
                window.dispatchEvent(
                    new CustomEvent('meal-search:select', {
                        detail: { dish: selected.dish, variant: selected.variant },
                    })
                );
            } else if (e.key === 'Escape') {
                setQuery('');
                setResults([]);
                inputRef.current?.blur();
            }
        },
        [results, highlightedIndex]
    );

    return {
        query,
        setQuery,
        results,
        isSearching,
        isOffline,
        highlightedIndex,
        searchCount,
        inputRef,
        handleKeyDown,
    };
}
