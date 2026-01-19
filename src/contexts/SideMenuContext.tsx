import React, { createContext, useContext, useState, ReactNode } from 'react';

/**
 * SideMenu Context Interface
 */
interface SideMenuContextType {
  isExpanded: boolean;
  isMobileOpen: boolean;
  toggleExpanded: () => void;
  toggleMobile: () => void;
  closeMobile: () => void;
}

const SideMenuContext = createContext<SideMenuContextType | undefined>(undefined);

/**
 * SideMenuProvider component
 * Manages side menu state (expanded/collapsed and mobile open/closed)
 */
export const SideMenuProvider = ({ children }: { children: ReactNode }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleExpanded = React.useCallback(() => {
    setIsExpanded((prev) => {
      console.log('toggleExpanded: changing from', prev, 'to', !prev);
      return !prev;
    });
  }, []);

  const toggleMobile = React.useCallback(() => {
    setIsMobileOpen((prev) => {
      console.log('toggleMobile: changing from', prev, 'to', !prev);
      return !prev;
    });
  }, []);

  const closeMobile = React.useCallback(() => {
    console.log('closeMobile: setting to false');
    setIsMobileOpen(false);
  }, []);

  const value: SideMenuContextType = {
    isExpanded,
    isMobileOpen,
    toggleExpanded,
    toggleMobile,
    closeMobile,
  };

  return <SideMenuContext.Provider value={value}>{children}</SideMenuContext.Provider>;
};

/**
 * Hook to use side menu context
 * Returns undefined if context is not available (instead of throwing)
 */
export const useSideMenu = (): SideMenuContextType | undefined => {
  return useContext(SideMenuContext);
};
