import React, { useEffect, useMemo, useState } from 'react';
import { MessageCircle, Phone, X } from 'lucide-react';
import { buildCookNotification, MealChange, ShareLanguage, LANGUAGE_OPTIONS } from '../../utils/share';


interface CookNotifyModalProps {
    isOpen: boolean;
    defaultPhone?: string;
    change: MealChange | null;
    onClose: () => void;
    onSend: (phone: string, message: string) => void;
}

const CookNotifyModal: React.FC<CookNotifyModalProps> = ({ isOpen, defaultPhone = '', change, onClose, onSend }) => {
    const [phone, setPhone] = useState(defaultPhone);
    const [language, setLanguage] = useState<ShareLanguage>('en');

    useEffect(() => {
        setPhone(defaultPhone || '');
        setLanguage('en');
    }, [defaultPhone, isOpen]);

    const preview = useMemo(() => {
        if (!change) return '';
        return buildCookNotification(change, language);
    }, [change, language]);

    if (!isOpen || !change) return null;

    const shareNow = () => {
        const number = phone.replace(/\D/g, '');
        if (!number) {
            alert('Cook ka number daalo pehle.');
            return;
        }
        onSend(number, preview);
        onClose();
    };

    const slotLabel = change.slot;
    const titleText = change.type === 'swap' ? 'Plan changed — tell cook?'
        : change.type === 'added' ? 'New meal added — tell cook?'
            : change.type === 'removed' ? 'Meal removed — tell cook?'
                : change.type === 'guest' ? 'Guest servings added — tell cook?'
                    : 'Quantity changed — tell cook?';

    return (
        <div className="fixed inset-0 z-[60] backdrop-blur-sm flex items-end justify-center p-4 bg-black/40" onClick={onClose}>
            <div className="w-full max-w-lg rounded-[28px] shadow-md border overflow-hidden animate-in slide-in-from-bottom-8 bg-white border-gray-100" onClick={(e) => e.stopPropagation()}>
                <div className="px-5 pt-5 pb-4 border-b flex items-start justify-between gap-4 border-gray-100">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-green-500 mb-2">Meal<span className="text-[#FF385C]">Drama</span></p>
                        <h3 className="text-lg font-bold text-gray-900">{titleText}</h3>
                        <p className="text-sm mt-1 text-gray-500">Cook ko bhejna hai? Language pick karo, preview dekho, phir send.</p>
                    </div>
                        <button onClick={onClose} className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-gray-100 text-gray-500">
                        <X size={16} />
                    </button>
                </div>

                <div className="px-5 py-4 space-y-4">
                    {/* Language */}
                    <div>
                        <p className={`text-[10px] font-black uppercase tracking-widest mb-2 text-gray-400`}>Cook reads fastest in</p>
                        <div className="flex flex-wrap gap-2">
                            {LANGUAGE_OPTIONS.map(opt => (
                                <button
                                    key={opt.key}
                                    onClick={() => setLanguage(opt.key)}
                                    className={`px-3 py-2 rounded-xl text-sm font-bold border transition-all ${language === opt.key
                                        ? 'border-[#FF385C] bg-[#FF385C]/5 text-[#FF385C]'
                                        : 'border-gray-200 bg-gray-50 text-gray-600'
                                        }`}
                                >
                                    {opt.native}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Phone */}
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest mb-2 text-gray-400">Cook&apos;s WhatsApp</p>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="+91 98765 43210"
                                inputMode="tel"
                                className="w-full rounded-xl py-3 pl-9 pr-3 text-sm font-bold border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-400"
                            />
                        </div>
                    </div>

                    {/* Preview */}
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest mb-2 text-gray-400">WhatsApp preview — {slotLabel}</p>
                        <div className="rounded-[22px] border border-gray-100 bg-gray-50 p-4 max-h-56 overflow-y-auto">
                                <pre className="whitespace-pre-wrap text-[13px] leading-relaxed font-medium text-gray-700">{preview}</pre>
                        </div>
                    </div>
                </div>

                <div className="px-5 pb-5 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-4 rounded-[20px] font-bold text-base active:scale-[0.98] transition-all bg-gray-100 text-gray-700"
                    >
                        Not now
                    </button>
                    <button
                        onClick={shareNow}
                        className="flex-1 py-4 rounded-[20px] bg-[#25D366] text-white font-bold text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                    >
                        <MessageCircle size={18} />
                        Send on WhatsApp
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CookNotifyModal;
