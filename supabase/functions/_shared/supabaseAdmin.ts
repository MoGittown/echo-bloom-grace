import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

export function createServiceClient() {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) {
    throw new Error("missing_supabase_service_config");
  }
  return createClient(url, key);
}
