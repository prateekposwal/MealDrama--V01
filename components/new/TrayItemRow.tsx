import React, { useState } from 'react';
import { Minus, Plus, X, ChevronDown, ChevronUp } from 'lucide-react';

export interface TrayItemData {
  id?: string;
  name: string;
  mealId?: string;
  customDishId?: string;
  quantity: number;
  gravyStyle: string;
  rotiType: string;
  riceType: string;
  sides: string[];
  beverages: string[];
  icon?: string;
  isCustom?: boolean;
}

interface TrayItemRowProps {
  item: TrayItemData;
  onUpdate: (updates: Partial<TrayItemData>) => void;
  onRemove: () => void;
  variantOptions: {
    gravy: { id: string; name: string; icon?: string }[];
    roti: { id: string; name: string; icon?: string }[];
    rice: { id: string; name: string; icon?: string }[];
    sides: { id: string; name: string; icon?: string }[];
    beverages: { id: string; name: string; icon?: string }[];
  };
}> = ({ label, options, selected, onSelect, isMulti }) => {
  const [expanded, setExpanded] = useState(false);
  const isSelected = (id: string) => isMulti
    ? (selected as string[]).includes(id)
    : selected === id;

  return (
    <div className="mb-2">
      <div
        className={`flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-all ${
  'bg-gray-50 hover:bg-gray-100'
        }`}
        onClick={() => setExpanded(!expanded)}
        <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-600">{label}</span>
          {isMulti && (selected as string[]).length > 0 && (
            <span className="text-[9px] bg-[#FF385C] text-white px-1.5 py-0.5 rounded-full font-bold">
              {(selected as string[]).length}
            </span>
          )}
          {!isMulti && (
            <span className="text-xs font-semibold text-gray-800">
              {options.find(o => o.id === selected)?.name || selected}
            </span>
          )}
        </div>
        {expanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
      </div>
      {expanded && (
        <div className="flex flex-wrap gap-1.5 mt-1.5 px-1">
          {options.map(opt => (
            <button
              key={opt.id}
              onClick={() => onSelect(opt.id)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all active:scale-95 ${
                isSelected(opt.id)
                  ? 'bg-[#FF385C] text-white'
                : 'bg-white text-gray-600 border border-gray-200'
              }`}
              {opt.icon && <span>{opt.icon}</span>}
              {opt.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const TrayItemRow: React.FC<TrayItemRowProps> = ({
  item,
  onUpdate,
  onRemove,
  variantOptions,
   index = 0,
}) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div
      className={`rounded-2xl border transition-all ${
'bg-white border-gray-100'
      } ${showDetails ? 'shadow-md' : ''}`}
      {/* Header Row */}
      <div className="flex items-center gap-3 p-3">
        {/* Index badge */}
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${
          'bg-[#FF385C]/10 text-[#FF385C]'
        }`}>
          {index + 1}
        </div>

        {/* Meal name */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            {item.icon && <span className="text-sm">{item.icon}</span>}
            <span className="text-sm font-bold truncate text-gray-900">
              {item.isCustom ? `My: ${item.name}` : item.name}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[9px] font-semibold text-gray-400">
               {item.gravyStyle}
             </span>
             <span className="text-[9px] text-gray-300">|</span>
             <span className="text-[9px] font-semibold text-gray-400">
              {item.rotiType}
            </span>
            {item.sides.length > 0 && (
              <>
                <span className="text-[9px] text-gray-300">|</span>
            <span className="text-[9px] font-semibold text-gray-400">
                  +{item.sides.length} sides
                </span>
              </>
            )}
          </div>
        </div>

        {/* Quantity controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onUpdate({ quantity: Math.max(1, item.quantity - 1) })}
            className="w-6 h-6 rounded-lg flex items-center justify-center active:scale-90 transition-all bg-gray-100 text-gray-500"
            <Minus size={11} />
          </button>
          <span className="text-xs font-bold w-4 text-center text-gray-800">
            {item.quantity}
          </span>
          <button
            onClick={() => onUpdate({ quantity: Math.min(99, item.quantity + 1) })}
            className="w-6 h-6 rounded-lg flex items-center justify-center active:scale-90 transition-all bg-gray-100 text-gray-500"
            <Plus size={11} />
          </button>
        </div>

        {/* Expand/Collapse + Remove */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-6 h-6 rounded-lg flex items-center justify-center transition-all bg-gray-100 text-gray-500">
          {showDetails ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
        </button>
        <button
          onClick={onRemove}
          className="w-6 h-6 rounded-lg flex items-center justify-center bg-[#FF385C]/10 text-[#FF385C] active:scale-90 transition-all"
          <X size={11} />
        </button>
      </div>

      {/* Details Panel */}
      {showDetails && (
        <div className="px-3 pb-3 border-t border-gray-100">
          <ChipSelector
            label="Gravy Style"
            options={variantOptions.gravy}
            selected={item.gravyStyle}
            onSelect={(v) => onUpdate({ gravyStyle: v })}
          />
          <ChipSelector
            label="Roti Type"
            options={variantOptions.roti}
            selected={item.rotiType}
            onSelect={(v) => onUpdate({ rotiType: v })}
          />
          <ChipSelector
            label="Rice Type"
            options={variantOptions.rice}
            selected={item.riceType}
            onSelect={(v) => onUpdate({ riceType: v })}
          />
          <ChipSelector
            label="Sides"
            options={variantOptions.sides}
            selected={item.sides}
            onSelect={(v) => {
              const sides = item.sides.includes(v)
                ? item.sides.filter(s => s !== v)
                : [...item.sides, v];
              onUpdate({ sides });
            }}
            isMulti
          />
          <ChipSelector
            label="Beverages"
            options={variantOptions.beverages}
            selected={item.beverages}
            onSelect={(v) => {
              const beverages = item.beverages.includes(v)
                ? item.beverages.filter(b => b !== v)
                : [...item.beverages, v];
              onUpdate({ beverages });
            }}
            isMulti
          />
        )}
      </div>
    );
  );
};
