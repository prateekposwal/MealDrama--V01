import React from 'react';
import { getHealthLabel, getHealthIcon } from '../../utils/nutritionScore';

interface HealthScoreBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'text-[9px] px-1.5 py-0.5 gap-1',
  md: 'text-[10px] px-2 py-1 gap-1.5',
  lg: 'text-xs px-3 py-1.5 gap-2',
};

export const HealthScoreBadge: React.FC<HealthScoreBadgeProps> = React.memo(({ score, size = 'sm' }) => {
  const { label, color, bg } = getHealthLabel(score);
  const sign = score > 0 ? '+' : '';

  return (
    <span
      className={`inline-flex items-center rounded-full font-bold border ${bg} ${color} ${sizeClasses[size]}`}
      aria-label={`Health score: ${label}`}
    >
      <span>{sign}{score}</span>
    </span>
  );
});

HealthScoreBadge.displayName = 'HealthScoreBadge';
