import { useState } from "react";

import type { AuthUser } from "../../api/auth";

const TOKEN_KEY = "agrowave_token";
const USER_KEY = "agrowave_user";

export interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: AuthUser) => void;
  clearAuth: () => void;
}

/**
 * Hook providing client authentication state backed by sessionStorage.
 * @returns Authentication state and dispatch functions.
 */
export function useAuthStore(): AuthState {
  const [token, setToken] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  });

  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const stored = sessionStorage.getItem(USER_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const setAuth = (newToken: string, newUser: AuthUser) => {
    try {
      sessionStorage.setItem(TOKEN_KEY, newToken);
      sessionStorage.setItem(USER_KEY, JSON.stringify(newUser));
    } catch {
      // Ignore storage errors in test or restricted environments
    }
    setToken(newToken);
    setUser(newUser);
  };

  const clearAuth = () => {
    try {
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(USER_KEY);
    } catch {
      // Ignore
    }
    setToken(null);
    setUser(null);
  };

  return {
    token,
    user,
    isAuthenticated: Boolean(token && user),
    setAuth,
    clearAuth,
  };
}
