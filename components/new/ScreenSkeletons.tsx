import React from 'react';

const Shimmer: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-100 rounded-xl ${className}`} />
);

export const DashboardSkeleton: React.FC = () => (
  <div className="min-h-screen bg-white pb-32 animate-in fade-in duration-300">
    <header className="px-6 pt-4 pb-4">
      <Shimmer className="h-8 w-48 mb-2" />
      <Shimmer className="h-4 w-32" />
    </header>
    <div className="px-6 space-y-4">
      {[0, 1, 2, 3].map(i => (
        <div key={i} className="rounded-[28px] border-2 border-gray-100 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shimmer className="h-8 w-8 rounded-xl" />
              <Shimmer className="h-4 w-16" />
            </div>
            <Shimmer className="h-8 w-20 rounded-xl" />
          </div>
          <div className="flex items-center gap-4">
            <Shimmer className="h-16 w-16 rounded-2xl" />
            <div className="flex-1 space-y-2">
              <Shimmer className="h-6 w-48" />
              <Shimmer className="h-4 w-64" />
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const PlanScreenSkeleton: React.FC = () => (
  <div className="min-h-screen bg-white pb-32 animate-in fade-in duration-300">
    <header className="px-6 pt-4 pb-4">
      <Shimmer className="h-8 w-40 mb-2" />
      <Shimmer className="h-4 w-24" />
    </header>
    <div className="px-6 mb-4">
      <div className="flex gap-2">
        <Shimmer className="h-8 w-24 rounded-full" />
        <Shimmer className="h-8 w-20 rounded-full" />
      </div>
    </div>
    <div className="px-4 space-y-6">
      {[0, 1, 2].map(day => (
        <div key={day}>
          <div className="flex items-center gap-3 mb-3 px-2">
            <Shimmer className="h-10 w-10 rounded-xl" />
            <Shimmer className="h-6 w-8" />
          </div>
          <div className="space-y-3">
            {[0, 1, 2, 3].map(slot => (
              <div key={slot} className="rounded-[28px] border-2 border-gray-100 p-4">
                <div className="flex items-center gap-3">
                  <Shimmer className="h-12 w-12 rounded-2xl" />
                  <div className="flex-1 space-y-2">
                    <Shimmer className="h-5 w-36" />
                    <Shimmer className="h-3 w-48" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const PantryPulseSkeleton: React.FC = () => (
  <div className="min-h-screen bg-white pb-32 animate-in fade-in duration-300">
    <header className="px-6 pt-4 pb-4">
      <Shimmer className="h-8 w-56 mb-2" />
      <Shimmer className="h-4 w-32" />
      <div className="mt-4">
        <Shimmer className="h-10 w-full rounded-2xl" />
      </div>
    </header>
    <div className="px-6 space-y-3">
      {[0, 1, 2, 3, 4].map(i => (
        <div key={i} className="flex items-center gap-4 p-4 rounded-[20px] border-2 border-gray-100">
          <Shimmer className="h-7 w-7 rounded-xl" />
          <div className="flex-1 space-y-1">
            <Shimmer className="h-4 w-32" />
            <Shimmer className="h-3 w-24" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const ProfileSkeleton: React.FC = () => (
  <div className="min-h-screen bg-white pb-32 animate-in fade-in duration-300">
    <header className="px-6 pt-4 pb-4">
      <Shimmer className="h-8 w-32 mb-2" />
    </header>
    <div className="px-6 space-y-4">
      {[0, 1, 2, 3].map(i => (
        <div key={i} className="rounded-2xl border border-gray-100 p-4 space-y-2">
          <Shimmer className="h-3 w-20" />
          <Shimmer className="h-5 w-40" />
        </div>
      ))}
    </div>
  </div>
);
