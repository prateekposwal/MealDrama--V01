import React, { useEffect, useState } from 'react';
import { fetchAIRecommendations, fetchAIScore } from '../../utils/aiBridge';
import { Sparkles, Lightbulb, X } from 'lucide-react';

interface Props {
  userId?: string;
  diet: string;
  region?: string;
}

export default function DashboardAIRecommendations({ userId, diet, region }: Props) {
  const [recs, setRecs] = useState<string[]>([]);
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!diet) return;
    setLoading(true);
    fetchAIRecommendations({
      trayLibrary: {}, planDays: {}, pantryStaples: [],
      diet, preferredRegions: region ? [region] : [],
    }).then(r => {
      if (r) setRecs(r);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [diet, region, userId]);

  if (loading || recs.length === 0) return null;

  const visible = recs.filter((_, i) => !dismissed.has(i)).slice(0, 2);
  if (visible.length === 0) return null;

  return (
    <div className="px-4 mt-2 mb-1">
      <div className="flex items-start gap-2">
        <Sparkles className="w-3.5 h-3.5 text-[#FF385C] mt-0.5 flex-shrink-0" />
        <div className="flex-1 flex flex-col gap-1">
          {visible.map((rec, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-gray-600 bg-gradient-to-r from-[#FFF0F3] to-transparent px-2.5 py-1.5 rounded-lg">
              <Lightbulb className="w-3 h-3 text-[#FF385C] flex-shrink-0" />
              <span className="flex-1">{rec}</span>
              <button onClick={() => setDismissed(prev => new Set(prev).add(recs.indexOf(rec)))} className="text-gray-400 hover:text-gray-600">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
