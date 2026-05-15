import React from 'react';
import { Calendar as CalendarIcon, ChevronRight } from 'lucide-react';

const Planner: React.FC = () => {
    const days = [
        { day: 'Mon', date: '13', status: 'completed' },
        { day: 'Tue', date: '14', status: 'completed' },
        { day: 'Wed', date: '15', status: 'current' },
        { day: 'Thu', date: '16', status: 'upcoming' },
        { day: 'Fri', date: '17', status: 'upcoming' },
        { day: 'Sat', date: '18', status: 'upcoming' },
        { day: 'Sun', date: '19', status: 'upcoming' }
    ];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header>
                <h2 className="text-3xl font-bold tracking-tight">Planning Suite</h2>
                <p className="text-[#717171] font-medium">Weekly Cycle: April 13 - 19</p>
            </header>

            {/* Horizontal Calendar */}
            <div className="flex justify-between gap-2 overflow-x-auto py-4 -mx-6 px-6 no-scrollbar">
                {days.map((d, idx) => (
                    <div
                        key={idx}
                        className={`flex-shrink-0 w-16 h-24 rounded-[20px] flex flex-col items-center justify-center gap-2 transition-all ${d.status === 'current' ? 'bg-[#FF385C] text-white shadow-lg scale-110' :
                                d.status === 'completed' ? 'bg-white text-gray-400 opacity-60' : 'bg-white text-gray-900'
                            }`}
                    >
                        <span className="text-[10px] font-bold uppercase">{d.day}</span>
                        <span className="text-xl font-bold">{d.date}</span>
                    </div>
                ))}
            </div>

            {/* Strategy Selector */}
            <div className="space-y-4">
                <h3 className="font-bold text-lg text-gray-400 uppercase tracking-widest text-[10px]">Your Rhythm</h3>
                <button className="apple-card w-full flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center">
                            <CalendarIcon size={20} />
                        </div>
                        <div className="text-left">
                            <h4 className="font-bold text-gray-900">Weekly Planning</h4>
                            <p className="text-xs text-[#717171] font-medium">Generate 21 meals every Sunday</p>
                        </div>
                    </div>
                    <ChevronRight size={20} className="text-gray-300 group-hover:text-[#FF385C]" />
                </button>

                <button className="apple-card w-full flex items-center justify-between group opacity-50">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center">
                            <CalendarIcon size={20} />
                        </div>
                        <div className="text-left">
                            <h4 className="font-bold text-gray-900">Bi-Weekly Rhythm</h4>
                            <p className="text-xs text-[#717171] font-medium">Balanced planning for 14 days</p>
                        </div>
                    </div>
                    <ChevronRight size={20} className="text-gray-300" />
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
                <div className="apple-card bg-white">
                    <span className="text-3xl mb-2 block">🍳</span>
                    <h4 className="font-bold text-2xl">85%</h4>
                    <p className="text-xs text-gray-400 font-medium">Home Cooked</p>
                </div>
                <div className="apple-card bg-white">
                    <span className="text-3xl mb-2 block">🥗</span>
                    <h4 className="font-bold text-2xl">3.2k</h4>
                    <p className="text-xs text-gray-400 font-medium">kcal Saved</p>
                </div>
            </div>
        </div>
    );
};

export default Planner;
