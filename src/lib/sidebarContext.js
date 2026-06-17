'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const SidebarContext = createContext(null);

export function SidebarProvider({ children }) {
  const [isOpen, setIsOpen] = useState(true);

  const apply = (open) => {
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--sidebar-width', open ? '240px' : '0px');
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('cf_sidebar');
    const open = saved === null ? true : saved === 'open';
    setIsOpen(open);
    apply(open);
  }, []);

  const toggle = () => {
    setIsOpen(prev => {
      const next = !prev;
      localStorage.setItem('cf_sidebar', next ? 'open' : 'closed');
      apply(next);
      return next;
    });
  };

  return (
    <SidebarContext.Provider value={{ isOpen, toggle }}>
      {children}
    </SidebarContext.Provider>
  );
}

export const useSidebar = () => useContext(SidebarContext);