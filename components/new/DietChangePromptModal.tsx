import React, { useState } from 'react';
import { RefreshCw, Clock, X, UtensilsCrossed } from 'lucide-react';
import { useBackButtonClose } from '../../hooks/useBackButtonClose';
import { useStore } from '../../app/store/useStore';
import type { TrayRegenResult } from '../../utils/trayRegen';

interface DietChangePromptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * PART B — "Apply to my current meal plan / Apply from my next meal plan".
 *
 * Shown when PUT /api/v1/diet reports a REAL dietType change against a
 * previous row (dietChanged && !wasUnset && changed.dietType — armed by
 * syncDietToServer). The user picks:
 *   [Apply to my current meal plan]  → rebuildTrayForDiet() — the canonical
 *     rebuild now runs the 20/20 regeneration pipeline (generate → validate →
 *     fill → dedupe → validate → render) so the final tray is target×4 dishes
 *     (20/20 on a 7-day loop), diet-compatible on EVERY dish, with no
 *     whole-plan duplicate dish_ids. Success toast states completeness
 *     honestly (a partial tray is surfaced with its reasons, never silent).
 *   [Apply from my next meal plan]   → deferDietRegen() — persistent flag
 *     consumed at the next plan-end boundary / app-start surface; the current
 *     plan is left UNCHANGED.
 *   [Not now / skip]                 → dismissDietRegen() — persisted, NEVER
 *     re-nags; the user can still rebuild from Manage tray.
 * If the rebuild errors, the error is surfaced (toast) — never silently skipped.
 */
export const DietChangePromptModal: React.FC<DietChangePromptModalProps> = ({ isOpen, onClose }) => {
  const pending = useStore(s => s.pendingDietChange);
  const deferDietRegen = useStore(s => s.deferDietRegen);
  const dismissDietRegen = useStore(s => s.dismissDietRegen);
  const setPendingDietChange = useStore(s => s.setPendingDietChange);
  const setToast = useStore(s => s.setToast);
  const [busy, setBusy] = useState(false);

  useBackButtonClose(isOpen, onClose);
  if (!isOpen || !pending) return null;

  const handleNow = async () => {
    // "Apply to my current meal plan" — immediately replace incompatible
    // dishes and regenerate the WHOLE plan via the 20/20 pipeline.
    setBusy(true);
    try {
      const { rebuildTrayForDiet } = await import('../../utils/trayRegen');
      const result: TrayRegenResult = await rebuildTrayForDiet();
      setPendingDietChange(null);
      const parts: string[] = [];
      if (result.invalidRemoved > 0) parts.push(`${result.invalidRemoved} old dish${result.invalidRemoved === 1 ? '' : 'es'} removed`);
      if (result.trayAdded > 0) parts.push(`${result.trayAdded} new dish${result.trayAdded === 1 ? '' : 'es'} added`);
      if (result.deduped > 0) parts.push(`${result.deduped} duplicate${result.deduped === 1 ? '' : 's'} replaced`);
      if (result.applied) parts.push('plan rebuilt');
      if (result.laneCleared) parts.push('household lane refreshed');
      // Honest completeness: the 20/20 contract is stated only when real.
      const total = result.target * 4;
      if (result.complete) {
        parts.push(`${total}/${total} dishes match your diet`);
      }
      const kept = parts.length > 0
        ? `Meal plan updated — ${parts.join(', ')}`
        : 'Tray checked — your dishes already match this diet';
      if (result.customKept > 0) {
        setToast({
          message: `${kept}. ${result.customKept} custom dish${result.customKept === 1 ? '' : 'es'} kept (not in our library).`,
          type: 'success',
        });
      } else if (result.shortSlots.length > 0) {
        // Λ2.3 — an unfillable slot is surfaced with its recorded reason,
        // never silently rendered as complete.
        const why = result.reasons[0] ? ` (${result.reasons[0]})` : '';
        setToast({
          message: `${kept}. ${result.shortSlots.length} slot${result.shortSlots.length === 1 ? '' : 's'} couldn't be filled for this diet+region${why} — try a nearby region or add dishes from Manage tray.`,
          type: 'info',
        });
      } else {
        setToast({ message: kept, type: 'success' });
      }
      onClose();
    } catch (err: any) {
      // Failure path: surface, don't silently skip (the store's dietRegen flag
      // stays unset; the user can retry from the prompt).
      console.error('[DietChangePrompt] rebuild failed:', err);
      setToast({ message: `Couldn't refresh dishes: ${err?.message ?? 'unknown error'}`, type: 'error' });
      onClose();
    } finally {
      setBusy(false);
    }
  };

  const handleAfterCycle = () => {
    // "Apply from my next meal plan" — keep the current plan unchanged, save
    // the preference, and let the next plan generation use the new diet.
    deferDietRegen();
    setToast({
      message: 'Preference saved — your new diet will apply from your next meal plan. Current plan unchanged.',
      type: 'info',
    });
    onClose();
  };

  const handleSkip = () => {
    dismissDietRegen();
    setToast({ message: 'No changes made. You can rebuild anytime from Manage tray.', type: 'info' });
    onClose();
  };

  const label = pending.from === pending.to
    ? `Your diet preference is now ${pending.to}`
    : `Your diet preference changed from ${pending.from} to ${pending.to}`;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center px-6" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={busy ? undefined : onClose} />
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-200">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center mb-4">
          <UtensilsCrossed size={24} className="text-[#FF385C]" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">How should we apply your new diet preference?</h3>
        <p className="text-sm text-gray-600 mb-1 leading-relaxed">
          {label}. Your tray still holds dishes from the previous preference.
        </p>
        <p className="text-xs text-gray-400 mb-5 leading-relaxed">
          Apply the change to your current meal plan now, or roll it into your next meal plan.
        </p>
        <div className="flex flex-col gap-2">
          <button
            onClick={handleNow}
            disabled={busy}
            className="flex items-center justify-center gap-2 py-3 rounded-xl bg-[#FF385C] text-white font-bold text-sm active:scale-[0.98] transition-all shadow-lg shadow-[#FF385C]/30 hover:bg-[#e03050] disabled:opacity-60"
          >
            <RefreshCw size={15} className={busy ? 'animate-spin' : ''} />
            Apply to my current meal plan
          </button>
          <button
            onClick={handleAfterCycle}
            disabled={busy}
            className="flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-100 text-gray-700 font-bold text-sm active:scale-[0.98] transition-all disabled:opacity-60"
          >
            <Clock size={15} />
            Apply from my next meal plan
          </button>
          <button
            onClick={handleSkip}
            disabled={busy}
            className="flex items-center justify-center gap-2 py-2 text-xs text-gray-400 font-semibold active:opacity-70"
          >
            <X size={13} />
            Not now — I'll manage the tray myself
          </button>
        </div>
      </div>
    </div>
  );
};

export default DietChangePromptModal;
