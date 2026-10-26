import React, { createContext, useContext, useEffect, useState } from "react";
import { ApiError, getMe, getToken, login, logout, setToken, signup, TOKEN_KEY, type SignupInput } from "../lib/api";
import type { User } from "../types";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null; user: User | null }>;
  signUp: (input: SignupInput) => Promise<{ error: string | null; user: User | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const errorMessage = (e: unknown): string =>
  e instanceof Error ? e.message : "Something went wrong. Please try again.";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    // On page load, turn a saved token back into the signed-in user.
    const restoreSession = async () => {
      const token = getToken();
      if (!token) {
        if (!cancelled && getToken() === token) setUser(null);
        return;
      }
      try {
        const { user: me } = await getMe();
        if (!cancelled && getToken() === token) setUser(me);
      } catch (e) {
        // An expired token is discarded; a network blip keeps it for next time.
        if (!cancelled && getToken() === token) {
          if (e instanceof ApiError && e.status === 401) setToken(null);
          setUser(null);
        }
      }
    };

    restoreSession().finally(() => {
      if (!cancelled) setLoading(false);
    });

    // Keep tabs in sync: signing in or out in one tab updates the others.
    const onStorage = (e: StorageEvent) => {
      if (e.key === TOKEN_KEY || e.key === null) void restoreSession();
    };
    window.addEventListener("storage", onStorage);

    return () => {
      cancelled = true;
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const session = await login(email, password);
      setToken(session.token);
      setUser(session.user);
      return { error: null, user: session.user };
    } catch (e) {
      return { error: errorMessage(e), user: null };
    }
  };

  const signUp = async (input: SignupInput) => {
    const passwordBytes = new TextEncoder().encode(input.password).length;
    if (input.password.length < 6 || passwordBytes > 72) {
      return { error: "At least 6 characters; up to 72 bytes.", user: null };
    }
    try {
      const session = await signup(input);
      setToken(session.token);
      setUser(session.user);
      return { error: null, user: session.user };
    } catch (e) {
      return { error: errorMessage(e), user: null };
    }
  };

  const signOut = async () => {
    const token = getToken();
    try {
      await logout();
    } catch (e) {
      if (!(e instanceof ApiError && e.status === 401 && getToken() === token)) throw e;
    }
    if (getToken() === token) {
      setToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};
