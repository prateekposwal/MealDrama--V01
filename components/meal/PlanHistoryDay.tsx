import React from 'react';
import type { MealType, TrayItem } from '../../store/useTrayStore';
import type { Dish } from '../../constants/dishLibrary';
import type { GuestMode } from '../../store/useTrayStore';
import { SlotBody } from './SlotBody';
import { SLOT_META } from './MealCard';
import { SLOTS } from '../../utils/continuity';

const getISODate = (d: Date) => d.toLocaleDateString('en-CA');

interface PlanHistoryDayProps {
  date: string;
  guestCount: number;
  getMeals: (date: string, mealType: MealType) => TrayItem[];
  dishes: Dish[];
  regionKey: string;
  userDiet: string;
  pantryStaples: string[];
  guestMode: GuestMode;
  noopHandlers: {
    open: () => void;
    close: () => void;
    select: () => () => void;
    updateInline: () => () => void;
    remove: () => () => void;
    suggestionAdd: () => () => void;
    openSearch: () => void;
    customizeOpen: () => void;
    customizeClose: () => void;
    customizeApply: () => () => void;
  };
}

export const PlanHistoryDay: React.FC<PlanHistoryDayProps> = ({
  date,
  guestCount,
  getMeals,
  dishes,
  regionKey,
  userDiet,
  pantryStaples,
  guestMode,
  noopHandlers,
}) => {
  const dateObj = new Date(date);
  const dayName = dateObj.toLocaleDateString('en-IN', { weekday: 'short' });
  const dayNum = dateObj.getDate();

  return (
    <div>
      <div className="flex items-center gap-3 mb-3 px-2">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-gray-100 text-gray-400">
          <span className="text-xs font-black">{dayName.slice(0, 2)}</span>
        </div>
        <span className="text-lg font-bold text-gray-400">{dayNum}</span>
        {guestCount > 0 && (
          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-violet-100/50 text-violet-400">+{guestCount} guests</span>
        )}
      </div>

      <div className="space-y-3">
        {SLOTS.map(({ key, mealType, label }) => {
          const slotMeals = getMeals(date, mealType);
          if (slotMeals.length === 0) return null;
          const slotMeta = SLOT_META[key];
          return (
            <div key={`${date}-${key}`}>
              {slotMeta && (
                <div className="flex items-center gap-1.5 mb-1 px-2">
                  <span className="text-[9px] font-medium text-gray-400">{slotMeta.time}</span>
                </div>
              )}
              <SlotBody
                date={date}
                mealType={mealType}
                slotLabel={label}
                meals={slotMeals}
                mode="history"
                dishes={dishes}
                userRegion={regionKey}
                userDiet={userDiet}
                pantryStaples={pantryStaples}
                guestMode={guestMode}
                swapOpenKey={null}
                onSwapOpen={noopHandlers.open}
                onSwapClose={noopHandlers.close}
                onSwapSelect={noopHandlers.select}
                onUpdateInline={noopHandlers.updateInline}
                onRemove={noopHandlers.remove}
                onSuggestionAdd={noopHandlers.suggestionAdd}
                onOpenSearch={noopHandlers.openSearch}
                swapCustomizeOpenKey={null}
                onSwapCustomizeOpen={noopHandlers.customizeOpen}
                onSwapCustomizeClose={noopHandlers.customizeClose}
                onSwapCustomizeApply={noopHandlers.customizeApply}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
