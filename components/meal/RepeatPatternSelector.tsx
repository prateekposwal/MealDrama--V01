import React from 'react';
import type { RepeatPattern } from '../../types/tray';

interface RepeatPatternSelectorProps {
  value: RepeatPattern;
  onChange: (p: RepeatPattern) => void;
}

export const RepeatPatternSelector: React.FC<RepeatPatternSelectorProps> = ({ value, onChange }) => (
  <div>
    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">
      Repeat Pattern
    </label>
    <div className="flex gap-2">
      <button
        onClick={() => onChange('sequential')}
        className={`flex-1 py-3 rounded-xl text-xs font-bold border transition-all ${
          value === 'sequential'
            ? 'bg-gray-900 text-white border-gray-900'
            : 'bg-white text-gray-600 border-gray-200'
        }`}
      >
        Sequential
      </button>
      <button
        onClick={() => onChange('random')}
        className={`flex-1 py-3 rounded-xl text-xs font-bold border transition-all ${
          value === 'random'
            ? 'bg-gray-900 text-white border-gray-900'
            : 'bg-white text-gray-600 border-gray-200'
        }`}
      >
        Random
      </button>
    </div>
  </div>
);
