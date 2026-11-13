// Project-specific public Supabase client, generated types preserved.
// Publishable keys are intended for browsers; never use a service_role or secret key.
// Explicit Vite overrides allow client-controlled migrations to other projects.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
const defaultProjectUrl = "https://cyxdevcjycmffhmwxojh.supabase.co";
const defaultPublicKey = "sb_publishable_PoqI-3PsCqewtJWJ0Z73Ag_5hIE0oKI";
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || defaultProjectUrl;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || defaultPublicKey;
if (new URL(SUPABASE_URL).protocol !== "https:") {
  throw new Error("MAXX requires HTTPS Supabase configuration");
}
// Never silently fall back to another project's key. The former generated
// legacy anon token's project claim did NOT match botanic-creations.
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { storage: typeof window !== "undefined" ? window.localStorage : undefined,
    persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});
