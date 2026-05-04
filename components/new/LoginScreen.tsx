import React, { useState, useEffect } from 'react';
import { ChevronRight, Phone, Loader2 } from 'lucide-react';
import api from '../../lib/api';

interface LoginScreenProps {
    onLogin: (userId: string) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
    const [mode, setMode] = useState<'landing' | 'phone' | 'otp'>('landing');
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState(['', '', '', '']);
    const [loading, setLoading] = useState(false);

    // Generate or retrieve UUID on mount
    useEffect(() => {
        const storedId = localStorage.getItem('mealdrama-user-id');
        if (storedId) {
            onLogin(storedId);
        }
    }, []);

    const handleCreateUser = async () => {
        // Generate UUID
        const userId = crypto.randomUUID();
        localStorage.setItem('mealdrama-user-id', userId);
        
        // Try to create user in DB (fire-and-forget)
        try {
            await api.post('/users', { id: userId, name: 'User', phone: phone || null });
        } catch (e) {
            console.log('[Login] DB user create failed, using local only');
        }
        
        onLogin(userId);
    };

    const handleSendOTP = () => {
        if (phone.length < 10) return;
        setLoading(true);
        setTimeout(() => { setLoading(false); setMode('otp'); }, 1200);
    };

    const handleOTPChange = (val: string, idx: number) => {
        const next = [...otp];
        next[idx] = val.slice(-1);
        setOtp(next);
        if (val && idx < 3) {
            document.getElementById(`otp-${idx + 1}`)?.focus();
        }
        if (next.every(v => v !== '')) {
            setLoading(true);
            setTimeout(() => handleCreateUser(), 1000);
        }
    };

    return (
        <div className="min-h-screen bg-white flex flex-col max-w-lg mx-auto">
            {/* Hero gradient */}
            <div className="relative flex-shrink-0 h-64 bg-gradient-to-br from-[#FF385C] via-[#E31C5F] to-[#c00c4a] flex items-end pb-10 px-8 overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    {['🍛', '🫓', '🥘', '🍲', '🥗', '🍚', '🥟', '🍜'].map((e, i) => (
                        <span key={i} className="absolute text-5xl" style={{ top: `${10 + (i * 11) % 70}%`, left: `${(i * 13) % 88}%`, transform: `rotate(${i * 15}deg)` }}>{e}</span>
                    ))}
                </div>
                <div className="relative">
                    <h1 className="text-5xl font-black text-white tracking-tight leading-none">Meal<span className="opacity-60">Drama</span></h1>
                    <p className="text-white/70 font-medium mt-2">Every meal tells a story... preferably one that does not end in Maggi.</p>
                </div>
            </div>

            <div className="flex-1 p-8 flex flex-col">
                {mode === 'landing' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 flex flex-col gap-4 mt-4">
                        <h2 className="text-3xl font-bold tracking-tight mb-2">Get Started</h2>
                        <p className="text-gray-500 mb-4">Authentic Indian recipes that taste like home, even if your home once burnt dal.</p>

                        {/* Google Sign In (mock) */}
                        <button
                            onClick={() => { setLoading(true); setTimeout(() => handleCreateUser(), 1400); }}
                            className="w-full py-5 rounded-[24px] border-2 border-gray-100 bg-white flex items-center justify-center gap-4 font-bold text-gray-900 text-lg hover:border-gray-200 hover:shadow-lg active:scale-95 transition-all"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                            {loading ? <Loader2 size={20} className="animate-spin text-gray-400" /> : 'Continue with Google'}
                        </button>

                        <div className="flex items-center gap-4 my-2">
                            <div className="flex-1 h-px bg-gray-100" />
                            <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">or</span>
                            <div className="flex-1 h-px bg-gray-100" />
                        </div>

                        <button
                            onClick={() => setMode('phone')}
                            className="w-full py-5 rounded-[24px] bg-[#FF385C] text-white flex items-center justify-center gap-3 font-bold text-lg shadow-xl shadow-[#FF385C]/30 active:scale-95 transition-all"
                        >
                            <Phone size={22} />
                            Continue with Phone
                        </button>

                        <p className="text-xs text-center text-gray-400 mt-6 px-4 leading-relaxed font-medium">
                            By continuing, you agree to our Terms & Privacy Policy. Your food data stays private.
                        </p>
                    </div>
                )}

                {mode === 'phone' && (
                    <div className="animate-in fade-in slide-in-from-right-8 flex flex-col gap-6 mt-4">
                        <div>
                            <h2 className="text-3xl font-bold tracking-tight mb-2">Your Number</h2>
                            <p className="text-gray-500 mb-8">We&apos;ll send a 4-digit code faster than someone can ask, &quot;Arre yaar, aaj kya banau?&quot;</p>
                        </div>

                        <div className="relative group">
                            <div className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                <span className="text-xl">🇮🇳</span>
                                <span className="font-bold text-gray-500">+91</span>
                                <div className="w-px h-5 bg-gray-200 ml-1" />
                            </div>
                            <input
                                type="tel"
                                placeholder="98765 43210"
                                maxLength={10}
                                className="w-full bg-gray-50 border-none rounded-[28px] py-6 pl-28 pr-6 font-bold text-xl focus:ring-2 focus:ring-[#FF385C] tracking-widest"
                                value={phone}
                                onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                            />
                        </div>

                        <button
                            onClick={handleSendOTP}
                            disabled={phone.length < 10 || loading}
                            className="w-full py-5 rounded-[24px] bg-[#FF385C] text-white font-bold text-lg flex items-center justify-center gap-3 disabled:opacity-30 shadow-xl shadow-[#FF385C]/20 active:scale-95 transition-all"
                        >
                            {loading ? <Loader2 size={20} className="animate-spin" /> : <><span>Send OTP</span><ChevronRight size={20} /></>}
                        </button>
                        <button onClick={() => setMode('landing')} className="text-center text-sm text-gray-400 font-bold">← Back</button>
                    </div>
                )}

                {mode === 'otp' && (
                    <div className="animate-in fade-in slide-in-from-right-8 flex flex-col gap-6 mt-4">
                        <div>
                            <h2 className="text-3xl font-bold tracking-tight mb-2">Enter Code</h2>
                            <p className="text-gray-500 mb-8">Sent to +91 {phone}. Use <strong>1234</strong> for demo, kyunki OTP bhi kabhi drama karta hai.</p>
                        </div>

                        <div className="flex gap-4 justify-center">
                            {otp.map((val, idx) => (
                                <input
                                    key={idx}
                                    id={`otp-${idx}`}
                                    type="tel"
                                    maxLength={1}
                                    value={val}
                                    onChange={e => handleOTPChange(e.target.value, idx)}
                                    className="w-16 h-16 text-center text-2xl font-black bg-gray-50 rounded-2xl border-2 focus:border-[#FF385C] focus:ring-0 focus:bg-white transition-all outline-none"
                                />
                            ))}
                        </div>

                        {loading && (
                            <div className="flex items-center justify-center gap-3 text-gray-400 font-bold">
                                <Loader2 size={18} className="animate-spin text-[#FF385C]" />
                                Verifying…
                            </div>
                        )}

                        <button onClick={() => setMode('phone')} className="text-center text-sm text-gray-400 font-bold mt-4">← Change Number</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LoginScreen;
