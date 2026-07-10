import React, { useState } from 'react';
import { X, Users } from 'lucide-react';
import { useStore } from '../../app/store/useStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const CreateHouseholdModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { createHousehold } = useStore();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await createHousehold(name.trim());
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-[28px] p-6 w-[90%] max-w-sm mx-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FF385C]/10 flex items-center justify-center">
              <Users size={18} className="text-[#FF385C]" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Create Household</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 text-gray-500">
            <X size={16} />
          </button>
        </div>

        <p className="text-sm text-gray-500 mb-4">
          Name your household share plan. You'll be the admin — others can join with a code.
        </p>

        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Prateek's Kitchen"
          className="w-full rounded-2xl py-3 px-4 text-sm font-medium border border-gray-200 bg-gray-50 text-gray-900 mb-4"
          autoFocus
        />

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-bold text-gray-600">
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim() || loading}
            className="flex-1 py-3 rounded-2xl bg-[#FF385C] text-white text-sm font-bold disabled:opacity-40"
          >
            {loading ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateHouseholdModal;
