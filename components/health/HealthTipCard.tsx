import React, { useState } from 'react';
import { Lightbulb, X, ChevronRight } from 'lucide-react';
import type { HealthTip } from '../../app/constants/healthGuidelines';

interface HealthTipCardProps {
  tip: HealthTip;
  onDismiss?: (id: string) => void;
  compact?: boolean;
}

export const HealthTipCard: React.FC<HealthTipCardProps> = React.memo(({ tip, onDismiss, compact = false }) => {
  const [expanded, setExpanded] = useState(false);

  if (compact) {
    return (
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-3 rounded-xl border border-gray-200 bg-white hover:border-emerald-200 transition-all text-left active:scale-[0.99]"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg" aria-hidden="true">{tip.icon}</span>
          <span className="text-xs font-bold text-gray-800 flex-1">{tip.title}</span>
          <ChevronRight size={14} className={`text-gray-400 transition-transform ${expanded ? 'rotate-90' : ''}`} />
        </div>
        {expanded && (
          <p className="text-[10px] text-gray-500 mt-2 leading-relaxed">{tip.body}</p>
        )}
      </button>
    );
  }

  return (
    <div className="p-4 rounded-2xl border-2 border-emerald-100 bg-emerald-50 relative">
      {onDismiss && (
        <button
          onClick={() => onDismiss(tip.id)}
          className="absolute top-3 right-3 w-6 h-6 rounded-full bg-white/80 flex items-center justify-center hover:bg-white transition-all"
          aria-label="Dismiss tip"
        >
          <X size={12} className="text-gray-400" />
        </button>
      )}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-xl shrink-0">
          {tip.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Lightbulb size={12} className="text-emerald-600" />
            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600">Health Tip</span>
          </div>
          <h4 className="font-bold text-sm text-gray-900 mb-1">{tip.title}</h4>
          <p className="text-xs text-gray-600 leading-relaxed">{tip.body}</p>
        </div>
      </div>
    </div>
  );
});

HealthTipCard.displayName = 'HealthTipCard';
