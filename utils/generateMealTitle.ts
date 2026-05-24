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

  const uniqueSides = sides.filter((s, i) => sides.indexOf(s) === i && s !== embeddedCarb);
  if (uniqueSides.length > 0) {
    parts.push(uniqueSides.slice(0, 2).join(', '));
  }

  const uniqueBeverages = beverages.filter((s, i) => beverages.indexOf(s) === i);
  if (uniqueBeverages.length > 0) {
    const firstBev = uniqueBeverages[0];
    if (firstBev) parts.push(firstBev);
  }

  return parts.join(' + ');
}
