import React, { useMemo } from 'react';
import { getISODate, addDaysISO } from '../../utils/dateUTC';
import { useTrayStore } from '../../plan/store/useTrayStore';
import { scorePlateBalance, type MealsForScoring } from '../../utils/nutritionScore';
import { DISH_HEALTH_MAP } from '../../app/constants/healthGuidelines';
import type { TrayItem, MealType } from '../../types/tray';
import { getScoreColor, getScoreEmoji } from '../../utils/nutritionScore';

const SLOT_TYPES: MealType[] = ['breakfast', 'lunch', 'snacks', 'dinner'];

function mealsToScoring(meals: TrayItem[]): MealsForScoring[] {
  const categories: string[] = [];
  const tags: string[] = [];

  for (const m of meals) {
    const meta = DISH_HEALTH_MAP[m.meal_id];
    if (meta) {
      categories.push(...meta.healthCategories);
      tags.push(...meta.tags);
    }
  }

  const hasCarbBase = meals.some(m => !!(m.roti || m.rice));
  const hasProteinCore = meals.some(m => {
    const n = m.name.toLowerCase();
    return ['dal', 'paneer', 'chicken', 'egg', 'fish', 'soya', 'tofu', 'legume'].some(k => n.includes(k));
  });
  const hasFiberSide = meals.some(m => (m.sides?.length ?? 0) > 0);
  const hasHydration = meals.some(m => (m.beverages?.length ?? 0) > 0);
  const hasDessert = meals.some(m => (m.dessert?.length ?? 0) > 0);

  return [{
    name: meals.map(m => m.name).join(', '),
    healthCategories: categories,
    tags,
    quantity: 1,
    hasCarbBase, hasProteinCore, hasFiberSide, hasHydration, hasDessert,
  }];
}

interface DayResult {
  date: string;
  score: number;
  max: number;
  hasMeals: boolean;
  suggestions: string[];
}

function trendIcon(current: number, prev: number | null): string {
  if (prev === null || current === prev) return '→';
  return current > prev ? '↑' : '↓';
}

const WeeklyHealthSummary: React.FC = () => {
  const planDays = useTrayStore(s => s.plan.days);

  const results = useMemo(() => {
    const today = getISODate();
    const days: DayResult[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = addDaysISO(today, -i);
      const dayMeals = planDays[date];
      if (!dayMeals) { days.push({ date, score: 0, max: 62.5, hasMeals: false, suggestions: [] }); continue; }
      const allMeals: TrayItem[] = [];
      for (const slot of SLOT_TYPES) {
        allMeals.push(...(dayMeals[slot] ?? []));
      }
      if (allMeals.length === 0) { days.push({ date, score: 0, max: 62.5, hasMeals: false, suggestions: [] }); continue; }
      const scoring = mealsToScoring(allMeals);
      const result = scorePlateBalance(scoring);
      days.push({ date, score: result.total, max: result.max, hasMeals: true, suggestions: result.suggestions });
    }
    return days;
  }, [planDays]);

  const daysWithMeals = results.filter(r => r.hasMeals);
  const avgScore = daysWithMeals.length > 0
    ? Math.round(daysWithMeals.reduce((s, d) => s + d.score, 0) / daysWithMeals.length * 10) / 10
    : 0;
  const avgPct = daysWithMeals.length > 0
    ? Math.round(daysWithMeals.reduce((s, d) => s + d.score / d.max, 0) / daysWithMeals.length * 100)
    : 0;

  const worstDay = daysWithMeals.length > 0
    ? daysWithMeals.reduce((a, b) => a.score < b.score ? a : b)
    : null;
  const bestDay = daysWithMeals.length > 0
    ? daysWithMeals.reduce((a, b) => a.score > b.score ? a : b)
    : null;

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Empty state for first-time users
  if (daysWithMeals.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-5 space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-base">📊</span>
          <h3 className="text-[11px] font-black uppercase tracking-widest text-gray-400">Weekly Health Summary</h3>
        </div>
        <div className="py-6 text-center">
          <div className="text-4xl mb-3">🌱</div>
          <p className="text-sm font-bold text-gray-800">Start planning meals to see your weekly balance</p>
          <p className="text-xs text-gray-400 mt-1">Add dishes to your plan and check back here for insights</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-base">📊</span>
        <h3 className="text-[11px] font-black uppercase tracking-widest text-gray-900">Weekly Health Summary</h3>
        <span className="ml-auto text-[9px] font-bold text-gray-400">{daysWithMeals.length} day{daysWithMeals.length > 1 ? 's' : ''} with meals</span>
      </div>

      {/* Average score */}
      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg ${getScoreColor(avgScore, 62.5).replace('bg-', 'bg-').replace('500', '100')}`}>
          {getScoreEmoji(avgScore, 62.5)}
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900">{avgScore.toFixed(0)} / 62.5 avg</p>
          <p className={`text-[10px] font-bold ${avgPct >= 60 ? 'text-emerald-600' : avgPct >= 40 ? 'text-amber-600' : 'text-red-500'}`}>
            {avgPct >= 60 ? 'Great balance' : avgPct >= 40 ? 'Getting there' : 'Room to grow'}
          </p>
        </div>
      </div>

      {/* Per-day mini bars */}
      <div className="space-y-1.5">
        {results.map((r, i) => {
          const d = new Date(r.date);
          const pct = r.hasMeals ? (r.score / r.max) * 100 : 0;
          const prevScore: number | null = i > 0 ? (results[i - 1]?.hasMeals ? results[i - 1]!.score : null) : null;
          const trend = r.hasMeals ? trendIcon(r.score, prevScore) : '';
          return (
            <div key={r.date} className="flex items-center gap-2">
              <span className="w-7 text-[9px] font-bold text-right shrink-0"
                style={{ color: r.hasMeals ? '#374151' : '#d1d5db' }}>
                {dayLabels[d.getDay()]}
              </span>
              <div className="flex-1 h-4 rounded-full bg-gray-100 overflow-hidden relative">
                {r.hasMeals && (
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${getScoreColor(r.score, r.max)}`}
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                )}
                {!r.hasMeals && (
                  <div className="h-full w-full flex items-center justify-center">
                    <span className="text-[8px] text-gray-300 font-medium">no meals</span>
                  </div>
                )}
              </div>
              <span className="w-10 text-[9px] font-bold text-right shrink-0 flex items-center gap-0.5 justify-end"
                style={{ color: r.hasMeals ? '#6b7280' : '#d1d5db' }}>
                {r.hasMeals ? r.score.toFixed(0) : '-'}
                {trend && <span className={`text-[8px] ${trend === '↑' ? 'text-emerald-500' : trend === '↓' ? 'text-red-400' : 'text-gray-300'}`}>{trend}</span>}
              </span>
            </div>
          );
        })}
      </div>

      {/* Best & worst day */}
      {(bestDay || worstDay) && (
        <div className="grid grid-cols-2 gap-2">
          {bestDay && bestDay.score >= 30 && (
            <div className="rounded-xl bg-emerald-50 p-3">
              <p className="text-[9px] font-bold text-emerald-600">Best day</p>
              <p className="text-[10px] font-bold text-gray-800 mt-0.5">{new Date(bestDay.date).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
              <p className="text-[9px] text-gray-500 mt-0.5">✅ {bestDay.score.toFixed(0)} / {bestDay.max}</p>
            </div>
          )}
          {worstDay && worstDay.hasMeals && worstDay.score < 40 && (
            <div className="rounded-xl bg-amber-50 p-3">
              <p className="text-[9px] font-bold text-amber-600">Could improve</p>
              <p className="text-[10px] font-bold text-gray-800 mt-0.5">{new Date(worstDay.date).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
              <p className="text-[9px] text-gray-500 mt-0.5 leading-tight">
                {worstDay.suggestions.length > 0
                  ? worstDay.suggestions[0]
                  : 'Add more variety to your meals'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Weekly tip */}
      {avgPct < 60 && worstDay && worstDay.suggestions.length > 0 && worstDay.suggestions[0] && (
        <p className="text-[10px] text-gray-500 leading-tight">
          💡 {worstDay.suggestions[0]}
        </p>
      )}
    </div>
  );
};

export default WeeklyHealthSummary;
