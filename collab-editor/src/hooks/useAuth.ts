import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { getCurrentUser } from "@/lib/api";

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

export function useAuth() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Load user data based on token
  const loadUserData = useCallback(
    async (authToken: string): Promise<boolean> => {
      try {
        // Verify the token is valid by decoding it
        const decodedToken = jwtDecode<DecodedToken>(authToken);

        // Check if token is expired
        if (decodedToken.exp * 1000 < Date.now()) {
          console.log("Token expired, clearing auth state");
          localStorage.removeItem("authToken");
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
            id: decodedToken.id,
            email: userData.email,
            name: userData.email, // Using email as name if no specific name is available
          };

          setUser(userDataFull);
          return true;
        } catch (error) {
          console.error("Failed to fetch user data:", error);
          // If we can't get user data, we still have basic info from token
          setUser({
            id: decodedToken.id,
            email: decodedToken.email || "", // Use email from token if available
          });
          return !!decodedToken.id; // Return true if we at least have a user ID
        }
      } catch (error) {
        console.error("Invalid token:", error);
        localStorage.removeItem("authToken");
        setToken(null);
        setUser(null);
        return false;
      }
    },
    []
  );

  // Initialize auth state and set up storage event listener
  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);

      // This needs to run both on mount and when localStorage changes
      const storedToken = localStorage.getItem("authToken");

      if (storedToken) {
        await loadUserData(storedToken);
      } else {
        // Ensure user is null when no token exists
        setToken(null);
        setUser(null);
      }

      setLoading(false);
    };

    // Run the initialization immediately
    initializeAuth();

    // Listen for storage events (when localStorage changes in other tabs)
    const handleStorageChange = async (event: StorageEvent) => {
      if (event.key === "authToken") {
        console.log("Auth token changed in localStorage, updating state");

        // If token was removed
        if (!event.newValue) {
          setToken(null);
          setUser(null);
          return;
        }

        // If token was added or changed
        if (event.newValue) {
          await loadUserData(event.newValue);
        }
      }
    };

    // Add event listener
    window.addEventListener("storage", handleStorageChange);

    // Clean up
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [loadUserData]);

  // Login function
  const login = async (newToken: string): Promise<boolean> => {
    console.log("Login function called with token");

    // Store token in localStorage
    localStorage.setItem("authToken", newToken);

    // Load user data
    const success = await loadUserData(newToken);
    return success;
  };

  // Logout function
  const logout = () => {
    console.log("Logout function called");

    // Remove token from localStorage
    localStorage.removeItem("authToken");

    // Clear auth state
    setToken(null);
    setUser(null);

    // Redirect to login page
    router.push("/login");
  };


  
  return {
    token,
    user,
    isAuthenticated: !!token && !!user,
    loading,
    login,
    logout,
  };
}
