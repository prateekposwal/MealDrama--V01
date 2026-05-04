import React, { useEffect, useMemo, useState } from 'react';
import { MessageCircle, Phone, X } from 'lucide-react';
import { getShareStrings, LANGUAGE_OPTIONS, ShareLanguage } from '../../utils/share';

const WhatsAppShareModal: React.FC<{
    isOpen: boolean;
    defaultPhone?: string;
    title: string;
    onClose: () => void;
    previewBuilder: (language: ShareLanguage) => string;
}> = ({ isOpen, defaultPhone = '', title, onClose, previewBuilder }) => {
    const [phone, setPhone] = useState(defaultPhone);
    const [language, setLanguage] = useState<ShareLanguage>('en');

    useEffect(() => {
        setPhone(defaultPhone || '');
    }, [defaultPhone, isOpen]);

    const preview = useMemo(() => previewBuilder(language), [language, previewBuilder]);
    const copy = getShareStrings(language);

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
        <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-end justify-center p-4">
            <div className="w-full max-w-lg rounded-[28px] bg-white shadow-2xl border border-gray-100 overflow-hidden">
                <div className="px-5 pt-5 pb-4 border-b border-gray-100 flex items-start justify-between gap-4">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-green-600 mb-2">WhatsApp preview</p>
                        <h3 className="text-xl font-bold text-gray-900">{title}</h3>
                        <p className="text-sm text-gray-500 mt-1">Choose the language your cook reads fastest, then review before sending.</p>
                    </div>
                    <button onClick={onClose} className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500">
                        <X size={16} />
                    </button>
                </div>

                <div className="px-5 py-4 space-y-4">
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

                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Cook&apos;s WhatsApp</p>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                            <input
                                type="tel"
                                value={phone}
                                onChange={(event) => setPhone(event.target.value)}
                                placeholder="+91 98765 43210"
                                className="w-full bg-gray-50 rounded-xl py-3 pl-9 pr-3 text-sm font-bold border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-400"
                            />
                        </div>
                    </div>

                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">{copy.todayPlan || copy.weekPlan}</p>
                        <div className="rounded-[22px] border border-gray-100 bg-gray-50 p-4 max-h-64 overflow-y-auto">
                            <pre className="whitespace-pre-wrap text-[13px] leading-relaxed font-medium text-gray-700">{preview}</pre>
                        </div>
                    </div>
                </div>

                <div className="px-5 pb-5">
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
