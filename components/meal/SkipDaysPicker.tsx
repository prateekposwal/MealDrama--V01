import React from 'react';
import { SkipForward, Check } from 'lucide-react';

interface SkipDaysPickerProps {
  skipDays: number[];
  onToggle: (day: number) => void;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

export const SkipDaysPicker: React.FC<SkipDaysPickerProps> = ({ skipDays, onToggle }) => (
  <div>
    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">
      <SkipForward size={12} className="inline mr-1" />
      Skip Days
    </label>
    <div className="flex gap-2">
      {ALL_DAYS.map(day => (
        <button
          key={day}
          onClick={() => onToggle(day)}
          className={`w-10 h-10 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-0.5 ${
            skipDays.includes(day)
              ? 'bg-red-500 text-white border-red-500 shadow-sm'
              : 'bg-gray-50 text-gray-600 border-gray-200'
          }`}
        >
          {skipDays.includes(day) && <Check size={10} className="shrink-0" />}
          {DAY_NAMES[day]}
        </button>
      ))}
    </div>
  </div>
);
