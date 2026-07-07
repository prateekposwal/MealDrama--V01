import React, { useEffect, useMemo, useState } from 'react';
import { MessageCircle, Phone, X, Check } from 'lucide-react';
import { getShareStrings, LANGUAGE_OPTIONS, SLOT_LABELS, ShareLanguage } from '../../utils/share';
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll';
import { useBackButtonClose } from '../../hooks/useBackButtonClose';

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

    useEffect(() => {
        setPhone(defaultPhone || '');
    }, [defaultPhone, isOpen]);

    useEffect(() => {
        setSelectedSlots(preselectedSlot ? [preselectedSlot] : availableSlots.map(s => s.key));
    }, [availableSlots, isOpen, preselectedSlot]);

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

    if (!isOpen) return null;

    const shareNow = () => {
        const number = phone.replace(/\D/g, '');
        if (!number) {
            alert('Add a WhatsApp number first.');
            return;
        }
        window.open(`https://wa.me/${number}?text=${encodeURIComponent(preview)}`, '_blank');
        onClose();
    };

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

                    {/* Message preview */}
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Preview</p>
                        <div className="rounded-[22px] border border-gray-100 bg-gray-50 p-4 max-h-64 overflow-y-auto">
                            <pre className="whitespace-pre-wrap text-[13px] leading-relaxed font-medium text-gray-700">{preview}</pre>
                        </div>
                    </div>
                </div>

                <div className="px-5 pb-5 flex-shrink-0">
                    <button
                        onClick={shareNow}
                        className="w-full py-4 rounded-[20px] bg-[#25D366] text-white font-bold text-base flex items-center justify-center gap-3 shadow-xl shadow-green-500/20 active:scale-[0.98] transition-all"
                    >
                        <MessageCircle size={18} />
                        Share on WhatsApp
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WhatsAppShareModal;
