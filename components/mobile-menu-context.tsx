"use client";

import React, { createContext, useContext, ReactNode } from "react";

interface MobileMenuContextType {
  toggleMobileMenu: () => void;
}

const MobileMenuContext = createContext<MobileMenuContextType | undefined>(undefined);

export const useMobileMenu = () => {
  const context = useContext(MobileMenuContext);
  if (context === undefined) {
    throw new Error("useMobileMenu must be used within a MobileMenuProvider");
  }
  return context;
};

interface MobileMenuProviderProps {
  children: ReactNode;
  toggleMobileMenu: () => void;
}

export const MobileMenuProvider: React.FC<MobileMenuProviderProps> = ({
  children,
  toggleMobileMenu,
}) => {
  return (
    <MobileMenuContext.Provider value={{ toggleMobileMenu }}>
      {children}
    </MobileMenuContext.Provider>
  );
};