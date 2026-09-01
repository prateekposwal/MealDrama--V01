// What-changed helpers for profile edits — a plain-language diff toast so
// edits never happen silently ("your food region changed the tray").
export interface ProfileFields { diet?: string; region?: string; plannedSlots?: string[] }

export function diffProfileFields(prev: ProfileFields, next: ProfileFields): string[] {
  const changes: string[] = [];
  const dA = next.diet ?? 'veg';
  const dB = prev.diet ?? 'veg';
  if (dA !== dB) changes.push(`Diet ${dB} → ${dA}`);
  const rA = next.region ?? '';
  const rB = prev.region ?? '';
  if (rA && rB && rA !== rB) changes.push(`Region changed to ${rA}`);
  const sA = (prev.plannedSlots ?? []).sort().join(',');
  const sB = (next.plannedSlots ?? []).sort().join(',');
  if (sA !== sB) changes.push('Slot selection changed');
  return changes;
}