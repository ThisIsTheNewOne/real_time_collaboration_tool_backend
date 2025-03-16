import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';

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
    setLoading(true);
    const storedToken = localStorage.getItem('authToken');
    
    if (storedToken) {
      try {
        // Decode the token to get user data
        const decodedToken = jwtDecode<UserData & { exp: number }>(storedToken);
        
        // Check if token is expired
        if (decodedToken.exp * 1000 < Date.now()) {
          // Token expired, remove it
          localStorage.removeItem('authToken');
          setToken(null);
          setUser(null);
        } else {
          // Valid token
          setToken(storedToken);
          setUser({
            id: decodedToken.id,
            email: decodedToken.email,
            name: decodedToken.name
          });
        }
      } catch (error) {
        // Invalid token
        console.error('Invalid token:', error);
        localStorage.removeItem('authToken');
      }
    }
    
    setLoading(false);
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