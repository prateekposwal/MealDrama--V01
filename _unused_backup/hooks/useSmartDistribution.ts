import { useMemo, useCallback, useState } from 'react';
import type { MealOption, TrayLibrary } from '../store/useStore';
import type { Dish } from '../constants/dishLibrary';

const SOFT_CAP_PER_SLOT = 4;
const TOTAL_WEEKLY_SLOTS = 28;
const MIN_GAP_DAYS = 3;
const MAX_WEEKLY_REPEATS = 2;

export interface DayDistribution {
    date: string;
    label: string;
    dateLabel: string;
    meals: Record<string, MealOption | null>;
    isComplete: boolean;
    missingSlots: string[];
    locked: boolean;
}

export interface DistributionWarning {
    type: 'soft-cap' | 'incomplete-week' | 'repetition' | 'excess-queued';
    severity: 'error' | 'warning' | 'info';
    message: string;
    slot?: string;
    date?: string;
    dishName?: string;
}

export interface GapFillSuggestion {
    date: string;
    slot: string;
    meal: MealOption;
    reason: string;
    confidence: number;
}

export interface WeekAnalysis {
    days: DayDistribution[];
    totalFilled: number;
    totalSlots: number;
    completionPct: number;
    warnings: DistributionWarning[];
    gapFillSuggestions: GapFillSuggestion[];
    excessQueue: MealOption[];
    canFinalize: boolean;
}

function countDishOccurrences(trayLibrary: TrayLibrary, dishId: string): number {
    let count = 0;
    for (const slot of ['breakfast', 'lunch', 'snacks', 'dinner'] as const) {
        for (const meal of trayLibrary[slot]) {
            if (meal.dishId === dishId) count++;
        }
    }
    return count;
}

function findMinGapDays(trayLibrary: TrayLibrary, dishId: string, slotKey: string): number {
    const slot = slotKey as keyof TrayLibrary;
    const meals = trayLibrary[slot];
    const indices = meals.map((m, i) => (m.dishId === dishId ? i : -1)).filter(i => i >= 0);
    if (indices.length < 2) return Infinity;

    let minGap = Infinity;
    for (let i = 1; i < indices.length; i++) {
        const gap = (indices[i] ?? 0) - (indices[i - 1] ?? 0);
        if (gap < minGap) minGap = gap;
    }
    return minGap;
}

export function useSmartDistribution({
    trayLibrary,
    dishes,
    userRegion,
    weekDays,
}: {
    trayLibrary: TrayLibrary;
    dishes: Dish[];
    userRegion: string;
    weekDays: { isoDate: string; label: string; dateLabel: string }[];
}) {
    const [lockedDays, setLockedDays] = useState<Set<string>>(new Set());
    const [autoFillSlots, setAutoFillSlots] = useState<Record<string, string[]>>({});

    const analysis = useMemo((): WeekAnalysis => {
        const warnings: DistributionWarning[] = [];
        const gapFillSuggestions: GapFillSuggestion[] = [];
        const excessQueue: MealOption[] = [];
        let totalFilled = 0;
        const SLOT_KEYS = ['breakfast', 'lunch', 'snacks', 'dinner'] as const;
        const totalSlots = weekDays.length * 4;

        // Build day distributions
        const days: DayDistribution[] = weekDays.map(day => {
            const meals: Record<string, MealOption | null> = {};
            const missingSlots: string[] = [];

            for (const slot of SLOT_KEYS) {
                const slotMeals = trayLibrary[slot] || [];
                const dayIndex = weekDays.indexOf(day);
                const meal = slotMeals[dayIndex % slotMeals.length] || null;
                meals[slot] = meal;

                if (meal) {
                    totalFilled++;
                } else {
                    missingSlots.push(slot);
                }
            }

            // Soft cap check per slot type
            for (const slot of SLOT_KEYS) {
                const count = trayLibrary[slot]?.length || 0;
                if (count > SOFT_CAP_PER_SLOT) {
                    warnings.push({
                        type: 'soft-cap',
                        severity: 'warning',
                        message: `${slot.charAt(0).toUpperCase() + slot.slice(1)}: ${count}/${SOFT_CAP_PER_SLOT} selected. Extras saved to Week 2.`,
                        slot,
                    });
                    excessQueue.push(...(trayLibrary[slot] || []).slice(SOFT_CAP_PER_SLOT));
                }
            }

            return {
                date: day.isoDate,
                label: day.label,
                dateLabel: day.dateLabel,
                meals,
                isComplete: missingSlots.length === 0,
                missingSlots,
                locked: lockedDays.has(day.isoDate),
            };
        });

        // Incomplete week warning
        if (totalFilled < TOTAL_WEEKLY_SLOTS) {
            const remaining = TOTAL_WEEKLY_SLOTS - totalFilled;
            warnings.push({
                type: 'incomplete-week',
                severity: 'info',
                message: `Complete your week — ${remaining} slot${remaining !== 1 ? 's' : ''} remaining.`,
            });
        }

        // Repetition guard
        for (const slot of SLOT_KEYS) {
            const slotMeals = trayLibrary[slot] || [];
            const dishCount: Record<string, number> = {};
            for (const meal of slotMeals) {
                dishCount[meal.dishId] = (dishCount[meal.dishId] || 0) + 1;
            }

            for (const [dishId, count] of Object.entries(dishCount)) {
                if (count > MAX_WEEKLY_REPEATS) {
                    const dish = dishes.find(d => d.id === dishId);
                    warnings.push({
                        type: 'repetition',
                        severity: 'warning',
                        message: `${dish?.name || dishId} appears ${count}× this week (max ${MAX_WEEKLY_REPEATS}).`,
                        dishName: dish?.name,
                    });
                }
                const minGap = findMinGapDays(trayLibrary, dishId, slot);
                if (minGap < MIN_GAP_DAYS) {
                    const dish = dishes.find(d => d.id === dishId);
                    warnings.push({
                        type: 'repetition',
                        severity: 'warning',
                        message: `${dish?.name || dishId} gap: ${minGap} day${minGap !== 1 ? 's' : ''} (min ${MIN_GAP_DAYS}). Recently eaten.`,
                        dishName: dish?.name,
                    });
                }
            }
        }

        // Excess queue info
        if (excessQueue.length > 0) {
            warnings.push({
                type: 'excess-queued',
                severity: 'info',
                message: `${excessQueue.length} dish${excessQueue.length !== 1 ? 'es' : ''} saved to Week 2 queue.`,
            });
        }

        // Gap fill suggestions for empty slots
        const regionKey = (userRegion ?? '').toLowerCase().replace(' india', '');
        for (const day of days) {
            for (const slot of day.missingSlots) {
                if (day.locked) continue;
                const category = slot as string;
                const allowedTypes = ['veg', 'non-veg', 'eggitarian'];

                const pool = dishes.filter(d => {
                    if (!d.category.some(c => c.includes(category))) return false;
                    if (!allowedTypes.includes(d.type)) return false;
                    return true;
                });

                if (pool.length === 0) continue;

                const regional = pool.filter(d => d.region.toLowerCase().includes(regionKey));
                const candidates = regional.length > 0 ? regional : pool;
                const picked = candidates[Math.floor(Math.random() * Math.min(3, candidates.length))];

                if (picked) {
                    const variant = picked.variants[0];
                    gapFillSuggestions.push({
                        date: day.date,
                        slot,
                        meal: {
                            id: `${variant?.id || picked.id}-${Date.now()}`,
                            dishId: picked.id,
                            name: picked.name,
                            icon: picked.icon,
                            variant: variant?.name,
                            variantId: variant?.id,
                            addOn: variant?.addOn,
                            mealContext: variant?.mealContext,
                            quantity: 1,
                            countBased: picked.tags.some(t => ['paratha', 'roti', 'idli', 'dosa', 'naan', 'puri'].includes(t)),
                        },
                        reason: `Regional match: ${picked.region} India`,
                        confidence: regional.length > 0 ? 0.9 : 0.6,
                    });
                }
            }
        }

        const completionPct = totalSlots > 0 ? Math.round((totalFilled / totalSlots) * 100) : 0;
        const canFinalize = totalFilled > 0;

        return {
            days,
            totalFilled,
            totalSlots,
            completionPct,
            warnings,
            gapFillSuggestions,
            excessQueue,
            canFinalize,
        };
    }, [trayLibrary, dishes, userRegion, weekDays, lockedDays]);

    const toggleDayLock = useCallback((date: string) => {
        setLockedDays(prev => {
            const next = new Set(prev);
            if (next.has(date)) next.delete(date);
            else next.add(date);
            return next;
        });
    }, []);

    const applyGapFill = useCallback((suggestion: GapFillSuggestion) => {
        setAutoFillSlots(prev => ({
            ...prev,
            [suggestion.date]: [...(prev[suggestion.date] || []), suggestion.slot],
        }));
    }, []);

    const applyAllGapFills = useCallback(() => {
        setAutoFillSlots(prev => {
            const next: Record<string, string[]> = { ...prev };
            for (const suggestion of analysis.gapFillSuggestions) {
                next[suggestion.date] = [...(next[suggestion.date] || []), suggestion.slot];
            }
            return next;
        });
    }, [analysis.gapFillSuggestions]);

    return {
        analysis,
        lockedDays,
        autoFillSlots,
        toggleDayLock,
        applyGapFill,
        applyAllGapFills,
    };
}
