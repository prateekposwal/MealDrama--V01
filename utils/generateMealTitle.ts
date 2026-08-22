import { normalizeCategory, isCarb, isBeverage, deduplicateSides, detectEmbeddedCarb } from './normalizeMealComponents';

export function generateMealTitle(
  mainDish: string,
  sides: string[],
  beverages: string[],
  assignedCarb?: string,
): string {
  // ─── KITCHEN LOGIC: Format as [Main] ([Sides]) + [Beverage] ──
  // Cap components, deduplicate by category, never repeat categories.

  // Normalize and deduplicate sides
  const normalizedSides = deduplicateSides(sides);

  // Normalize beverage (pick first, cap at 1)
  const normalizedBev = beverages.length > 0 ? normalizeCategory(beverages[0]!) : null;

  // Detect carb already embedded in dish name
  const dishCarb = detectEmbeddedCarb(mainDish);

  // Normalize assigned carb if present
  const normalizedAssignedCarb = assignedCarb ? normalizeCategory(assignedCarb) : null;

  // Use assigned carb if provided and different from embedded carb (user swapped)
  const effectiveCarb = normalizedAssignedCarb && normalizedAssignedCarb !== dishCarb
    ? normalizedAssignedCarb
    : dishCarb ? null : normalizedAssignedCarb;

  // When the user swapped the carb, strip the old embedded carb from the dish name
  let cleanName = mainDish;
  if (effectiveCarb && dishCarb && effectiveCarb !== dishCarb) {
    // Remove "with X" or "+ X" patterns matching the old embedded carb
    const oldCarb = dishCarb.toLowerCase();
    cleanName = mainDish.replace(new RegExp(`\\s+with\\s+${oldCarb}`, 'i'), '');
    cleanName = cleanName.replace(new RegExp(`\\s+\\+\\s+${oldCarb}`, 'i'), '');
  }

  // Build sides list — exclude carbs, especially when dish name already has a carb
  const sideParts = normalizedSides.filter(s => {
    if (s === effectiveCarb || s === dishCarb) return false;
    if ((effectiveCarb || dishCarb) && isCarb(s)) return false;
    return true;
  });

  // Format: Main (Side1, Side2) + Carb + Beverage
  const parts: string[] = [cleanName];

  if (sideParts.length > 0) {
    parts.push(`(${sideParts.join(', ')})`);
  }

  if (effectiveCarb) {
    parts.push(effectiveCarb);
  }

  if (normalizedBev) {
    parts.push(normalizedBev);
  }

  return parts.join(' ');
}
