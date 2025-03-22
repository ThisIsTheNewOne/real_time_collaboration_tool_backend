"use client";

import { createContext, useState, useEffect, useCallback, ReactNode, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import { getCurrentUser } from '@/lib/api';

interface UserData {
  id: string;
  email: string;
  name?: string;
}

interface DecodedToken {
  id: string;
  exp: number;
  email?: string;
}

interface AuthContextType {
  user: UserData | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (token: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  // Load user data based on token
  const loadUserData = useCallback(async (authToken: string): Promise<boolean> => {
    try {
      // Verify the token is valid by decoding it
      const decodedToken = jwtDecode<DecodedToken>(authToken);
      
      // Check if token is expired
      if (decodedToken.exp * 1000 < Date.now()) {
        console.log("Token expired, clearing auth state");
        localStorage.removeItem('authToken');
        setToken(null);
        setUser(null);
        return false;
      }
      
      // Token is valid, set it in state
      setToken(authToken);
      
      try {
        // Fetch complete user data from API
        const userData = await getCurrentUser(authToken);

        const userDataFull: UserData = {
          id: userData.id,
          email: userData.email,
          name: userData.email 
        };

        console.log("User data loaded successfully:", userDataFull);
        setUser(userDataFull);
        return true;
      } catch (error) {
        console.error('Failed to fetch user data:', error);
        // If we can't get user data, we still have basic info from token
        setUser({
          id: decodedToken.id,
          email: decodedToken.email || '', 
        });
        return !!decodedToken.id;
      }
    } catch (error) {
      console.error('Invalid token:', error);
      localStorage.removeItem('authToken');
      setToken(null);
      setUser(null);
      return false;
    }
  }, []);

  // Initialize auth state from localStorage and set up event listeners
  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);
      const storedToken = localStorage.getItem('authToken');
      
      if (storedToken) {
        console.log("Found token in localStorage, loading user data");
        await loadUserData(storedToken);
      } else {
        console.log("No token found in localStorage");
        setToken(null);
        setUser(null);
      }
      
      setLoading(false);
    };

    initializeAuth();

    // Listen for storage events (when localStorage changes in other tabs)
    const handleStorageChange = async (event: StorageEvent) => {
      if (event.key === 'authToken') {
        console.log("Auth token changed in localStorage");
        
        if (!event.newValue) {
          setToken(null);
          setUser(null);
          return;
        }
        
        if (event.newValue) {
          await loadUserData(event.newValue);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [loadUserData]);

  // Login function
  const login = async (newToken: string): Promise<boolean> => {
    console.log("Login function called with token");
    
    // First store the token in localStorage
    localStorage.setItem('authToken', newToken);
    
    // Then load the user data
    const success = await loadUserData(newToken);
    console.log("Login result:", { success, user: !!user, token: !!newToken });
    return success;
  };

  // Logout function
  const logout = () => {
    console.log("Logout function called");
    localStorage.removeItem('authToken');
    setToken(null);
    setUser(null);
    router.push('/login');
  };

  useEffect(() => {
    setIsAuthenticated(!!token && !!user);
  }, [token, user]);

  console.log("Auth context state:", { isAuthenticated, hasUser: !!user, hasToken: !!token, loading });

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        loading,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}