import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { demoDb, type DemoAccount } from "../lib/demoStorage";
import { newId } from "../lib/id";
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
  isDemoMode: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null; profile: Profile | null }>;
  signUp: (
    email: string,
    password: string,
    details: SignUpDetails,
  ) => Promise<{ error: string | null; profile: Profile | null }>;
  signOut: () => Promise<void>;
  updateProfile: (patch: Partial<Profile>) => Promise<{ error: string | null }>;
  /** Supabase: emails a real reset link. Demo mode: just confirms the account
   * exists — there's no email transport, so the caller collects a new
   * password directly and calls updatePassword with demoEmail set. */
  requestPasswordReset: (email: string) => Promise<{ error: string | null }>;
  /** Supabase: requires an active recovery session (from the emailed link).
   * Demo mode: pass demoEmail to look the account up directly. */
  updatePassword: (newPassword: string, demoEmail?: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function profileFromAccount(account: DemoAccount): Profile {
  const { password: _password, ...profile } = account;
  return profile;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const isDemoMode = !isSupabaseConfigured;

  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      const client = supabase;
      client.auth.getSession().then(async ({ data: { session } }) => {
        if (session?.user) {
          const { data: profile } = await client
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .maybeSingle();
          setUser(profile as Profile | null);
        }
        setLoading(false);
      });

      const { data: { subscription } } = client.auth.onAuthStateChange(
        async (_event, session) => {
          if (session?.user) {
            const { data: profile } = await client
              .from("profiles")
              .select("*")
              .eq("id", session.user.id)
              .maybeSingle();
            setUser(profile as Profile | null);
          } else {
            setUser(null);
          }
        },
      );

      return () => subscription.unsubscribe();
    } else {
      const sessionId = demoDb.getSession();
      if (sessionId) {
        const account = demoDb.getAccounts().find((a) => a.id === sessionId);
        if (account) setUser(profileFromAccount(account));
      }
      setLoading(false);
    }
  }, []);

  const signIn = async (
    email: string,
    password: string,
  ): Promise<{ error: string | null; profile: Profile | null }> => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: error.message, profile: null };
      if (data.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", data.user.id)
          .maybeSingle();
        setUser(profile as Profile | null);
        return { error: null, profile: profile as Profile | null };
      }
      return { error: null, profile: null };
    }

    const account = demoDb
      .getAccounts()
      .find((a) => a.email.toLowerCase() === email.toLowerCase());
    if (!account || account.password !== password) {
      return { error: "Invalid email or password.", profile: null };
    }
    demoDb.setSession(account.id);
    const profile = profileFromAccount(account);
    setUser(profile);
    return { error: null, profile };
  };

  const signUp = async (
    email: string,
    password: string,
    details: SignUpDetails,
  ): Promise<{ error: string | null; profile: Profile | null }> => {
    if (password.length < 6) {
      return { error: "Password must be at least 6 characters.", profile: null };
    }

    if (isSupabaseConfigured && supabase) {
      // The profiles row is created server-side by the on_auth_user_created
      // trigger (see supabase_schema.sql) — a client-side insert right here
      // would fail RLS whenever email confirmation is on, since there's no
      // confirmed session yet to authenticate it. name/role ride along as
      // signup metadata for the trigger to read back out.
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name: details.name, role: details.role } },
      });
      if (error) return { error: error.message, profile: null };
      if (data.user) {
        const profile: Profile = { id: data.user.id, email, ...details };
        setUser(profile);
        return { error: null, profile };
      }
      return { error: null, profile: null };
    }

    const accounts = demoDb.getAccounts();
    if (accounts.some((a) => a.email.toLowerCase() === email.toLowerCase())) {
      return { error: "An account with this email already exists.", profile: null };
    }
    const account: DemoAccount = {
      id: newId("user"),
      email,
      password,
      ...details,
    };
    demoDb.saveAccounts([...accounts, account]);
    demoDb.setSession(account.id);
    const profile = profileFromAccount(account);
    setUser(profile);
    return { error: null, profile };
  };

  const signOut = async (): Promise<void> => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    } else {
      demoDb.setSession(null);
    }
    setUser(null);
  };

  const updateProfile = async (patch: Partial<Profile>): Promise<{ error: string | null }> => {
    if (!user) return { error: "Not signed in." };

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from("profiles").update(patch).eq("id", user.id);
      if (error) return { error: error.message };
      setUser({ ...user, ...patch });
      return { error: null };
    }

    const accounts = demoDb.getAccounts();
    demoDb.saveAccounts(accounts.map((a) => (a.id === user.id ? { ...a, ...patch } : a)));
    setUser({ ...user, ...patch });
    return { error: null };
  };

  const requestPasswordReset = async (email: string): Promise<{ error: string | null }> => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      return { error: error ? error.message : null };
    }

    const exists = demoDb
      .getAccounts()
      .some((a) => a.email.toLowerCase() === email.toLowerCase());
    if (!exists) return { error: "No account found with that email." };
    return { error: null };
  };

  const updatePassword = async (
    newPassword: string,
    demoEmail?: string,
  ): Promise<{ error: string | null }> => {
    if (newPassword.length < 6) {
      return { error: "Password must be at least 6 characters." };
    }

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      return { error: error ? error.message : null };
    }

    if (!demoEmail) return { error: "Missing email." };
    const accounts = demoDb.getAccounts();
    const idx = accounts.findIndex((a) => a.email.toLowerCase() === demoEmail.toLowerCase());
    if (idx === -1) return { error: "No account found with that email." };
    const updated = [...accounts];
    updated[idx] = { ...updated[idx], password: newPassword };
    demoDb.saveAccounts(updated);
    return { error: null };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isDemoMode,
        signIn,
        signUp,
        signOut,
        updateProfile,
        requestPasswordReset,
        updatePassword,
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
