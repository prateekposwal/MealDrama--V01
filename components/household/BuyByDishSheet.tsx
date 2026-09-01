import React, { useMemo, useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { BuyDishGroup, BuySummary, RadarUse, categoryGroups, allMissingItems, applyAssumptions, BUY_CATEGORY_META, serializeAssumptions, parseAssumptions } from '../../utils/buyByDish';

const ASSUME_KEY = 'md-buy-assumptions';
function loadAssumptions() {
  try { return parseAssumptions(window.localStorage.getItem(ASSUME_KEY)); }
  catch { return { manualHave: new Set<string>(), notHave: new Set<string>() }; }
}
function saveAssumptions(manualHave: Set<string>, notHave: Set<string>) {
  try { window.localStorage.setItem(ASSUME_KEY, serializeAssumptions(manualHave, notHave)); } catch { /* ignore */ }
}

type View = 'dish' | 'category' | 'cart';

export const BuyByDishSheet: React.FC<{
  open: boolean;
  onClose: () => void;
  groups: BuyDishGroup[];
  summary: BuySummary;
  radar: RadarUse[];
  previousSummary?: BuySummary | null;
  onBuyDish: (key: string, items: Array<{ name: string; quantity?: number; unit?: string }>) => void;
  householdId?: string;
  assumptions?: Record<string, 'have' | 'notHave'>;
  onAssumption?: (name: string, flag: 'have' | 'notHave' | null) => void;
}> = ({ open, onClose, groups, summary, radar, previousSummary, onBuyDish, householdId, assumptions, onAssumption }) => {
  const [view, setView] = useState<View>('dish');
  const initAssumptions = (a: Record<string, 'have' | 'notHave'> | undefined) => {
    const local = loadAssumptions();
    const mh = local.manualHave;
    const nh = local.notHave;
    for (const [k, f] of Object.entries(a ?? {})) {
      if (f === 'have') { mh.add(k); nh.delete(k); }
      else { nh.add(k); mh.delete(k); }
    }
    return { mh, nh };
  };
  const seeds = React.useMemo(() => initAssumptions(assumptions), []); // eslint-disable-line react-hooks/exhaustive-deps
  const [manualHave, setManualHave] = useState<Set<string>>(seeds.mh);
  const [notHave, setNotHave] = useState<Set<string>>(seeds.nh);
  const [lastManual, setLastManual] = useState<string | null>(null);
  useEffect(() => { saveAssumptions(manualHave, notHave); }, [manualHave, notHave]);
  const syncAssumption = (name: string, flag: 'have' | 'notHave' | null) => { onAssumption?.(name, flag); };

  // Recompute everything against the "I already have" set — batch buys never
  // re-purchase something the user just marked as hand.
  const effective = useMemo(() => {
    const g2 = applyAssumptions(groups, manualHave, notHave);
    const missing = allMissingItems(g2);
    const dishes = g2.filter(x => x.hasMissing).length;
    return { g2, missing, itemsToBuy: missing.length, dishes, itemsHave: manualHave.size, itemsNotHave: notHave.size };
  }, [groups, manualHave, notHave]);

  if (!open) return null;
  const { g2, missing, itemsToBuy, dishes, itemsHave, itemsNotHave } = effective;
  const cart = missing.reduce<Array<{ name: string; quantity?: number; unit?: string }>>((acc, i) => {
    const ex = acc.find(a => a.name.toLowerCase() === i.name.toLowerCase() && (a.unit ?? '') === (i.unit ?? ''));
    if (ex) ex.quantity = Math.round(((ex.quantity ?? 0) + (i.quantity ?? 0)) * 100) / 100;
    else acc.push({ ...i });
    return acc;
  }, []);
  const delta = previousSummary ? previousSummary.itemsToBuy - itemsToBuy : 0;
  const toggleHave = (name: string) => setManualHave(prev => {
    const next = new Set(prev);
    const k = name.toLowerCase();
    if (next.has(k)) {
      next.delete(k);
      setLastManual(prev => (prev === name ? null : prev));
      syncAssumption(name, null);
    } else {
      next.add(k);
      setNotHave(prev => { const n = new Set(prev); n.delete(k); return n; });
      setLastManual(name);
      syncAssumption(name, 'have');
    }
    return next;
  });
  const toggleNotHave = (name: string) => setNotHave(prev => {
    const next = new Set(prev);
    const k = name.toLowerCase();
    if (next.has(k)) { next.delete(k); syncAssumption(name, null); }
    else { next.add(k); syncAssumption(name, 'notHave'); }
    return next;
  });
  const undoLast = () => {
    if (!lastManual) return;
    setManualHave(prev => { const n = new Set(prev); n.delete(lastManual.toLowerCase()); return n; });
    syncAssumption(lastManual, null);
    setLastManual(null);
  };
  const undoAll = () => {
    for (const k of manualHave) syncAssumption(k, null);
    for (const k of notHave) syncAssumption(k, null);
    setManualHave(new Set()); setNotHave(new Set()); setLastManual(null);
  };
  const manualOf = (name: string) => manualHave.has(name.toLowerCase());
  const notHaveOf = (name: string) => notHave.has(name.toLowerCase());
  const origStatus = (groupKey: string, name: string) =>
    (groups.find(g => g.key === groupKey)?.items.find(i => i.name.toLowerCase() === name.toLowerCase())?.status) ?? 'missing';
  const cats = categoryGroups(g2);

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative max-w-lg w-full bg-white rounded-t-3xl sm:rounded-3xl max-h-[82vh] flex flex-col animate-in slide-in-from-bottom duration-200" onClick={e => e.stopPropagation()}>
        <div className="shrink-0 px-5 pt-4 pb-3 border-b border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-base font-black text-gray-900">🛒 Buy · grouped</p>
            <button onClick={onClose} className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center active:scale-90 transition-all" aria-label="Close"><X size={14} className="text-gray-500" /></button>
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-orange-600">❌ {itemsToBuy} to buy</span>
              <span className="text-xs font-bold text-gray-400">· {dishes} dish{dishes === 1 ? '' : 'es'}</span>
              {itemsHave > 0 && <span className="text-[11px] font-bold text-amber-600 bg-amber-50 rounded-full px-2 py-0.5">🟡 {itemsHave} have</span>}
              {delta > 0 && <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 rounded-full px-2 py-0.5">🛒 +{delta} bought</span>}
            </div>
            <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-0.5">
              {(['dish', 'category', 'cart'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setView(m)}
                  className={`px-2 py-1 rounded-lg text-[11px] font-bold active:scale-95 transition-all capitalize ${view === m ? 'bg-white shadow text-gray-900' : 'text-gray-400'}`}
                >
                  {m === 'cart' ? `Cart (${cart.length})` : m}
                </button>
              ))}
            </div>
          </div>
          <p className="text-[10px] font-bold text-gray-400 mt-1.5">Legend: 🟡 = on your pantry list (assumed) — tap 🟡 to say you DON’T have it (moves to buy) · 🟡✓ = you marked have, tap to undo.</p>
          {(itemsHave > 0 || itemsNotHave > 0) && (
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {itemsHave > 0 && <span className="text-[11px] font-bold text-amber-700 bg-amber-50 rounded-full px-2 py-1">🟡✓ {itemsHave} have</span>}
              {itemsNotHave > 0 && <span className="text-[11px] font-bold text-orange-600 bg-orange-50 rounded-full px-2 py-1">✗ {itemsNotHave} not have — will buy</span>}
              {lastManual && (
                <button onClick={undoLast} className="text-[11px] font-black text-gray-500 bg-gray-100 rounded-full px-2 py-1 active:scale-95 transition-all">↩ Undo {lastManual}</button>
              )}
              <button onClick={undoAll} className="text-[11px] font-black text-red-500 bg-red-50 rounded-full px-2 py-1 active:scale-95 transition-all">Undo all</button>
            </div>
          )}
          <button
            onClick={() => missing.length > 0 && onBuyDish('*', missing)}
            disabled={missing.length === 0}
            className="w-full mt-2 py-2.5 rounded-xl bg-orange-600 text-white text-xs font-black uppercase tracking-widest active:scale-95 transition-all disabled:opacity-40"
          >
            Buy all missing ({missing.length})
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {g2.length === 0 && <p className="text-sm font-bold text-gray-400 py-8 text-center">Nothing to buy — kitchen is stocked 🎉</p>}

          {view === 'dish' && g2.map(g => (
            <div key={g.key} className={`rounded-2xl bg-orange-50/60 border border-orange-100 p-3 ${!g.hasMissing ? 'opacity-60' : ''}`}>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-sm font-bold text-gray-900 truncate flex items-center gap-1.5">
                  {g.icon} {g.dishName}
                  {g.members > 1 && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-600">👥 ×{g.members}</span>}
                </p>
                {g.hasMissing && (
                  <button
                    onClick={() => onBuyDish(g.key, g.items.filter(i => i.status === 'missing').map(i => ({ name: i.name, quantity: i.quantity, unit: i.unit })))}
                    className="px-2.5 py-1 rounded-lg bg-orange-600 text-white text-[10px] font-bold active:scale-95 transition-all shrink-0"
                  >
                    Mark all bought
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1">
                {g.items.map((i, idx) => {
                  const isManual = manualOf(i.name);
                  const isWontBuy = notHaveOf(i.name);
                  const orig = origStatus(g.key, i.name);
                  const clickable = orig === 'staple' ? true : i.status === 'missing';
                  return (
                    <button key={`${i.name}-${idx}`} onClick={() => clickable && toggleNotHave(i.name)}
                      title={orig === 'staple' ? (isWontBuy ? 'Tap to keep it on the pantry list (undo)' : 'Tap if you DON’T have it — move to buy') : i.status === 'missing' ? (isManual ? 'Tap to undo (no longer have?)' : 'Tap if you already have it') : i.status === 'staple' ? 'On pantry list (assumed)' : 'Logged quantity'}
                      className={`text-[11px] font-bold rounded-full px-2 py-0.5 border active:scale-95 transition-all ${
                        i.status === 'missing'
                          ? isWontBuy
                            ? 'bg-white text-orange-700 border-orange-300 ring-1 ring-orange-300'
                            : 'bg-white text-orange-700 border-orange-200'
                          : isManual
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : i.status === 'staple'
                              ? 'bg-amber-50 text-amber-700 border-amber-100 active:ring-1'
                              : 'bg-white text-gray-400 border-gray-100'
                      }`}>
                      {i.status === 'missing' ? '✗' : isManual ? '🟡✓' : i.status === 'staple' ? '🟡' : '✅'} {i.name} {i.quantity}{i.unit ?? ''}{(isManual || isWontBuy) ? ' ↩' : orig === 'staple' ? ' ▾' : ''}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {view === 'category' && cats.map(c => {
            const cMissing = c.items.filter(i => i.status === 'missing');
            const meta = BUY_CATEGORY_META[c.category] ?? { icon: '🛍️', label: c.category.toUpperCase() };
            if (c.items.length === 0) return null;
            return (
              <div key={c.category} className="rounded-2xl bg-white border border-gray-100 p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs font-black uppercase tracking-widest text-gray-500">{meta.icon} {meta.label} · {c.items.length}</p>
                  {cMissing.length > 0 && (
                    <button
                      onClick={() => onBuyDish(`cat:${c.category}`, cMissing.map(i => ({ name: i.name, quantity: i.quantity, unit: i.unit })))}
                      className="px-2.5 py-1 rounded-lg bg-orange-600 text-white text-[10px] font-bold active:scale-95 transition-all shrink-0"
                    >
                      Mark bought
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1">
                  {c.items.map((i, idx) => {
                    const isManual = manualOf(i.name);
                    const isWontBuy = notHaveOf(i.name);
                    const orig = origStatus(c.items[0] ? undefined as any : undefined, i.name);
                    void orig;
                    const groupKeyFor = g2.find(g => g.items.some(x => x.name === i.name))?.key ?? '';
                    const clickable = (() => { const o = origStatus(groupKeyFor, i.name); return o === 'staple' ? true : i.status === 'missing'; })();
                    return (
                      <button key={`${i.name}-${idx}`} onClick={() => clickable && toggleNotHave(i.name)}
                        title={(() => { const o = origStatus(groupKeyFor, i.name); return o === 'staple' ? (isWontBuy ? 'Undo: keep on pantry list' : 'Tap if you DON’T have it — moves to buy') : i.status === 'missing' ? (isManual ? 'Tap to undo' : 'Tap if you already have it') : i.status === 'staple' ? 'On pantry list (assumed)' : 'Logged qty'; })()}
                        className={`text-[11px] font-bold rounded-full px-2 py-0.5 border active:scale-95 transition-all ${i.status === 'missing' ? (isWontBuy ? 'bg-white text-orange-700 border-orange-300 ring-1 ring-orange-300' : 'bg-white text-orange-700 border-orange-200') : isManual ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : i.status === 'staple' ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-white text-gray-400 border-gray-100'}`}>
                        {i.status === 'missing' ? '✗' : isManual ? '🟡✓' : i.status === 'staple' ? '🟡' : '✅'} {i.name} {i.quantity}{i.unit ?? ''}{(isManual || isWontBuy) ? ' ↩' : ''}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {view === 'cart' && (
            <div className="rounded-2xl bg-white border border-gray-100 p-3">
              <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2">🛒 Buy once · summed</p>
              <div className="space-y-1">
                {cart.map(c => (
                  <div key={`${c.name}-${c.unit}`} className="flex items-center justify-between text-sm">
                    <span className="font-bold text-gray-800 truncate">{c.name}</span>
                    <span className="font-black text-orange-600 shrink-0">{c.quantity}{c.unit ?? ''}</span>
                  </div>
                ))}
                {cart.length === 0 && <p className="text-sm font-bold text-gray-400 py-4 text-center">Everything is on hand 🎉</p>}
              </div>
            </div>
          )}

          {radar.length > 0 && (
            <div className="rounded-2xl bg-amber-50 border border-amber-200 p-3">
              <p className="text-[11px] font-black uppercase tracking-widest text-amber-700 mb-1">🧊 Leftover radar — use first</p>
              {radar.map(r => (
                <p key={r.name} className="text-xs font-bold text-amber-800">✓ Already got {r.name}{r.daysLeft <= 2 ? ` (expires in ${r.daysLeft} d)` : ''} — use before buying</p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};