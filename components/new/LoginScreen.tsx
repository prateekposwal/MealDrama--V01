import React, { useState, useEffect } from 'react';
import { ChevronRight, User, Loader2, Sparkles } from 'lucide-react';
import { generatePrimaryId } from '../../types/identity';
import { useStore } from '../../store/useStore';

interface LoginScreenProps {
    onLogin: (username: string) => void;
}

// Pre-filled beta accounts for easy testing
const BETA_ACCOUNTS = [
    { label: 'North India User', username: 'beta_north_01' },
    { label: 'South India User', username: 'beta_south_02' },
    { label: 'Vegan Tester', username: 'beta_vegan_03' },
    { label: 'Keto Tester', username: 'beta_keto_04' },
    { label: 'Family Plan', username: 'beta_family_05' },
];

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
    const [mode, setMode] = useState<'landing' | 'username'>('landing');
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (name: string) => {
        if (!name.trim()) return;
        setLoading(true);
        // Simulate brief loading for UX
        await new Promise(r => setTimeout(r, 600));
        onLogin(name.trim());
    };

    return (
        <div className="min-h-screen bg-white flex flex-col max-w-lg mx-auto">
            {/* Hero */}
            <div className="relative flex-shrink-0 h-48 flex items-end pb-6 px-8 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#FF385C] via-[#E31C5F] to-[#c00c4a]" />
                <img
                    src="/hero-food-bg.jpg"
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover opacity-30"
                    loading="lazy"
                />
                <div className="relative">
                    <h1 className="text-4xl font-black text-white tracking-tight leading-none">Meal<span className="opacity-60">Drama</span></h1>
                    <p className="text-white text-sm font-bold mt-2">Beta Access</p>
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

                        <div className="relative my-2">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-100" />
                            </div>
                            <div className="relative flex justify-center text-xs">
                                <span className="px-3 bg-white text-gray-400 font-bold uppercase tracking-widest">Quick Test</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            {BETA_ACCOUNTS.map((acc) => (
                                <button
                                    key={acc.username}
                                    onClick={() => handleLogin(acc.username)}
                                    className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 border border-gray-100 active:bg-gray-100 transition-colors text-left"
                                >
                                    <Sparkles size={14} className="text-[#FF385C]" />
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-gray-800 truncate">{acc.label}</p>
                                        <p className="text-[10px] text-gray-400 truncate">{acc.username}</p>
                                    </div>
                                </button>
                            ))}
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
                                placeholder="e.g. Rahul_Cooks"
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
