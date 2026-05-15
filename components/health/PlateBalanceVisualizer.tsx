import React from 'react';
import type { PlateBalanceScore } from '../../types/nutrition';
import { getScoreColor, getScoreEmoji } from '../../utils/nutritionScore';

interface PlateBalanceVisualizerProps {
  score: PlateBalanceScore;
  diet?: string;
}

const categoryLabels: Record<string, string> = {
  vegFruit: 'Veg & Fruits',
  wholeGrain: 'Whole Grains',
  protein: 'Protein',
  healthyFat: 'Healthy Fats',
  limitSugary: 'Low Sugar',
  limitRedMeat: 'Limit Red Meat',
};

export const PlateBalanceVisualizer: React.FC<PlateBalanceVisualizerProps> = React.memo(({ score, diet }) => {
  const isPlantBased = ['veg', 'vegan', 'eggitarian'].includes(diet?.toLowerCase() ?? '');

  const adjustedMax = isPlantBased ? score.max - 5 : score.max;
  const pct = Math.round((score.total / adjustedMax) * 100);

  const filteredCategories = isPlantBased
    ? Object.entries(score.categories).filter(([key]) => key !== 'limitRedMeat')
    : Object.entries(score.categories);

  const filteredBreakdown = isPlantBased
    ? score.breakdown.filter(b => !b.toLowerCase().includes('red meat'))
    : score.breakdown;

  const filteredSuggestions = isPlantBased
    ? score.suggestions.filter(s => !s.toLowerCase().includes('red meat'))
    : score.suggestions;

  return (
    <div className="p-5 rounded-2xl border-2 border-gray-200 bg-white">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl" aria-hidden="true">{getScoreEmoji(score.total, adjustedMax)}</span>
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Meal Balance</span>
        </div>
        <span className="text-lg font-black text-gray-800">{pct}%</span>
      </div>

      <div className="w-full h-3 rounded-full bg-gray-100 overflow-hidden mb-4">
        <div
          className={`h-full rounded-full transition-all duration-500 ${getScoreColor(score.total, adjustedMax)}`}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Meal balance score: ${pct}%`}
        />
      </div>

      <div className="space-y-2">
        {filteredCategories.map(([key, value]) => {
          const maxVal = key === 'limitSugary' || key === 'limitRedMeat' ? 5 : 10;
          const barPct = Math.round(((value + (key === 'limitSugary' || key === 'limitRedMeat' ? 5 : 0)) / (maxVal + (key === 'limitSugary' || key === 'limitRedMeat' ? 5 : 0))) * 100);
          return (
            <div key={key} className="flex items-center gap-2">
              <span className="text-[9px] font-bold text-gray-500 w-20 shrink-0">{categoryLabels[key] || key}</span>
              <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className={`h-full rounded-full ${key === 'limitSugary' || key === 'limitRedMeat' ? (value >= 0 ? 'bg-emerald-400' : 'bg-red-300') : (value > 0 ? 'bg-emerald-400' : 'bg-red-300')}`}
                  style={{ width: `${barPct}%` }}
                />
              </div>
              <span className="text-[9px] font-bold text-gray-400 w-4 text-right">{value}</span>
            </div>
          );
        })}
      </div>

      {filteredBreakdown.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-100 space-y-1">
          {filteredBreakdown.map((b, i) => (
            <p key={i} className="text-[9px] text-gray-500 leading-relaxed">{b}</p>
          ))}
        </div>
      )}

      {filteredSuggestions.length > 0 && (
        <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-100">
          <p className="text-[9px] font-black uppercase tracking-widest text-amber-700 mb-1">Suggestions</p>
          {filteredSuggestions.map((s, i) => (
            <p key={i} className="text-[9px] text-amber-800 leading-relaxed">• {s}</p>
          ))}
        </div>
      )}
    </div>
  );
});

PlateBalanceVisualizer.displayName = 'PlateBalanceVisualizer';
