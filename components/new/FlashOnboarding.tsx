import React, { useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Check, MessageCircle } from 'lucide-react';

const REGIONS = [
  { label: 'North India', icon: '🌾', note: 'Ghee, butter, rich curries' },
  { label: 'South India', icon: '🥥', note: 'Rice, coconut, dosa' },
  { label: 'East India', icon: '🐟', note: 'Fish, mustard, sweets' },
  { label: 'West India', icon: '🌶️', note: 'Spicy, tangy, street food' },
  { label: 'Central India', icon: '🍲', note: 'Comfort food, hearty meals' },
  { label: 'Northeast India', icon: '🍚', note: 'Fermented, herbs, grilled' },
] as const;

const DIETS = [
  { label: 'Veg', icon: '🥦', note: 'No meat, no egg' },
  { label: 'Eggitarian', icon: '🥚', note: 'Veg + eggs' },
  { label: 'Non-Veg', icon: '🍗', note: 'All meats included' },
  { label: 'Vegan', icon: '🌱', note: 'No animal products' },
] as const;

const HEALTH_GOALS = [
  { label: 'Balanced', icon: '⚖️', note: 'No restrictions, eat well' },
  { label: 'High Protein', icon: '🥩', note: 'Build muscle, stay full' },
  { label: 'High Fiber', icon: '🌾', note: 'Digestive health' },
  { label: 'Low Calorie', icon: '🥗', note: 'Lighter meals' },
  { label: 'Low Fat', icon: '🫒', note: 'Cut the grease' },
  { label: 'Weight Loss', icon: '🔥', note: 'Calorie-conscious' },
] as const;

// ─── Taste step (single source: utils/tasteProfile.ts) ──────────────────────
const SPICE_OPTIONS = [
  { value: 'mild', label: 'Mild', icon: '🌱', note: 'Gentle, low heat' },
  { value: 'medium', label: 'Medium', icon: '🌶️', note: 'A comfortable kick' },
  { value: 'hot', label: 'Hot', icon: '🔥', note: 'Bring the fire' },
] as const;

const NOVELTY_OPTIONS = [
  { value: 'familiar', label: 'Familiar', icon: '🏠', note: 'Stick with cuisines I love' },
  { value: 'balanced', label: 'Balanced', icon: '⚖️', note: 'Favourites + new dishes' },
  { value: 'adventurous', label: 'Adventurous', icon: '🧭', note: 'Surprise me with new cuisines' },
] as const;

const COMMON_ALLERGIES = ['Peanuts', 'Nuts', 'Dairy', 'Gluten', 'Eggs', 'Soy', 'Shellfish', 'Sesame'] as const;

const STEPS = [
  { key: 'region', title: 'Your Food Region', subtitle: 'What kind of flavors do you love?', benefit: 'We\'ll recommend dishes from your favorite cuisine.' },
  { key: 'diet', title: 'Your Diet Preference', subtitle: 'What do you eat?', benefit: 'Every suggested dish will match your diet.' },
  { key: 'health', title: 'Your Health Focus', subtitle: 'Any specific goal?', benefit: 'Meals will be tailored to your wellness needs.' },
  { key: 'taste', title: 'Your Taste Profile', subtitle: 'Spice, allergies and how adventurous you are', benefit: 'Dishes will match your spice level, avoid your allergens, and balance familiar vs new.' },
  { key: 'cook', title: 'Cook\'s WhatsApp', subtitle: 'Who makes the meals?', benefit: 'Your cook gets the daily plan every morning.' },
] as const;

type NoveltyValue = 'familiar' | 'balanced' | 'adventurous';

interface FlashOnboardingProps {
  onComplete: (data: {
    region: string;
    diet: string;
    spiceLevel: number;
    allergies: string[];
    noveltyPreference: NoveltyValue;
    cookContact: string;
    plannedSlots: ('Breakfast' | 'Lunch' | 'Dinner' | 'Snacks')[];
    healthGoal: string;
    onboardingComplete?: boolean;
  }) => void;
  isEditMode?: boolean;
  initialStep?: number;
  prefill?: {
    region?: string;
    diet?: string;
    spiceLevel?: number;
    plannedSlots?: ('Breakfast' | 'Lunch' | 'Dinner' | 'Snacks')[];
    cookContact?: string;
    healthGoal?: string;
    allergies?: string[];
    noveltyPreference?: NoveltyValue;
  };
}

const FlashOnboarding: React.FC<FlashOnboardingProps> = ({ onComplete, isEditMode, initialStep, prefill }) => {
  const [step, setStep] = useState(initialStep ?? 0);
  const [region, setRegion] = useState(prefill?.region ?? '');
  const [diet, setDiet] = useState(prefill?.diet ?? '');
  const [spiceLevel, setSpiceLevel] = useState(prefill?.spiceLevel ?? 2);
  const [allergies, setAllergies] = useState<string[]>(prefill?.allergies ?? []);
  const [noveltyPreference, setNoveltyPreference] = useState<NoveltyValue>(prefill?.noveltyPreference ?? 'balanced');
  const [healthGoal, setHealthGoal] = useState(prefill?.healthGoal ?? '');
  const [cookContact, setCookContact] = useState(prefill?.cookContact ?? '');
  const [plannedSlots] = useState<('Breakfast' | 'Lunch' | 'Dinner' | 'Snacks')[]>(
    prefill?.plannedSlots ?? ['Breakfast', 'Lunch', 'Snacks', 'Dinner'],
  );

  const canContinue = step === 0 ? !!region : step === 1 ? !!diet : step === 2 ? !!healthGoal : true;

  const toggleAllergy = (a: string) => {
    setAllergies(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);
  };

  const goNext = useCallback(() => {
    if (step < STEPS.length - 1) setStep(s => s + 1);
  }, [step]);

  const goBack = useCallback(() => {
    if (step > 0) setStep(s => s - 1);
  }, [step]);

  const handleComplete = useCallback(() => {
    onComplete({
      region: region || 'North India',
      diet: diet || 'Veg',
      spiceLevel,
      allergies,
      noveltyPreference,
      healthGoal: healthGoal || 'Balanced',
      cookContact,
      plannedSlots,
      onboardingComplete: true,
    });
  }, [onComplete, region, diet, spiceLevel, allergies, noveltyPreference, healthGoal, cookContact, plannedSlots]);

  const isLastStep = step === STEPS.length - 1;
  const stepProgress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-lg mx-auto w-full">
      {/* Top bar with step indicator */}
      <div className="bg-white px-6 pt-8 pb-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {step > 0 && (
              <button onClick={goBack} className="w-10 h-10 rounded-xl flex items-center justify-center bg-gray-100 text-gray-500 active:scale-90 transition-all">
                <ChevronLeft size={20} />
              </button>
            )}
            <span className="text-sm font-bold text-gray-400">
              Step {step + 1} of {STEPS.length}
            </span>
          </div>
          {!isEditMode && (
            <span className="text-xs font-bold text-gray-300">
              {Math.round(stepProgress)}%
            </span>
          )}
        </div>
        {/* Progress bar */}
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-[#FF385C] rounded-full transition-all duration-500 ease-out" style={{ width: `${stepProgress}%` }} />
        </div>
        {/* Step labels */}
        <div className="flex justify-between mt-3">
          {STEPS.map((s, i) => (
            <span key={i} className={`text-xs font-bold uppercase transition-colors duration-300 ${
              i <= step ? 'text-[#FF385C]' : 'text-gray-300'
            }`}>{s.key}</span>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 px-6 pt-8 pb-4 overflow-y-auto">
        {/* Step 1: Region */}
        {step === 0 && (
          <div className="animate-in fade-in slide-in-from-right-2 duration-300">
            <div className="mb-8">
              <h2 className="text-3xl font-black tracking-tight text-gray-900">{STEPS[0].title}</h2>
              <p className="text-base text-gray-500 mt-2">{STEPS[0].subtitle}</p>
              <div className="mt-4 p-4 rounded-xl bg-orange-50 border border-orange-100">
                <p className="text-sm text-orange-700 font-medium leading-relaxed">{STEPS[0].benefit}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {REGIONS.map(opt => (
                <button key={opt.label} onClick={() => setRegion(opt.label)}
                  className={`p-5 rounded-2xl border-2 text-left transition-all active:scale-[0.98] ${
                    region === opt.label ? 'border-[#FF385C] bg-[#FF385C]/5 ring-2 ring-[#FF385C]/20' : 'border-gray-100 bg-white hover:border-gray-200'
                  }`}>
                  <p className="font-bold text-base text-gray-900 mb-1">{opt.icon} {opt.label}</p>
                  <p className="text-sm text-gray-500 leading-snug">{opt.note}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Diet Preference */}
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-right-2 duration-300">
            <div className="mb-8">
              <h2 className="text-3xl font-black tracking-tight text-gray-900">{STEPS[1].title}</h2>
              <p className="text-base text-gray-500 mt-2">{STEPS[1].subtitle}</p>
              <div className="mt-4 p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                <p className="text-sm text-emerald-700 font-medium leading-relaxed">{STEPS[1].benefit}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {DIETS.map(opt => (
                <button key={opt.label} onClick={() => setDiet(opt.label)}
                  className={`p-5 rounded-2xl border-2 text-left transition-all active:scale-[0.98] ${
                    diet === opt.label ? 'border-[#FF385C] bg-[#FF385C]/5 ring-2 ring-[#FF385C]/20' : 'border-gray-100 bg-white hover:border-gray-200'
                  }`}>
                  <p className="font-bold text-base text-gray-900 mb-1">{opt.icon} {opt.label}</p>
                  <p className="text-sm text-gray-500 leading-snug">{opt.note}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Health Goal */}
        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-2 duration-300">
            <div className="mb-8">
              <h2 className="text-3xl font-black tracking-tight text-gray-900">{STEPS[2].title}</h2>
              <p className="text-base text-gray-500 mt-2">{STEPS[2].subtitle}</p>
              <div className="mt-4 p-4 rounded-xl bg-blue-50 border border-blue-100">
                <p className="text-sm text-blue-700 font-medium leading-relaxed">{STEPS[2].benefit}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {HEALTH_GOALS.map(opt => (
                <button key={opt.label} onClick={() => setHealthGoal(opt.label)}
                  className={`p-5 rounded-2xl border-2 text-left transition-all active:scale-[0.98] ${
                    healthGoal === opt.label ? 'border-[#FF385C] bg-[#FF385C]/5 ring-2 ring-[#FF385C]/20' : 'border-gray-100 bg-white hover:border-gray-200'
                  }`}>
                  <p className="font-bold text-base text-gray-900 mb-1">{opt.icon} {opt.label}</p>
                  <p className="text-sm text-gray-500 leading-snug">{opt.note}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Taste Profile — spice + allergies + novelty in ONE screen */}
        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-right-2 duration-300">
            <div className="mb-6">
              <h2 className="text-3xl font-black tracking-tight text-gray-900">{STEPS[3].title}</h2>
              <p className="text-base text-gray-500 mt-2">{STEPS[3].subtitle}</p>
              <div className="mt-4 p-4 rounded-xl bg-rose-50 border border-rose-100">
                <p className="text-sm text-rose-700 font-medium leading-relaxed">{STEPS[3].benefit}</p>
              </div>
            </div>

            {/* Spice */}
            <p className="text-sm font-bold text-gray-700 mb-2">🌶️ Spice level</p>
            <div className="grid grid-cols-3 gap-3 mb-6">
              {SPICE_OPTIONS.map(opt => (
                <button key={opt.value} onClick={() => setSpiceLevel(opt.value === 'mild' ? 1 : opt.value === 'hot' ? 3 : 2)}
                  className={`p-4 rounded-2xl border-2 text-center transition-all active:scale-[0.98] ${
                    (opt.value === 'mild' ? spiceLevel === 1 : opt.value === 'hot' ? spiceLevel === 3 : spiceLevel === 2)
                      ? 'border-[#FF385C] bg-[#FF385C]/5 ring-2 ring-[#FF385C]/20' : 'border-gray-100 bg-white hover:border-gray-200'
                  }`}>
                  <p className="text-xl mb-1">{opt.icon}</p>
                  <p className="font-bold text-sm text-gray-900">{opt.label}</p>
                  <p className="text-[11px] text-gray-500 leading-tight mt-0.5">{opt.note}</p>
                </button>
              ))}
            </div>

            {/* Allergies */}
            <p className="text-sm font-bold text-gray-700 mb-2">🚫 Allergies (we never recommend these)</p>
            <div className="flex flex-wrap gap-2 mb-6">
              {COMMON_ALLERGIES.map(a => (
                <button key={a} onClick={() => toggleAllergy(a)}
                  className={`px-3 py-2 rounded-full border-2 text-xs font-bold transition-all active:scale-95 ${
                    allergies.includes(a) ? 'border-[#FF385C] bg-[#FF385C]/5 text-[#FF385C]' : 'border-gray-100 bg-white text-gray-600 hover:border-gray-200'
                  }`}>
                  {allergies.includes(a) ? '✓ ' : ''}{a}
                </button>
              ))}
              {allergies.length > 0 && (
                <button onClick={() => setAllergies([])} className="px-3 py-2 rounded-full text-xs font-bold text-gray-400 active:opacity-60">
                  Clear
                </button>
              )}
            </div>

            {/* Novelty */}
            <p className="text-sm font-bold text-gray-700 mb-2">🧭 How adventurous are you?</p>
            <div className="grid grid-cols-3 gap-3">
              {NOVELTY_OPTIONS.map(opt => (
                <button key={opt.value} onClick={() => setNoveltyPreference(opt.value)}
                  className={`p-4 rounded-2xl border-2 text-center transition-all active:scale-[0.98] ${
                    noveltyPreference === opt.value ? 'border-[#FF385C] bg-[#FF385C]/5 ring-2 ring-[#FF385C]/20' : 'border-gray-100 bg-white hover:border-gray-200'
                  }`}>
                  <p className="text-xl mb-1">{opt.icon}</p>
                  <p className="font-bold text-sm text-gray-900">{opt.label}</p>
                  <p className="text-[11px] text-gray-500 leading-tight mt-0.5">{opt.note}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 5: Summary + Cook Contact */}
        {step === 4 && (
          <div className="animate-in fade-in slide-in-from-right-2 duration-300">
            <div className="mb-8">
              <h2 className="text-3xl font-black tracking-tight text-gray-900">Almost there!</h2>
              <p className="text-base text-gray-500 mt-2">Here's what you've set up. Add your cook's number to get the plan delivered.</p>
            </div>

            {/* Summary cards */}
            <div className="space-y-3 mb-8">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-white border border-gray-100">
                <span className="text-2xl">{REGIONS.find(r => r.label === (region || 'North India'))?.icon}</span>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Region</p>
                  <p className="text-base font-bold text-gray-900">{region || 'North India'}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-xl bg-white border border-gray-100">
                <span className="text-2xl">{DIETS.find(d => d.label === (diet || 'Veg'))?.icon}</span>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Diet</p>
                  <p className="text-base font-bold text-gray-900">{diet || 'Veg'}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-xl bg-white border border-gray-100">
                <span className="text-2xl">{HEALTH_GOALS.find(h => h.label === (healthGoal || 'Balanced'))?.icon}</span>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Health Focus</p>
                  <p className="text-base font-bold text-gray-900">{healthGoal || 'Balanced'}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-xl bg-white border border-gray-100">
                <span className="text-2xl">{spiceLevel === 1 ? '🌱' : spiceLevel === 3 ? '🔥' : '🌶️'}</span>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Taste</p>
                  <p className="text-base font-bold text-gray-900">
                    {spiceLevel === 1 ? 'Mild' : spiceLevel === 3 ? 'Hot' : 'Medium'} · {NOVELTY_OPTIONS.find(n => n.value === noveltyPreference)?.label}
                    {allergies.length > 0 ? ` · ${allergies.join(', ')}` : ''}
                  </p>
                </div>
              </div>
            </div>

            {/* Cook number */}
            <div className="rounded-2xl border-2 border-gray-100 bg-white p-6">
              <div className="flex items-center gap-2 mb-2">
                <MessageCircle size={20} className="text-green-500" />
                <label className="text-sm font-bold text-gray-700">Cook's WhatsApp Number</label>
              </div>
              <p className="text-sm text-gray-500 mb-5 leading-relaxed">
                Your cook gets a live link to today's plan that updates on its own — no app needed on their end. You can also WhatsApp the plan anytime.
              </p>
              <input
                type="tel"
                value={cookContact}
                onChange={e => setCookContact(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-base font-semibold focus:outline-none focus:ring-2 focus:ring-[#FF385C] focus:border-transparent"
                autoFocus
              />
              {cookContact.length >= 10 && (
                <div className="mt-4 flex items-center gap-2 text-green-600 animate-in fade-in">
                  <Check size={16} />
                  <span className="text-sm font-medium">Number set — send the plan to the cook anytime</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom action */}
      <div className="bg-white px-6 pt-5 border-t border-gray-100 pb-[max(2rem,env(safe-area-inset-bottom,0px))]">
        <button
          onClick={isLastStep ? handleComplete : goNext}
          disabled={!canContinue}
          className="w-full py-5 rounded-2xl bg-[#FF385C] text-white font-bold text-lg flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-30 hover:bg-[#e03050] shadow-lg shadow-[#FF385C]/20"
        >
          {isLastStep ? (
            <><Check size={20} /> Start Planning</>
          ) : (
            <><span>Continue</span> <ChevronRight size={20} /></>
          )}
        </button>
        {!isLastStep && (
          <button onClick={() => setStep(STEPS.length - 1)} className="w-full text-center text-sm text-gray-400 font-semibold mt-4 active:opacity-60">
            Skip to end
          </button>
        )}
      </div>
    </div>
  );
};

export default FlashOnboarding;
