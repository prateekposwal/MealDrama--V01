'use client';
import type { MealType } from '../../types/tray';
import { useLoopAutoFill } from '../../plan/hooks/useLoopAutoFill';

interface LoopAutoFillSlotProps {
  date: string;
  mealType: MealType;
}

/**
 * Renders nothing. Calls useLoopAutoFill hook for a given date+slot.
 * Place inside slot rendering so the hook fires for each displayed slot.
 */
const LoopAutoFillSlot: React.FC<LoopAutoFillSlotProps> = ({ date, mealType }) => {
  useLoopAutoFill(date, mealType);
  return null;
};

export default LoopAutoFillSlot;
