import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, User, Loader2, Sparkles, Plus, ArrowLeftRight, Repeat } from 'lucide-react';
import { generatePrimaryId } from '../../types/identity';
import { useStore } from '../../app/store/useStore';

interface LoginScreenProps {
    onLogin: (username: string) => void;
}

const STEPS = [
    {
        icon: Plus, label: 'Add meal', desc: 'Tap + to pick dishes from 400+ Indian meals',
        screen: (
            <div className="h-[100px] flex flex-col gap-1.5 p-3">
                <div className="flex items-center justify-between">
                    <div className="h-2 w-16 rounded-full bg-gray-200" />
                    <div className="h-5 w-5 rounded-full bg-[#FF385C] flex items-center justify-center shadow-lg shadow-[#FF385C]/40"><Plus size={10} className="text-white" /></div>
                </div>
                <div className="h-3 w-24 rounded-full bg-gray-100 mt-1" />
                <div className="flex gap-1.5 mt-2">
                    <div className="flex-1 h-12 rounded-xl bg-orange-100 flex items-center justify-center"><span className="text-[18px]">🍛</span></div>
                    <div className="flex-1 h-12 rounded-xl bg-green-100 flex items-center justify-center"><span className="text-[18px]">🥗</span></div>
                    <div className="flex-1 h-12 rounded-xl bg-yellow-100 flex items-center justify-center"><span className="text-[18px]">🍚</span></div>
                </div>
                <div className="flex gap-1.5">
                    <div className="flex-1 h-2 rounded-full bg-gray-100" />
                    <div className="flex-1 h-2 rounded-full bg-gray-100" />
                    <div className="flex-1 h-2 rounded-full bg-gray-100" />
                </div>
            </div>
        ),
    },
    {
        icon: ArrowLeftRight, label: 'Swap dish', desc: 'Replace any meal instantly with one tap',
        screen: (
            <div className="h-[100px] flex flex-col gap-1.5 p-3">
                <div className="h-2 w-20 rounded-full bg-gray-200" />
                <div className="flex items-center gap-2 mt-1 bg-[#FF385C]/5 rounded-xl p-2 border border-[#FF385C]/20">
                    <span className="text-[20px]">🍛</span>
                    <div className="flex-1"><div className="h-2 w-14 rounded-full bg-gray-300" /><div className="h-1.5 w-10 rounded-full bg-gray-200 mt-1" /></div>
                    <div className="h-6 w-6 rounded-lg bg-[#FF385C] flex items-center justify-center"><ArrowLeftRight size={12} className="text-white" /></div>
                </div>
                <div className="flex items-center gap-2 opacity-40">
                    <span className="text-[20px]">🥗</span>
                    <div className="flex-1"><div className="h-2 w-12 rounded-full bg-gray-200" /><div className="h-1.5 w-8 rounded-full bg-gray-100 mt-1" /></div>
                </div>
                <div className="flex items-center gap-2 opacity-40">
                    <span className="text-[20px]">🍚</span>
                    <div className="flex-1"><div className="h-2 w-10 rounded-full bg-gray-200" /><div className="h-1.5 w-7 rounded-full bg-gray-100 mt-1" /></div>
                </div>
            </div>
        ),
    },
    {
        icon: Repeat, label: 'Loop next week', desc: 'Auto-schedule meals across the week ahead',
        screen: (
            <div className="h-[100px] flex flex-col gap-1.5 p-3">
                <div className="flex items-center justify-between"><div className="h-2 w-14 rounded-full bg-gray-200" /><div className="text-[9px] font-bold text-gray-400">Next 7 days</div></div>
                <div className="flex gap-1 mt-1">
                    {['M','T','W','T','F','S','S'].map((d,i) => (
                        <div key={i} className={`flex-1 h-10 rounded-lg flex flex-col items-center justify-center gap-0.5 ${i < 3 ? 'bg-[#FF385C]/10 border border-[#FF385C]/20' : 'bg-gray-50'}`}>
                            <span className={`text-[8px] font-bold ${i < 3 ? 'text-[#FF385C]' : 'text-gray-300'}`}>{d}</span>
                            {i < 3 && <span className="text-[10px]">🍛</span>}
                        </div>
                    ))}
                </div>
                <div className="h-1.5 w-full rounded-full bg-gray-100 mt-1 overflow-hidden">
                    <div className="h-full w-[42%] rounded-full bg-gradient-to-r from-[#FF385C] to-purple-500" />
                </div>
            </div>
        ),
    },
];

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
    const [mode, setMode] = useState<'landing' | 'username'>('landing');
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const [activeStep, setActiveStep] = useState(0);
    const intervalRef = useRef<ReturnType<typeof setInterval>>();
    const touchStartX = useRef(0);

    useEffect(() => {
        intervalRef.current = setInterval(() => {
            setActiveStep(prev => (prev + 1) % STEPS.length);
        }, 2500);
        return () => clearInterval(intervalRef.current);
    }, []);

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0]!.clientX;
        clearInterval(intervalRef.current);
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        const diff = touchStartX.current - e.changedTouches[0]!.clientX;
        if (Math.abs(diff) > 50) {
            setActiveStep(prev => diff > 0
                ? (prev + 1) % STEPS.length
                : (prev - 1 + STEPS.length) % STEPS.length
            );
        }
        intervalRef.current = setInterval(() => {
            setActiveStep(prev => (prev + 1) % STEPS.length);
        }, 2500);
    };

    const handleLogin = async (name: string) => {
        if (!name.trim()) return;
        setLoading(true);
        await new Promise(r => setTimeout(r, 600));
        onLogin(name.trim());
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
                    <p className="text-white text-sm font-bold mt-2 drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]">Beta Access</p>
                </div>
            </div>

            <div className="flex-1 px-6 py-6 flex flex-col">
                {mode === 'landing' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 flex flex-col gap-4">
                        <div className="mb-2">
                            <p className="text-xl font-bold tracking-tight text-gray-900 leading-snug">"आज खाने में क्या बनाऊं?"</p>
                            <p className="text-sm font-medium text-gray-600 mt-2">Join the beta. Your data stays on your device.</p>
                        </div>

                        <button
                            onClick={() => setMode('username')}
                            className="w-full py-4 rounded-[24px] bg-[#FF385C] text-white flex items-center justify-center gap-3 font-bold text-lg shadow-xl shadow-[#FF385C]/30 active:scale-95 transition-all"
                        >
                            <User size={20} />
                            Create Beta Account
                        </button>

                        {/* Animated instructional card */}
                        <div className="relative mt-2">
                            <div className="absolute -inset-0.5 bg-gradient-to-br from-[#FF385C] via-purple-500 to-amber-400 rounded-[24px] opacity-30 blur-sm animate-pulse" />
                            <div
                                className="relative rounded-[22px] bg-white border border-gray-100 p-5 shadow-lg shadow-gray-200/50"
                                onTouchStart={handleTouchStart}
                                onTouchEnd={handleTouchEnd}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#FF385C] to-[#E31C5F] flex items-center justify-center shadow-lg shadow-[#FF385C]/20">
                                            <Sparkles size={14} className="text-white" />
                                        </div>
                                        <span className="text-sm font-bold text-gray-700">How it works</span>
                                    </div>
                                    <div className="flex gap-1">
                                        {[1,2,3].map(n => (
                                            <span key={n} className={`text-[10px] font-black ${n === activeStep + 1 ? 'text-[#FF385C]' : 'text-gray-200'}`}>{n}</span>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex flex-col items-center">
                                    <div className="relative h-[152px] w-full flex items-center justify-center">
                                        {STEPS.map((step, i) => (
                                            <div
                                                key={i}
                                                className={`transition-all duration-500 ease-out ${
                                                    i === activeStep
                                                        ? 'opacity-100 scale-100'
                                                        : 'opacity-0 scale-95 absolute pointer-events-none'
                                                }`}
                                            >
                                                <div className="relative w-[140px] rounded-[18px] overflow-hidden">
                                                    <div
                                                        className="absolute -inset-10 animate-spin-slow"
                                                        style={{
                                                            background: 'conic-gradient(#ffffff 0deg, #ffffff 54deg, #FF385C, #a855f7, #FF385C 360deg)',
                                                        }}
                                                    />
                                                    <div className="relative m-[4px] rounded-[14px] bg-gray-900 overflow-hidden shadow-xl">
                                                        <div className="h-4 bg-gray-800 flex items-center justify-center">
                                                            <div className="w-6 h-1.5 rounded-full bg-gray-700" />
                                                        </div>
                                                        {step.screen}
                                                        <div className="h-1 bg-gray-800" />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                <div className="relative w-full mt-4 min-h-[48px]">
                                        {STEPS.map((step, i) => (
                                            <div
                                                key={i}
                                                className={`transition-all duration-500 ease-out text-center ${
                                                    i === activeStep
                                                        ? 'opacity-100 translate-y-0'
                                                        : 'opacity-0 translate-y-2 absolute inset-0 pointer-events-none'
                                                }`}
                                            >
                                                <div className="text-sm font-bold text-gray-900 mb-0.5">{step.label}</div>
                                                <p className="text-[13px] text-gray-500 leading-relaxed px-2">{step.desc}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <p className="text-[10px] text-center text-gray-400 mt-4 px-4 leading-relaxed font-medium">
                            Each account is isolated to your device. No passwords needed.
                        </p>
                    </div>
                )}

                {mode === 'username' && (
                    <div className="animate-in fade-in slide-in-from-right-8 flex flex-col gap-6 mt-4">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight mb-2">Pick your handle</h2>
                            <p className="text-gray-500 mb-6">This will be your identity for this beta. No passwords, just meals.</p>
                        </div>

                        <div className="relative">
                            <div className="absolute left-5 top-1/2 -translate-y-1/2">
                                <User size={20} className="text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="user_name"
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
                            {loading ? <Loader2 size={20} className="animate-spin" /> : <><span>Start Planning</span><ChevronRight size={20} /></>}
                        </button>
                        <button onClick={() => setMode('landing')} className="text-center text-sm text-gray-400 font-bold">← Back</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LoginScreen;
