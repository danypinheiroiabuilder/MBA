"use client";

import { create } from "zustand";
import type { Session, User } from "@supabase/supabase-js";

import { getSupabase } from "@/services/supabase/client";

type AuthState = {
  ready: boolean;
  session: Session | null;
  user: User | null;
  configOk: boolean;
  init: () => Promise<void>;
  signOut: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  ready: false,
  session: null,
  user: null,
  configOk: true,

  init: async () => {
    if (get().ready) return;

    const supabase = getSupabase();
    if (!supabase) {
      set({ ready: true, session: null, user: null, configOk: false });
      return;
    }

    const { data } = await supabase.auth.getSession();
    set({ session: data.session ?? null, user: data.session?.user ?? null, ready: true });

    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session: session ?? null, user: session?.user ?? null, ready: true });
    });
  },

  signOut: async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    await supabase.auth.signOut();
    set({ session: null, user: null });
  },
}));

