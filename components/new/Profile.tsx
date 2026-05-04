import React, { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { MapPin, ShieldAlert, Flame, Phone, LogOut, Bell, BellOff, Check, ChevronDown, ChevronRight, ArrowRight, SlidersHorizontal } from 'lucide-react';


const REGION_EMOJI: Record<string, string> = {
    'North India': '🟡',
    'South India': '🟢',
    'West India': '🔵',
    'East India': '🔴',
    'Central India': '🟣',
    'Northeast India': '🟠',
};
const ALLERGIES_LIST = ['Dairy', 'Nuts', 'Gluten', 'Soy', 'Seafood', 'Eggs'];
const SPICE_LABELS: Record<string, string> = { 'mild': 'Mild 🌿', 'medium': 'Medium 🌶️', 'hot': 'Hot 🔥' };

const Profile: React.FC<{ onLogout?: () => void; onOpenQuickSetup?: () => void }> = ({ onLogout }) => {
    const { user, trayLibrary, updateProfile, startTrayEdit, openQuickSetup } = useStore();
    const [nameDraft, setNameDraft] = useState<string>(user?.name ?? '');
    useEffect(() => {
        setNameDraft(user?.name ?? '');
    }, [user?.name]);
    const [editingRegion, setEditingRegion] = useState(false);
    const [editingAllergy, setEditingAllergy] = useState(false);
    const [editingCook, setEditingCook] = useState(false);
    const [editingSpice, setEditingSpice] = useState(false);
    const [cookInput, setCookInput] = useState(user?.cookContact || '');
    const [notifications, setNotifications] = useState(true);

    if (!user) return null;

    const closeAll = () => {
        setEditingRegion(false);
        setEditingAllergy(false);
        setEditingCook(false);
        setEditingSpice(false);
    };

    const toggleAllergy = (allergy: string) => {
        const next = user.allergies?.includes(allergy)
            ? user.allergies.filter((item: string) => item !== allergy)
            : [...(user.allergies || []), allergy];
        updateProfile({ allergies: next });
    };

    const traySummary = [
        { slot: 'Breakfast', count: trayLibrary.breakfast.length },
        { slot: 'Lunch', count: trayLibrary.lunch.length },
        { slot: 'Dinner', count: trayLibrary.dinner.length },
        { slot: 'Snacks', count: trayLibrary.snacks.length },
    ];

    return (
        <div className="min-h-screen bg-white pb-32 animate-in fade-in duration-500">
            <header className="px-6 pt-14 pb-6 bg-gradient-to-b from-gray-50 to-white">
                <div className="mb-6">
                <input
                    value={nameDraft}
                    onChange={(e) => setNameDraft(e.target.value)}
                    onBlur={() => {
                        updateProfile({ name: nameDraft });
                    }}
                    className="w-full bg-transparent font-bold text-3xl text-gray-900 tracking-tight outline-none border-b-2 border-transparent focus:border-[#FF385C] transition-colors placeholder:text-gray-300"
                    placeholder="Your name"
                />
            </div>
                <div className="flex items-center gap-5">
                    <div className="w-20 h-20 bg-gradient-to-br from-[#FF385C] to-[#E31C5F] rounded-[28px] flex items-center justify-center text-4xl shadow-xl shadow-[#FF385C]/20">
                        {REGION_EMOJI[user.region ?? 'India'] || '🍱'}
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold">{user.diet || 'Food Lover'}</h3>
                        <p className="text-gray-400 text-sm">{user.region} · {SPICE_LABELS[user.spiceLevel || 2]}</p>
                    </div>
                </div>
                {/* Visual stat cards removed: replaced by a focused Profile editing experience */}
            </header>
            <div className="px-6 pb-6">
                <div
                    className="p-5 rounded-[22px] bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer"
                    onClick={() => {
                        const spiceValue = ((): number => {
                            switch (user?.spiceLevel) {
                                case 'mild': return 1;
                                case 'hot': return 3;
                                default: return 2;
                            }
                        })();
                        const prefill: any = {
                            region: user?.region,
                            diet: user?.diet,
                            spiceLevel: spiceValue,
                            plannedSlots: user?.plannedSlots ?? [],
                            cookContact: user?.cookContact ?? '',
                        };
                        openQuickSetup?.(prefill);
                    }}
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#FF385C]/10 rounded-2xl flex items-center justify-center">
                            <SlidersHorizontal size={16} className="text-[#FF385C]" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-bold text-gray-900">Preferences</p>
                            <p className="text-xs text-gray-400">Region, diet, slots.</p>
                        </div>
                        <ChevronRight size={16} className="text-gray-400" />
                    </div>
                </div>
            </div>

            <main className="px-6 space-y-5">
                <section>
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Meal Management</h4>
                    <div className="space-y-3">
                        <div className="p-5 rounded-[22px] bg-[#FF385C]/5 border border-[#FF385C]/10">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-xs font-black uppercase tracking-widest text-[#FF385C]">Your Tray</p>
                                    <p className="text-base font-bold text-gray-900 mt-1">Your go-to meals.</p>
                                </div>
                                <button
                                    onClick={() => startTrayEdit({ returnTab: 'profile', slot: 'Lunch' })}
                                    className="px-4 py-2 rounded-2xl bg-[#FF385C] text-white text-xs font-black uppercase tracking-widest"
                                >
                                    Manage
                                </button>
                            </div>
                            <div className="grid grid-cols-2 gap-2 mt-4">
                                {traySummary.map(item => (
                                    <button
                                        key={item.slot}
                                        onClick={() => startTrayEdit({ returnTab: 'profile', slot: item.slot as any })}
                                        className="bg-white rounded-2xl border border-white/80 p-4 text-left shadow-sm"
                                    >
                                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{item.slot}</p>
                                        <p className="text-lg font-bold text-gray-900 mt-1">{item.count} saved</p>
                                    </button>
                                ))}
                            </div>
                        </div>


                    </div>
                </section>

                <section>
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Settings</h4>
                    <div className="space-y-3">
                        <div className="w-full p-5 rounded-[22px] bg-gray-50 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-11 h-11 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                                    <SlidersHorizontal size={18} className="text-[#FF385C]" />
                                </div>
                                <div>
                                    <p className="text-xs font-black text-gray-900">Vibe</p>
                                    <p className="text-[11px] text-gray-400">Start of something good.</p>
                                </div>
                            </div>
                            <button
                                onClick={() => startTrayEdit({ returnTab: 'profile', slot: 'Breakfast' })}
                                className="px-4 py-2 rounded-2xl bg-white border border-gray-100 text-[10px] font-black uppercase tracking-widest text-[#FF385C]"
                            >
                                Review
                            </button>
                        </div>

                        <div className="w-full p-5 rounded-[22px] bg-gray-50 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-11 h-11 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                                    {notifications ? <Bell size={18} className="text-violet-500" /> : <BellOff size={18} className="text-gray-400" />}
                                </div>
                                <div>
                                    <p className="text-xs font-black text-gray-900">Notifications</p>
                                    <p className="text-[11px] text-gray-400">{notifications ? 'Daily meal reminders' : 'Off'}</p>
                                </div>
                            </div>
                            <button onClick={() => setNotifications(state => !state)}
                                className={`w-12 h-6 rounded-full transition-all duration-300 relative ${notifications ? 'bg-violet-500' : 'bg-gray-200'}`}>
                                <div className={`w-5 h-5 bg-white rounded-full shadow absolute top-0.5 transition-all duration-300 ${notifications ? 'left-6' : 'left-0.5'}`} />
                            </button>
                        </div>
                    </div>
                </section>

                <section>
                    <button onClick={onLogout}
                        className="w-full p-5 rounded-[22px] bg-red-50 text-red-500 flex items-center justify-center gap-3 font-bold active:scale-95 transition-all">
                        <LogOut size={18} />Logout
                    </button>
                </section>
            </main>
        </div>
    );
};

export default React.memo(Profile);
