import React, { createContext, useContext, useEffect, useState } from "react";
import { api, ApiError, getToken, setToken, TOKEN_KEY } from "../lib/api";
import type { Profile, Role } from "../types";

interface SignUpDetails {
  name: string;
  role: Role;
  college?: string;
  branch?: string;
  year?: string;
  phone?: string;
}

interface AuthContextType {
  user: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null; profile: Profile | null }>;
  signUp: (
    email: string,
    password: string,
    details: SignUpDetails,
  ) => Promise<{ error: string | null; profile: Profile | null }>;
  signOut: () => Promise<void>;
  updateProfile: (patch: Partial<Profile>) => Promise<{ error: string | null }>;
  /** Emails a single-use reset link to /reset-password?token=... */
  requestPasswordReset: (email: string) => Promise<{ error: string | null }>;
  /** Redeems the token from that link, sets the new password, and signs in. */
  resetPassword: (token: string, newPassword: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const errorMessage = (e: unknown): string =>
  e instanceof Error ? e.message : "Something went wrong. Please try again.";

interface SessionResponse {
  token: string;
  user: Profile;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const restoreSession = async () => {
      if (!getToken()) {
        if (!cancelled) setUser(null);
        return;
      }
      try {
        const { user: me } = await api<{ user: Profile }>("/auth/me");
        if (!cancelled) setUser(me);
      } catch (e) {
        // An expired/revoked token is discarded; a network blip keeps it so the
        // next load can try again.
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

  const startSession = ({ token, user: profile }: SessionResponse) => {
    setToken(token);
    setUser(profile);
  };

  const signIn = async (
    email: string,
    password: string,
  ): Promise<{ error: string | null; profile: Profile | null }> => {
    try {
      const session = await api<SessionResponse>("/auth/login", {
        method: "POST",
        body: { email, password },
      });
      startSession(session);
      return { error: null, profile: session.user };
    } catch (e) {
      return { error: errorMessage(e), profile: null };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    details: SignUpDetails,
  ): Promise<{ error: string | null; profile: Profile | null }> => {
    if (password.length < 6) {
      return { error: "Password must be at least 6 characters.", profile: null };
    }
    try {
      const session = await api<SessionResponse>("/auth/signup", {
        method: "POST",
        body: { email, password, ...details },
      });
      startSession(session);
      return { error: null, profile: session.user };
    } catch (e) {
      return { error: errorMessage(e), profile: null };
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      await api("/auth/logout", { method: "POST", body: {} });
    } catch {
      // Even if the server can't be reached, sign out locally.
    }
    setToken(null);
    setUser(null);
  };

  const updateProfile = async (patch: Partial<Profile>): Promise<{ error: string | null }> => {
    if (!user) return { error: "Not signed in." };
    try {
      const { user: updated } = await api<{ user: Profile }>("/auth/profile", {
        method: "PATCH",
        body: patch,
      });
      setUser(updated);
      return { error: null };
    } catch (e) {
      return { error: errorMessage(e) };
    }
  };

  const requestPasswordReset = async (email: string): Promise<{ error: string | null }> => {
    try {
      await api("/auth/forgot", { method: "POST", body: { email } });
      return { error: null };
    } catch (e) {
      return { error: errorMessage(e) };
    }
  };

  const resetPassword = async (token: string, newPassword: string): Promise<{ error: string | null }> => {
    if (newPassword.length < 6) {
      return { error: "Password must be at least 6 characters." };
    }
    try {
      const session = await api<SessionResponse>("/auth/reset", {
        method: "POST",
        body: { token, password: newPassword },
      });
      startSession(session);
      return { error: null };
    } catch (e) {
      return { error: errorMessage(e) };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signOut,
        updateProfile,
        requestPasswordReset,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};
