import React, { useState, useEffect } from 'react';
import { User, Loader2, Sparkles } from 'lucide-react';
import { generatePrimaryId } from '../../types/identity';
import { useStore } from '../../app/store/useStore';

interface LoginScreenProps {
    onLogin: (username: string) => void;
}

const STEPS = [
    {
        icon: '🍛', label: 'Pick meals for the week',
        desc: 'Choose from 400+ Indian dishes. Breakfast, lunch, snacks & dinner — all planned in minutes.',
        color: 'bg-orange-50 border-orange-200',
        iconBg: 'bg-orange-100',
    },
    {
        icon: '🔄', label: 'Swap & customize',
        desc: 'Change any meal with one tap. Adjust servings, sides, and pairings — your plan, your way.',
        color: 'bg-purple-50 border-purple-200',
        iconBg: 'bg-purple-100',
    },
    {
        icon: '🤖', label: 'Auto-rotates weekly',
        desc: 'Set it once. Meals auto-schedule each week from your favorites. No more "what\'s for dinner?"',
        color: 'bg-blue-50 border-blue-200',
        iconBg: 'bg-blue-100',
    },
    {
        icon: '👨‍🍳', label: 'Cook gets it on WhatsApp',
        desc: 'Your cook receives the full plan every morning — dishes, quantities, and pairings. No app needed.',
        color: 'bg-green-50 border-green-200',
        iconBg: 'bg-green-100',
    },
];

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
    const [mode, setMode] = useState<'landing' | 'username'>('landing');
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const [activeStep, setActiveStep] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setActiveStep(prev => (prev + 1) % STEPS.length);
        }, 3000);
        return () => clearInterval(timer);
    }, []);

    const handleLogin = async (name: string) => {
        if (!name.trim()) return;
        setLoading(true);
        await new Promise(r => setTimeout(r, 600));
        onLogin(name.trim());
    };

    const handleGoogleLogin = () => {
        window.location.href = '/api/v1/auth/google';
    };

    return (
        <div className="min-h-screen bg-white flex flex-col max-w-lg mx-auto">
            {/* Hero */}
            <div className="relative flex-shrink-0 h-48 flex items-end pb-6 px-8 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#FF385C] via-[#d91a4a] to-[#a30f35]" />
                <img
                    src="/hero-food-bg.jpg"
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover opacity-30"
                    loading="lazy"
                />
                <div className="relative">
                    <h1 className="text-4xl font-black text-white tracking-tight leading-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]">Meal<span className="text-white/70">Drama</span></h1>
                    <p className="text-white text-sm font-bold mt-2 drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]">Plan meals · Share with cook · Less stress</p>
                </div>
            </div>

            <div className="flex-1 px-6 py-6 flex flex-col">
                {mode === 'landing' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 flex flex-col gap-4">
                        <div className="mb-1">
                            <p className="text-xl font-bold tracking-tight text-gray-900 leading-snug">"आज खाने में क्या बनाऊं?"</p>
                            <p className="text-sm font-medium text-gray-600 mt-2">Plan your family's meals in minutes. Your cook gets everything on WhatsApp.</p>
                        </div>

                        {/* Google Sign-In */}
                        <button
                            onClick={handleGoogleLogin}
                            className="w-full py-4 rounded-[24px] bg-white text-gray-800 border-2 border-gray-200 flex items-center justify-center gap-3 font-bold text-base shadow-sm active:scale-95 transition-all hover:border-gray-300"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                            Sign in with Google
                        </button>

                        <div className="flex items-center gap-3">
                            <div className="flex-1 h-px bg-gray-200" />
                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">or</span>
                            <div className="flex-1 h-px bg-gray-200" />
                        </div>

                        <button
                            onClick={() => setMode('username')}
                            className="w-full py-4 rounded-[24px] bg-[#FF385C] text-white flex items-center justify-center gap-3 font-bold text-lg shadow-xl shadow-[#FF385C]/30 active:scale-95 transition-all"
                        >
                            <User size={20} />
                            Continue without signing in
                        </button>

                        {/* How it works — simple step cards */}
                        <div className="mt-2 space-y-2">
                            <div className="flex items-center gap-2 mb-3">
                                <Sparkles size={14} className="text-[#FF385C]" />
                                <span className="text-xs font-black uppercase tracking-widest text-gray-400">How it works</span>
                            </div>
                            {STEPS.map((step, i) => (
                                <div key={i} className={`flex items-center gap-3 p-3.5 rounded-xl border ${step.color} transition-all duration-300`}
                                    style={{
                                        opacity: activeStep === i ? 1 : 0.5,
                                        transform: `scale(${activeStep === i ? 1 : 0.97})`,
                                    }}
                                >
                                    <div className={`w-10 h-10 rounded-xl ${step.iconBg} flex items-center justify-center text-xl flex-shrink-0`}>
                                        {step.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-gray-900">{step.label}</p>
                                        <p className="text-[11px] text-gray-500 leading-relaxed mt-0.5">{step.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <p className="text-[10px] text-center text-gray-400 mt-3 px-4 leading-relaxed font-medium">
                            Sign in with Google to sync across devices. Guest mode keeps everything on this device only.
                        </p>
                    </div>
                )}

                {mode === 'username' && (
                    <div className="animate-in fade-in slide-in-from-right-8 flex flex-col gap-6 mt-4">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight mb-2">Pick your handle</h2>
                            <p className="text-gray-500 mb-6">This will be your identity. No passwords needed — just pick a name and start planning.</p>
                        </div>

                        <div className="relative">
                            <div className="absolute left-5 top-1/2 -translate-y-1/2">
                                <User size={20} className="text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="your_name"
                                maxLength={20}
                                className="w-full bg-gray-50 border-none rounded-[28px] py-5 pl-14 pr-6 font-bold text-lg focus:ring-2 focus:ring-[#FF385C] outline-none"
                                value={username}
                                onChange={e => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                                onKeyDown={e => e.key === 'Enter' && handleLogin(username)}
                            />
                        </div>

                        <button
                            onClick={() => handleLogin(username)}
                            disabled={username.length < 3 || loading}
                            className="w-full py-5 rounded-[24px] bg-[#FF385C] text-white font-bold text-lg flex items-center justify-center gap-3 disabled:opacity-30 shadow-xl shadow-[#FF385C]/20 active:scale-95 transition-all"
                        >
                            {loading ? <Loader2 size={20} className="animate-spin" /> : <><span>Start Planning</span> →</>}
                        </button>
                        <button onClick={() => setMode('landing')} className="text-center text-sm text-gray-400 font-bold">← Back</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LoginScreen;
