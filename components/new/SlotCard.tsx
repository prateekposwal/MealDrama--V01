import React from 'react';
import { Plus, AlertTriangle, Sparkles } from 'lucide-react';
import { TrayItemRow, TrayItemData } from './TrayItemRow';
import type { RoommateSuggestion } from '../../store/useStore';

interface SlotCardProps {
  date: string;
  slot: string;
  slotIcon: string;
  slotTime: string;
  items: TrayItemData[];
  totalServings: number;
  suggestions: RoommateSuggestion[];
  onAddItem: () => void;
  onUpdateItem: (index: number, updates: Partial<TrayItemData>) => void;
  onRemoveItem: (index: number) => void;
  onApproveSuggestion: (suggestionId: string) => void;
  onRejectSuggestion: (suggestionId: string) => void;
  variantOptions: {
    gravy: { id: string; name: string; icon?: string }[];
    roti: { id: string; name: string; icon?: string }[];
    rice: { id: string; name: string; icon?: string }[];
    sides: { id: string; name: string; icon?: string }[];
    beverages: { id: string; name: string; icon?: string }[];
  };
}

export const SlotCard: React.FC<SlotCardProps> = ({
  date,
  slot,
  slotIcon,
  slotTime,
  items,
  totalServings,
  suggestions,
  onAddItem,
  onUpdateItem,
  onRemoveItem,
  onApproveSuggestion,
  onRejectSuggestion,
  variantOptions,
}) => {
  const isCrowded = items.length > 5;

  return (
    <div className={`rounded-3xl border-2 p-4 transition-all ${
'bg-white border-gray-100'
    }`}>
      {/* Slot Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">{slotIcon}</span>
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-gray-900">
              {slot}
            </h3>
            <p className="text-[10px] font-bold text-gray-400">{slotTime}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Servings badge */}
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-50">
            <span className="text-xs font-bold text-gray-800">
              {totalServings} serving{totalServings > 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Crowded Warning */}
      {isCrowded && (
        <div className={`mb-3 px-3 py-2 rounded-xl flex items-center gap-2 ${
'bg-amber-50 border border-amber-100'
        }`}>
          <AlertTriangle size={12} className="text-amber-600 flex-shrink-0" />
          <span className="text-[10px] font-bold text-amber-700">
            Slot crowded ({items.length} items). Consider splitting into separate meals.
          </span>
        </div>
      )}

      {/* Meal Items */}
      <div className="space-y-2 mb-3">
        {items.map((item, idx) => (
          <TrayItemRow
            key={item.id || idx}
            item={item}
            index={idx}
            onUpdate={(updates) => onUpdateItem(idx, updates)}
            onRemove={() => onRemoveItem(idx)}
            variantOptions={variantOptions}
           />
         ))}
         {items.length === 0 && (
          <div className={`text-center py-6 rounded-2xl border-2 border-dashed ${
'border-gray-200'
          }`}>
            <p className="text-xs font-bold text-gray-400">
              No meals added yet
            </p>
          </div>
        )}
      </div>

      {/* Add Meal Button */}
      <button
        onClick={onAddItem}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed transition-all active:scale-[0.98] border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-500">
        <Plus size={14} />
        <span className="text-xs font-bold">Add Meal to {slot}</span>
      </button>

      {/* Roommate Suggestions */}
      {suggestions.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles size={12} className="text-[#FF385C]" />
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
              Roommate Suggestions ({suggestions.length})
            </span>
          </div>
          <div className="space-y-2">
            {suggestions.map(suggestion => (
              <div
                key={suggestion.id}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl ${
'bg-gray-50'
                }`}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold truncate text-gray-800">
                      {suggestion.mealName}
                    </span>
                    <span className="text-[9px] font-semibold text-gray-400">
                      x{suggestion.quantity}
                    </span>
                  </div>
                  <p className="text-[9px] text-gray-400">
                    Suggested by {suggestion.roommateName}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onApproveSuggestion(suggestion.id)}
                    className="px-2 py-1 rounded-lg bg-green-500/10 text-green-600 text-[10px] font-bold active:scale-90 transition-all"
                    Add
                  </button>
                  <button
                    onClick={() => onRejectSuggestion(suggestion.id)}
                    className="px-2 py-1 rounded-lg text-[10px] font-bold active:scale-90 transition-all bg-gray-200 text-gray-500">
                    Skip
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
