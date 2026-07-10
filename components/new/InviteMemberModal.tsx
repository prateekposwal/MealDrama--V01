import React, { useEffect, useState } from 'react';
import { X, Copy, Check, Share2 } from 'lucide-react';
import { useStore } from '../../app/store/useStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const InviteMemberModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { household } = useStore();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) setCopied(false);
  }, [isOpen]);

  if (!isOpen || !household) return null;

  const code = household.code;
  const shareText = `Join my MealDrama household "${household.name}"! Use code: ${code}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* fallback */ }
  };

  const handleShare = async () => {
    const shareData = { title: 'Join MealDrama Household', text: shareText };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch { /* user cancelled */ }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-[28px] p-6 w-[90%] max-w-sm mx-auto shadow-2xl text-center" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Invite Members</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 text-gray-500">
            <X size={16} />
          </button>
        </div>

        <p className="text-sm text-gray-500 mb-5">
          Share this code with your household. They enter it in their app to join.
        </p>

        <div className="bg-gray-50 rounded-2xl p-5 mb-5 border border-gray-100">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Share Code</p>
          <p className="text-3xl font-black tracking-[0.4em] text-gray-900 select-all">{code}</p>
        </div>

        <div className="flex gap-2">
          <button onClick={handleCopy} className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-bold text-gray-600 flex items-center justify-center gap-2">
            {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button onClick={handleShare} className="flex-1 py-3 rounded-2xl bg-[#FF385C] text-white text-sm font-bold flex items-center justify-center gap-2">
            <Share2 size={16} /> Share
          </button>
        </div>
      </div>
    </div>
  );
};

export default InviteMemberModal;
