import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Check, MessageCircle } from 'lucide-react';

const REGIONS = [
  { label: 'North India', icon: '🌾', note: 'Ghee overload' },
  { label: 'South India', icon: '🥥', note: 'Coconut everything' },
  { label: 'East India', icon: '🐟', note: 'Fish & feelings' },
  { label: 'West India', icon: '🌶️', note: 'Spice is life' },
  { label: 'Central India', icon: '🍲', note: 'Comfort food headquarters' },
  { label: 'Northeast India', icon: '🍚', note: 'Ferments, fire, full emotion' },
] as const;

const DIETS = [
  { label: 'Veg', icon: '🥦', note: "Mummy's favorite" },
  { label: 'Eggitarian', icon: '🥚', note: 'Anda is life' },
  { label: 'Non-Veg', icon: '🍗', note: 'Chicken pe aaye ho' },
  { label: 'Vegan', icon: '🌱', note: 'No dairy, no sorry' },
] as const;

const HEALTH_GOALS = [
  { label: 'Balanced', icon: '⚖️', note: 'No restrictions' },
  { label: 'High Protein', icon: '🥩', note: 'Build & recover' },
  { label: 'High Fiber', icon: '🌾', note: 'Gut health first' },
  { label: 'Low Calorie', icon: '🥗', note: 'Light eating' },
  { label: 'Low Fat', icon: '🫒', note: 'Cut the grease' },
  { label: 'Weight Loss', icon: '🔥', note: 'Calorie deficit' },
] as const;

const STEPS = [
  { key: 'region', title: 'PICK YOUR FOOD REGION' },
  { key: 'diet', title: 'YOUR FOOD PREFERENCE' },
  { key: 'health', title: 'ANY HEALTH FOCUS?' },
  { key: 'cook', title: "YOUR COOK'S NUMBER" },
] as const;

interface FlashOnboardingProps {
  onComplete: (data: {
    region: string;
    diet: string;
    spiceLevel: number;
    cookContact: string;
    plannedSlots: ('Breakfast' | 'Lunch' | 'Dinner' | 'Snacks')[];
    healthGoal: string;
    onboardingComplete?: boolean;
  }) => void;
  isEditMode?: boolean;
  prefill?: {
    region?: string;
    diet?: string;
    spiceLevel?: number;
    plannedSlots?: ('Breakfast' | 'Lunch' | 'Dinner' | 'Snacks')[];
    cookContact?: string;
    healthGoal?: string;
  };
}

const FlashOnboarding: React.FC<FlashOnboardingProps> = ({ onComplete, isEditMode, prefill }) => {
  const [step, setStep] = useState(0);
  const [region, setRegion] = useState(prefill?.region ?? 'North India');
  const [diet, setDiet] = useState(prefill?.diet ?? 'Veg');
  const [spiceLevel] = useState(prefill?.spiceLevel ?? 2);
  const [healthGoal, setHealthGoal] = useState(prefill?.healthGoal ?? 'Balanced');
  const [cookContact, setCookContact] = useState(prefill?.cookContact ?? '');
  const [plannedSlots] = useState<('Breakfast' | 'Lunch' | 'Dinner' | 'Snacks')[]>(
    prefill?.plannedSlots ?? ['Breakfast', 'Lunch', 'Snacks', 'Dinner'],
  );
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    if (isEditMode && prefill) {
      if (prefill.region) setRegion(prefill.region);
      if (prefill.diet) setDiet(prefill.diet);
      if (prefill.cookContact !== undefined) setCookContact(prefill.cookContact);
    }
  }, [isEditMode, prefill]);

  const canContinue = step === 0 ? true : step === 1 ? true : step === 2 ? true : step === 3 ? cookContact.trim().length >= 10 : true;

  const goNext = useCallback(() => {
    if (step < STEPS.length - 1) {
      setDirection(1);
      setStep(s => s + 1);
    }
  }, [step]);

  const goBack = useCallback(() => {
    if (step > 0) {
      setDirection(-1);
      setStep(s => s - 1);
    }
  }, [step]);

  const handleComplete = useCallback(() => {
    onComplete({
      region,
      diet,
      spiceLevel,
      healthGoal,
      cookContact,
      plannedSlots,
      onboardingComplete: true,
    });
  }, [onComplete, region, diet, spiceLevel, healthGoal, cookContact, plannedSlots]);

  const isLastStep = step === STEPS.length - 1;

  return (
    <div className="min-h-screen bg-white max-w-lg mx-auto flex flex-col">
      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2 pt-14 pb-6">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === step ? 'w-8 bg-[#FF385C]' : i < step ? 'w-2 bg-[#FF385C]/50' : 'w-2 bg-gray-200'
            }`}
          />
        ))}
      </div>

      {/* Header with back */}
      <div className="flex items-center gap-3 px-6 mb-2">
        {step > 0 && (
          <button
            onClick={goBack}
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-gray-100 text-gray-600 active:scale-90 transition-all"
          >
            <ChevronLeft size={18} />
          </button>
        )}
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
          Step {step + 1} of {STEPS.length}
        </p>
      </div>

      {/* Step content */}
      <div className="flex-1 px-6 overflow-y-auto">
        {/* Step 1: Region */}
        {step === 0 && (
          <div className="animate-in fade-in slide-in-from-right-2 duration-300">
            <div className="mb-6">
              <h2 className="text-2xl font-black tracking-tight text-gray-900">{STEPS[0].title}</h2>
              <p className="text-sm text-gray-500 mt-1.5">Choose the flavors you enjoy most. You can change anytime.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {REGIONS.map(opt => (
                <button
                  key={opt.label}
                  onClick={() => setRegion(opt.label)}
                  className={`p-4 rounded-[20px] border-2 text-left transition-all active:scale-[0.98] ${
                    region === opt.label ? 'border-[#FF385C] bg-[#FF385C]/5' : 'border-gray-100 bg-white hover:border-gray-200'
                  }`}
                >
                  <p className="font-bold text-sm text-gray-900">{opt.icon} {opt.label}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">{opt.note}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Diet Preference */}
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-right-2 duration-300">
            <div className="mb-6">
              <h2 className="text-2xl font-black tracking-tight text-gray-900">{STEPS[1].title}</h2>
              <p className="text-sm text-gray-500 mt-1.5">Pick what fits your lifestyle.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {DIETS.map(opt => (
                <button
                  key={opt.label}
                  onClick={() => setDiet(opt.label)}
                  className={`p-4 rounded-[20px] border-2 text-left transition-all active:scale-[0.98] ${
                    diet === opt.label ? 'border-[#FF385C] bg-[#FF385C]/5' : 'border-gray-100 bg-white hover:border-gray-200'
                  }`}
                >
                  <p className="font-bold text-sm text-gray-900">{opt.icon} {opt.label}</p>
                  <p className="text-[11px] text-gray-500 mt-1">{opt.note}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Health Goal */}
        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-2 duration-300">
            <div className="mb-6">
              <h2 className="text-2xl font-black tracking-tight text-gray-900">{STEPS[2].title}</h2>
              <p className="text-sm text-gray-500 mt-1.5">We'll auto-apply this when suggesting dishes. Change anytime.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {HEALTH_GOALS.map(opt => (
                <button
                  key={opt.label}
                  onClick={() => setHealthGoal(opt.label)}
                  className={`p-4 rounded-[20px] border-2 text-left transition-all active:scale-[0.98] ${
                    healthGoal === opt.label ? 'border-[#FF385C] bg-[#FF385C]/5' : 'border-gray-100 bg-white hover:border-gray-200'
                  }`}
                >
                  <p className="font-bold text-sm text-gray-900">{opt.icon} {opt.label}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">{opt.note}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Cook Contact */}
        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-right-2 duration-300">
            <div className="mb-6">
              <h2 className="text-2xl font-black tracking-tight text-gray-900">Cook's WhatsApp Number</h2>
              <p className="text-sm text-gray-500 mt-1.5">This is where your daily meal plan gets sent. Your cook will receive the full plan — dishes, accompaniments, quantities — every morning.</p>
            </div>
            <div className="rounded-[24px] border border-gray-100 bg-gray-50 p-5">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">WhatsApp Number</label>
              <input
                type="tel"
                value={cookContact}
                onChange={e => setCookContact(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full bg-white border border-gray-200 rounded-[20px] px-5 py-4 text-sm font-bold mt-2 focus:outline-none focus:ring-2 focus:ring-[#FF385C]"
                autoFocus
              />
              <p className="text-[11px] text-gray-500 mt-3 flex items-center gap-1.5">
                <MessageCircle size={14} className="text-green-500" />
                Plan will be shared daily via WhatsApp
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom action */}
      <div className="px-6 pb-10 pt-4 border-t border-gray-100 bg-white">
        <button
          onClick={isLastStep ? handleComplete : goNext}
          disabled={!canContinue}
          className="w-full py-5 rounded-[24px] bg-[#FF385C] text-white font-black text-base flex items-center justify-center gap-3 shadow-xl shadow-[#FF385C]/20 active:scale-[0.98] transition-all disabled:opacity-40"
        >
          {isLastStep ? (
            <>
              <Check size={18} />
              Let's Go
            </>
          ) : (
            <>
              Next
              <ChevronRight size={18} />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default FlashOnboarding;
