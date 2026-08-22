import React, { useState } from 'react';
import { X, LogIn } from 'lucide-react';
import { useBackButtonClose } from '../../hooks/useBackButtonClose';
import { useStore } from '../../app/store/useStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const JoinHouseholdModal: React.FC<Props> = ({ isOpen, onClose }) => {
  useBackButtonClose(isOpen, onClose);
  const { joinHousehold } = useStore();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleJoin = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setError('');
    try {
      await joinHousehold(code.trim().toUpperCase());
      onClose();
    } catch {
      setError('Invalid code or household not found.');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-[28px] p-6 w-[90%] max-w-sm mx-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center">
              <LogIn size={18} className="text-emerald-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Join Household</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 text-gray-500">
            <X size={16} />
          </button>
        </div>

        <p className="text-sm text-gray-500 mb-4">
          Enter the 6-character code shared by your household admin.
        </p>

        <input
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase().slice(0, 6))}
          placeholder="e.g. FAM42B"
          className="w-full rounded-2xl py-3 px-4 text-sm font-bold text-center tracking-[0.3em] border border-gray-200 bg-gray-50 text-gray-900 mb-4 uppercase"
          maxLength={6}
          autoFocus
        />

        {error && <p className="text-xs text-red-500 mb-3 text-center">{error}</p>}

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-bold text-gray-600">
            Cancel
          </button>
          <button
            onClick={handleJoin}
            disabled={code.length < 4 || loading}
            className="flex-1 py-3 rounded-2xl bg-emerald-500 text-white text-sm font-bold disabled:opacity-40"
          >
            {loading ? 'Joining...' : 'Join'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default JoinHouseholdModal;
