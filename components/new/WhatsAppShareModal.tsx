import React, { useState, useMemo, useCallback, useRef } from 'react';
import { X, Phone, Square, MessageCircle, Volume2, Download } from 'lucide-react';
import { getShareStrings, ShareLanguage } from '../../utils/share';

interface Props {
  isOpen: boolean;
  defaultPhone?: string;
  title?: string;
  previewBuilder?: (lang: ShareLanguage, selectedSlots: string[]) => string;
  availableSlots: { key: string; label: string }[];
  onClose: () => void;
}

const LANGUAGE_OPTIONS = [
  { key: 'en' as ShareLanguage, label: 'English' },
  { key: 'hi' as ShareLanguage, label: 'हिन्दी' },
  { key: 'mr' as ShareLanguage, label: 'मराठी' },
  { key: 'bn' as ShareLanguage, label: 'বাংলা' },
  { key: 'ta' as ShareLanguage, label: 'தமிழ்' },
  { key: 'te' as ShareLanguage, label: 'తెలుగు' },
];

export default function WhatsAppShareModal({
  isOpen, defaultPhone = '', title = 'Share Plan',
  previewBuilder, availableSlots, onClose,
}: Props) {
  const [language, setLanguage] = useState<ShareLanguage>('en');
  const [phone, setPhone] = useState(defaultPhone);
  const [selectedSlots, setSelectedSlots] = useState(availableSlots.map(s => s.key));
  const [speaking, setSpeaking] = useState(false);
  const [ttsStatus, setTtsStatus] = useState<string>('idle');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const preview = useMemo(() => {
    if (!previewBuilder) return '';
    return previewBuilder(language, selectedSlots);
  }, [previewBuilder, language, selectedSlots]);

  // Bilingual preview: adds English version below native text
  const bilingualPreview = useMemo(() => {
    if (language === 'en') return preview;
    const englishVersion = previewBuilder ? previewBuilder('en', selectedSlots) : '';
    if (!englishVersion) return preview;
    return preview + '\n\n━━━ 📖 English ━━━\n' + englishVersion;
  }, [preview, previewBuilder, language, selectedSlots]);

  const speakScript = useMemo(() => {
    return preview.replace(/[*_#`]/g, '').replace(/\n{2,}/g, '\n').trim();
  }, [preview]);

  // TTS: generates audio via server, plays it and stores blob for sharing
  const speak = useCallback(async () => {
    window.speechSynthesis.cancel();
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    setAudioBlob(null);

    const langMap: Record<string, string> = { hi: 'Aditi', mr: 'Aditi', bn: 'Aditi', ta: 'Vani', te: 'Vani', en: 'Samantha' };
    const voice = langMap[language] || 'Samantha';

    try {
      const resp = await fetch(`/api/v1/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: speakScript, voice, language }),
      });
      if (resp.ok) {
        const blob = await resp.blob();
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onplay = () => { setSpeaking(true); setTtsStatus('playing'); };
        audio.onended = () => { setSpeaking(false); setTtsStatus('done'); };
        audio.onerror = () => { setSpeaking(false); setTtsStatus('idle'); };
        audio.play();
        return;
      }
    } catch {}

    // Fallback: browser SpeechSynthesis
    const utterance = new SpeechSynthesisUtterance(speakScript);
    utterance.lang = language === 'hi' ? 'hi-IN' : language === 'mr' ? 'mr-IN' : language === 'bn' ? 'bn-IN' : language === 'ta' ? 'ta-IN' : language === 'te' ? 'te-IN' : 'en-US';
    utterance.rate = 0.9;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, [speakScript, language]);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis.cancel();
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    setSpeaking(false);
  }, []);

  // Share voice note: download .wav + open WhatsApp with full text
  const shareVoice = useCallback(async () => {
    const number = phone.replace(/\D/g, '');
    if (!number) { alert('Add a WhatsApp number first.'); return; }

    // Generate audio
    let blob = audioBlob;
    if (!blob) {
      const langMap: Record<string, string> = { hi: 'Aditi', mr: 'Aditi', bn: 'Aditi', ta: 'Vani', te: 'Vani', en: 'Samantha' };
      try {
        const resp = await fetch(`/api/v1/tts`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: speakScript, voice: langMap[language] || 'Samantha', language }),
        });
        if (resp.ok) blob = await resp.blob();
      } catch {}
    }

    // Download the audio file
    if (blob) {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `MealDrama-${language}-voice.wav`;
      a.click();
    }

    // Open WhatsApp with the full bilingual meal plan
    window.open(`https://wa.me/${number}?text=${encodeURIComponent(bilingualPreview)}`, '_blank');
    onClose();
  }, [audioBlob, speakScript, language, phone, bilingualPreview, onClose]);

  const toggleSlot = (key: string) => {
    setSelectedSlots(prev => prev.includes(key) ? prev.filter(s => s !== key) : [...prev, key]);
  };

  const shareNow = () => {
    const number = phone.replace(/\D/g, '');
    if (!number) { alert('Add a WhatsApp number first.'); return; }
    window.open(`https://wa.me/${number}?text=${encodeURIComponent(bilingualPreview)}`, '_blank');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-sm flex items-end justify-center p-4 pt-12">
      <div className="w-full max-w-lg rounded-[28px] bg-white shadow-2xl border border-gray-100 max-h-[85dvh] flex flex-col pb-[env(safe-area-inset-bottom)]">
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-gray-100 flex items-start justify-between gap-4 flex-shrink-0">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-green-600 mb-2">WhatsApp</p>
            <h3 className="text-xl font-bold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500 mt-1">Choose language and review before sending.</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500">
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4 overflow-y-auto flex-1">
          {/* Language picker */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Regional language</p>
            <div className="flex flex-wrap gap-2">
              {LANGUAGE_OPTIONS.map(option => (
                <button key={option.key} onClick={() => setLanguage(option.key)}
                  className={`px-3 py-2 rounded-xl text-sm font-bold border transition-all ${language === option.key ? 'border-[#FF385C] bg-[#FF385C]/5 text-[#FF385C]' : 'border-gray-200 bg-gray-50 text-gray-600'}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Phone input */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Cook's WhatsApp</p>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full bg-gray-50 rounded-xl py-3 pl-9 pr-3 text-sm font-bold border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>
          </div>

          {/* Message preview with bilingual format */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Preview</p>
            <div className="rounded-[22px] border border-gray-100 bg-gray-50 p-4 max-h-64 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-[13px] leading-relaxed font-medium text-gray-700">{bilingualPreview}</pre>
            </div>
          </div>

          {/* Listen + Share Voice buttons */}
          <div className="flex gap-2">
            {!speaking ? (
              <button onClick={speak}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-200 text-gray-700 font-bold text-sm active:scale-[0.98]"
              >
                <Volume2 size={16} /> 🔊 Listen
              </button>
            ) : (
              <button onClick={stopSpeaking}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-red-100 text-red-600 font-bold text-sm active:scale-[0.98]"
              >
                <Square size={16} /> Stop
              </button>
            )}
            <button onClick={shareVoice}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#25D366] text-white font-bold text-sm active:scale-[0.98]"
            >
              <Download size={16} /> Share Voice 📤
            </button>
          </div>
          {ttsStatus === 'playing' && (
            <p className="text-[10px] text-emerald-600 font-bold animate-pulse text-center">🔊 Speaking...</p>
          )}
        </div>

        {/* Share button */}
        <div className="px-5 pb-5 flex-shrink-0">
          <button onClick={shareNow}
            className="w-full py-4 rounded-[20px] bg-[#25D366] text-white font-bold text-base flex items-center justify-center gap-3 shadow-xl shadow-green-500/20 active:scale-[0.98] transition-all"
          >
            <MessageCircle size={18} />
            Share on WhatsApp
          </button>
          {language !== 'en' && (
            <p className="text-[10px] text-gray-400 text-center mt-2">
              📖 English version included for readability
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
