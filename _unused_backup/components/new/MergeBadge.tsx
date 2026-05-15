import React from 'react';
import { UserPlus } from 'lucide-react';

interface MergeBadgeProps {
  roommateName: string;
  tooltip?: string;
}

export const MergeBadge: React.FC<MergeBadgeProps> = ({ roommateName, tooltip }) => (
  <span
    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest bg-[#FF385C]/5 text-[#FF385C]">
    title={tooltip || `Suggested by ${roommateName}`}>
    <UserPlus size={8} />
    {roommateName}
  </span>
);
