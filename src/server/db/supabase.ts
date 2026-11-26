import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

/**
 * Cliente Supabase com a service_role key.
 * Só pode ser usado no servidor: a chave ignora o RLS e nunca deve chegar ao navegador.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (client) return client;

  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY precisam estar definidas no .env.local",
    );
  }

  client = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return client;
}
