import React, { useState, useEffect, useCallback } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { getPendingCount } from '../../utils/offlineQueue';
import { onConnectivityChange, isOnline } from '../../utils/connectivity';

export const OfflineBanner: React.FC = () => {
  const [online, setOnline] = useState(isOnline());
  const [pending, setPending] = useState(getPendingCount);

  const refreshPending = useCallback(() => setPending(getPendingCount()), []);

  useEffect(() => {
    const unsub = onConnectivityChange((state) => setOnline(state === 'online'));
    window.addEventListener('offline_queue_updated', refreshPending);
    return () => {
      unsub();
      window.removeEventListener('offline_queue_updated', refreshPending);
    };
  }, [refreshPending]);

  if (online) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[200] max-w-lg mx-auto">
      <div className="bg-amber-500 text-white px-4 py-2 flex items-center justify-center gap-2 text-xs font-bold shadow-lg">
        <WifiOff size={14} />
        <span>
          You're offline{pending > 0 ? ` \u2022 ${pending} queued` : ''}
        </span>
      </div>
    </div>
  );
};

export const OnlineStatus: React.FC = () => {
  const [online, setOnline] = useState(isOnline());

  useEffect(() => {
    return onConnectivityChange((state) => setOnline(state === 'online'));
  }, []);

  if (online) return <Wifi size={14} className="text-green-500" />;
  return <WifiOff size={14} className="text-amber-500" />;
};
