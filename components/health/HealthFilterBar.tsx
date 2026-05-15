import React from 'react';
import { Sparkles, ArrowUpDown } from 'lucide-react';
import type { HealthSortKey, HealthFilterPreset } from '../../utils/healthSortFilter';

interface HealthFilterBarProps {
  activePreset: HealthFilterPreset | null;
  activeSort: HealthSortKey | null;
  onPresetChange: (preset: HealthFilterPreset | null) => void;
  onSortChange: (sort: HealthSortKey | null) => void;
}

const presets: { id: HealthFilterPreset; label: string; icon: string }[] = [
  { id: 'healthy', label: 'Healthy', icon: '🌟' },
  { id: 'high-protein', label: 'High Protein', icon: '🥩' },
  { id: 'high-fiber', label: 'High Fiber', icon: '🌾' },
  { id: 'low-fat', label: 'Low Fat', icon: '🫒' },
  { id: 'low-calorie', label: 'Low Cal', icon: '🥗' },
];

const sortOptions: { id: HealthSortKey; label: string }[] = [
  { id: 'health-score', label: 'Health Score' },
  { id: 'protein', label: 'Protein' },
  { id: 'fiber', label: 'Fiber' },
  { id: 'low-fat', label: 'Low Fat' },
];

export const HealthFilterBar: React.FC<HealthFilterBarProps> = React.memo(({
  activePreset,
  activeSort,
  onPresetChange,
  onSortChange,
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles size={14} className="text-emerald-500" />
        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Health Filters</span>
      </div>

      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
        <button
          onClick={() => onPresetChange(null)}
          className={`shrink-0 px-3 py-1.5 rounded-full text-[9px] font-bold border transition-all ${
            activePreset === null
              ? 'bg-gray-900 text-white border-gray-900'
              : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
          }`}
        >
          All
        </button>
        {presets.map(p => (
          <button
            key={p.id}
            onClick={() => onPresetChange(activePreset === p.id ? null : p.id)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-[9px] font-bold border transition-all flex items-center gap-1 ${
              activePreset === p.id
                ? 'bg-emerald-500 text-white border-emerald-500'
                : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-300'
            }`}
          >
            <span>{p.icon}</span>
            <span>{p.label}</span>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <ArrowUpDown size={12} className="text-gray-400" />
        <span className="text-[9px] font-bold text-gray-400">Sort by:</span>
        <div className="flex gap-1">
          {sortOptions.map(s => (
            <button
              key={s.id}
              onClick={() => onSortChange(activeSort === s.id ? null : s.id)}
              className={`px-2 py-1 rounded-md text-[8px] font-bold border transition-all ${
                activeSort === s.id
                  ? 'bg-gray-800 text-white border-gray-800'
                  : 'bg-white text-gray-400 border-gray-200 hover:border-gray-400'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
});

HealthFilterBar.displayName = 'HealthFilterBar';
