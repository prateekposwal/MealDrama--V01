import React, { useState, useEffect, useCallback } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { getPendingCount } from '../../utils/offlineQueue';

export const OfflineBanner: React.FC = () => {
  const [online, setOnline] = useState(navigator.onLine);
  const [pending, setPending] = useState(getPendingCount);

  const refreshPending = useCallback(() => setPending(getPendingCount()), []);

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    window.addEventListener('offline_queue_updated', refreshPending);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
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
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  if (online) return <Wifi size={14} className="text-green-500" />;
  return <WifiOff size={14} className="text-amber-500" />;
};
