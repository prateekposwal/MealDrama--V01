import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Check, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { expenseApi } from '../../app/utils/expenseApi';
import AddExpenseModal from './AddExpenseModal';
import type { Expense, MemberBalance } from '../../types/household';

const CATEGORY_EMOJI: Record<string, string> = {
  cook_salary: '👨‍🍳', groceries: '🛒', utilities: '💡', supplies: '🧂', other: '📦',
};

interface Props {
  householdId: string;
  isRoommateHousehold: boolean; // show expense features only for roommates
  currentMemberRole: string;
}

export default function ExpenseList({ householdId, isRoommateHousehold, currentMemberRole }: Props) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [balances, setBalances] = useState<MemberBalance[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const isAdmin = currentMemberRole === 'admin';

  const load = useCallback(async () => {
    try {
      const [expData, balData] = await Promise.all([
        expenseApi.list(householdId),
        expenseApi.balances(householdId),
      ]);
      setExpenses(expData);
      setBalances(balData);
    } catch (e) {
      console.error('Failed to load expenses:', e);
    }
  }, [householdId]);

  useEffect(() => { if (expanded) load(); }, [expanded, load]);

  const handleDelete = async (expenseId: string) => {
    if (!isAdmin) return;
    try {
      await expenseApi.delete(householdId, expenseId);
      load();
    } catch (e) {
      console.error('Failed to delete:', e);
    }
  };

  const totalUnpaid = expenses.reduce((sum, e) => sum + e.splits.filter(s => !s.paid).reduce((ss, s) => ss + s.amount, 0), 0);

  // Hide for non-roommate households (e.g., families)
  if (!isRoommateHousehold) return null;

  return (
    <div className="border-b border-gray-50">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-4 active:bg-gray-50/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-black uppercase tracking-widest text-gray-400">Expenses</span>
          {!expanded && totalUnpaid > 0 && (
            <span className="text-sm font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-full">
              ₹{totalUnpaid} unpaid
            </span>
          )}
        </div>
        {expanded ? <ChevronDown size={14} className="text-gray-300" /> : <ChevronRight size={14} className="text-gray-300" />}
      </button>

      {expanded && (
        <div className="px-5 pb-4 space-y-3">
          {/* Balance summary */}
          {balances.length > 0 && (
            <div className="bg-gray-50 rounded-xl p-3 space-y-1.5">
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Balances</p>
              {balances.map(b => (
                <div key={b.memberId} className="flex items-center justify-between text-xs">
                  <span className="font-medium text-gray-700">{b.memberName}</span>
                  <span className={`font-bold ${b.balance < -0.01 ? 'text-orange-600' : b.balance > 0.01 ? 'text-emerald-600' : 'text-gray-400'}`}>
                    {b.balance < -0.01 ? `owes ₹${Math.abs(b.balance)}` : b.balance > 0.01 ? `gets ₹${b.balance}` : 'settled'}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Expense list */}
          {expenses.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-4">No expenses yet. Tap + to add one.</p>
          ) : (
            <div className="space-y-1.5">
              {expenses.map(e => (
                <div key={e.id} className="flex items-center justify-between p-3 rounded-xl bg-white border border-gray-100">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span>{CATEGORY_EMOJI[e.category] || '📦'}</span>
                      <p className="text-xs font-bold text-gray-900 truncate">{e.title}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-400">₹{e.amount}</span>
                      <span className="text-sm text-gray-300">·</span>
                      <span className="text-sm text-gray-400">{e.splits.filter(s => s.paid).length}/{e.splits.length} paid</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {e.splits.map(s => (
                      <button
                        key={s.id}
                        onClick={async () => {
                          if (!s.paid) {
                            await expenseApi.markPaid(householdId, e.id, s.id);
                            load();
                          }
                        }}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                          s.paid ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-200 hover:border-emerald-300'
                        }`}
                        title={s.paid ? 'Paid' : 'Mark as paid'}
                      >
                        {s.paid && <Check size={10} />}
                      </button>
                    ))}
                    {isAdmin && (
                      <button onClick={() => handleDelete(e.id)} className="p-1.5 rounded-full hover:bg-red-50 text-gray-300 hover:text-red-500 ml-1">
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="w-full py-2.5 rounded-xl border border-dashed border-gray-200 text-xs font-bold text-gray-400 flex items-center justify-center gap-1.5 active:scale-95 transition-all hover:border-[#FF385C]/30 hover:text-[#FF385C]"
          >
            <Plus size={14} /> Add Expense
          </button>
        </div>
      )}

      {showAddModal && (
        <AddExpenseModal
          householdId={householdId}
          onClose={() => setShowAddModal(false)}
          onCreated={load}
        />
      )}
    </div>
  );
}
