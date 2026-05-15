import React, { useState, useMemo } from 'react';
import { useTrayStore, MealType } from '../store/useTrayStore';
import { useBackendDishes } from '../hooks/useBackendDishes';
import { ChevronLeft, ChevronRight, Check, Clock, RotateCcw, Save, FileText, Sparkles, FolderOpen } from 'lucide-react';
import { SLOT_META } from '../components/meal/MealCard';
import type { Dish } from '../constants/dishLibrary';

type Slot = 'Breakfast' | 'Lunch' | 'Snacks' | 'Dinner';
type Period = 'week' | 'biweek' | 'month';

interface SlotTimeWindow {
  start: string;
  end: string;
}

const DEFAULT_TIME_WINDOWS: Record<Slot, SlotTimeWindow> = {
  Breakfast: { start: '07:00', end: '08:30' },
  Lunch: { start: '12:00', end: '13:30' },
  Snacks: { start: '16:00', end: '17:00' },
  Dinner: { start: '19:30', end: '21:00' },
};

const PERIOD_OPTIONS: { key: Period; label: string; desc: string; icon: string }[] = [
  { key: 'week', label: 'Weekly', desc: 'Meals repeat every 7 days', icon: '📅' },
  { key: 'biweek', label: 'Bi-Weekly', desc: 'Meals repeat every 14 days', icon: '📆' },
  { key: 'month', label: 'Monthly', desc: 'Full month meal plan', icon: '🗓️' },
];

const TEMPLATE_OPTIONS = [
  { id: '', name: 'None' },
  { id: 'north-indian', name: 'North Indian Lunch' },
  { id: 'light-dinner', name: 'Light Dinner' },
  { id: 'south-indian', name: 'South Indian Meals' },
  { id: 'snacks-box', name: 'Snacks Box' },
];

interface SlotConfigScreenProps {
  user: any;
  onComplete: (period: 'week' | 'biweek' | 'month') => void;
}

export const SlotConfigScreen: React.FC<SlotConfigScreenProps> = ({ user, onComplete }) => {
  const { dishes } = useBackendDishes();
  const today = new Date().toLocaleDateString('en-CA');
  const { getMeals, fillPlan, saveTemplate, templates } = useTrayStore();

  const [activeSlot, setActiveSlot] = useState<Slot>('Breakfast');
  const [timeWindows, setTimeWindows] = useState<Record<Slot, SlotTimeWindow>>(DEFAULT_TIME_WINDOWS);
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('week');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [step, setStep] = useState<'slots' | 'recurrence' | 'review'>('slots');
  const [showSaveModal, setShowSaveModal] = useState<'template' | 'draft' | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [showLoadTemplates, setShowLoadTemplates] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const slots: { key: Slot; mealType: MealType }[] = [
    { key: 'Breakfast', mealType: 'breakfast' },
    { key: 'Lunch', mealType: 'lunch' },
    { key: 'Snacks', mealType: 'snacks' },
    { key: 'Dinner', mealType: 'dinner' },
  ];

  const meals = getMeals(today, activeSlot.toLowerCase() as MealType);
  const slotMeta = SLOT_META[activeSlot];
  const tw = timeWindows[activeSlot];

  const handlePublish = () => {
    const store = useTrayStore.getState();
    store.setPeriod(selectedPeriod);
    store.fillPlan(selectedPeriod);
    onComplete(selectedPeriod);
  };

  const handleSaveTemplate = () => {
    if (!templateName.trim()) return;
    saveTemplate(templateName.trim(), slotConfigs, selectedPeriod, showSaveModal === 'draft');
    setShowSaveModal(null);
    setTemplateName('');
    setToastMsg(showSaveModal === 'draft' ? 'Draft saved!' : 'Template saved!');
    setTimeout(() => setToastMsg(null), 2000);
  };

  const handleLoadTemplate = (id: string) => {
    const data = useTrayStore.getState().loadTemplate(id);
    if (!data) return;
    setSelectedPeriod(data.period);
    for (const [slot, cfg] of Object.entries(data.slotConfigs)) {
      setTimeWindows(prev => ({ ...prev, [slot]: { start: cfg.start, end: cfg.end } }));
    }
    setShowLoadTemplates(false);
    setToastMsg('Template loaded');
    setTimeout(() => setToastMsg(null), 2000);
  };

  const hasAnyMeals = slots.some(({ key }) => getMeals(today, key.toLowerCase() as MealType).length > 0);
  const isTimeValid = timeWindows[activeSlot].start < timeWindows[activeSlot].end;

  const slotConfigs = useMemo(() => {
    const configs: Record<string, { start: string; end: string; templateId: string }> = {};
    for (const { key } of slots) {
      configs[key] = { start: timeWindows[key].start, end: timeWindows[key].end, templateId: selectedTemplate };
    }
    return configs;
  }, [timeWindows, selectedTemplate]);

  const sortedTemplates = useMemo(() => {
    return [...templates].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [templates]);

  const slotDishes = useMemo(() => {
    return meals.map(m => dishes.find(d => d.id === m.meal_id)).filter(Boolean) as Dish[];
  }, [meals, dishes]);

  return (
    <div className="min-h-screen bg-white flex flex-col max-w-lg mx-auto">
      {/* Header */}
      <header className="px-6 pt-14 pb-3">
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={step === 'recurrence' ? () => setStep('slots') : step === 'review' ? () => setStep('recurrence') : undefined}
            className={`w-8 h-8 rounded-xl flex items-center justify-center bg-gray-100 active:scale-90 ${step === 'slots' ? 'invisible' : ''}`}
            aria-label="Back"
          >
            <ChevronLeft size={16} className="text-gray-700" />
          </button>
          <div>
            <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
              <span>🍽️</span> Configure Meal Slot
            </h1>
            <p className="text-[10px] font-medium text-gray-500">
              {step === 'slots' ? 'Set time windows for each meal slot' : step === 'recurrence' ? 'Choose how often meals repeat' : 'Review and publish your plan'}
            </p>
          </div>
        </div>
        {/* Step indicator */}
        <div className="flex items-center gap-2 mt-3">
          {(['slots', 'recurrence', 'review'] as const).map((s, i) => {
            const stepOrder = ['slots', 'recurrence', 'review'];
            const currentStepIdx = stepOrder.indexOf(step);
            const isCompleted = currentStepIdx > i;
            return (
              <div key={s} className="flex items-center gap-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black transition-all ${
                  step === s ? 'bg-[#FF385C] text-white' : isCompleted ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'
                }`}>
                  {step === s ? i + 1 : <Check size={10} />}
                </div>
                <span className={`text-[8px] font-bold uppercase tracking-widest ${step === s ? 'text-[#FF385C]' : 'text-gray-300'}`}>{s}</span>
                {i < 2 && <div className="w-6 h-px bg-gray-200 mx-1" />}
              </div>
            );
          })}
        </div>
      </header>

      {step === 'slots' && (
        <div className="flex-1 overflow-y-auto px-4">
          {/* Slot tabs */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl mb-4">
            {slots.map(({ key }) => {
              const meta = SLOT_META[key];
              const hasMeals = getMeals(today, key.toLowerCase() as MealType).length > 0;
              return (
                <button
                  key={key}
                  onClick={() => setActiveSlot(key)}
                  className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    activeSlot === key
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-400'
                  }`}
                >
                  {meta?.icon} {key}
                  {hasMeals && <span className="ml-1 w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />}
                </button>
              );
            })}
          </div>

          {/* Active slot config */}
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-4">
            <div className="flex items-center gap-2">
              {slotMeta?.icon && <span className="text-lg">{slotMeta.icon}</span>}
              <span className="text-sm font-bold text-gray-800">{activeSlot}</span>
              <span className="text-[9px] text-gray-400 font-medium">{meals.length} meal{meals.length !== 1 ? 's' : ''}</span>
            </div>

            {/* Time Window */}
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Time Window</label>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <span className="text-[9px] font-medium text-gray-400 block mb-1">Start</span>
                  <input
                    type="time"
                    value={tw.start}
                    onChange={e => setTimeWindows(prev => ({ ...prev, [activeSlot]: { ...prev[activeSlot], start: e.target.value } }))}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-sm font-semibold text-gray-800"
                  />
                </div>
                <span className="text-gray-300 mt-5">—</span>
                <div className="flex-1">
                  <span className="text-[9px] font-medium text-gray-400 block mb-1">End</span>
                  <input
                    type="time"
                    value={tw.end}
                    onChange={e => setTimeWindows(prev => ({ ...prev, [activeSlot]: { ...prev[activeSlot], end: e.target.value } }))}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-sm font-semibold text-gray-800"
                  />
                </div>
              </div>
              {!isTimeValid && (
                <p className="text-[9px] text-red-500 mt-1">Start time must be before end time</p>
              )}
            </div>

            {/* Template selector */}
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">
                Use Template <span className="font-normal normal-case text-gray-400">(Optional)</span>
              </label>
              <div className="relative">
                <select
                  value={selectedTemplate}
                  onChange={e => setSelectedTemplate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white border border-gray-200 text-sm font-semibold text-gray-800 appearance-none"
                >
                  {TEMPLATE_OPTIONS.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                <ChevronRight size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 rotate-90" />
              </div>
            </div>

            {/* Saved templates */}
            {templates.length > 0 && (
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">
                  Load Saved <span className="font-normal normal-case text-gray-400">({templates.length} saved)</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {sortedTemplates.map(t => (
                    <button
                      key={t.id}
                      onClick={() => handleLoadTemplate(t.id)}
                      className="px-2.5 py-1.5 rounded-lg bg-white border border-gray-200 text-[10px] font-semibold text-gray-600 active:scale-95 transition-all flex items-center gap-1"
                    >
                      <FolderOpen size={10} />
                      {t.name} v{t.version}
                      {t.isDraft && <span className="text-[8px] text-orange-500 ml-0.5">draft</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Dishes in this slot */}
          {slotDishes.length > 0 && (
            <div className="mt-4 p-4 rounded-2xl bg-white border border-gray-100 space-y-3">
              <div className="flex items-center gap-1.5">
                <Sparkles size={12} className="text-[#FF385C]" />
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Auto-Routing</span>
              </div>
              {slotDishes.map(dish => {
                const isGravy = dish.tags.some(t => ['gravy', 'curry', 'masala'].includes(t));
                const isDry = dish.tags.some(t => ['dry', 'fry', 'tadka', 'sabzi'].includes(t));
                const isBread = dish.tags.some(t => ['bread', 'roti', 'paratha', 'naan'].includes(t));
                const isRice = dish.tags.some(t => ['rice', 'biryani', 'pulao'].includes(t));
                return (
                  <div key={dish.id} className="flex items-start gap-2 text-xs">
                    <span className="text-base">{dish.icon}</span>
                    <div>
                      <p className="font-bold text-gray-800">{dish.name}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        {isGravy && '→ Bread: Roti/Naan/Paratha · Rice: Basmati/Jeera (pair both)'}
                        {isDry && '→ Bread: Roti/Bhakri · Rice: Optional (light)'}
                        {isBread && '→ Self-bread, no extra carbs needed'}
                        {isRice && '→ Self-rice, sides only'}
                        {!isGravy && !isDry && !isBread && !isRice && '→ Universal sides & beverages'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Universal items hint */}
          <div className="mt-3 p-3 rounded-2xl bg-orange-50 border border-orange-100">
            <p className="text-[10px] font-bold text-orange-700 flex items-center gap-1.5">
              <Clock size={12} />
              Time-Aware Universal Items
            </p>
            <p className="text-[9px] text-orange-600 mt-1">
              {activeSlot === 'Breakfast' ? '05:00–10:00 → Tea, Coffee, Water' :
               activeSlot === 'Lunch' ? '10:00–16:00 → Buttermilk, Water, Juice' :
               activeSlot === 'Snacks' ? '16:00–18:00 → Soda, Water, Herbal Tea' :
               '16:00–22:00 → Soda, Water, Herbal Tea'}
            </p>
          </div>

          {/* Navigation */}
          <div className="mt-6 pb-4 space-y-2">
            {!hasAnyMeals && (
              <p className="text-[10px] text-orange-600 text-center font-medium">Add at least one meal in Meal Tray Builder first</p>
            )}
            <button
              onClick={() => setStep('recurrence')}
              disabled={!hasAnyMeals}
              className="w-full py-3.5 rounded-2xl bg-[#FF385C] text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-lg shadow-[#FF385C]/30 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next: Recurrence <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {step === 'recurrence' && (
        <div className="flex-1 px-4 flex flex-col justify-center">
          <div className="text-center mb-8">
            <span className="text-4xl block mb-3">🔄</span>
            <h2 className="text-xl font-black text-gray-900 mb-1">Meal Rotation</h2>
            <p className="text-sm text-gray-500">How often should your meals repeat?</p>
          </div>
          <div className="space-y-3">
            {PERIOD_OPTIONS.map(opt => (
              <button
                key={opt.key}
                onClick={() => setSelectedPeriod(opt.key)}
                className={`w-full p-4 rounded-2xl border-2 text-left transition-all active:scale-[0.98] flex items-center gap-4 ${
                  selectedPeriod === opt.key
                    ? 'border-[#FF385C] bg-[#FF385C]/5'
                    : 'border-gray-100 bg-white'
                }`}
              >
                <span className="text-2xl">{opt.icon}</span>
                <div>
                  <p className="text-sm font-black text-gray-900">{opt.label}</p>
                  <p className="text-xs text-gray-500">{opt.desc}</p>
                </div>
              </button>
            ))}
          </div>
          <div className="mt-8 space-y-3">
            <button
              onClick={() => setStep('review')}
              className="w-full py-3.5 rounded-2xl bg-[#FF385C] text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-lg shadow-[#FF385C]/30"
            >
              Next: Review <ChevronRight size={16} />
            </button>
            <button
              onClick={() => setStep('slots')}
              className="w-full py-3 rounded-xl text-gray-500 text-xs font-bold active:scale-[0.98] transition-all"
            >
              Back to slot config
            </button>
          </div>
        </div>
      )}

      {step === 'review' && (
        <div className="flex-1 overflow-y-auto px-4">
          <div className="space-y-4">
            {slots.map(({ key, mealType }) => {
              const meta = SLOT_META[key];
              const tw = timeWindows[key];
              const slotMeals = getMeals(today, mealType);
              if (slotMeals.length === 0) return null;
              return (
                <div key={key} className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{meta?.icon}</span>
                      <span className="text-sm font-black text-gray-800">{key}</span>
                    </div>
                    <span className="text-[9px] font-medium text-gray-400">
                      {tw.start} – {tw.end}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {slotMeals.map(m => (
                      <div key={m.id} className="flex items-center gap-2 text-xs text-gray-600">
                        <span>•</span>
                        <span className="font-semibold">{m.name}</span>
                        {m.gravy && <span className="text-gray-400">· {m.gravy}</span>}
                        {m.roti && <span className="text-gray-400">· {m.roti}</span>}
                        {m.rice && <span className="text-gray-400">· {m.rice}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 p-3 rounded-2xl bg-violet-50 border border-violet-100 flex items-center gap-2">
            <RotateCcw size={14} className="text-violet-500" />
            <span className="text-[10px] font-bold text-violet-700">
              Repeats {selectedPeriod === 'week' ? 'Weekly' : selectedPeriod === 'biweek' ? 'Bi-Weekly' : 'Monthly'}
            </span>
          </div>

          <div className="mt-6 pb-8 space-y-3">
            <button
              onClick={handlePublish}
              className="w-full py-4 rounded-2xl bg-[#FF385C] text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-lg shadow-[#FF385C]/30"
            >
              <Check size={16} /> Publish Slot
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => { setShowSaveModal('template'); setTemplateName(''); }}
                className="flex-1 py-3 rounded-xl border-2 border-dashed border-gray-200 text-gray-500 text-xs font-bold flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all"
              >
                <Save size={12} /> Save as Template
              </button>
              <button
                onClick={() => { saveTemplate(`Draft ${new Date().toLocaleDateString()}`, slotConfigs, selectedPeriod, true); setToastMsg('Draft saved!'); setTimeout(() => setToastMsg(null), 2000); }}
                className="flex-1 py-3 rounded-xl border-2 border-dashed border-gray-200 text-gray-500 text-xs font-bold flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all"
              >
                <FileText size={12} /> Draft
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-gray-900 text-white text-xs font-bold shadow-xl animate-in slide-in-from-top-2">
          {toastMsg}
        </div>
      )}

      {/* Save as Template modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center pb-24">
          <div className="bg-white rounded-3xl w-full max-w-lg mx-4 p-6 shadow-2xl">
            <h3 className="text-base font-black text-gray-900 mb-1">
              {showSaveModal === 'draft' ? 'Save as Draft' : 'Save as Template'}
            </h3>
            <p className="text-[10px] text-gray-500 mb-4">Give this configuration a name</p>
            <input
              autoFocus
              value={templateName}
              onChange={e => setTemplateName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSaveTemplate()}
              placeholder="e.g. Weekday Meals"
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm font-semibold text-gray-800 mb-4 outline-none focus:border-[#FF385C]"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowSaveModal(null)}
                className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-600 text-xs font-bold active:scale-[0.98] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTemplate}
                disabled={!templateName.trim()}
                className="flex-1 py-3 rounded-xl bg-[#FF385C] text-white text-xs font-bold active:scale-[0.98] transition-all disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SlotConfigScreen;
