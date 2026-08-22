import React, { useState } from 'react';
import { User, Loader2 } from 'lucide-react';

interface LoginScreenProps {
    onLogin: (username: string) => void;
}

const STEPS = [
    { icon: '🍛', label: 'Pick meals', desc: '400+ Indian dishes to choose from' },
    { icon: '🔄', label: 'Swap & customize', desc: 'Adjust servings, sides & pairings' },
    { icon: '🤖', label: 'Auto-rotates weekly', desc: 'New plan every week from favorites' },
    { icon: '👨‍🍳', label: 'Cook gets it', desc: 'Full plan on WhatsApp every morning' },
];

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
    const [mode, setMode] = useState<'landing' | 'username'>('landing');
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);

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
        <div className="min-h-screen bg-gray-50 flex flex-col max-w-lg mx-auto w-full">
            {/* Hero */}
            <div className="relative flex-shrink-0 pt-14 pb-10 px-6 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#FF385C] via-[#d91a4a] to-[#a30f35]" />
                <div className="relative">
                    <h1 className="text-4xl font-black text-white tracking-tight leading-none">
                        Meal<span className="text-white/70">Drama</span>
                    </h1>
                    <p className="text-white/80 text-base font-medium mt-2 leading-relaxed">
                        Plan meals · Share with cook · Less stress
                    </p>
                </div>
            </div>

            <div className="flex-1 -mt-6 rounded-t-3xl bg-white px-6 pt-10 pb-12 shadow-sm">
                {mode === 'landing' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 flex flex-col gap-8">
                        <div className="text-center">
                            <p className="text-xl font-bold text-gray-900 leading-snug">"आज खाने में क्या बनाऊं?"</p>
                        </div>

                        {/* CTA Buttons */}
                        <div className="flex flex-col gap-4">
                            <button
                                onClick={handleGoogleLogin}
                                className="w-full py-4 rounded-2xl bg-white text-gray-800 border-2 border-gray-200 flex items-center justify-center gap-3 font-bold text-base active:scale-[0.98] transition-all hover:border-gray-300 hover:bg-gray-50"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                                Sign in with Google
                            </button>

                            <div className="flex items-center gap-4">
                                <div className="flex-1 h-px bg-gray-100" />
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">or</span>
                                <div className="flex-1 h-px bg-gray-100" />
                            </div>

                            <button
                                onClick={() => setMode('username')}
                                className="w-full py-4 rounded-2xl bg-[#FF385C] text-white flex items-center justify-center gap-2.5 font-bold text-base active:scale-[0.98] transition-all hover:bg-[#e03050]"
                            >
                                <User size={18} />
                                Continue as guest
                            </button>
                        </div>

                        {/* Features grid */}
                        <div>
                            <div className="flex items-center gap-2 mb-5">
                                <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                                <span className="text-xs font-bold uppercase tracking-widest text-gray-400">How it works</span>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                {STEPS.map((step, i) => (
                                    <div key={i} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                        <div className="text-xl mb-2">{step.icon}</div>
                                        <p className="text-sm font-bold text-gray-900 leading-snug">{step.label}</p>
                                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">{step.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <p className="text-xs text-center text-gray-400 leading-relaxed px-2">
                            Sign in with Google to sync across devices. Guest mode keeps everything on this device only.
                        </p>
                    </div>
                )}

                {mode === 'username' && (
                    <div className="animate-in fade-in slide-in-from-right-8 flex flex-col gap-8">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight text-gray-900">Pick your handle</h2>
                            <p className="text-base text-gray-500 mt-2 leading-relaxed">No passwords needed — just pick a name and start planning.</p>
                        </div>

                        <div className="relative">
                            <div className="absolute left-5 top-1/2 -translate-y-1/2">
                                <User size={20} className="text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="your_name"
                                maxLength={20}
                                className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 pl-13 pr-5 text-base font-semibold focus:outline-none focus:ring-2 focus:ring-[#FF385C] focus:border-transparent"
                                value={username}
                                onChange={e => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                                onKeyDown={e => e.key === 'Enter' && handleLogin(username)}
                            />
                        </div>

                        <button
                            onClick={() => handleLogin(username)}
                            disabled={username.length < 3 || loading}
                            className="w-full py-4 rounded-2xl bg-[#FF385C] text-white font-bold text-base flex items-center justify-center gap-2 disabled:opacity-30 active:scale-[0.98] transition-all hover:bg-[#e03050]"
                        >
                            {loading ? <Loader2 size={18} className="animate-spin" /> : <><span>Start Planning</span> →</>}
                        </button>
                        <button onClick={() => setMode('landing')} className="text-center text-base text-gray-400 font-semibold">← Back</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LoginScreen;
