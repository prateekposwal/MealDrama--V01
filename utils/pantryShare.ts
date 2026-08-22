// ─────────────────────────────────────────────────────────────────────────────
// Pure builder for the WhatsApp pantry-share message (P1).
// Structural text comes from the canonical 10-lang `shareMessages` strings so
// section headers (NEED TO BUY / ALREADY HAVE / MEALS TO PREPARE / leftover
// ideas) actually localize for non-English. Extracted from PantryPulse so the
// share path is testable without mounting the component. Deterministic; the
// leftover-ideas section truncates row-by-row (or drops entirely) to respect
// WHATSAPP_LIMIT — the output is always a valid, sendable message.
// ─────────────────────────────────────────────────────────────────────────────

import { getShareStrings, WHATSAPP_LIMIT, type ShareLanguage } from './shareMessages';

export interface PantryShareItem {
  name: string;
  quantity: string;
  unit: string;
  sources: string[];
}

export interface PantryShareCategory {
  key: string;
  emoji: string;
  label: string;
  items: PantryShareItem[];
}

export interface PantryShareMeal {
  slot: string;
  items: { name: string; variant?: string }[];
}

export interface PantryShareSurplus {
  name: string;
  surplus: number;
  unit: string;
  expiry?: string;
  freezer: boolean;
  dishes: string[];
}

export interface PantryShareInput {
  lang: ShareLanguage;
  region: string;
  viewLabel: string;
  checkedCount: number;
  uncheckedCount: number;
  totalMeals: number;
  categories: PantryShareCategory[];
  checkedNames: string[];
  meals: PantryShareMeal[];
  surplus: PantryShareSurplus[];
  /** Hard cap in chars. Defaults to WhatsApp's 4096. */
  limit?: number;
}

/** Assemble the full WhatsApp message. Pure — no Date.now, no component state. */
export function buildPantryShareMessage(input: PantryShareInput): string {
  const s = getShareStrings(input.lang);
  const limit = input.limit ?? WHATSAPP_LIMIT;

  let lines = `🛒 *${s.pantryTitle}*\n`;
  lines += `📍 *Region:* ${input.region}\n`;
  lines += `📅 *For:* ${input.viewLabel}\n`;
  lines += `✅ *In Kitchen:* ${input.checkedCount} items\n`;
  lines += `❌ *Needed:* ${input.uncheckedCount} items\n`;
  lines += `🍽️ *Total Meals:* ${input.totalMeals}\n\n`;

  lines += `━━━ *${s.needToBuy}* ━━━\n`;
  for (const cat of input.categories) {
    lines += `\n${cat.emoji} ${cat.label}\n`;
    for (const item of cat.items) {
      lines += `  • ${item.name}${item.unit !== 'unit' ? ` (${item.quantity} ${item.unit})` : ''}`;
      if (item.sources.length > 0) {
        lines += ` — for ${item.sources.slice(0, 2).join(', ')}${item.sources.length > 2 ? ` +${item.sources.length - 2} more` : ''}`;
      }
      lines += '\n';
    }
  }

  lines += `\n━━━ *${s.alreadyHave}* ━━━\n`;
  for (const n of input.checkedNames) lines += `  ✅ ${n}\n`;

  lines += `\n━━━ *${s.mealsToPrepare}* ━━━\n`;
  for (const m of input.meals) {
    lines += `\n☀️ *${m.slot}*\n`;
    for (const meal of m.items) lines += `  • ${meal.name}${meal.variant ? ` (${meal.variant})` : ''}\n`;
  }

  const footer = `\n━━━━━━━━━━━━━━━━\n${s.sentFrom}`;
  let message = lines + footer;

  // Leftover-ideas section — only when at least one surplus reuse suggestion
  // exists. Appended after MEALS TO PREPARE, before the Sent-from footer; rows
  // are dropped one-by-one (or the whole section) when it would blow the cap.
  if (input.surplus.length > 0) {
    const header = `\n━━━ *${s.leftoverTitle}* ━━━\n`;
    const rowOf = (r: PantryShareSurplus): string => {
      const rest = r.dishes.length ? ` — ${s.leftoverFor}: ${r.dishes.join(', ')}` : '';
      const useBy = r.expiry ? ` (${s.useBy} ${r.expiry})` : '';
      const freeze = r.freezer ? ` · ${s.freezeTip}` : '';
      return `  • ${r.name} ~${r.surplus}${r.unit} ${s.left}${rest}${useBy}${freeze}`;
    };
    const section = (rows: PantryShareSurplus[]): string => header + rows.map(rowOf).join('\n') + '\n';

    if ((lines + section(input.surplus) + footer).length <= limit) {
      message = lines + section(input.surplus) + footer;
    } else {
      const kept: PantryShareSurplus[] = [];
      for (const r of input.surplus) {
        if ((lines + section([...kept, r]) + footer).length <= limit) kept.push(r);
        else break;
      }
      message = kept.length > 0 ? lines + section(kept) + footer : lines + footer;
    }
  }

  return message;
}
