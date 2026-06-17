import { createClient } from "@supabase/supabase-js";

// Anon key, browser-only. This client never queries tables directly - your
// custom JWT auth has no Supabase RLS policies to back that. Its only job is
// listening for the broadcast signal the backend sends after writing a
// notification, which then triggers a refetch over your authenticated REST API.
export const supabaseBrowser = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);
