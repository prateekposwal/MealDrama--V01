import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { MessageCircle, Phone, X, Check, Play, Square, Volume2 } from 'lucide-react';
import { getShareStrings, LANGUAGE_OPTIONS, SLOT_LABELS, ShareLanguage } from '../../utils/share';
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll';
import { useBackButtonClose } from '../../hooks/useBackButtonClose';

const isCapacitor = !!(window as any).Capacitor?.isNative;

interface WhatsAppShareModalProps {
    isOpen: boolean;
    defaultPhone?: string;
    title: string;
    onClose: () => void;
    previewBuilder: (language: ShareLanguage, selectedSlots: string[]) => string;
    availableSlots: { key: string; label: string }[];
    completedSlots?: string[];
    preselectedSlot?: string | null;
}

const WhatsAppShareModal: React.FC<WhatsAppShareModalProps> = ({
    isOpen,
    defaultPhone = '',
    title,
    onClose,
    previewBuilder,
    availableSlots,
    completedSlots = [],
    preselectedSlot,
}) => {
    useLockBodyScroll(isOpen);
    useBackButtonClose(isOpen, onClose);
    const [phone, setPhone] = useState(defaultPhone || '');
    const [language, setLanguage] = useState<ShareLanguage>('en');
    const [selectedSlots, setSelectedSlots] = useState<string[]>(
        preselectedSlot ? [preselectedSlot] : availableSlots.map(s => s.key),
    );
    const [voiceMode, setVoiceMode] = useState(false);
    const [speaking, setSpeaking] = useState(false);
    const [recording, setRecording] = useState(false);
    const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
    const [ttsBlob, setTtsBlob] = useState<Blob | null>(null);
    const [ttsStatus, setTtsStatus] = useState<'idle' | 'no-voice' | 'playing' | 'done'>('idle');
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        setPhone(defaultPhone || '');
    }, [defaultPhone, isOpen]);

    useEffect(() => {
        setSelectedSlots(preselectedSlot ? [preselectedSlot] : availableSlots.map(s => s.key));
    }, [availableSlots, isOpen, preselectedSlot]);

    // Reset voice state when modal opens
    useEffect(() => {
        if (isOpen) {
            setVoiceMode(false);
            setSpeaking(false);
            setRecording(false);
            setRecordingBlob(null);
            setTtsBlob(null);
            setTtsStatus('idle');
        }
    }, [isOpen]);

    const preview = useMemo(
        () => previewBuilder(language, selectedSlots),
        [language, selectedSlots, previewBuilder],
    );
    const copy = getShareStrings(language);

    const toggleSlot = (key: string) => {
        setSelectedSlots(prev =>
            prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key],
        );
    };

    const selectAll = () => setSelectedSlots(availableSlots.map(s => s.key));
    const deselectAll = () => setSelectedSlots([]);

    // Build a speakable script from the preview text
    const speakScript = useMemo(() => {
        return preview
            .replace(/[*_#`]/g, '')
            .replace(/\n{2,}/g, '\n')
            .trim();
    }, [preview]);

    // Map language to macOS voice name
    const ttsVoiceForLang: Record<string, string> = {
        hi: 'Aditi', mr: 'Aditi', bn: 'Aditi', ta: 'Vani', te: 'Vani', en: 'Samantha',
    };

    // ─── Helper: get voices (load async) ───────────────────────────────────
    const getVoices = useCallback((): Promise<SpeechSynthesisVoice[]> => {
        return new Promise((resolve) => {
            const voices = window.speechSynthesis.getVoices();
            if (voices.length) {
                resolve(voices);
                return;
            }
            window.speechSynthesis.onvoiceschanged = () => {
                resolve(window.speechSynthesis.getVoices());
                window.speechSynthesis.onvoiceschanged = null;
            };
            setTimeout(() => resolve(window.speechSynthesis.getVoices()), 1000);
        });
    }, []);

    // ─── TTS: SpeechSynthesis first (sync, preserves gesture), server fallback ──
    const speak = useCallback(async (forRecording = false) => {
        window.speechSynthesis.cancel();
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }

        // Try SpeechSynthesis first — runs synchronously from gesture
        const trySpeechSynthesis = (): boolean => {
            const voices = window.speechSynthesis.getVoices();
            if (!voices.length) return false;
            const utterance = new SpeechSynthesisUtterance(speakScript);
            const langMap: Record<string, string> = {
                hi: 'hi-IN', mr: 'mr-IN', bn: 'bn-IN', ta: 'ta-IN', te: 'te-IN', en: 'en-US',
            };
            const targetLang = langMap[language] || 'en-US';
            const voice = voices.find(v => v.lang === targetLang) || voices.find(v => v.lang.startsWith(targetLang.slice(0, 2)));
            if (voice) utterance.voice = voice;
            utterance.lang = targetLang;
            utterance.rate = 0.9;
            utterance.onstart = () => { setSpeaking(true); setTtsStatus('playing'); };
            utterance.onend = () => { setSpeaking(false); setTtsStatus('done'); };
            utterance.onerror = () => { setSpeaking(false); setTtsStatus('idle'); };
            utteranceRef.current = utterance;
            window.speechSynthesis.speak(utterance);
            return true;
        };

        if (trySpeechSynthesis()) return;

        // Voices not loaded yet — wait and retry
        const voices = await getVoices();
        if (voices.length) {
            const utterance = new SpeechSynthesisUtterance(speakScript);
            const langMap: Record<string, string> = {
                hi: 'hi-IN', mr: 'mr-IN', bn: 'bn-IN', ta: 'ta-IN', te: 'te-IN', en: 'en-US',
            };
            const targetLang = langMap[language] || 'en-US';
            const voice = voices.find(v => v.lang === targetLang) || voices.find(v => v.lang.startsWith(targetLang.slice(0, 2)));
            if (voice) utterance.voice = voice;
            utterance.lang = targetLang;
            utterance.rate = 0.9;
            utterance.onstart = () => { setSpeaking(true); setTtsStatus('playing'); };
            utterance.onend = () => { setSpeaking(false); setTtsStatus('done'); };
            utterance.onerror = () => { setSpeaking(false); setTtsStatus('idle'); };
            utteranceRef.current = utterance;
            window.speechSynthesis.speak(utterance);
            return;
        }

        // SpeechSynthesis unavailable — try server TTS (WAV)
        const apiBase = window.location.origin.includes('localhost')
            ? 'http://localhost:3001'
            : window.location.origin;
        try {
            const resp = await fetch(`${apiBase}/api/v1/tts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: speakScript,
                    voice: ttsVoiceForLang[language] || 'Samantha',
                    language,
                }),
            });
            if (resp.ok) {
                const blob = await resp.blob();
                const url = URL.createObjectURL(blob);
                if (forRecording) setTtsBlob(blob);
                const audio = new Audio(url);
                audioRef.current = audio;
                audio.onplay = () => { setSpeaking(true); setTtsStatus('playing'); };
                audio.onended = () => { setSpeaking(false); setTtsStatus('done'); };
                audio.onerror = () => { setSpeaking(false); setTtsStatus('idle'); };
                await audio.play();
                return;
            }
        } catch {}

        setTtsStatus('no-voice');
    }, [speakScript, language, getVoices]);

    const stopSpeaking = useCallback(() => {
        window.speechSynthesis.cancel();
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
        setSpeaking(false);
        setTtsStatus('idle');
    }, []);

    // ─── Open system app settings on Android ──────────────────────────────
    const redirectToSettings = () => {
        if (isCapacitor) {
            window.location.href = 'package:com.mealdrama.app';
        } else {
            alert('Please enable mic access in your browser/phone settings for this app.\n\nOn Android: Settings → Apps → MealDrama → Permissions → Microphone\nOn iOS: Settings → MealDrama → Microphone');
        }
    };

    // ─── Record audio (mic picks up TTS from speaker) ─────────────────────
    const startRecording = useCallback(async () => {
        // Check permission state first while gesture is still fresh
        try {
            const perm = await navigator.permissions.query({ name: 'microphone' as PermissionName });
            if (perm.state === 'denied') {
                redirectToSettings();
                return;
            }
        } catch {}

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            chunksRef.current = [];
            const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };
            recorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                setRecordingBlob(blob);
                stream.getTracks().forEach(t => t.stop());
            };
            mediaRecorderRef.current = recorder;
            recorder.start();
            setRecording(true);
            // Start TTS after recording begins
            speak(true);
        } catch {
            redirectToSettings();
        }
    }, [speak]);

    const stopRecording = useCallback(() => {
        stopSpeaking();
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
        setRecording(false);
    }, [stopSpeaking]);

    // The audio to share: recording blob if available, otherwise server TTS blob
    const shareableBlob = recordingBlob || ttsBlob;

    const shareVoiceNote = useCallback(async () => {
        if (!shareableBlob) return;
        const number = phone.replace(/\D/g, '');
        if (!number) { alert('Add a WhatsApp number first.'); return; }

        const ext = shareableBlob.type.includes('webm') ? 'webm' : 'wav';
        const file = new File([shareableBlob], `menu-voice-note.${ext}`, { type: shareableBlob.type });
        if (navigator.share && navigator.canShare?.({ files: [file] })) {
            await navigator.share({ files: [file], title: "Today's Menu" });
        } else {
            window.open(`https://wa.me/${number}?text=${encodeURIComponent('🎤 Today\'s menu (voice note)\n\n' + preview)}`, '_blank');
        }
        onClose();
    }, [shareableBlob, phone, preview, onClose]);

    const shareNow = () => {
        const number = phone.replace(/\D/g, '');
        if (!number) {
            alert('Add a WhatsApp number first.');
            return;
        }
        window.open(`https://wa.me/${number}?text=${encodeURIComponent(preview)}`, '_blank');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-sm flex items-end justify-center p-4 pt-12">
            <div className="w-full max-w-lg rounded-[28px] bg-white shadow-2xl border border-gray-100 max-h-[85dvh] flex flex-col pb-[env(safe-area-inset-bottom)]">
                <div className="px-5 pt-5 pb-4 border-b border-gray-100 flex items-start justify-between gap-4 flex-shrink-0">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-green-600 mb-2">WhatsApp preview</p>
                        <h3 className="text-xl font-bold text-gray-900">{title}</h3>
                        <p className="text-sm text-gray-500 mt-1">Choose slots, language, and review before sending.</p>
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
                                <button
                                    key={option.key}
                                    onClick={() => setLanguage(option.key)}
                                    className={`px-3 py-2 rounded-xl text-sm font-bold border transition-all ${language === option.key ? 'border-[#FF385C] bg-[#FF385C]/5 text-[#FF385C]' : 'border-gray-200 bg-gray-50 text-gray-600'}`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Slot checkboxes - compact */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Meal slots</p>
                            <div className="flex gap-2">
                                <button onClick={selectAll} className="text-[9px] font-bold text-[#FF385C] active:opacity-60">All</button>
                                <button onClick={deselectAll} className="text-[9px] font-bold text-gray-400 active:opacity-60">None</button>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {availableSlots.map(slot => {
                                const isCompleted = completedSlots.includes(slot.key);
                                const isSelected = selectedSlots.includes(slot.key);
                                return (
                                    <button
                                        key={slot.key}
                                        onClick={() => toggleSlot(slot.key)}
                                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                                            isSelected
                                                ? 'border-[#FF385C] bg-[#FF385C]/5 text-[#FF385C]'
                                                : 'border-gray-200 bg-gray-50 text-gray-400'
                                        } ${isCompleted ? 'opacity-50' : ''}`}
                                    >
                                        <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                                            isSelected ? 'border-[#FF385C] bg-[#FF385C]' : 'border-gray-300'
                                        }`}>
                                            {isSelected && <Check size={8} className="text-white" />}
                                        </div>
                                        <span>{slot.label}</span>
                                        {isCompleted && <span className="text-[7px] text-green-600 font-bold">✓</span>}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Phone input */}
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Cook&apos;s WhatsApp</p>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="+91 98765 43210"
                                className="w-full bg-gray-50 rounded-xl py-3 pl-9 pr-3 text-sm font-bold border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-400"
                            />
                        </div>
                    </div>

                    {/* Toggle: Text ↔ Voice */}
                    <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-1">
                        <button
                            onClick={() => { try { stopSpeaking(); stopRecording(); } catch {} setVoiceMode(false); }}
                            className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${!voiceMode ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'}`}
                        >
                            <MessageCircle size={12} className="inline mr-1" />
                            Text
                        </button>
                        <button
                            onClick={() => { try { stopRecording(); } catch {} setVoiceMode(true); }}
                            className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${voiceMode ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'}`}
                        >
                            <Volume2 size={12} className="inline mr-1" />
                            Voice Note
                        </button>
                    </div>

                    {/* Voice Note controls */}
                    {voiceMode && (
                        <div className="rounded-[22px] border border-gray-100 bg-gray-50 p-4 space-y-3">
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Voice Note</p>
                            <p className="text-xs text-gray-500">{speakScript.slice(0, 120)}...</p>

                            <div className="flex gap-2">
                                {!speaking && !recording ? (
                                    <button
                                        onClick={() => speak(false)}
                                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-200 text-gray-700 font-bold text-xs active:scale-[0.98]"
                                    >
                                        <Play size={14} /> Listen
                                    </button>
                                ) : (
                                    <button
                                        onClick={stopSpeaking}
                                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-red-100 text-red-600 font-bold text-xs active:scale-[0.98]"
                                    >
                                        <Square size={14} /> Stop
                                    </button>
                                )}

                                {!recording ? (
                                    <button
                                        onClick={startRecording}
                                        disabled={speaking}
                                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#FF385C] text-white font-bold text-xs active:scale-[0.98] disabled:opacity-40"
                                    >
                                        <Volume2 size={14} /> Record & Share
                                    </button>
                                ) : (
                                    <button
                                        onClick={stopRecording}
                                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500 text-white font-bold text-xs active:scale-[0.98] animate-pulse"
                                    >
                                        <Square size={14} /> Stop & Send
                                    </button>
                                )}
                            </div>

                            {ttsStatus === 'playing' && (
                                <p className="text-[10px] text-emerald-600 font-bold animate-pulse text-center">🔊 Speaking...</p>
                            )}
                            {ttsStatus === 'no-voice' && (
                                <p className="text-[10px] text-amber-600 text-center">No voice found for this language on your device.</p>
                            )}
                            {shareableBlob && (
                                <button
                                    onClick={shareVoiceNote}
                                    className="w-full py-3 rounded-[20px] bg-[#25D366] text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98]"
                                >
                                    <MessageCircle size={16} />
                                    Send Voice Note to WhatsApp
                                </button>
                            )}
                            {ttsStatus === 'done' && !shareableBlob && (
                                <p className="text-[10px] text-gray-400 text-center">✅ Done. Record & Share to send as voice.</p>
                            )}
                        </div>
                    )}

                    {/* Message preview (text mode only) */}
                    {!voiceMode && (
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Preview</p>
                            <div className="rounded-[22px] border border-gray-100 bg-gray-50 p-4 max-h-64 overflow-y-auto">
                                <pre className="whitespace-pre-wrap text-[13px] leading-relaxed font-medium text-gray-700">{preview}</pre>
                            </div>
                        </div>
                    )}
                </div>

                {!voiceMode && (
                    <div className="px-5 pb-5 flex-shrink-0">
                        <button
                            onClick={shareNow}
                            className="w-full py-4 rounded-[20px] bg-[#25D366] text-white font-bold text-base flex items-center justify-center gap-3 shadow-xl shadow-green-500/20 active:scale-[0.98] transition-all"
                        >
                            <MessageCircle size={18} />
                            Share on WhatsApp
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WhatsAppShareModal;
