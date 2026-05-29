import { scorePlateBalance, tallyCompleteness } from './nutritionScore';
import type { MealsForScoring } from './nutritionScore';

export interface SwapCandidate {
  removeId: string;
  addId: string;
  addName: string;
  addHealthCategories: string[];
  addTags: string[];
  addRoleFlags?: {
    hasCarbBase?: boolean;
    hasProteinCore?: boolean;
    hasFiberSide?: boolean;
    hasHydration?: boolean;
    hasDessert?: boolean;
  };
}

export interface SwapScore {
  candidate: SwapCandidate;
  delta: number;
  currentScore: number;
  newScore: number;
  reasons: string[];
}

function toMealForScoring(
  name: string,
  healthCategories: string[],
  tags: string[],
  roleFlags?: SwapCandidate['addRoleFlags'],
): MealsForScoring {
  return {
    name,
    healthCategories,
    tags,
    hasCarbBase: roleFlags?.hasCarbBase,
    hasProteinCore: roleFlags?.hasProteinCore,
    hasFiberSide: roleFlags?.hasFiberSide,
    hasHydration: roleFlags?.hasHydration,
    hasDessert: roleFlags?.hasDessert,
  };
}

export function scoreSwap(
  currentMeals: MealsForScoring[],
  removeIndex: number,
  candidate: SwapCandidate,
): SwapScore {
  const currentScore = scorePlateBalance(currentMeals).total;

  const newMeals = currentMeals.filter((_, i) => i !== removeIndex);
  newMeals.push(toMealForScoring(
    candidate.addName,
    candidate.addHealthCategories,
    candidate.addTags,
    candidate.addRoleFlags,
  ));

  const newBalanceScore = scorePlateBalance(newMeals);
  const newTotal = newBalanceScore.total;
  const delta = newTotal - currentScore;

  const currentRoles = tallyCompleteness(currentMeals);
  const newRoles = tallyCompleteness(newMeals);

  const reasons: string[] = [];
  if (delta > 0) reasons.push(`+${delta.toFixed(1)} score`);
  if (newRoles.rolesFilled > currentRoles.rolesFilled) {
    const gained = newRoles.missing.filter(
      m => !currentRoles.missing.includes(m),
    );
    if (gained.length) reasons.push(`adds ${gained[0]!}`);
  }
  if (delta <= 0 && newRoles.rolesFilled <= currentRoles.rolesFilled) {
    reasons.push('swap without improvement');
  }

  return {
    candidate,
    delta,
    currentScore,
    newScore: newTotal,
    reasons: reasons.slice(0, 3),
  };
}

export function findBestSwap(
  currentMeals: MealsForScoring[],
  candidates: SwapCandidate[],
): SwapScore | null {
  if (currentMeals.length === 0 || candidates.length === 0) return null;

  let best: SwapScore | null = null;

  for (let removeIdx = 0; removeIdx < currentMeals.length; removeIdx++) {
    for (const candidate of candidates) {
      if (candidate.removeId !== currentMeals[removeIdx]?.name) continue;
      const score = scoreSwap(currentMeals, removeIdx, candidate);
      if (!best || score.delta > best.delta) {
        best = score;
      }
    }
  }

  return best;
}

export function findBestInsertion(
  currentMeals: MealsForScoring[],
  candidates: SwapCandidate[],
): SwapScore | null {
  if (candidates.length === 0) return null;

  let best: SwapScore | null = null;

  for (const candidate of candidates) {
    const newMeals = [...currentMeals, toMealForScoring(
      candidate.addName,
      candidate.addHealthCategories,
      candidate.addTags,
      candidate.addRoleFlags,
    )];
    const currentTotal = scorePlateBalance(currentMeals).total;
    const newTotal = scorePlateBalance(newMeals).total;
    const delta = newTotal - currentTotal;

    const reasons: string[] = [];
    if (delta > 0) reasons.push(`+${delta.toFixed(1)} score`);

    const score: SwapScore = {
      candidate,
      delta,
      currentScore: currentTotal,
      newScore: newTotal,
      reasons: reasons.slice(0, 2),
    };

    if (!best || score.delta > best.delta) {
      best = score;
    }
  }

  return best;
}
