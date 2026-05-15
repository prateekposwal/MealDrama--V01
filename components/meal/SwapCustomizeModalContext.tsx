import React, { createContext, useContext, useState, useMemo } from 'react';

interface SwapCustomizeState {
  openKey: string | null;
  setOpenKey: (key: string | null) => void;
}

const SwapCustomizeContext = createContext<SwapCustomizeState>({
  openKey: null,
  setOpenKey: () => {},
});

export function SwapCustomizeProvider({ children }: { children: React.ReactNode }) {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const value = useMemo(() => ({ openKey, setOpenKey }), [openKey]);
  return (
    <SwapCustomizeContext.Provider value={value}>
      {children}
    </SwapCustomizeContext.Provider>
  );
}

export function useSwapCustomize() {
  return useContext(SwapCustomizeContext);
}
