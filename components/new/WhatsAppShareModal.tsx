import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { X, Phone, MessageCircle, Volume2, Check, Copy, Download, Square, Languages } from 'lucide-react';
import type { ShareLanguage as _Lang6 } from '../../utils/share';
import { ALL_LANGUAGES, LANG_TTS_MAP, renderSharePreview, messageCharCount, WHATSAPP_LIMIT, SHARE_STRINGS } from '../../utils/shareMessages';
import type { ShareLanguage } from '../../utils/shareMessages';
import { useStore } from '../../app/store/useStore';
import { useBackButtonClose } from '../../hooks/useBackButtonClose';

interface Props {
  isOpen: boolean;
  defaultPhone?: string;
  title?: string;
  previewBuilder?: (lang: _Lang6, selectedSlots: string[]) => string;
  recipeBuilder?: (lang: _Lang6, selectedSlots: string[]) => string;
  availableSlots: { key: string; label: string }[];
  completedSlots?: string[];
  preselectedSlot?: string | null;
  onClose: () => void;
}

const LANGUAGES = ALL_LANGUAGES;

const LANG_MAP: Record<string, string> = LANG_TTS_MAP;

export default function WhatsAppShareModal({
  isOpen, defaultPhone = '', title = 'Share Plan',
  previewBuilder, recipeBuilder, availableSlots, completedSlots = [], preselectedSlot,
  onClose,
}: Props) {
  useBackButtonClose(isOpen, onClose);
  const [language, setLanguage] = useState<ShareLanguage>('en');
  const [phone, setPhone] = useState(defaultPhone);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [includeEnglish, setIncludeEnglish] = useState(false);
  const [mode, setMode] = useState<'plan' | 'recipe'>('plan');

  useEffect(() => {
    if (isOpen) {
      setSelectedSlots(
        preselectedSlot
          ? [preselectedSlot]
          : availableSlots.filter(s => !completedSlots.includes(s.key)).map(s => s.key)
      );
    }
  }, [isOpen, preselectedSlot, availableSlots, completedSlots]);

  const preview = useMemo(() => {
    const lang6 = language as _Lang6;
    if (mode === 'recipe' && recipeBuilder) return recipeBuilder(lang6, selectedSlots);
    if (!previewBuilder) return '';
    return previewBuilder(lang6, selectedSlots);
  }, [previewBuilder, recipeBuilder, language, selectedSlots, mode]);

  const shareText = useMemo(() => {
    const lang6 = language as _Lang6;
    if (language === 'en' || (!previewBuilder && !recipeBuilder)) return preview;
    if (!includeEnglish) return preview; // whole message stays in the chosen language
    const eng = (mode === 'recipe' && recipeBuilder)
      ? recipeBuilder('en', selectedSlots)
      : (previewBuilder ? previewBuilder('en', selectedSlots) : '');
    if (!eng) return preview;
    return preview + '\n\n━━━━━━━━━━━━━━━\n' + eng;
  }, [preview, previewBuilder, recipeBuilder, language, selectedSlots, includeEnglish, mode]);

  const previewLines = useMemo(() => renderSharePreview(shareText), [shareText]);
  const charCount = useMemo(() => messageCharCount(shareText), [shareText]);

  const speakText = useMemo(() => {
    return preview.replace(/[*_#`]/g, '').replace(/\n{2,}/g, '\n').trim();
  }, [preview]);

  // Browser SpeechSynthesis — works cross-platform, supports Indian languages
  const speak = useCallback(() => {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(speakText);
    u.lang = LANG_MAP[language] || 'en-US';
    u.rate = 0.85;
    u.onstart = () => setSpeaking(true);
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(u);
  }, [speakText, language]);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  // Download voice via TTS endpoint (macOS `say` command)
  const downloadVoice = useCallback(async () => {
    try {
      const resp = await fetch('/api/v1/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: speakText, language }),
      });
      if (resp.ok) {
        const blob = await resp.blob();
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `MealDrama-${language}-voice.wav`;
        a.click();
      } else {
        useStore.getState().setToast?.({ message: 'Voice generation failed', type: 'error' });
      }
    } catch {
      useStore.getState().setToast?.({ message: 'Voice generation failed', type: 'error' });
    }
  }, [speakText, language]);

  const shareNow = () => {
    const num = phone.replace(/\D/g, '');
    if (!num) return;
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(shareText)}`, '_blank');
    onClose();
  };

  const copyText = () => {
    navigator.clipboard.writeText(shareText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const toggleSlot = (key: string) => {
    setSelectedSlots(prev => prev.includes(key) ? prev.filter(s => s !== key) : [...prev, key]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative bg-white rounded-t-[28px] sm:rounded-[28px] w-full max-w-lg mx-auto max-h-[90vh] flex flex-col shadow-xl" onClick={e => e.stopPropagation()}>

        <div className="shrink-0 px-5 pt-4 pb-3 border-b border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-gray-400">Share via WhatsApp</p>
            <h3 className="text-base font-bold text-gray-900 mt-0.5">{title}</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center active:scale-90"><X size={14} /></button>
        </div>

        <div className="overflow-y-auto px-5 py-4 space-y-4 flex-1">
          {recipeBuilder && (
            <div className="flex rounded-xl border border-gray-200 overflow-hidden text-xs font-bold">
              <button onClick={() => setMode('plan')}
                className={`flex-1 py-2.5 text-center transition-all ${mode === 'plan' ? 'bg-[#FF385C]/5 text-[#FF385C]' : 'bg-white text-gray-500'}`}
              >Kitchen List · Meal Plan</button>
              <button onClick={() => setMode('recipe')}
                className={`flex-1 py-2.5 text-center transition-all ${mode === 'recipe' ? 'bg-[#FF385C]/5 text-[#FF385C]' : 'bg-white text-gray-500'}`}
              >🍳 Recipe to Cook</button>
            </div>
          )}
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Language for cook</p>
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
              {LANGUAGES.map(l => (
                <button key={l.key} onClick={() => setLanguage(l.key)}
                  className={`shrink-0 px-3 py-2 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                    language === l.key ? 'border-[#FF385C] bg-[#FF385C]/5 text-[#FF385C]' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >{l.native}</button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Cook's WhatsApp</p>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full bg-gray-50 rounded-xl py-3 pl-9 pr-3 text-sm font-medium border border-gray-200 outline-none focus:border-gray-400 transition-all"
              />
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Meal slots</p>
            <div className="flex gap-1.5 flex-wrap">
              {availableSlots.map(slot => {
                const done = completedSlots.includes(slot.key);
                const sel = selectedSlots.includes(slot.key);
                return (
                  <button key={slot.key} onClick={() => done ? null : toggleSlot(slot.key)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                      done ? 'bg-gray-100 border-gray-200 text-gray-400 line-through cursor-default' :
                      sel ? 'bg-[#FF385C]/10 border-[#FF385C]/30 text-[#FF385C]' :
                      'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >{slot.label}{done && ' ✓'}</button>
                );
              })}
            </div>
          </div>

          {preview && (
            <div>
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Preview</p>
                <span className={`text-[10px] font-bold mb-2 ${charCount > WHATSAPP_LIMIT ? 'text-red-500' : 'text-gray-400'}`}>{charCount.toLocaleString('en-IN')} / {WHATSAPP_LIMIT.toLocaleString('en-IN')}</span>
              </div>
              <div className="rounded-xl bg-gray-50 border border-gray-100 p-3 max-h-64 overflow-y-auto">
                <div className="space-y-1">
                  {previewLines.map((line, i) => (
                    line.icon ? (
                      <div key={i} className="flex items-center gap-1.5 text-gray-300">
                        <span className="text-[10px]">{line.icon}</span>
                        <div className="flex-1 h-px bg-gray-200" />
                      </div>
                    ) : (
                      <p key={i} className={`${line.bold ? 'font-black text-gray-900' : 'text-gray-600'} ${line.sub ? 'ml-3 text-[12.5px]' : 'text-[13.5px]'} leading-snug`}>{line.icon && <span className="mr-1">{line.icon}</span>}{line.text}</p>
                    )
                  ))}
                </div>
              </div>

              {language !== 'en' && (
                <label className="flex items-center gap-2 mt-2 cursor-pointer select-none">
                  <input type="checkbox" checked={includeEnglish} onChange={e => setIncludeEnglish(e.target.checked)}
                    className="w-4 h-4 accent-[#FF385C]" />
                  <span className="text-xs font-bold text-gray-500">{SHARE_STRINGS[language].addEnglish}</span>
                </label>
              )}

              <div className="flex items-center gap-2 mt-2">
                <button onClick={copyText} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm font-bold text-gray-700 hover:border-[#FF385C]/30 hover:text-[#FF385C] active:scale-95 transition-all shadow-sm">
                  {copied ? <><Check size={13} className="text-green-500" /> Copied</> : <><Copy size={13} /> Copy</>}
                </button>
                <button onClick={speaking ? stopSpeaking : speak} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm font-bold text-gray-700 hover:border-[#FF385C]/30 hover:text-[#FF385C] active:scale-95 transition-all shadow-sm">
                  {speaking ? <><Square size={13} /> Stop</> : <><Volume2 size={13} /> Listen</>}
                </button>
                <button onClick={async () => {
                    const num = phone.replace(/\D/g, '');
                    if (!num) return;
                    await downloadVoice();
                    window.open(`https://wa.me/${num}?text=${encodeURIComponent(shareText)}`, '_blank');
                    onClose();
                  }} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm font-bold text-gray-700 hover:border-[#FF385C]/30 hover:text-[#FF385C] active:scale-95 transition-all shadow-sm">
                  <Download size={13} /> Voice
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="shrink-0 px-5 pt-3 border-t border-gray-100 space-y-2 pb-[max(1.25rem,env(safe-area-inset-bottom,0px))]">
          <button onClick={shareNow} disabled={!phone.replace(/\D/g, '')}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#FF385C] text-white text-xs font-bold active:scale-[0.98] transition-all disabled:opacity-40 shadow-sm"
          ><MessageCircle size={15} /> Send on WhatsApp</button>
          <p className="text-xs text-gray-400 text-center">Structure & labels follow {LANGUAGES.find(l => l.key === language)?.native || 'your language'} — dish names shown in their known form</p>
        </div>
      </div>
    </div>
  );
}
