'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('careerforge_user');
      if (stored) setUser(JSON.parse(stored));
    } catch (_) {}
    setLoaded(true);
  }, []);

  const login = (userData) => {
    // Merge data baru dengan data lama agar avatar_url tidak hilang
    setUser(prev => {
      const merged = { ...(prev || {}), ...userData };
      localStorage.setItem('careerforge_user', JSON.stringify(merged));
      return merged;
    });
  };

  const logout = () => {
    localStorage.removeItem('careerforge_user');
    setUser(null);
  };

  const updateAvatar = (avatarUrl) => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, avatar_url: avatarUrl };
      localStorage.setItem('careerforge_user', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <UserContext.Provider value={{ user, login, logout, loaded, updateAvatar }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);
