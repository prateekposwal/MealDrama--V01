export type Spice = 'mild' | 'medium' | 'hot'
export function spiceLevelFromNumber(n: number): Spice {
  switch (n) {
    case 1: return 'mild'
    case 3: return 'hot'
    default: return 'medium'
  }
}
