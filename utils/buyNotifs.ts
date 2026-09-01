// Evening "still to buy before the cook" push — once per day, after 15:00,
// if anything is still missing. Morning pantry_buy is separate; this is the
// supper-time safety net.
const AM_KEY = (d: string) => `buy-pm:${d}`;

export function maybeBuyNotif(
  itemsToBuy: number,
  date: string,
  now: Date = new Date(),
): { title: string; message: string } | null {
  const hour = now.getHours();
  if (hour < 15 || hour >= 22) return null;
  if (itemsToBuy <= 0) return null;
  try {
    if (typeof window !== 'undefined' && window.localStorage.getItem(AM_KEY(date))) return null;
    if (typeof window !== 'undefined') window.localStorage.setItem(AM_KEY(date), '1');
  } catch {
    return null;
  }
  return { title: `🛒 ${itemsToBuy} item${itemsToBuy > 1 ? 's' : ''} still to buy`, message: 'before the evening cook' };
}