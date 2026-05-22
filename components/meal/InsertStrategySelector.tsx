import React from 'react';
import { Calendar, Shuffle, Zap, ArrowRightToLine } from 'lucide-react';
import type { InsertStrategy } from '../../types/tray';

interface InsertStrategySelectorProps {
  value: InsertStrategy;
  onChange: (s: InsertStrategy) => void;
}

const OPTIONS: { value: InsertStrategy; label: string; desc: string; icon: React.ReactNode }[] = [
  { value: 'append', label: 'Append to Cycle', desc: 'New dishes added to end of queue', icon: <ArrowRightToLine size={12} /> },
  { value: 'smart-shuffle', label: 'Smart Shuffle', desc: 'Insert into upcoming 7-day window', icon: <Shuffle size={12} /> },
  { value: 'immediate', label: 'Immediate Priority', desc: 'New dishes jump to next slot', icon: <Zap size={12} /> },
  { value: 'next-cycle', label: 'Next Cycle Only', desc: 'Wait until current cycle ends', icon: <Calendar size={12} /> },
];

export const InsertStrategySelector: React.FC<InsertStrategySelectorProps> = ({ value, onChange }) => (
  <div>
    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">
      When New Dishes Are Added
    </label>
    <div className="space-y-1.5">
      {OPTIONS.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs border transition-all text-left ${
            value === opt.value
              ? 'bg-gray-900 text-white border-gray-900'
              : 'bg-white text-gray-600 border-gray-200'
          }`}
        >
          <span className={`shrink-0 ${value === opt.value ? 'text-white' : 'text-gray-400'}`}>
            {opt.icon}
          </span>
          <div className="min-w-0">
            <p className="font-bold">{opt.label}</p>
            <p className={`text-[9px] ${value === opt.value ? 'text-gray-300' : 'text-gray-400'}`}>
              {opt.desc}
            </p>
          </div>
        </button>
      ))}
    </div>
  </div>
);
