import React from 'react';
import { AlertCircle, Lightbulb, ArrowRight } from 'lucide-react';
import type { HealthSuggestion, SwapSuggestion } from '../../utils/healthSuggestions';

interface HealthSuggestionPanelProps {
  suggestions: HealthSuggestion[];
  swapSuggestions: SwapSuggestion[];
  onApplySwap?: (suggestion: SwapSuggestion) => void;
  compact?: boolean;
}

export const HealthSuggestionPanel: React.FC<HealthSuggestionPanelProps> = React.memo(({
  suggestions,
  swapSuggestions,
  onApplySwap,
  compact = false,
}) => {
  if (suggestions.length === 0 && swapSuggestions.length === 0) return null;

  if (compact) {
    return (
      <div className="p-3 rounded-xl bg-amber-50 border border-amber-100">
        <div className="flex items-center gap-1.5 mb-2">
          <Lightbulb size={12} className="text-amber-600" />
          <span className="text-[9px] font-black uppercase tracking-widest text-amber-700">
            {suggestions.length + swapSuggestions.length} suggestion{suggestions.length + swapSuggestions.length !== 1 ? 's' : ''}
          </span>
        </div>
        {swapSuggestions.slice(0, 2).map((s, i) => (
          <div key={i} className="flex items-center gap-1.5 mb-1">
            <ArrowRight size={10} className="text-emerald-500 shrink-0" />
            <p className="text-[9px] text-gray-600 leading-tight">
              Swap for <span className="font-bold text-emerald-700">{s.suggestedName}</span> — {s.reason}
            </p>
          </div>
        ))}
        {suggestions.slice(0, 1).map((s, i) => (
          <div key={`hs-${i}`} className="flex items-start gap-1.5 mb-1">
            <AlertCircle size={10} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[9px] text-gray-600 leading-tight">{s.message}</p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {swapSuggestions.length > 0 && (
        <div className="p-4 rounded-2xl border-2 border-emerald-100 bg-emerald-50">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb size={14} className="text-emerald-600" />
            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-700">Healthier Swaps</span>
          </div>
          <div className="space-y-2">
            {swapSuggestions.map((s, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-xl bg-white border border-emerald-100"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-800 line-through">{s.currentName || s.currentDishId}</span>
                    <ArrowRight size={12} className="text-emerald-500 shrink-0" />
                    <span className="text-xs font-bold text-emerald-700">{s.suggestedName}</span>
                  </div>
                  <p className="text-[9px] text-gray-500 mt-0.5">{s.reason}</p>
                </div>
                {onApplySwap && (
                  <button
                    onClick={() => onApplySwap(s)}
                    className="shrink-0 px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-[9px] font-bold hover:bg-emerald-600 transition-all active:scale-95"
                  >
                    Swap
                  </button>
                )}
              </div>
            ))}
          </div>
          <p className="text-[8px] text-gray-400 mt-2">Health gain: +{swapSuggestions.reduce((a, s) => a + s.healthGain, 0)} pts</p>
        </div>
      )}

      {suggestions.map((s, i) => (
        <div
          key={i}
          className={`p-4 rounded-2xl border-2 flex items-start gap-3 ${
            s.priority === 'high'
              ? 'bg-amber-50 border-amber-100'
              : 'bg-blue-50 border-blue-100'
          }`}
        >
          <AlertCircle
            size={16}
            className={s.priority === 'high' ? 'text-amber-500 shrink-0 mt-0.5' : 'text-blue-500 shrink-0 mt-0.5'}
          />
          <div>
            <p className="text-xs font-bold text-gray-900">{s.message}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">{s.reason}</p>
          </div>
        </div>
      ))}
    </div>
  );
});

HealthSuggestionPanel.displayName = 'HealthSuggestionPanel';
