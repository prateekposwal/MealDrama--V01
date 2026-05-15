import React, { useEffect, useState } from 'react';
import { Users, X, Minus, Plus, AlertTriangle } from 'lucide-react';
import { logEvent } from '../../lib/analytics';

interface GuestModeToggleProps {
  isOpen: boolean;
  onClose: () => void;
  currentGuestCount: number;
  currentGuestDays: number;
  currentServings: number;
  onEnable: (guestCount: number, guestDays: number) => void;
  onDisable: () => void;
}

export const GuestModeToggle: React.FC<GuestModeToggleProps> = ({
  isOpen,
  onClose,
  currentGuestCount,
  currentGuestDays,
  currentServings,
  onEnable,
  onDisable,
}) => {
  const [guestCount, setGuestCount] = useState(currentGuestCount || 0);
  const [guestDays, setGuestDays] = useState(currentGuestDays || 1);
  const isHighVolume = guestCount + 1 > 12;

  useEffect(() => {
    if (isOpen) {
      setGuestCount(currentGuestCount || 0);
      setGuestDays(currentGuestDays || 1);
    }
  }, [isOpen, currentGuestCount, currentGuestDays]);

  if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 animate-in fade-in duration-200">
            <div className="w-full max-w-md rounded-t-3xl overflow-hidden animate-in slide-in-from-bottom duration-300 bg-white">
        <div className="overflow-y-auto overscroll-contain px-6 pt-6" style={{ maxHeight: 'calc(100dvh - 20px)', paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FF385C]/10 flex items-center justify-center">
              <Users size={16} className="text-[#FF385C]" />
            </div>
            <div>
                    <h3 className="text-sm font-black text-gray-900">Guest Mode</h3>
                        <p className="text-[10px] font-bold text-gray-400">
                Scale servings across days
              </p>
            </div>
          </div>
          <button
            onClick={onClose}>
                        className="w-7 h-7 rounded-lg flex items-center justify-center bg-gray-100 text-gray-500">
            <X size={13} />
          </button>
        </div>

        {/* Current servings */}
        <div className="mb-4 px-4 py-3 rounded-xl bg-gray-50">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
            Current Servings
          </p>
                    <p className="text-2xl font-black mt-0.5 text-gray-900">
            {currentServings}
          </p>
        </div>

        {/* Guest count */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-gray-600">
              Extra Guests
            </label>
                        <span className="text-sm font-black text-gray-900">
                            +{guestCount}
                        </span>
          </div>
          <div className="flex items-center gap-3">
                            <button
                                onClick={() => setGuestCount(Math.max(0, guestCount - 1))}>
                                className="w-10 h-10 rounded-xl flex items-center justify-center active:scale-90 transition-all bg-gray-100 text-gray-500">
              <Minus size={16} />
            </button>
            <div className="flex-1 h-2 rounded-full overflow-hidden bg-gray-100">
              <div
                className="h-full bg-[#FF385C] rounded-full transition-all">
                style={{ width: `${(guestCount / 11) * 100}%` }}
              />
            </div>
                            <button
                                onClick={() => setGuestCount(Math.min(11, guestCount + 1))}>
                                className="w-10 h-10 rounded-xl flex items-center justify-center active:scale-90 transition-all bg-gray-100 text-gray-500">
              <Plus size={16} />
            </button>
          </div>
        </div>

        {/* Guest days */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-gray-600">
              Apply for Days
            </label>
                            <span className="text-sm font-black text-gray-900">
                                {guestDays} day{guestDays > 1 ? 's' : ''}
                            </span>
          </div>
          <div className="flex items-center gap-3">
                            <button
                                onClick={() => setGuestDays(Math.max(1, guestDays - 1))}>
                                className="w-10 h-10 rounded-xl flex items-center justify-center active:scale-90 transition-all bg-gray-100 text-gray-500">
              <Minus size={16} />
            </button>
            <div className="flex-1 h-2 rounded-full overflow-hidden bg-gray-100">
              <div
                className="h-full bg-[#FF385C] rounded-full transition-all">
                style={{ width: `${(guestDays / 14) * 100}%` }}
              />
            </div>
                            <button
                                onClick={() => setGuestDays(Math.min(14, guestDays + 1))}>
                                className="w-10 h-10 rounded-xl flex items-center justify-center active:scale-90 transition-all bg-gray-100 text-gray-500">
              <Plus size={16} />
            </button>
          </div>
        </div>

        {/* High volume warning */}
        {isHighVolume && (
          <div className="mb-4 px-3 py-2 rounded-xl flex items-center gap-2 bg-amber-50 border border-amber-100">
            <AlertTriangle size={12} className="text-amber-600 flex-shrink-0" />
            <span className="text-[10px] font-bold text-amber-700">
              High volume ({guestCount + 1} servings). Consider splitting batches.
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          {currentGuestCount > 0 && (
            <button
              onClick={() => { logEvent('guest_mode_disabled', { source: 'day_header' }); onDisable(); onClose(); }}>
              className="flex-1 py-3 rounded-xl font-bold text-sm transition-all bg-gray-100 text-gray-600">
              Remove Guests
            </button>
          )}
          <button
            onClick={() => { logEvent('guest_mode_enabled', { count: guestCount, days: guestDays, source: 'day_header' }); onEnable(guestCount, guestDays); onClose(); }}>
            className="flex-1 py-3 rounded-xl bg-[#FF385C] text-white font-bold text-sm active:scale-[0.98] transition-all">
            {currentGuestCount > 0 ? 'Update' : 'Save'}
          </button>
        </div>
        </div>
      </div>
    </div>
  );
};
