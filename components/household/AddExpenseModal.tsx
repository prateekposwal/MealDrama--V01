import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { expenseApi } from '../../app/utils/expenseApi';
import type { ExpenseCategory } from '../../types/household';

const CATEGORIES: { key: ExpenseCategory; label: string; emoji: string }[] = [
  { key: 'cook_salary', label: 'Cook Salary', emoji: '👨‍🍳' },
  { key: 'groceries', label: 'Groceries', emoji: '🛒' },
  { key: 'utilities', label: 'Utilities', emoji: '💡' },
  { key: 'supplies', label: 'Kitchen Supplies', emoji: '🧂' },
  { key: 'other', label: 'Other', emoji: '📦' },
];

interface Props {
  householdId: string;
  onClose: () => void;
  onCreated: () => void;
}

export default function AddExpenseModal({ householdId, onClose, onCreated }: Props) {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('other');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !amount || parseFloat(amount) <= 0) return;
    setSaving(true);
    try {
      await expenseApi.create(householdId, {
        title: title.trim(),
        amount: parseFloat(amount),
        category,
      });
      onCreated();
      onClose();
    } catch (e) {
      console.error('Failed to create expense:', e);
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-2xl animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">Add Expense</h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100"><X size={16} /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[9px] font-bold text-gray-500 block mb-1">Title</label>
            <input
              type="text" value={title} onChange={e => setTitle(e.target.value)}
              placeholder="e.g., Cook Ramesh - July Salary"
              className="w-full rounded-xl py-2.5 px-3 text-sm font-medium border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#FF385C]/20 focus:border-[#FF385C] outline-none transition-all"
            />
          </div>

          <div>
            <label className="text-[9px] font-bold text-gray-500 block mb-1">Amount (₹)</label>
            <input
              type="number" value={amount} onChange={e => setAmount(e.target.value)}
              placeholder="0"
              min="1"
              step="0.01"
              className="w-full rounded-xl py-2.5 px-3 text-sm font-medium border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#FF385C]/20 focus:border-[#FF385C] outline-none transition-all"
            />
          </div>

          <div>
            <label className="text-[9px] font-bold text-gray-500 block mb-2">Category</label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map(c => (
                <button
                  key={c.key}
                  onClick={() => setCategory(c.key)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all active:scale-95 ${
                    category === c.key
                      ? 'bg-gray-900 text-white border-gray-900 shadow-sm'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {c.emoji} {c.label}
                </button>
              ))}
            </div>
          </div>

          <p className="text-[9px] text-gray-400 font-medium">
            Split equally among {householdId ? 'all members' : 'household members'}
          </p>
        </div>

        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-500 text-xs font-bold active:scale-95 transition-all">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!title.trim() || !amount || saving}
            className="flex-1 py-2.5 rounded-xl bg-gray-900 text-white text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all disabled:opacity-40"
          >
            {saving ? 'Adding...' : <><Plus size={14} /> Add Expense</>}
          </button>
        </div>
      </div>
    </div>
  );
}
