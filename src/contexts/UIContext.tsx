import { createContext, useCallback, useContext, useMemo, useState, ReactNode } from 'react';

type UIContextValue = {
  mobileNavOpen: boolean;
  openMobileNav: () => void;
  closeMobileNav: () => void;
  toggleMobileNav: () => void;
};

const UIContext = createContext<UIContextValue | undefined>(undefined);

export function UIProvider({ children }: { children: ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const openMobileNav = useCallback(() => setMobileNavOpen(true), []);
  const closeMobileNav = useCallback(() => setMobileNavOpen(false), []);
  const toggleMobileNav = useCallback(() => setMobileNavOpen((v) => !v), []);

  const value = useMemo(
    () => ({ mobileNavOpen, openMobileNav, closeMobileNav, toggleMobileNav }),
    [mobileNavOpen, openMobileNav, closeMobileNav, toggleMobileNav]
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI must be used within UIProvider');
  return ctx;
}
