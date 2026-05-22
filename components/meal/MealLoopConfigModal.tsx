import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { X, Check, RefreshCw, Calendar } from 'lucide-react';
import type { MealType, MealLoopConfig } from '../../types/tray';
import type { RepeatPattern } from '../../types/tray';
import { validateSourcePool, buildLoopAssignments, buildLoopSummary, type SourcePool } from '../../utils/mealLoopEngine';
import { useTrayStore } from '../../store/useTrayStore';
import { getISODate } from '../../utils/dateUTC';
import { CycleLengthSelector } from './CycleLengthSelector';
import { SkipDaysPicker } from './SkipDaysPicker';
import { RepeatPatternSelector } from './RepeatPatternSelector';
import { InsertStrategySelector } from './InsertStrategySelector';

const SLOT_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  snacks: 'Snacks',
  dinner: 'Dinner',
};

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const STRATEGY_LABELS: Record<string, string> = {
  append: 'Append',
  'smart-shuffle': 'Smart Shuffle',
  immediate: 'Immediate',
  'next-cycle': 'Next Cycle',
};

interface MealLoopConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourcePool: SourcePool;
  onApply: (config: MealLoopConfig) => void;
  onFixSlots?: (targetSlot: MealType) => void;
}

const MealLoopConfigModal: React.FC<MealLoopConfigModalProps> = ({
  isOpen,
  onClose,
  sourcePool,
  onApply,
  onFixSlots,
}) => {
  const mealLoop = useTrayStore(s => s.mealLoop);
  const savedConfig = mealLoop.config;
  const savedDishIds = mealLoop.sourceDishIds;
  const [cycleLength, setCycleLength] = useState(savedConfig?.cycleLength ?? 7);
  const [startDate, setStartDate] = useState(savedConfig?.startDate ?? getISODate(new Date()));
  const [skipDays, setSkipDays] = useState<number[]>(savedConfig?.skipDays ?? [0, 6]);
  const [repeatPattern, setRepeatPattern] = useState<RepeatPattern>(savedConfig?.repeatPattern ?? 'random');
  const [insertStrategy, setInsertStrategy] = useState<InsertStrategy>(savedConfig?.insertStrategy ?? 'append');

  const pool = sourcePool;

  const validation = useMemo(() => validateSourcePool(pool), [pool]);

  const isFirstTimeSetup = !savedConfig;

  const initialConfig = useRef({
    cycleLength: savedConfig?.cycleLength ?? 7,
    startDate: savedConfig?.startDate ?? getISODate(new Date()),
    skipDays: savedConfig?.skipDays ?? [0, 6],
    repeatPattern: savedConfig?.repeatPattern ?? 'random',
    insertStrategy: savedConfig?.insertStrategy ?? 'append',
  });

  const hasChanges = useMemo(() => {
    if (isFirstTimeSetup) return true;
    return (
      cycleLength !== initialConfig.current.cycleLength ||
      startDate !== initialConfig.current.startDate ||
      JSON.stringify([...skipDays].sort()) !== JSON.stringify([...initialConfig.current.skipDays].sort()) ||
      repeatPattern !== initialConfig.current.repeatPattern ||
      insertStrategy !== initialConfig.current.insertStrategy
    );
  }, [cycleLength, startDate, skipDays, repeatPattern, insertStrategy, isFirstTimeSetup]);

  const canSave = validation.valid && (isFirstTimeSetup || hasChanges);

  const toggleSkipDay = (day: number) => {
    setSkipDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day],
    );
  };
  const currentDishIds = useMemo(
    () => Object.values(pool).flat().map(d => d.id),
    [pool],
  );
  const trayPoolChanged = useMemo(() => {
    if (isFirstTimeSetup) return false;
    const oldSet = new Set(savedDishIds);
    return currentDishIds.some(id => !oldSet.has(id));
  }, [currentDishIds, savedDishIds, isFirstTimeSetup]);
  const showIntegrationOptions = !isFirstTimeSetup && trayPoolChanged;
  // ────────────────────────────────────────────────────────────────────────

  const previewConfig = useMemo((): MealLoopConfig => ({
    cycleLength,
    startDate,
    skipDays,
    repeatPattern,
    // When integration options are hidden, silently default to 'append'
    insertStrategy: showIntegrationOptions ? insertStrategy : 'append',
  }), [cycleLength, startDate, skipDays, repeatPattern, insertStrategy, showIntegrationOptions]);

  const { assignments: previewAssignments } = useMemo(
    () => buildLoopAssignments(pool, previewConfig),
    [pool, previewConfig],
  );

  const summary = useMemo(
    () => buildLoopSummary(previewConfig, previewAssignments),
    [previewConfig, previewAssignments],
  );

  const [showConfirm, setShowConfirm] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // FIX 2: Handle virtual keyboard obscuring inputs on mobile
  useEffect(() => {
    if (!isOpen) return;

    let initialHeight = window.innerHeight;
    const handleResize = () => {
      const currentHeight = window.innerHeight;
      // If height decreased by > 100px, keyboard likely appeared
      if (initialHeight - currentHeight > 100) {
        const active = document.activeElement as HTMLElement | null;
        if (active && active.tagName === 'INPUT') {
          active.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
      } else {
        initialHeight = currentHeight;
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen]);

  const handleApply = useCallback(() => {
    if (!validation.valid) return;
    // FIX 7: Custom confirmation dialog instead of window.confirm
    if (isFirstTimeSetup && !showConfirm) {
      setShowConfirm(true);
      return;
    }
    onApply(previewConfig);
    setShowConfirm(false);
  }, [validation.valid, previewConfig, onApply, isFirstTimeSetup, showConfirm]);

  if (!isOpen) return null;

  // FIX 5: Custom confirmation overlay with accessibility & focus trap
  if (showConfirm) {
    return (
      <div
        className="fixed inset-0 z-[70] flex items-center justify-center"
        role="dialog"
        aria-modal="true"
        aria-label="Confirm loop creation"
        onKeyDown={(e) => {
          if (e.key === 'Escape') setShowConfirm(false);
          // Focus trap for Tab key
          if (e.key === 'Tab') {
            const focusable = e.currentTarget.querySelectorAll('button');
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (e.shiftKey && document.activeElement === first) {
              e.preventDefault();
              (last as HTMLElement).focus();
            } else if (!e.shiftKey && document.activeElement === last) {
              e.preventDefault();
              (first as HTMLElement).focus();
            }
          }
        }}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowConfirm(false)} />
        <div
          className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-200"
          autoFocus
        >
          <h3 className="text-lg font-bold text-gray-900 mb-2">Create Meal Loop?</h3>
          <p className="text-sm text-gray-600 mb-4">
            This will auto-fill future days based on your tray dishes. You can undo this anytime in Profile.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setShowConfirm(false)}
              className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-600 font-bold text-sm active:scale-[0.98] transition-all"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                // FIX 3: Haptic feedback for critical mobile action
                if ('vibrate' in navigator) navigator.vibrate(15);
                setShowConfirm(false);
                onApply(previewConfig);
              }}
              className="flex-1 py-3 rounded-xl bg-[#FF385C] text-white font-bold text-sm active:scale-[0.98] transition-all shadow-lg shadow-[#FF385C]/30"
            >
              Create Loop
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center"
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
        // FIX 5: Focus trap for tablet/keyboard users — cycle Tab within modal
        if (e.key === 'Tab') {
          const modal = e.currentTarget.querySelector('[role="dialog"]');
          if (!modal) return;
          const focusable = modal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
          ) as NodeListOf<HTMLElement>;
          const focusableArray = Array.from(focusable).filter(el => !el.disabled && el.offsetParent !== null);
          if (focusableArray.length === 0) return;
          const first = focusableArray[0];
          const last = focusableArray[focusableArray.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div
        className="relative w-full sm:max-w-lg max-h-[90vh] bg-white rounded-t-[32px] sm:rounded-[32px] shadow-2xl animate-in slide-in-from-bottom-4 fade-in duration-200 flex flex-col overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Configure meal loop"
        tabIndex={-1}
      >
        {/* Header */}
        <div className="shrink-0 px-5 pt-5 pb-3 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RefreshCw size={16} className="text-[#FF385C]" />
              <h2 className="text-base font-black tracking-tight text-gray-900">
                Meal Loop
              </h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center bg-gray-100 active:scale-90"
              aria-label="Close"
            >
              <X size={14} className="text-gray-500" />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Configure how your tray dishes repeat across the plan
          </p>
        </div>

        {/* Content */}
        <div ref={contentRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Validation error */}
          {!validation.valid && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3">
              <p className="text-[10px] font-bold text-amber-700">
                {validation.errors.join('. ')}
              </p>
            </div>
          )}

          {/* Cycle Length */}
          <CycleLengthSelector value={cycleLength} onChange={setCycleLength} />

          {/* Start Date */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">
              <Calendar size={12} className="inline mr-1" />
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full rounded-xl py-2.5 px-3 text-sm font-medium border border-gray-200 bg-gray-50 text-gray-900"
            />
          </div>

          {/* Skip Days */}
          <SkipDaysPicker skipDays={skipDays} onToggle={toggleSkipDay} />

          {/* Repeat Pattern */}
          <RepeatPatternSelector value={repeatPattern} onChange={setRepeatPattern} />

          {/* Insert Strategy — only shown when a loop exists AND new dishes were added */}
          {showIntegrationOptions && (
            <InsertStrategySelector value={insertStrategy} onChange={setInsertStrategy} />
          )}

          {/* Your Preferences */}
          {validation.valid && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">
                <Check size={11} className="inline mr-1" /> Your Preferences
              </p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                <div>
                  <span className="text-gray-500">Cycle:</span>
                  <span className="font-bold text-gray-800 ml-1">{cycleLength} {skipDays.length ? 'Active' : 'Calendar'} Day{cycleLength !== 1 ? 's' : ''}</span>
                </div>
                <div>
                  <span className="text-gray-500">Pattern:</span>
                  <span className="font-bold text-gray-800 capitalize ml-1">{repeatPattern}</span>
                </div>
                <div>
                  <span className="text-gray-500">Skip:</span>
                  <span className="font-bold text-gray-800 ml-1">{skipDays.length ? skipDays.map(d => DAY_NAMES[d]).join(', ') : 'None'}</span>
                </div>
                {showIntegrationOptions && (
                  <div>
                    <span className="text-gray-500">New Dishes:</span>
                    <span className="font-bold text-gray-800 ml-1">{STRATEGY_LABELS[insertStrategy] ?? insertStrategy}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Summary Preview */}
          {validation.valid && (
            <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                Preview
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="font-bold text-gray-700">{summary.totalAssignments}</span>
                  <span className="text-gray-500 ml-1">meals</span>
                </div>
                <div>
                  <span className="font-bold text-gray-700">{summary.uniqueDishCount}</span>
                  <span className="text-gray-500 ml-1">unique dishes</span>
                </div>
                <div>
                  <span className="font-bold text-gray-700">{summary.cycleLength}</span>
                  <span className="text-gray-500 ml-1">day cycle</span>
                </div>
                <div>
                  <span className="font-bold text-gray-700 capitalize">{summary.repeatPattern}</span>
                  <span className="text-gray-500 ml-1">order</span>
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                {(Object.keys(summary.slotBreakdown) as MealType[]).map(slot => (
                  <div key={slot} className="flex-1 text-center">
                    <p className="text-[9px] font-bold text-gray-400">{SLOT_LABELS[slot].slice(0, 3)}</p>
                    <p className="text-xs font-black text-gray-700">{summary.slotBreakdown[slot]}</p>
                  </div>
                ))}
              </div>
              <p className="text-[9px] text-gray-400 pt-1">
                Starts {summary.startDate} · Skips {summary.skipDays.join(', ')}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 px-5 py-4 border-t border-gray-100 bg-white flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-600 font-bold text-sm active:scale-[0.98] transition-all"
          >
            Cancel
          </button>
          <button
            onClick={canSave ? handleApply : () => {
              if (!validation.valid) {
                const missing = (['breakfast', 'lunch', 'snacks', 'dinner'] as MealType[]).find(s => pool[s].length === 0);
                onFixSlots?.(missing ?? 'breakfast');
              }
            }}
            disabled={!canSave}
            className={`flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
              canSave
                ? 'bg-[#FF385C] text-white active:scale-[0.98] shadow-lg shadow-[#FF385C]/30'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {validation.valid ? <Check size={14} /> : null}
            {validation.valid ? (isFirstTimeSetup ? 'Create Loop' : 'Save Changes') : 'Fix Slots'}
          </button>
        </div>

        <style>{`
          @media (prefers-reduced-motion: reduce) {
            .animate-in { animation: none !important; }
          }
        `}</style>
      </div>
    </div>
  );
};

export default React.memo(MealLoopConfigModal);
