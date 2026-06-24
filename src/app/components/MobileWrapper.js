'use client';

import { useEffect, useState } from 'react';
import { useSidebar } from '../../lib/sidebarContext';

export default function MobileWrapper({ children }) {
  const [isMobile, setIsMobile] = useState(false);
  const sidebarCtx = useSidebar();
  const isOpen = sidebarCtx ? sidebarCtx.isOpen : true;

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return (
    <div style={{ paddingTop: isMobile && !isOpen ? '52px' : '0' }}>
      {children}
    </div>
  );
}