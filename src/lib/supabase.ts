import { createClient } from "@supabase/supabase-js";

// These are the Supabase project URL and anon/publishable key. Both are safe
// to ship in client-side code by design: the anon key only grants what RLS
// and the exposed RPC functions allow (see supabase/migrations), it is not a
// secret. Env vars let this be overridden per-environment if ever needed.
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://ilcopwobedfysggjgptf.supabase.co";

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "sb_publishable_DxHBgkg_175cy-u5vs6r4A_TwFC09rb";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
