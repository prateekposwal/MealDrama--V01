/**
 * Server-side canonical ingredient-name reconciliation.
 *
 * The SAME canonical map the client buy list uses (utils/ingredientUtils.ts):
 * if this file ever diverges, the ledger consume endpoint would miss rows the
 * buy list purchased. Keep the alias table byte-for-byte in sync with
 * canonicalName() in utils/ingredientUtils.ts.
 *
 * (Why a server copy and not a require? The compiled server/dist cannot load
 * the root client TS modules the old pantry resolver requires() — that pattern
 * is a latent MODULE_NOT_FOUND in production. This file compiles into dist.)
 */
export function canonicalName(name: string): string {
  const n = (name || '').toLowerCase().trim();
  if (['curd', 'dahi', 'yogurt', 'yoghurt'].includes(n)) return 'yogurt';
  if (/^coriander/.test(n)) return 'coriander';
  if (/^ginger/.test(n)) return 'ginger';
  if (/^garlic/.test(n)) return 'garlic';
  if (/^onion/.test(n)) return 'onion';
  if (/^potato|^potatoes|^aloo/.test(n)) return 'potato';
  if (/^tomato/.test(n)) return 'tomato';
  if (/^mint|^pudina/.test(n)) return 'mint';
  if (/^curry leaves/.test(n)) return 'curry leaves';
  if (/^capsicum|^bell pepper|^shimla/.test(n)) return 'capsicum';
  if (/^carrot|^gajar/.test(n)) return 'carrot';
  if (/^lemon|^nimbu/.test(n)) return 'lemon';
  if (/^green chilli|^mirch/.test(n)) return 'green chilli';
  return n;
}