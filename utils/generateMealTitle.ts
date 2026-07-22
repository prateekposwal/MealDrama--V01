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

  // Skip assigned carb if dish already has the same carb embedded
  const effectiveCarb = (normalizedAssignedCarb && normalizedAssignedCarb !== dishCarb) ? normalizedAssignedCarb : null;

  // Build sides list — exclude carbs that match effective carb, dish carb, or are general carb-like when carb is assigned
  const sideParts = normalizedSides.filter(s => {
    if (s === effectiveCarb || s === dishCarb) return false;
    if (effectiveCarb && isCarb(s)) return false;
    return true;
  });

  // Format: Main (Side1, Side2) + Carb + Beverage
  const parts: string[] = [mainDish];

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
