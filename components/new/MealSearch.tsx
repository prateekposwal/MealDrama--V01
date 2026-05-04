import React, { useState, useEffect } from 'react';
import { Search, X, TrendingUp, MapPin, Plus } from 'lucide-react';
import { useStore } from '../../store/useStore';

const MealSearch: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { user } = useStore();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [trending, setTrending] = useState<any[]>([]);

    useEffect(() => {
        // Mocking trending logic
        const mockTrending = [
            { id: 1, name: 'Paneer Butter Masala', region: 'North', popularity: 98 },
            { id: 2, name: 'Hyderabadi Biryani', region: 'South', popularity: 95 },
            { id: 3, name: 'Misal Pav', region: 'West', popularity: 92 },
        ].filter(item => item.region === user?.region || user?.region === 'Global');

        setTrending(mockTrending);
    }, [user]);

    return (
        <div className="fixed inset-0 bg-white z-50 flex flex-col animate-in fade-in slide-in-from-bottom-8 duration-300">
            <header className="p-4 flex items-center gap-4 border-b border-gray-100">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        autoFocus
                        type="text"
                        placeholder="Search regional dishes..."
                        className="w-full bg-gray-50 border-none rounded-2xl py-4 pl-12 pr-4 font-medium focus:ring-2 focus:ring-[#FF385C]"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                </div>
                <button onClick={onClose} className="p-3 hover:bg-gray-100 rounded-full">
                    <X size={24} className="text-gray-900" />
                </button>
            </header>

            <div className="flex-1 overflow-y-auto p-6">
                {!query && trending.length > 0 && (
                    <section className="mb-8">
                        <div className="flex items-center gap-2 mb-4 text-[#FF385C]">
                            <TrendingUp size={18} />
                            <h3 className="font-bold text-sm uppercase tracking-widest">Trending in {user?.region}</h3>
                        </div>
                        <div className="space-y-3">
                            {trending.map((item) => (
                                <button
                                    key={item.id}
                                    className="w-full p-4 flex items-center justify-between bg-[#FF385C]/5 rounded-2xl border border-[#FF385C]/10 hover:border-[#FF385C] transition-all group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-xl">
                                            🔥
                                        </div>
                                        <div className="text-left">
                                            <span className="font-bold text-gray-900">{item.name}</span>
                                            <span className="text-[10px] text-gray-400 font-bold block uppercase">Recommended for you</span>
                                        </div>
                                    </div>
                                    <Plus size={20} className="text-[#FF385C] opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>
                            ))}
                        </div>
                    </section>
                )}

                {!query && (
                    <div className="p-12 text-center flex flex-col items-center gap-4 text-gray-400">
                        <div className="p-6 bg-gray-50 rounded-full">
                            <MapPin size={48} />
                        </div>
                        <p className="font-bold">What's on your mind today?</p>
                        <p className="text-xs max-w-[200px]">Search for any dish, or add your signature specialty to the MealDrama library.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MealSearch;
