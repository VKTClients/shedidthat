import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

let _supabaseAdmin: SupabaseClient<Database> | null = null;

function getSupabaseAdmin(): SupabaseClient<Database> {
  if (!_supabaseAdmin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error(
        "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables"
      );
    }
    _supabaseAdmin = createClient<Database>(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return _supabaseAdmin;
}

export const supabaseAdmin = new Proxy({} as SupabaseClient<Database>, {
  get(_target, prop) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      if (prop === "from") {
        return () => {
          const chain: any = {
            select: () => chain,
            insert: () => chain,
            update: () => chain,
            delete: () => chain,
            eq: () => chain,
            neq: () => chain,
            in: () => chain,
            gte: () => chain,
            lte: () => chain,
            lt: () => chain,
            gt: () => chain,
            order: () => chain,
            single: () => chain,
            limit: () => chain,
            then: (resolve: any) => resolve({ data: null, error: { message: "Supabase not configured" } }),
          };
          return chain;
        };
      }
      if (prop === "storage") {
        return { from: () => ({ upload: () => Promise.resolve({ error: { message: "Supabase not configured" } }), getPublicUrl: () => ({ data: { publicUrl: "" } }), createSignedUrl: () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } }) }) };
      }
      return undefined;
    }
    return (getSupabaseAdmin() as any)[prop];
  },
});
