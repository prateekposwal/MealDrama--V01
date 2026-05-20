export function generateMealTitle(
  mainDish: string,
  sides: string[],
  beverages: string[],
  embeddedCarb?: string,
): string {
  const parts: string[] = [mainDish];

  if (embeddedCarb) {
    parts.push(embeddedCarb);
  }

  if (sides.length > 0) {
    parts.push(sides.slice(0, 2).join(', '));
  }

  if (beverages.length > 0) {
    const firstBev = beverages[0];
    if (firstBev) parts.push(firstBev);
  }

  return parts.join(' + ');
}
