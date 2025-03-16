import { useAuthContext } from "@/context/AuthContext";

export function useNavbarAuth() {
  const { user, login, logout, loading } = useAuthContext();
  return {
    user,
    isAuthenticated: !!user,
    loading,
    logout,
  };
}
