import React, { useEffect, useState } from 'react';
import { ArrowLeft, Link, Copy, Trash2, Check, Users, RefreshCw } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { logEvent } from '../../lib/analytics';

interface RoommateShareScreenProps {
  onClose: () => void;
}

export const RoommateShareScreen: React.FC<RoommateShareScreenProps> = ({ onClose }) => {
  const {
    roommateLink, roommateSuggestions,
    generateRoommateLink, revokeRoommateLink,
    fetchRoommateSuggestions, approveSuggestion, rejectSuggestion,
  } = useStore();

  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRoommateSuggestions();
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    await generateRoommateLink();
    logEvent('roommate_link_generated');
    setGenerating(false);
  };

  const handleCopy = () => {
    if (roommateLink?.magicLink) {
      navigator.clipboard.writeText(roommateLink.magicLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRevoke = async () => {
    await revokeRoommateLink();
  };

  const handleRefresh = async () => {
    setLoading(true);
    await fetchRoommateSuggestions();
    setLoading(false);
  };

  const pendingSuggestions = roommateSuggestions.filter(s => s.status === 'pending');

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 px-4 py-3 flex items-center justify-between border-b bg-white border-gray-100">
        <button onClick={onClose} className="w-9 h-9 rounded-xl flex items-center justify-center">
          <ArrowLeft size={18} className="text-gray-900" />
        </button>
        <h2 className="text-sm font-black text-gray-900">Share with Roommates</h2>
        <button
          onClick={handleRefresh}
          className="w-9 h-9 rounded-xl flex items-center justify-center bg-gray-100 text-gray-500"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {/* Link Generator */}
        <div className="rounded-2xl p-5 bg-white border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#FF385C]/10 flex items-center justify-center">
              <Link size={18} className="text-[#FF385C]" />
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-900">Magic Link</h3>
              <p className="text-[10px] font-bold text-gray-400">
                Share this link — no app needed
              </p>
            </div>
          </div>

          {roommateLink ? (
            <div className="space-y-3">
              <div className="px-4 py-3 rounded-xl flex items-center justify-between bg-gray-50">
                <span className="text-xs font-mono truncate flex-1 mr-2 text-gray-600">
                  {roommateLink.magicLink}
                </span>
                <button
                  onClick={handleCopy}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    copied
                      ? 'bg-green-500/10 text-green-600'
                      : 'bg-[#FF385C]/5 text-[#FF385C]'
                  }`}
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold text-gray-400">
                  Expires: {new Date(roommateLink.expiresAt).toLocaleDateString()}
                </span>
                <button
                  onClick={handleRevoke}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-500/10 text-red-600 text-[10px] font-bold ml-auto"
                >
                  <Trash2 size={10} />
                  Revoke
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleGenerate}
              disabled={generating}
              className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
                generating
                  ? 'bg-gray-200 text-gray-400'
                  : 'bg-[#FF385C] text-white active:scale-[0.98]'
              }`}
            >
              {generating ? 'Generating...' : 'Generate Link'}
            </button>
          )}
        </div>

        {/* Suggestions */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Users size={14} className="text-[#FF385C]" />
              <h3 className="text-sm font-black text-gray-900">
                Suggestions ({pendingSuggestions.length})
              </h3>
            </div>
          </div>

          {pendingSuggestions.length === 0 ? (
            <div className="text-center py-10 rounded-2xl border-2 border-dashed border-gray-200">
              <span className="text-2xl block mb-2">👻</span>
              <p className="text-xs font-bold text-gray-400">
                No suggestions yet
              </p>
              <p className="text-[10px] mt-1 text-gray-400">
                Share your link to get roommate suggestions
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {pendingSuggestions.map(suggestion => (
                <div
                  key={suggestion.id}
                  className="rounded-xl p-4 bg-white border border-gray-100"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">
                        {suggestion.mealName}
                      </h4>
                      <p className="text-[10px] font-semibold text-gray-400">
                        {suggestion.slot} · {new Date(suggestion.date).toLocaleDateString()} · x{suggestion.quantity}
                      </p>
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-[#FF385C]/5 text-[#FF385C]">
                      {suggestion.roommateName}
                    </span>
                  </div>

                  {/* Details */}
                  {(suggestion.gravyStyle || suggestion.rotiType || suggestion.sides.length > 0) && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {suggestion.gravyStyle && (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-gray-100 text-gray-500">
                          {suggestion.gravyStyle}
                        </span>
                      )}
                      {suggestion.rotiType && (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-gray-100 text-gray-500">
                          {suggestion.rotiType}
                        </span>
                      )}
                      {suggestion.sides.map(side => (
                        <span key={side} className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-gray-100 text-gray-500">
                          + {side}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => approveSuggestion(suggestion.id)}
                      className="flex-1 py-2 rounded-xl bg-green-500/10 text-green-600 text-[10px] font-bold active:scale-90 transition-all"
                    >
                      Add to Plan
                    </button>
                    <button
                      onClick={() => rejectSuggestion(suggestion.id)}
                      className="flex-1 py-2 rounded-xl text-[10px] font-bold active:scale-90 transition-all bg-gray-100 text-gray-500"
                    >
                      Skip
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
