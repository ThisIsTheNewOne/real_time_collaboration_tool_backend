"use client";

import { useAuth } from '@/hooks/useAuth';
import { createContext, useContext, ReactNode } from 'react';


// Create context
const AuthContext = createContext<ReturnType<typeof useAuth> | undefined>(undefined);

// Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  
  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook for using the auth context
export function useAuthContext() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  
  return context;
}