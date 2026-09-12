// ─────────────────────────────────────────────────────────────────────────────
// PERSONALIZATION HINT — the honest "no history yet" state (rule: never
// backfill pre-feature history).
//
// Shown ONLY while the persisted MealLog (the REAL "consumed" rows written by
// the complete-slot flow) is CONFIRMED loaded AND empty. Once the user has
// logged even one meal, the hint replaces itself with nothing — personalization
// is then driven by real history. While the log is still loading, offline, or
// unauthenticated, NOTHING renders — an unreachable log is never assumed empty.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useEffect, useState } from 'react';
import { useStore } from '../../app/store/useStore';
import { hasPersistedMealHistory, isMealHistoryLoaded, refreshMealHistory, getMealHistoryCount } from '../../app/lib/mealHistory';

/** Pure state selector — exported for tests: true ONLY when the persisted log
 *  is CONFIRMED loaded AND empty (the hint's show condition). */
export function shouldShowPersonalizationHint(userId: string | undefined | null): boolean {
  if (!userId) return false;
  if (!isMealHistoryLoaded(userId)) return false;       // unconfirmed → no claim
  return getMealHistoryCount(userId) === 0 && !hasPersistedMealHistory(userId);
}

/** THE honest empty-history state — contextual to the Plan screen. */
export const PersonalizationHint: React.FC = () => {
  const userId = useStore(s => s.user?.id);
  const [, force] = useState(0);

  useEffect(() => {
    if (!userId) return;
    let alive = true;
    // Fire-and-forget refresh; the cache drives the state (never blocks UI).
    void refreshMealHistory(userId).then(() => { if (alive) force(n => n + 1); });
    return () => { alive = false; };
  }, [userId]);

  if (!shouldShowPersonalizationHint(userId)) return null;

  return (
    <div className="mx-4 mb-4 rounded-2xl border border-amber-200/60 bg-amber-50/70 px-4 py-3" role="status" data-testid="personalization-hint">
      <p className="text-xs font-bold text-gray-800">✨ Personalization will improve as you use the app</p>
      <p className="text-[11px] text-gray-500 mt-0.5">
        Complete and swap meals — once you have real history, your plans adapt to it.
      </p>
    </div>
  );
};

export default PersonalizationHint;
