import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Phone, X, Check, MessageCircle } from 'lucide-react';
import { useStore } from '../../store/useStore';

// Indian phone validation: 10 digits, starts with 6-9
const INDIAN_PHONE_REGEX = /^[6-9]\d{9}$/;
const INDIAN_PHONE_WITH_CODE_REGEX = /^(?:\+91|91)?[6-9]\d{9}$/;

function normalizePhone(raw: string): string {
    return raw.replace(/[\s\-\(\)]/g, '').replace(/^(\+91|91)/, '');
}

function isValidIndianPhone(raw: string): boolean {
    const cleaned = normalizePhone(raw);
    return INDIAN_PHONE_REGEX.test(cleaned);
}

function formatDisplayPhone(raw: string): string {
    const cleaned = normalizePhone(raw);
    if (cleaned.length === 10) {
        return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
    }
    return raw;
}

interface CookPhoneInputProps {
    onShare?: (phone: string) => void;
    compact?: boolean;
}

export const CookPhoneInput: React.FC<CookPhoneInputProps> = ({ onShare, compact }) => {
    const { user, updateProfile } = useStore();
    const existingPhone = user?.cookContact || '';
    const hasPhone = isValidIndianPhone(existingPhone);

    const [isEditing, setIsEditing] = useState(false);
    const [inputValue, setInputValue] = useState(existingPhone);
    const [isValid, setIsValid] = useState(hasPhone);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [copied, setCopied] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditing]);

    useEffect(() => {
        setInputValue(existingPhone);
        setIsValid(hasPhone);
    }, [existingPhone, hasPhone]);

    const handleInputChange = useCallback((value: string) => {
        const cleaned = value.replace(/[^\d+\s]/g, '');
        setInputValue(cleaned);
        const normalized = normalizePhone(cleaned);
        const valid = normalized.length === 0 || INDIAN_PHONE_REGEX.test(normalized) || INDIAN_PHONE_WITH_CODE_REGEX.test(cleaned);
        setIsValid(valid);
        if (!valid && normalized.length > 0) {
            setError('Enter a valid 10-digit Indian number');
        } else {
            setError(null);
        }
    }, []);

    const handleSave = useCallback(() => {
        const normalized = normalizePhone(inputValue);
        if (!normalized) {
            setError('Please enter a phone number');
            return;
        }
        if (!INDIAN_PHONE_REGEX.test(normalized)) {
            setError('Enter a valid 10-digit Indian number');
            return;
        }
        setSaving(true);
        const formatted = `+91${normalized}`;
        updateProfile({ cookContact: formatted });
        setIsEditing(false);
        setError(null);
        setSaving(false);
    }, [inputValue, updateProfile]);

    const handleCancel = useCallback(() => {
        setInputValue(existingPhone);
        setIsEditing(false);
        setError(null);
    }, [existingPhone]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSave();
        } else if (e.key === 'Escape') {
            handleCancel();
        }
    }, [handleSave, handleCancel]);

    const handleShare = useCallback(() => {
        const phone = normalizePhone(existingPhone);
        if (phone && onShare) {
            onShare(phone);
        }
    }, [existingPhone, onShare]);

    const handleCopy = useCallback(() => {
        if (hasPhone) {
            navigator.clipboard?.writeText(`+91${normalizePhone(existingPhone)}`).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            });
        }
    }, [existingPhone, hasPhone]);

    if (compact) {
        return (
            <button
                onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                className="flex items-center gap-2 group"
                aria-label={hasPhone ? `Cook's number: ${formatDisplayPhone(existingPhone)}. Tap to edit.` : 'Add cook phone number'}
            >
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-md shadow-green-500/20 group-active:scale-95 transition-transform">
                    {hasPhone ? <Phone size={14} fill="white" className="text-white" /> : <Phone size={14} className="text-white/80" />}
                </div>
                <span className={`text-xs font-bold ${hasPhone ? 'text-gray-700' : 'text-gray-400'}`}>
                    {hasPhone ? formatDisplayPhone(existingPhone) : 'Add number'}
                </span>
            </button>
        );
    }

    return (
        <div className="bg-gray-50 p-4 rounded-[24px] border border-gray-100">
            {isEditing ? (
                <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-start gap-3">
                        <div className="w-9 h-9 bg-green-500 rounded-full flex items-center justify-center shadow-md shadow-green-500/20 flex-shrink-0 mt-0.5">
                            <Phone size={16} fill="white" className="text-white" />
                        </div>
                        <div className="flex-1">
                            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2">
                                Cook&apos;s WhatsApp Number
                            </p>
                            <div className="flex items-center gap-2">
                                <div className="flex-1 relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">+91</span>
                                    <input
                                        ref={inputRef}
                                        type="tel"
                                        inputMode="numeric"
                                        value={inputValue.replace(/^(\+91|91)/, '')}
                                        onChange={(e) => handleInputChange(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="98765 43210"
                                        maxLength={10}
                                        className={`w-full bg-white rounded-xl py-3 pl-10 pr-3 text-sm font-bold border transition-all focus:outline-none ${
                                            error
                                                ? 'border-red-300 focus:ring-2 focus:ring-red-200'
                                                : inputValue && isValid
                                                ? 'border-green-300 focus:ring-2 focus:ring-green-200'
                                                : 'border-gray-200 focus:ring-2 focus:ring-green-200'
                                        }`}
                                        aria-label="Cook phone number"
                                        aria-invalid={!!error}
                                        aria-describedby={error ? 'phone-error' : undefined}
                                    />
                                </div>
                                <button
                                    onClick={handleSave}
                                    disabled={saving || !isValid || !normalizePhone(inputValue)}
                                    className="w-10 h-10 rounded-xl bg-green-500 text-white flex items-center justify-center disabled:opacity-40 active:scale-95 transition-all"
                                    aria-label="Save phone number"
                                >
                                    {saving ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <Check size={16} />
                                    )}
                                </button>
                                <button
                                    onClick={handleCancel}
                                    className="w-10 h-10 rounded-xl bg-gray-100 text-gray-500 flex items-center justify-center active:scale-95 transition-all"
                                    aria-label="Cancel"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                            {error && (
                                <p id="phone-error" className="text-[10px] font-bold text-red-500 mt-1.5" role="alert">
                                    {error}
                                </p>
                            )}
                            {!error && inputValue && isValid && (
                                <p className="text-[10px] font-bold text-green-600 mt-1.5">
                                    Valid Indian number
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => {
                            setInputValue(existingPhone);
                            setIsEditing(true);
                        }}
                        className="flex items-center gap-3 flex-1 text-left group"
                        aria-label={hasPhone ? `Cook's number: ${formatDisplayPhone(existingPhone)}. Tap to edit.` : 'Add cook phone number'}
                    >
                        <div className="w-9 h-9 bg-green-500 rounded-full flex items-center justify-center shadow-md shadow-green-500/20 group-active:scale-95 transition-transform">
                            <Phone size={16} fill="white" className="text-white" />
                        </div>
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Cook</p>
                            <p className="text-sm font-bold">
                                {hasPhone ? formatDisplayPhone(existingPhone) : '— Drop a number'}
                            </p>
                        </div>
                    </button>
                    {hasPhone && onShare && (
                        <button
                            onClick={handleShare}
                            className="bg-white px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-[#FF385C] shadow-sm border border-gray-100 active:scale-95 transition-all flex items-center gap-1.5"
                            aria-label="Share plan on WhatsApp"
                        >
                            <MessageCircle size={12} />
                            Share
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export { isValidIndianPhone, normalizePhone, formatDisplayPhone };
