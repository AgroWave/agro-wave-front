import { useSyncExternalStore } from "react";
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

interface AuthSnapshot {
  token: string | null;
  user: AuthUser | null;
}

const listeners: Set<() => void> = new Set();

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

let cachedRawToken: string | null = undefined as unknown as string | null;
let cachedRawUser: string | null = undefined as unknown as string | null;
let cachedSnapshot: AuthSnapshot = { token: null, user: null };

function getSnapshot(): AuthSnapshot {
  try {
    const rawToken = typeof window !== "undefined" ? sessionStorage.getItem(TOKEN_KEY) : null;
    const rawUser = typeof window !== "undefined" ? sessionStorage.getItem(USER_KEY) : null;

    if (rawToken !== cachedRawToken || rawUser !== cachedRawUser) {
      cachedRawToken = rawToken;
      cachedRawUser = rawUser;
      let parsedUser: AuthUser | null = null;
      if (rawUser) {
        try {
          parsedUser = JSON.parse(rawUser);
        } catch {
          parsedUser = null;
        }
      }
      cachedSnapshot = {
        token: rawToken,
        user: parsedUser,
      };
    }
  } catch {
    cachedSnapshot = { token: null, user: null };
  }
  return cachedSnapshot;
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

/**
 * Hook providing client authentication state backed by synchronized sessionStorage.
 * @returns Authentication state and dispatch functions.
 */
export function useAuthStore(): AuthState {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const setAuth = (newToken: string, newUser: AuthUser) => {
    try {
      sessionStorage.setItem(TOKEN_KEY, newToken);
      sessionStorage.setItem(USER_KEY, JSON.stringify(newUser));
    } catch {
      // Ignore
    }
    notifyListeners();
  };

  const clearAuth = () => {
    try {
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(USER_KEY);
    } catch {
      // Ignore
    }
    notifyListeners();
  };

  return {
    token: snapshot.token,
    user: snapshot.user,
    isAuthenticated: Boolean(snapshot.token && snapshot.user),
    setAuth,
    clearAuth,
  };
}
