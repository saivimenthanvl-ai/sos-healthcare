"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import type { User, Session } from "@supabase/supabase-js";
import type { Profile } from "@/types/app";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  profile: Profile | null;
  signUp: (
    email: string,
    password: string,
    fullName?: string
  ) => Promise<{ data: { user: User | null; session: Session | null }; error: Error | null }>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const loadUserProfile = async (
      userId: string,
      email?: string,
      userMetadata?: Record<string, unknown>
    ) => {
      try {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .maybeSingle();

        if (profileData) {
          setProfile(profileData);
          return profileData;
        }

        // If row doesn't exist, create an initial profile row so user never gets stuck
        const rawName = userMetadata?.full_name ?? userMetadata?.name;
        const initialName: string =
          typeof rawName === "string" && rawName.trim().length > 0
            ? rawName
            : email?.split("@")[0] || "User";

        const { data: createdProfile } = await supabase
          .from("profiles")
          .upsert(
            {
              id: userId,
              email: email || null,
              full_name: initialName,
              role: "patient",
            },
            { onConflict: "id" }
          )
          .select()
          .maybeSingle();

        if (createdProfile) {
          setProfile(createdProfile);
          return createdProfile;
        } else {
          // In-memory fallback profile so pages don't block
          const fallbackProfile: Profile = {
            id: userId,
            full_name: initialName,
            email: email || null,
            phone: null,
            emergency_contact_name: null,
            emergency_contact_phone: null,
            medical_conditions: null,
            allergies: null,
            blood_type: null,
            fitbit_user_id: null,
            fitbit_access_token: null,
            fitbit_refresh_token: null,
            fitbit_token_expires_at: null,
            smartwatch_connected: false,
            role: "patient",
            ambulance_id: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          setProfile(fallbackProfile);
          return fallbackProfile;
        }
      } catch (err) {
        console.warn("[AuthContext] Profile load handled:", err);
      }
      return null;
    };

    const getSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await loadUserProfile(
            session.user.id,
            session.user.email,
            session.user.user_metadata
          );
        }
      } catch (err) {
        console.warn("[AuthContext] getSession error:", err);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await loadUserProfile(
          session.user.id,
          session.user.email,
          session.user.user_metadata
        );
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/auth/confirm`,
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      return { data: { user: null, session: null }, error };
    }

    if (data?.user) {
      // The on_auth_user_created trigger creates this row. The upsert is a
      // no-op fallback for databases that have not run migration 001 yet.
      try {
        await supabase
          .from("profiles")
          .upsert(
            { id: data.user.id, full_name: fullName || "", email },
            { onConflict: "id", ignoreDuplicates: true }
          );
      } catch (err) {
        console.warn("Notice: profile ensure handled:", err);
      }
    }

    return { data, error: null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signInWithGoogle = async () => {
    const redirectUrl = `${window.location.origin}/auth/callback`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          prompt: "select_account",
        },
      },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        profile,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
