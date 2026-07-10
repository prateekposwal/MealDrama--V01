import type { TrayItem, MealType } from '../store/useTrayStore';
import type { Dish } from '../../meal/constants/dishLibrary';
import { slotKey } from './planIndex';

interface RotationContext {
  userRegion: string;
  userDiet: string;
  completions: Record<string, number>;
  skipped: Record<string, number>;
  lastFeaturedTimes: Record<string, number>;
}

const ROTATION_HOURS = 4;

function getTimeWindow(date: string, mealType: MealType): number {
  const now = new Date();
  const hourBucket = Math.floor(now.getHours() / ROTATION_HOURS);
  const dayCode = new Date(date).getTime();
  return dayCode + hourBucket;
}

function mealHash(mealId: string, timeWindow: number, region: string, mealType: string): number {
  let hash = 0;
  const str = `${mealId}:${timeWindow}:${region}:${mealType}`;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function pickFeaturedMeals(
  meals: TrayItem[],
  dishes: Dish[],
  date: string,
  mealType: MealType,
  ctx: RotationContext,
): { primary: TrayItem; secondary?: TrayItem } {
  if (meals.length === 0) {
    throw new Error('pickFeaturedMeals called with empty meals');
  }
  if (meals.length <= 2) {
    return { primary: meals[0]!, secondary: meals[1] };
  }

  const timeWindow = getTimeWindow(date, mealType);
  const now = Date.now();

  const scored = meals.map((meal) => {
    const dish = dishes.find(d => d.id === meal.meal_id);
    let score = 0;

    const baseHash = mealHash(meal.meal_id, timeWindow, ctx.userRegion, mealType);
    score += (baseHash % 100) / 100;

    if (dish) {
      if (dish.region === ctx.userRegion || dish.states?.some(s => ctx.userRegion.includes(s))) {
        score += 2;
      }
      if (dish.category?.includes(mealType)) {
        score += 1.5;
      }
    }

    const completionKey = slotKey(date, mealType);
    if (ctx.completions[completionKey]) {
      score += 1;
    }

    const skipKey = slotKey(date, mealType);
    if (ctx.skipped[skipKey]) {
      score += 2;
    }

    const lastFeatured = ctx.lastFeaturedTimes[meal.meal_id];
    if (lastFeatured) {
      const hoursSince = (now - lastFeatured) / (1000 * 60 * 60);
      if (hoursSince < ROTATION_HOURS) {
        score -= 10;
      } else if (hoursSince < ROTATION_HOURS * 2) {
        score -= 3;
      }
    }

    return { meal, score };
  });

  scored.sort((a, b) => b.score - a.score);

  const primary = scored[0]!.meal;
  const secondary = scored[1]!.meal;
  return { primary, secondary: primary !== secondary ? secondary : undefined };
}
