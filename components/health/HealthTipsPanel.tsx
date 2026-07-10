import React, { useState, useMemo } from 'react';
import { HEALTH_TIPS, type HealthTip } from '../../app/constants/healthGuidelines';
import { HealthTipCard } from './HealthTipCard';

interface HealthTipsPanelProps {
  maxTips?: number;
  category?: HealthTip['category'];
  dismissable?: boolean;
  onDismiss?: (id: string) => void;
  dismissedIds?: string[];
  compact?: boolean;
}

export const HealthTipsPanel: React.FC<HealthTipsPanelProps> = React.memo(({
  maxTips = 3,
  category,
  dismissable = true,
  onDismiss,
  dismissedIds = [],
  compact = false,
}) => {
  const [localDismissed, setLocalDismissed] = useState<Set<string>>(new Set());

  const filteredTips = useMemo(() => {
    let tips = HEALTH_TIPS;
    if (category) tips = tips.filter(t => t.category === category);
    tips = tips.filter(t => !dismissedIds.includes(t.id) && !localDismissed.has(t.id));
    return tips.slice(0, maxTips);
  }, [category, maxTips, dismissedIds, localDismissed]);

  const handleDismiss = (id: string) => {
    setLocalDismissed(prev => new Set(prev).add(id));
    onDismiss?.(id);
  };

  if (filteredTips.length === 0) return null;

  return (
    <div className="space-y-2">
      {compact ? (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {filteredTips.map(tip => (
            <div key={tip.id} className="shrink-0 w-56">
              <HealthTipCard tip={tip} onDismiss={dismissable ? handleDismiss : undefined} compact />
            </div>
          ))}
        </div>
      ) : (
        filteredTips.map(tip => (
          <HealthTipCard
            key={tip.id}
            tip={tip}
            onDismiss={dismissable ? handleDismiss : undefined}
          />
        ))
      )}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
});

HealthTipsPanel.displayName = 'HealthTipsPanel';
