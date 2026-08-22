import React, { useMemo, useState } from 'react';
import { getISODate, addDaysISO } from '../../utils/dateUTC';
import { useTrayStore } from '../../plan/store/useTrayStore';
import { useStore } from '../../app/store/useStore';
import { classifySuggestion } from '../../utils/classifySuggestion';
import { inferDishHealthCategories } from '../../utils/inferDishHealthCategories';
import { scorePlateBalance, type MealsForScoring } from '../../utils/nutritionScore';
import { DISH_HEALTH_MAP } from '../../app/constants/healthGuidelines';
import type { TrayItem, MealType } from '../../types/tray';
import { DISH_LIBRARY, type Dish } from '../../meal/constants/dishLibrary';
import { getScoreColor, getScoreEmoji } from '../../utils/nutritionScore';
import { Lightbulb, Plus, Check } from 'lucide-react';

const SLOT_TYPES: MealType[] = ['breakfast', 'lunch', 'snacks', 'dinner'];

function mealsToScoring(meals: TrayItem[]): MealsForScoring[] {
  const categories: string[] = [];
  const tags: string[] = [];
  for (const m of meals) {
    const meta = DISH_HEALTH_MAP[m.meal_id];
    if (meta) { categories.push(...meta.healthCategories); tags.push(...meta.tags); }
    else { categories.push(...inferDishHealthCategories(m.name)); }
  }
  return [{
    name: meals.map(m => m.name).join(', '),
    healthCategories: categories, tags, quantity: 1,
    hasCarbBase: meals.some(m => !!(m.roti || m.rice)),
    hasProteinCore: meals.some(m => ['dal','paneer','chicken','egg','fish','mutton','lamb','pork','beef','meat','tofu','soya','legume'].some(k => m.name.toLowerCase().includes(k))),
    hasFiberSide: meals.some(m => (m.sides?.length ?? 0) > 0),
    hasHydration: meals.some(m => (m.beverages?.length ?? 0) > 0),
    hasDessert: meals.some(m => (m.dessert?.length ?? 0) > 0),
  }];
}

interface DayDetail {
  date: string; score: number; max: number; hasMeals: boolean;
  protein: number; vegFruit: number; wholeGrain: number; sugarScore: number;
  suggestions: string[];
}

const WeeklyHealthSummary: React.FC = () => {
  const planDays = useTrayStore(s => s.plan.days);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const results = useMemo(() => {
    const today = getISODate();
    const days: DayDetail[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = addDaysISO(today, -i);
      const dayMeals = planDays[date];
      if (!dayMeals) { days.push({ date, score: 0, max: 62.5, hasMeals: false, protein: 0, vegFruit: 0, wholeGrain: 0, sugarScore: 0, suggestions: [] }); continue; }
      const allMeals: TrayItem[] = [];
      for (const slot of SLOT_TYPES) allMeals.push(...(dayMeals[slot] ?? []));
      if (allMeals.length === 0) { days.push({ date, score: 0, max: 62.5, hasMeals: false, protein: 0, vegFruit: 0, wholeGrain: 0, sugarScore: 0, suggestions: [] }); continue; }
      const result = scorePlateBalance(mealsToScoring(allMeals));
      days.push({
        date, score: result.total, max: result.max, hasMeals: true,
        protein: result.categories?.protein || 0,
        vegFruit: result.categories?.vegFruit || 0,
        wholeGrain: result.categories?.wholeGrain || 0,
        sugarScore: result.categories?.limitSugary || 0,
        suggestions: result.suggestions || [],
      });
    }
    return days;
  }, [planDays]);

  const daysWithMeals = results.filter(r => r.hasMeals);
  const avgPct = daysWithMeals.length > 0 ? Math.round(daysWithMeals.reduce((s, d) => s + d.score / d.max, 0) / daysWithMeals.length * 100) : 0;
  const selected = selectedDay !== null ? results[selectedDay] : null;

  const state = daysWithMeals.length === 0
    ? { emoji: '🌱', title: 'Start your journey!', subtitle: 'Add meals to see your health score', color: '#8B7D6B' }
    : avgPct >= 70 ? { emoji: '🌟', title: 'Crushing it!', subtitle: 'Your meal balance is looking great', color: '#22c55e' }
    : avgPct >= 50 ? { emoji: '💪', title: 'Getting there!', subtitle: 'Keep building balanced meals', color: '#eab308' }
    : avgPct >= 30 ? { emoji: '🌿', title: 'Room to grow', subtitle: 'Try adding more variety', color: '#f97316' }
    : { emoji: '🫤', title: "Let's cook!", subtitle: 'Start planning to see improvements', color: '#ef4444' };

  const streak = daysWithMeals.filter(d => d.score >= 30).length;
  const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  return (
    <div className="space-y-4">
      {/* Overview card */}
      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5" style={{ borderLeftColor: state.color, borderLeftWidth: 4 }}>
        <div className="flex items-center gap-4">
          <div className="text-4xl">{state.emoji}</div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold text-gray-900">{state.title}</p>
            <p className="text-sm text-gray-500 mt-0.5">{state.subtitle}</p>
          </div>
          {daysWithMeals.length > 0 && (
            <div className="text-right">
              <p className="text-2xl font-black" style={{ color: state.color }}>{avgPct}%</p>
              <p className="text-xs text-gray-400">weekly</p>
            </div>
          )}
        </div>
      </div>

      {daysWithMeals.length > 0 ? (
        <>
          {/* Day bubbles row */}
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
            {results.map((r, i) => {
              const d = new Date(r.date);
              const pct = r.hasMeals ? (r.score / r.max) * 100 : 0;
              const isToday = i === results.length - 1;
              const isSelected = selectedDay === i;
              return (
                <button key={r.date} onClick={() => setSelectedDay(selectedDay === i ? null : i)}
                  className="flex flex-col items-center gap-1.5 flex-shrink-0 active:scale-95 transition-all"
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold transition-all shadow-sm ${
                    !r.hasMeals ? 'bg-gray-100 text-gray-300' :
                    pct >= 70 ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-200' :
                    pct >= 40 ? 'bg-amber-100 text-amber-700 border-2 border-amber-200' :
                    'bg-red-100 text-red-600 border-2 border-red-200'
                  } ${isToday ? 'ring-2 ring-[#FF385C] ring-offset-2' : ''} ${isSelected ? 'scale-110 shadow-md' : ''}`}>
                    {r.hasMeals ? getScoreEmoji(r.score, r.max) : '-'}
                  </div>
                  <span className={`text-xs font-bold ${isToday ? 'text-[#FF385C]' : 'text-gray-400'}`}>
                    {dayNames[d.getDay()]}
                  </span>
                  <span className="text-sm font-semibold text-gray-400">{d.getDate()}</span>
                </button>
              );
            })}
          </div>

          {/* Selected day breakdown */}
          {selected && selected.hasMeals && (
            <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5 space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="flex items-center justify-between">
                <p className="text-xs font-black uppercase tracking-widest text-gray-500">
                  {new Date(selected.date).toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' })}
                </p>
                <span className="text-sm font-bold" style={{ color: (selected.score / selected.max) > 0.6 ? '#22c55e' : (selected.score / selected.max) > 0.4 ? '#eab308' : '#ef4444' }}>
                  {selected.score.toFixed(0)} / {selected.max}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Protein', value: selected.protein, max: 15, icon: '🥩', color: '#ef4444' },
                  { label: 'Veg & Fruits', value: selected.vegFruit, max: 15, icon: '🥗', color: '#22c55e' },
                  { label: 'Whole Grains', value: selected.wholeGrain, max: 12, icon: '🌾', color: '#eab308' },
                  { label: 'Sugar Control', value: 5 + selected.sugarScore, max: 5, icon: '🍬', color: '#3b82f6' },
                ].map(n => {
                  const pct = Math.min(100, Math.round(n.value / n.max * 100));
                  return (
                    <div key={n.label} className="rounded-xl bg-gray-50 p-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-medium text-gray-500 flex items-center gap-1">{n.icon} {n.label}</span>
                        <span className="text-xs font-bold text-gray-700">{n.value.toFixed(0)}</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: n.color }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {selected.suggestions.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Tips</p>
                  {selected.suggestions.slice(0, 2).map((tip, i) => {
                    const cls = classifySuggestion(tip);
                    const isPantry = cls.actionType === 'add-to-pantry';
                    const isToday = selectedDay === results.length - 1;
                    const matchedDishes: Dish[] = !isPantry && cls.dishCategories && isToday
                      ? (DISH_LIBRARY as Dish[]).filter(d => {
                          const meta = DISH_HEALTH_MAP[d.id];
                          const hc = meta ? meta.healthCategories : inferDishHealthCategories(d.name);
                          const match = hc.some(hc => cls.dishCategories!.includes(hc));
                          if (!match) return false;
                          const dt = (d.diet || d.type || '').toLowerCase();
                          const appState = useStore.getState();
                          const ud = (appState.user?.diet || 'veg').toLowerCase();
                          if (ud === 'veg') return dt === 'veg' || dt === 'vegan';
                          if (ud === 'eggitarian') return dt === 'eggitarian' || dt === 'veg' || dt === 'vegan' || dt === 'egg' || dt === 'eggetarian';
                          return true;
                        }).slice(0, 3)
                      : [];
                    return (
                      <div key={i} className="p-3 rounded-xl bg-gradient-to-r from-[#FFF0F3] to-transparent border border-[#FF385C]/10 space-y-2">
                        <div className="flex items-start gap-2">
                          <Lightbulb className="w-4 h-4 text-[#FF385C] mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-gray-700 leading-relaxed">{tip}</p>
                        </div>
                        {isToday && isPantry && cls.pantryItems && (
                          <div className="flex flex-wrap gap-1.5 pl-6">
                            {cls.pantryItems.map(item => (
                              <button key={item}
                                onClick={() => { useStore.getState().addToPantry([item]); useStore.getState().setToast({ message: `${item} added to pantry!`, type: 'success' }); }}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-gray-200 text-xs font-medium text-gray-700 active:scale-95 transition-all"
                              ><Plus size={11} className="text-[#FF385C]" /> {item}</button>
                            ))}
                          </div>
                        )}
                        {isToday && !isPantry && matchedDishes.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pl-6">
                            {matchedDishes.map(d => (
                              <button key={d.id}
                                onClick={() => {
                                  const tray = useTrayStore.getState();
                                  const slot = d.category?.[0] || 'lunch';
                                  tray.addMealToSlot(selected.date, slot as any, { id: d.id, name: d.name, icon: '', region: 'north' });
                                  useStore.getState().setToast({ message: `${d.name} added to ${slot}!`, type: 'success' });
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-gray-200 text-xs font-medium text-gray-700 active:scale-95 transition-all"
                              ><Plus size={11} className="text-[#FF385C]" /> {d.name}</button>
                            ))}
                          </div>
                        )}
                        {isToday && !isPantry && matchedDishes.length === 0 && cls.dishCategories !== undefined && (
                          <div className="pl-6">
                            <button onClick={() => window.dispatchEvent(new CustomEvent('navigate-to', { detail: { tab: 'dashboard' } }))}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-gray-200 text-xs font-medium text-gray-700 active:scale-95 transition-all"
                            ><Plus size={11} className="text-[#FF385C]" /> Browse dishes 🍽️</button>
                          </div>
                        )}
                        {!isToday && <p className="text-xs text-gray-400 pl-6">Switch to today to act on this tip</p>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 p-4 text-center">
              <p className="text-xl font-black text-orange-600">{streak}</p>
              <p className="text-xs font-bold text-orange-500 uppercase tracking-widest mt-1">Good days</p>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 p-4 text-center">
              <p className="text-xl font-black text-emerald-600">{daysWithMeals.length}</p>
              <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest mt-1">Days tracked</p>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 p-4 text-center">
              <p className="text-xl font-black text-blue-600">{avgPct}%</p>
              <p className="text-xs font-bold text-blue-500 uppercase tracking-widest mt-1">Avg score</p>
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center py-6 text-center">
          <p className="text-sm text-gray-400 mb-4">Plan your meals to see your weekly nutrition breakdown!</p>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('navigate-to', { detail: { tab: 'dashboard' } }))}
            className="flex items-center gap-1.5 px-5 py-3 rounded-xl bg-[#FF385C] text-white text-sm font-bold active:scale-95 transition-all shadow-sm"
          >
            <Plus size={16} /> Plan your meals
          </button>
        </div>
      )}
    </div>
  );
};

export default WeeklyHealthSummary;
