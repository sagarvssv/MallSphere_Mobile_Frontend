// contexts/AuthContext.tsx
import React, { createContext, ReactNode, useContext } from 'react';
import { useAuth as useAuthHook } from '../hooks/useAuth';

const AuthContext = createContext<ReturnType<typeof useAuthHook> | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuthHook();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
}