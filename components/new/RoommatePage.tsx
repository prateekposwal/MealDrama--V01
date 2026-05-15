import React, { useEffect, useState } from 'react';
import { SimplifiedSlot } from './SimplifiedSlot';
import { Check, Loader2 } from 'lucide-react';
import api from '../../lib/api';

interface RoommatePageProps {
  token: string;
}

interface LinkValidation {
  valid: boolean;
  cookName: string;
  region: string;
  expiresAt: string;
}

export const RoommatePage: React.FC<RoommatePageProps> = ({ token }) => {
  const [validation, setValidation] = useState<LinkValidation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roommateName, setRoommateName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [suggestionData, setSuggestionData] = useState<{
    mealName: string;
    quantity: number;
    gravyStyle?: string;
    rotiType?: string;
    sides?: string[];
    beverages?: string[];
  } | null>(null);

  useEffect(() => {
    const validate = async () => {
      try {
        const res = await api.get<LinkValidation>(`/roommates/link/validate/${token}`);
        setValidation(res);
      } catch (err: any) {
        setError(err?.message || 'Invalid link');
      } finally {
        setLoading(false);
      }
    };
    validate();
  }, [token]);

  const handleSubmit = async (data: {
    mealName: string;
    quantity: number;
    gravyStyle?: string;
    rotiType?: string;
    sides?: string[];
    beverages?: string[];
  }) => {
    if (!roommateName.trim()) return;
    try {
      await api.post('/roommates/suggestion', {
        token,
        date: new Date().toISOString().split('T')[0],
        slot: 'dinner',
        roommateName: roommateName.trim(),
        ...data,
      });
      setSuggestionData(data);
      setSubmitted(true);
    } catch (err) {
      console.error('Failed to submit suggestion:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <Loader2 size={32} className="text-[#FF385C] animate-spin mb-4" />
        <p className="text-sm font-bold text-gray-500">Loading...</p>
      </div>
    );
  }

    if (error || !validation?.valid) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-white">
        <span className="text-4xl mb-4">🔗</span>
        <h2 className="text-xl font-black mb-2 text-gray-900">Link Expired</h2>
        <p className="text-sm text-center text-gray-500">
          This sharing link is no longer valid. Ask the cook for a new one.
        </p>
      </div>
    );
  }

    if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-white">
        <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
          <Check size={28} className="text-green-600" />
        </div>
        <h2 className="text-xl font-black mb-2 text-center text-gray-900">
          Suggestion Sent!
        </h2>
        <p className="text-sm text-center mb-1 text-gray-500">
          {validation.cookName} will review your suggestion for {suggestionData?.mealName}.
        </p>
          <p className="text-xs text-center text-gray-400">
            You can close this page now.
          </p>
      </div>
    );
  }

    return (
      <div className="min-h-screen bg-gray-50">
      {/* Header */}
        <div className="px-5 py-6 text-center bg-white">
        <span className="text-3xl block mb-3">🍛</span>
          <h1 className="text-xl font-black text-gray-900">
            {validation.cookName}&apos;s Kitchen
          </h1>
          <p className="text-sm mt-1 text-gray-500">
            What would you like to eat?
          </p>
      </div>

      {/* Name Input */}
      <div className="px-5 py-4">
        <label className="text-[10px] font-black uppercase tracking-widest block mb-2 text-gray-500">
          Your Name
        </label>
        <input
          type="text"
          value={roommateName}
          onChange={(e) => setRoommateName(e.target.value)}
          placeholder="Enter your name"
                                className="w-full px-4 py-3 rounded-xl text-sm font-bold border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF385C]"
        />
      </div>

      {/* Simplified Slot */}
      <div className="px-5 pb-10">
        <SimplifiedSlot
          slot="Dinner"
          slotIcon="🌙"
          slotTime="8:00 PM"
          existingMeals={[]}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
};
