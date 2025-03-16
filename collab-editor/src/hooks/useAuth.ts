import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import { getCurrentUser } from '@/lib/api';

interface UserData {
  id: string;
  email: string;
  name?: string;
}

export function useAuth() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Load token from localStorage on component mount
  useEffect(() => {
    const loadUserData = async () => {
      setLoading(true);
      const storedToken = localStorage.getItem('authToken');
      
      if (storedToken) {
        try {
          // Verify the token is valid by decoding it
          const decodedToken = jwtDecode<{id: string, exp: number}>(storedToken);
          
          // Check if token is expired
          if (decodedToken.exp * 1000 < Date.now()) {
            localStorage.removeItem('authToken');
            setToken(null);
            setUser(null);
          } else {
            // Token is valid, fetch complete user data from API
            setToken(storedToken);
            
            try {
              const userData = await getCurrentUser(storedToken);

              const userDataFull = {
                id: decodedToken.id,
                email: userData.email,
                name: userData.email
              }

              setUser(userDataFull);
            } catch (error) {
              console.error('Failed to fetch user data:', error);
              // If we can't get user data, we still have basic info from token
              setUser({
                id: decodedToken.id,
                email: '', // We don't have this from the token alone
                // created_at: new Date().toISOString()
              });
            }
          }
        } catch (error) {
          console.error('Invalid token:', error);
          localStorage.removeItem('authToken');
        }
      }
      
      setLoading(false);
    };

    loadUserData();
  }, []);

  // Login function
  const login = (newToken: string) => {
    try {
      const decodedToken = jwtDecode<UserData & { exp: number }>(newToken);
      
      // Store token in localStorage
      localStorage.setItem('authToken', newToken);
      
      // Update state
      setToken(newToken);
      setUser({
        id: decodedToken.id,
        email: decodedToken.email,
        name: decodedToken.name
      });
      
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('authToken');
    setToken(null);
    setUser(null);
    router.push('/login');
  };

  return {
    token,
    user,
    isAuthenticated: !!token,
    loading,
    login,
    logout
  };
}