import { useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { AuthContext } from "@/contexts/auth-context";

const TEMP_PUBLIC_DASHBOARD = true;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(!TEMP_PUBLIC_DASHBOARD);
  const devBypass = TEMP_PUBLIC_DASHBOARD || (import.meta.env.DEV && import.meta.env.VITE_MAXX_DEV_AUTH_BYPASS === "true");

  useEffect(() => {
    if (TEMP_PUBLIC_DASHBOARD) return;

    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) {
        setSession(data.session);
        setLoading(false);
      }
    });
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });
    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        loading: devBypass ? false : loading,
        devBypass,
        signOut: async () => {
          if (!TEMP_PUBLIC_DASHBOARD) await supabase.auth.signOut();
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
