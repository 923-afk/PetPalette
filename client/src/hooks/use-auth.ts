import { useState, useEffect } from "react";
import { authManager } from "@/lib/auth";
import { User } from "@shared/schema";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = authManager.subscribe((state) => {
      setUser(state.user);
      setToken(state.token);
      setIsLoading(false);
    });

    // Initialize with current state
    const currentState = authManager.getState();
    setUser(currentState.user);
    setToken(currentState.token);
    setIsLoading(false);

    return unsubscribe;
  }, []);

  const login = (user: User, token: string) => {
    authManager.setAuth(user, token);
  };

  const logout = () => {
    authManager.clearAuth();
  };

  return {
    user,
    token,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
  };
}
