import React from 'react';

interface CycleLengthSelectorProps {
  value: number;
  onChange: (n: number) => void;
}

const OPTIONS = [3, 5, 7, 14, 30];

export const CycleLengthSelector: React.FC<CycleLengthSelectorProps> = ({ value, onChange }) => (
  <div>
    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">
      Cycle Length
    </label>
    <div className="flex items-center gap-3">
      {OPTIONS.map(n => (
        <button
          key={n}
          onClick={() => onChange(n)}
          className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
            value === n
              ? 'bg-gray-900 text-white border-gray-900'
              : 'bg-white text-gray-600 border-gray-200'
          }`}
        >
          {n}d
        </button>
      ))}
    </div>
  </div>
);
