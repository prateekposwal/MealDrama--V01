/**
 * COOK WORK-ORDER COMPOSER — turns today's family plan into the one WhatsApp
 * message the cook actually wants: the FULL plan (progress visible: done vs.
 * pending) AND the "left to do" (the actionable slice — nothing pending means
 * a clear all-done state). plus shortages and the auto-updating live link.
 *
 * Pure + exported for tests. Language is hi (default, Hinglish labels — the
 * cook-artifact rule: it must be utterable) or en. Dish names always stay
 * in their canonical form; the cook page keeps matching the message.
 */

export interface CookWorkOrderItem {
  mealType: string; // breakfast | lunch | snacks | dinner
  dishName: string;
  icon: string;
  quantity: number;
  who: string; // resolved member name, or 'Family'
  status: string; // planned | requested | accepted | completed
}

export interface CookWorkOrderInput {
  displayName: string;
  householdName: string;
  dateLabel: string; // e.g. "Tuesday, 16 September"
  items: CookWorkOrderItem[];
  cookLink: string; // absolute URL to /cook/:token
  shortages: string[]; // out-of-stock canonical names
  language?: 'hi' | 'en';
}

const MEAL_ORDER: Record<string, number> = { breakfast: 0, lunch: 1, snacks: 2, dinner: 3 };

interface WordSet {
  greeting: string;
  plan: string;
  leftToDo: string;
  allDone: string;
  short: string;
  live: string;
  hint: string;
  family: string;
  for: string;
}

const WORD: Record<'hi' | 'en', WordSet> = {
  en: {
    greeting: 'Namaste',
    plan: '📋 Today’s plan',
    leftToDo: '🗒️ Left to do',
    allDone: '🎉 All done for today!',
    short: '⚠️ Short right now',
    live: '👀 Live plan (updates by itself):',
    hint: 'Reply “done” when everything is finished · “tomatoes nahi” if something is short',
    family: 'Family',
    for: 'for',
  },
  hi: {
    greeting: 'Namaste',
    plan: '📋 Aaj ka plan',
    leftToDo: '🗒️ Baaki ka kaam',
    allDone: '🎉 Aaj ka kaam ho gaya!',
    short: '⚠️ Khatam / kam',
    live: '👀 Live plan (khud update hota hai):',
    hint: 'Sab ban gaya? “done” likhein · kuch khatam? “tomato nahi” jaise likhein',
    family: 'Family',
    for: 'ke liye',
  },
};

const MEAL_HEADING: Record<string, Record<string, string>> = {
  en: { breakfast: 'Breakfast', lunch: 'Lunch', snacks: 'Snacks', dinner: 'Dinner' },
  hi: { breakfast: 'Nashta', lunch: 'Lunch', snacks: 'Snacks', dinner: 'Dinner' },
};

export function compileCookWorkOrder(input: CookWorkOrderInput): string {
  const lang: 'hi' | 'en' = input.language ?? 'hi';
  const w = WORD[lang] ?? WORD.en;

  const sorted = [...input.items].sort((a, b) => (MEAL_ORDER[a.mealType] ?? 9) - (MEAL_ORDER[b.mealType] ?? 9));
  const done = sorted.filter(i => i.status === 'completed');
  const pending = sorted.filter(i => i.status !== 'completed');

  const line = (i: CookWorkOrderItem, markDone: boolean): string => {
    const qty = i.quantity > 1 ? ` ×${i.quantity}` : '';
    const who = i.who ? ` (${w.for} ${i.who})` : '';
    const check = markDone && i.status === 'completed' ? ' ✓' : '';
    return `${i.icon || '🍽️'} ${MEAL_HEADING[lang]?.[i.mealType] ?? i.mealType} — ${i.dishName}${qty}${who}${check}`;
  };

  const out: string[] = [];
  out.push(`${w.greeting} ${input.displayName} 🙏`);
  out.push(`${input.householdName} · ${input.dateLabel}`);
  out.push('');

  // FULL PLAN — every item, done or not (progress is visible).
  out.push(w.plan);
  if (sorted.length === 0) {
    out.push('_No meals planned for today yet._');
  } else {
    out.push(...sorted.map(i => line(i, true)));
  }

  // LEFT TO DO — the actionable slice, repeated by design (this is the work order).
  out.push('');
  out.push(`${w.leftToDo} — ${pending.length}`);
  if (pending.length === 0) {
    out.push(w.allDone);
  } else {
    out.push(...pending.map(i => line(i, false)));
  }

  // SHORTAGES — pantry rows clamped to zero mean "we ran out".
  if (input.shortages.length > 0) {
    out.push('');
    out.push(`${w.short}: ${input.shortages.join(', ')}`);
  }

  out.push('');
  out.push(`${w.live} ${input.cookLink}`);
  out.push(`_${w.hint}_`);

  return out.join('\n');
}