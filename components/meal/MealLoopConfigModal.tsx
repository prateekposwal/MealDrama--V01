import React, { useState, useMemo, useCallback } from 'react';
import { X, Check, RefreshCw, Calendar, SkipForward, Shuffle, Zap, ArrowRightToLine } from 'lucide-react';
import type { MealType, MealLoopConfig, InsertStrategy } from '../../types/tray';
import type { RepeatPattern } from '../../types/tray';
import { validateSourcePool, buildLoopAssignments, buildLoopSummary, type SourcePool } from '../../utils/mealLoopEngine';
import { useTrayStore } from '../../store/useTrayStore';

const SLOT_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  snacks: 'Snacks',
  dinner: 'Dinner',
};

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

const STRATEGY_OPTIONS: { value: InsertStrategy; label: string; desc: string; icon: React.ReactNode }[] = [
  { value: 'append', label: 'Append to Cycle', desc: 'New dishes added to end of queue', icon: <ArrowRightToLine size={12} /> },
  { value: 'smart-shuffle', label: 'Smart Shuffle', desc: 'Insert into upcoming 7-day window', icon: <Shuffle size={12} /> },
  { value: 'immediate', label: 'Immediate Priority', desc: 'New dishes jump to next slot', icon: <Zap size={12} /> },
  { value: 'next-cycle', label: 'Next Cycle Only', desc: 'Wait until current cycle ends', icon: <Calendar size={12} /> },
];

function getISODate(d: Date): string {
  return d.toLocaleDateString('en-CA');
}

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

  const toggleSkipDay = (day: number) => {
    setSkipDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day],
    );
  };

  const pool = sourcePool;

  const validation = useMemo(() => validateSourcePool(pool), [pool]);

  // ─── Integration strategy visibility ──────────────────────────────────
  // Only show "When New Dishes Are Added" section when:
  //   1. A loop already exists (not first-time setup)
  //   2. New dishes have been added to the tray since the loop was configured
  const isFirstTimeSetup = !savedConfig;
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

  const handleApply = useCallback(() => {
    if (!validation.valid) return;
    onApply(previewConfig);
  }, [validation.valid, previewConfig, onApply]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div
        className="relative w-full sm:max-w-lg max-h-[90vh] bg-white rounded-t-[32px] sm:rounded-[32px] shadow-2xl animate-in slide-in-from-bottom-4 fade-in duration-200 flex flex-col overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Configure meal loop"
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
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Validation error */}
          {!validation.valid && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3">
              <p className="text-[10px] font-bold text-amber-700">
                {validation.errors.join('. ')}
              </p>
            </div>
          )}

          {/* Cycle Length */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">
              Cycle Length
            </label>
            <div className="flex items-center gap-3">
              {[3, 5, 7, 14, 30].map(n => (
                <button
                  key={n}
                  onClick={() => setCycleLength(n)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                    cycleLength === n
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white text-gray-600 border-gray-200'
                  }`}
                >
                  {n}d
                </button>
              ))}
            </div>
          </div>

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
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">
              <SkipForward size={12} className="inline mr-1" />
              Skip Days
            </label>
            <div className="flex gap-2">
              {ALL_DAYS.map(day => (
                <button
                  key={day}
                  onClick={() => toggleSkipDay(day)}
                  className={`w-10 h-10 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-0.5 ${
                    skipDays.includes(day)
                      ? 'bg-red-500 text-white border-red-500 shadow-sm'
                      : 'bg-gray-50 text-gray-600 border-gray-200'
                  }`}
                >
                  {skipDays.includes(day) && <Check size={10} className="shrink-0" />}
                  {DAY_NAMES[day]}
                </button>
              ))}
            </div>
          </div>

          {/* Repeat Pattern */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">
              Repeat Pattern
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setRepeatPattern('sequential')}
                className={`flex-1 py-3 rounded-xl text-xs font-bold border transition-all ${
                  repeatPattern === 'sequential'
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-600 border-gray-200'
                }`}
              >
                Sequential
              </button>
              <button
                onClick={() => setRepeatPattern('random')}
                className={`flex-1 py-3 rounded-xl text-xs font-bold border transition-all ${
                  repeatPattern === 'random'
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-600 border-gray-200'
                }`}
              >
                Random
              </button>
            </div>
          </div>

          {/* Insert Strategy — only shown when a loop exists AND new dishes were added */}
          {showIntegrationOptions && (
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">
                When New Dishes Are Added
              </label>
              <div className="space-y-1.5">
                {STRATEGY_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setInsertStrategy(opt.value)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs border transition-all text-left ${
                      insertStrategy === opt.value
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'bg-white text-gray-600 border-gray-200'
                    }`}
                  >
                    <span className={`shrink-0 ${insertStrategy === opt.value ? 'text-white' : 'text-gray-400'}`}>
                      {opt.icon}
                    </span>
                    <div className="min-w-0">
                      <p className="font-bold">{opt.label}</p>
                      <p className={`text-[9px] ${insertStrategy === opt.value ? 'text-gray-300' : 'text-gray-400'}`}>
                        {opt.desc}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
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
                    <span className="font-bold text-gray-800 ml-1">{STRATEGY_OPTIONS.find(o => o.value === insertStrategy)?.label?.replace(' to Cycle', '') || insertStrategy}</span>
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
            onClick={validation.valid ? handleApply : () => {
              const missing = (['breakfast', 'lunch', 'snacks', 'dinner'] as MealType[]).find(s => pool[s].length === 0);
              onFixSlots?.(missing ?? 'breakfast');
            }}
            className="flex-1 py-3 rounded-xl bg-[#FF385C] text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-lg shadow-[#FF385C]/30"
          >
            {validation.valid ? <Check size={14} /> : null}
            {validation.valid ? `Create Loop` : 'Fix Slots'}
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
