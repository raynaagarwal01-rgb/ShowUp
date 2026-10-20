import React, { createContext, useContext, useEffect, useState } from "react";
import { ApiError, getMe, getToken, login, setToken, signup, TOKEN_KEY, type SignupInput } from "../lib/api";
import type { User } from "../types";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null; user: User | null }>;
  signUp: (input: SignupInput) => Promise<{ error: string | null; user: User | null }>;
  /** Logging out just forgets the token — JWTs are not stored on the server. */
  signOut: () => void;
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
      if (!getToken()) {
        if (!cancelled) setUser(null);
        return;
      }
      try {
        const { user: me } = await getMe();
        if (!cancelled) setUser(me);
      } catch (e) {
        // An expired token is discarded; a network blip keeps it for next time.
        if (e instanceof ApiError && e.status === 401) setToken(null);
        if (!cancelled) setUser(null);
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
    if (input.password.length < 6) return { error: "Password must be at least 6 characters.", user: null };
    try {
      const session = await signup(input);
      setToken(session.token);
      setUser(session.user);
      return { error: null, user: session.user };
    } catch (e) {
      return { error: errorMessage(e), user: null };
    }
  };

  const signOut = () => {
    setToken(null);
    setUser(null);
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
